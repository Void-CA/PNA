use serde::{Deserialize, Serialize};
use crate::error::EngineError;
use crate::models::raw::RawTable;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AcademicTable {
    pub evaluations: Vec<String>, // Nombres de las columnas de notas
    pub records: Vec<StudentRecord>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StudentRecord {
    pub carnet: String,
    pub name: String,
    pub email: String,
    pub group: String,            // "IMS", "ICE", etc.
    pub grades: Vec<GradeValue>,  // Mapeado 1:1 con 'evaluations'
    pub final_grade: GradeValue,  // El campo NP
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(tag = "status", content = "value")]
pub enum GradeValue {
    Numeric(f32),
    Fraction { obtained: f32, total: f32 },
    Withdrawn,    // Para "RM"
    Absent,       // Para "NP" o vacíos
    Label(String) // Para otros casos de texto
}

impl TryFrom<RawTable> for AcademicTable {
    type Error = EngineError;

    fn try_from(raw: RawTable) -> Result<Self, Self::Error> {
        // Ajustamos para que empiece en el índice 4 (Prueba 1 en tu test)
        // y tome todo hasta antes del último (NP)
        // Identify valid indices (columns to keep) based on headers
        // We look at headers from index 4 up to len-1 (excluding NP)
        // Row data for these headers is at header_index + 1
        let mut valid_indices = Vec::new();
        let mut eval_headers = Vec::new();

        if raw.headers.len() > 5 {
            for (i, header) in raw.headers.iter().enumerate().take(raw.headers.len() - 1).skip(4) {
                let h_upper = header.trim().to_uppercase();
                // Filter out summary columns
                if !h_upper.starts_with("ACU[") && !h_upper.starts_with("EXA[") && !h_upper.starts_with("NP") {
                    valid_indices.push(i);
                    if h_upper.starts_with("CEC[") {
                        eval_headers.push("Evaluacion Docente".to_string());
                        continue;
                    }
                    eval_headers.push(header.clone());
                }
                
            }
        }

        let mut records = Vec::new();

        for row in raw.rows {
            if row.len() < 5 { continue; }

            // Mapeo de columnas según los índices del test:
            // 1: CARNET, 2: Alumno, 3: Correo, 4: Grupo/Carrera
            let carnet = row[1].clone().unwrap_or_default();
            let name = row[2].clone().unwrap_or_default();
            let email = row[3].clone().unwrap_or_default();
            let group = row[4].clone().unwrap_or_default();

            let mut grades = Vec::new();
            for &idx in &valid_indices {
                // Row data is shifted by +1 relative to header index
                // (Header 4 -> Row 5)
                let cell = if idx + 1 < row.len() {
                    &row[idx + 1]
                } else {
                    &None
                };
                grades.push(parse_cell(cell));
            }

            let final_grade = parse_cell(row.last().unwrap_or(&None));

            records.push(StudentRecord {
                carnet,
                name,
                email,
                group,
                grades,
                final_grade,
            });
        }

        Ok(AcademicTable {
            evaluations: eval_headers,
            records,
        })
    }
}

/// Lógica central para interpretar el contenido de las celdas de la universidad
fn parse_cell(cell: &Option<String>) -> GradeValue {
    let s = match cell {
        Some(val) => val.trim().to_uppercase(),
        None => return GradeValue::Absent,
    };

    if s.is_empty() || s == "NP" { return GradeValue::Absent; }
    if s == "RM" { return GradeValue::Withdrawn; }

    // Manejar fracciones: "9/10"
    if s.contains('/') {
        let parts: Vec<&str> = s.split('/').collect();
        if parts.len() == 2 {
            let n = parts[0].parse::<f32>().unwrap_or(0.0);
            let d = parts[1].parse::<f32>().unwrap_or(1.0);
            return GradeValue::Fraction { obtained: n, total: d };
        }
    }

    // Manejar números puros: "87", "55"
    if let Ok(val) = s.parse::<f32>() {
        return GradeValue::Numeric(val);
    }

    // Si es texto (ej. "IMS" metido en una celda de nota por error)
    GradeValue::Label(s)
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::models::raw::RawTable;

    #[test]
    fn test_academic_table_conversion() {
        // 1. Simulamos los headers que obtuviste en el test anterior
        let headers = vec![
            "#".to_string(),
            "CARNET".to_string(),
            "Alumno".to_string(),
            "Correo".to_string(),
            "Prueba 1".to_string(),
            "Tarea 1".to_string(),
            "NP".to_string(),
        ];

        // 2. Simulamos filas con diferentes casos: normal, fraccionario, RM y NP
        let rows = vec![
            // Estudiante normal con fracción
            vec![
                Some("1".to_string()),
                Some("23-A0201".to_string()),
                Some("OMAR ARTOLA".to_string()),
                Some("omar@est.ulsa".to_string()),
                Some("IMS".to_string()),    // Grupo/Carrera
                Some("9/10".to_string()),   // Evaluación 1
                Some("5/5".to_string()),    // Evaluación 2
                Some("95".to_string()),     // NP (Nota Final)
            ],
            // Estudiante que retiró (RM)
            vec![
                Some("2".to_string()),
                Some("22-A0201".to_string()),
                Some("JURGEN PEREZ".to_string()),
                Some("jurgen@est.ulsa".to_string()),
                Some("IMS".to_string()),
                Some("RM".to_string()),     // RM en evaluación
                Some("RM".to_string()),
                Some("RM".to_string()),     // RM en nota final
            ],
            // Estudiante con celdas vacías (No se presentó)
            vec![
                Some("3".to_string()),
                Some("21-A0401".to_string()),
                Some("ALEJANDRO COTTO".to_string()),
                Some("ale@est.ulsa".to_string()),
                Some("ICE".to_string()),
                Some("".to_string()),       // Vacío -> Absent
                Some("0/5".to_string()),
                Some("NP".to_string()),     // NP -> Absent
            ],
        ];

        let raw = RawTable { headers, rows };
        let result = AcademicTable::try_from(raw).expect("Debe convertir correctamente");

        // --- Verificaciones ---

        // Verificar Headers de evaluación (deben ser 2: Prueba 1 y Tarea 1)
        assert_eq!(result.evaluations.len(), 2);
        assert_eq!(result.evaluations[0], "Prueba 1");

        // Verificar Estudiante 1 (Fracciones y Números)
        let s1 = &result.records[0];
        assert_eq!(s1.group, "IMS");
        assert_eq!(s1.grades[0], GradeValue::Fraction { obtained: 9.0, total: 10.0 });
        assert_eq!(s1.final_grade, GradeValue::Numeric(95.0));

        // Verificar Estudiante 2 (Retiró Matrícula - RM)
        let s2 = &result.records[1];
        assert_eq!(s2.final_grade, GradeValue::Withdrawn);
        assert_eq!(s2.grades[0], GradeValue::Withdrawn);

        // Verificar Estudiante 3 (Ausente - NP/Vacío)
        let s3 = &result.records[2];
        assert_eq!(s3.grades[0], GradeValue::Absent); // Por celda vacía
        assert_eq!(s3.final_grade, GradeValue::Absent); // Por texto "NP"
        
        // Verificar que se mantienen los datos de identidad
        assert_eq!(s3.carnet, "21-A0401");
        assert_eq!(s3.name, "ALEJANDRO COTTO");
    }

    #[test]
    fn test_parse_cell_logic() {
        assert_eq!(parse_cell(&Some("9/10".to_string())), GradeValue::Fraction { obtained: 9.0, total: 10.0 });
        assert_eq!(parse_cell(&Some("RM".to_string())), GradeValue::Withdrawn);
        assert_eq!(parse_cell(&Some("np".to_string())), GradeValue::Absent);
        assert_eq!(parse_cell(&Some("85.5".to_string())), GradeValue::Numeric(85.5));
        assert_eq!(parse_cell(&None), GradeValue::Absent);
    }


    #[test]
    fn test_summary_filtering() {
        let headers = vec![
            "#".to_string(), "CARNET".to_string(), "Alumno".to_string(), "Correo".to_string(),
            "Prueba 1".to_string(),
            "ACU[60%]".to_string(), // Should be filtered
            "CEC[10%]".to_string(), // Should be filtered
            "EXA[30%]".to_string(), // Should be filtered
            "NP".to_string(),
        ];

        let rows = vec![
            vec![
                Some("1".to_string()), Some("C1".to_string()), Some("N1".to_string()), Some("E1".to_string()), Some("G1".to_string()),
                Some("10".to_string()), // Prueba 1
                Some("60".to_string()), // ACU
                Some("10".to_string()), // CEC
                Some("30".to_string()), // EXA
                Some("100".to_string()) // NP
            ]
        ];

        let raw = RawTable { headers, rows };
        let result = AcademicTable::try_from(raw).expect("Conversion Success");

        assert_eq!(result.evaluations.len(), 1);
        assert_eq!(result.evaluations[0], "Prueba 1");
        
        let s = &result.records[0];
        // Only 1 grade should be remaining
        assert_eq!(s.grades.len(), 1);
        assert_eq!(s.grades[0], GradeValue::Numeric(10.0));
    }
}
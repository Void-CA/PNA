use serde::{Deserialize, Serialize};

use crate::models::domain::{ClassSummary, EvaluationSummary, GradebookSummary, StudentSummary};
use crate::models::gradebook::{AcademicTable, GradeValue};
use crate::rules::AcademicStatus;

pub struct GradeStats<'a> {
    table: &'a AcademicTable,

    student_scores: Vec<Option<f32>>,
    student_std: Vec<Option<f32>>,
    student_percentiles: Vec<Option<f32>>,
    student_lost_points : Vec<Option<f32>>,

    evaluation_averages: Vec<Option<f32>>,
    evaluation_std: Vec<Option<f32>>,
}

#[derive(Serialize, Deserialize)]
pub struct GradeStatsOwned {
    pub students: Vec<StudentSummary>,
    pub evaluations: Vec<EvaluationSummary>,
    pub class: ClassSummary,
}


impl From<&AcademicTable> for GradeStatsOwned {
    fn from(table: &AcademicTable) -> Self {
        let grades_stats = GradeStats::new(table);
        Self {
            students: grades_stats.student_summaries(),
            evaluations: grades_stats.evaluation_summaries(),
            class: grades_stats.class_summary(),
        }
    }
}


impl<'a> GradeStats<'a> {
    pub fn new(table: &'a AcademicTable) -> Self {
        let student_scores = compute_student_accumulated_scores(table);
        // Standard deviation for students remains relevant if we view it as deviation from mean class score? 
        // Or deviation of their own grades? 
        // compute_student_std was using normalized averages. 
        // If we want std of their own grades, we should use extracted raw scores?
        // Let's assume we want std of their raw grades.
        let student_std = compute_student_std(table, &student_scores); // This function needs checking
        let student_percentiles = compute_student_percentiles(&student_scores);

        let evaluation_averages = compute_evaluation_averages(table);
        let evaluation_std = compute_evaluation_std(table, &evaluation_averages);
        let student_lost_points = compute_student_lost_points(table);
        Self {
            table,
            student_scores,
            student_std,
            student_percentiles,
            student_lost_points,
            evaluation_averages,
            evaluation_std,
        }
    }

    pub fn academic_status(&self, student_idx: usize) -> AcademicStatus {
        const TOTAL_COURSE_POINTS: f32 = 100.0;
        const PASSING_SCORE: f32 = 70.0; // Ajusta según tu reglamento

        // 1. Obtener nota acumulada actual (lo que ya tiene en la bolsa)
        // Asumimos que calculate_total_score suma los numeradores
        let current_score = match self.student_scores[student_idx] {
            Some(s) => s,
            None => 0.0, // Si es None, tratamos como 0 para cálculos
        };

        // 2. Si ya cruzó la meta, Aprobado directo.
        if current_score >= PASSING_SCORE {
            return AcademicStatus::Approved;
        }

        // 3. Calcular "Puntos Perdidos" (La clave de la solución)
        // Iteramos sobre las tareas YA evaluadas y vemos cuántos puntos dejó ir.
        let lost_points = self.calculate_lost_points(student_idx);

        // 4. Calcular el "Techo Máximo" (Max Possible Score)
        // Si el curso vale 100 y perdió 10, lo máximo que puede sacar es 90.
        let max_possible_score = TOTAL_COURSE_POINTS - lost_points;

        // 5. Escenario: Matemáticamente Reprobado
        // Si su techo máximo es menor que la nota de pase (ej: Max 65 < 70)
        if max_possible_score < PASSING_SCORE {
            return AcademicStatus::Failed;
        }

        // 6. Análisis de Proyección (Pressure)
        // ¿Cuántos puntos le faltan para llegar al 70?
        let points_needed_to_pass = PASSING_SCORE - current_score;
        
        // ¿Cuántos puntos quedan TODAVÍA en la mesa de juego?
        // Esto es: Su techo máximo - lo que ya tiene ganado.
        let points_remaining_in_game = max_possible_score - current_score;

        // Seguridad contra división por cero
        if points_remaining_in_game <= 0.0 {
            return AcademicStatus::Failed;
        }

        let pressure = points_needed_to_pass / points_remaining_in_game;

        match pressure {
            p if p <= 0.70 => AcademicStatus::OnTrack,  // Necesita < 40% de efectividad
            p if p <= 0.90 => AcademicStatus::Warning,  // Necesita esforzarse
            _ => AcademicStatus::Critical,              // Necesita un milagro (>75% efectividad)
        }
    }

    // --- NUEVA FUNCIÓN AUXILIAR ---
    fn calculate_lost_points(&self, student_idx: usize) -> f32 {
        let mut lost = 0.0;
        
        // Iteramos sobre las calificaciones del alumno
        for (_eval_idx, grade) in self.table.records[student_idx].grades.iter().enumerate() {
            if let GradeValue::Fraction { obtained, total } = grade {
                if *total > 0.0 {
                    lost += total - obtained;
                }
            }
            // Si es None o es una nota vacía, NO ha perdido puntos.
            // Asumimos que todavía puede sacar el 100% de esos puntos futuros.
        }
        lost
    }

    pub fn student_summaries(&self) -> Vec<StudentSummary> {
        self.table.records.iter().enumerate().map(|(i, record)| {
            StudentSummary {
                id: record.carnet.clone(),
                name: record.name.clone(),
                accumulated_score: self.student_scores[i],
                lost_points: self.student_lost_points[i],
                percentile: self.student_percentiles[i],
                std_dev: self.student_std[i],
                status: self.academic_status(i),
            }
        }).collect()
    }

    pub fn evaluation_summaries(&self) -> Vec<EvaluationSummary> {
        self.table.evaluations.iter().enumerate().map(|(eval_idx, name)| {
            let mut highest_score = None;
            let mut lowest_score = None;
            let mut max_possible_score = None;
            let mut evaluated_count = 0;
            let mut missing_count = 0;

            for record in &self.table.records {
                // Ensure we don't go out of bounds if records have diff lengths (shouldn't happen in valid table)
                if let Some(grade_value) = record.grades.get(eval_idx) {
                    
                    // Try to discover max possible score from any Fraction value in this column
                    if max_possible_score.is_none() {
                        if let GradeValue::Fraction { total, .. } = grade_value {
                            if *total > 0.0 {
                                max_possible_score = Some(*total);
                            }
                        }
                    }

                    if let Some(score) = extract_raw_score(grade_value) {
                         evaluated_count += 1;
                         highest_score = Some(highest_score.map_or(score, |hs:f32| hs.max(score)));
                         lowest_score = Some(lowest_score.map_or(score, |ls:f32| ls.min(score)));
                    } else {
                        missing_count += 1;
                    }
                } else {
                    missing_count += 1;
                }
            }

            EvaluationSummary {
                id: eval_idx.to_string(), // Or use name as ID if unique? Keeping index for safety
                name: name.clone(),
                average: self.evaluation_averages.get(eval_idx).copied().flatten(),
                std_dev: self.evaluation_std.get(eval_idx).copied().flatten(),
                highest_score,
                lowest_score,
                max_possible_score,
                evaluated_count,
                missing_count,
            }
        }).collect()
    }

    pub fn class_summary(&self) -> ClassSummary {
        let mut count = 0;
        let mut mean = 0.0;
        let mut m2 = 0.0;

        let mut approved_count = 0;
        let mut failed_count = 0;
        let mut on_track_count = 0;
        let mut warning_count = 0;
        let mut critical_count = 0;

        for (i, score_opt) in self.student_scores.iter().enumerate() {
            let score = match score_opt {
                Some(v) => *v,
                None => continue,
            };

            count += 1;

            // Welford
            let delta = score - mean;
            mean += delta / count as f32;
            let delta2 = score - mean;
            m2 += delta * delta2;

            match self.academic_status(i) {
                AcademicStatus::Approved => approved_count += 1,
                AcademicStatus::Failed => failed_count += 1,
                AcademicStatus::OnTrack => on_track_count += 1,
                AcademicStatus::Warning => warning_count += 1,
                AcademicStatus::Critical => critical_count += 1,
            }
        }

        let overall_average = if count > 0 { Some(mean) } else { None };
        let overall_std_dev = if count > 1 {
            Some((m2 / (count as f32 - 1.0)).sqrt())
        } else {
            None
        };

        ClassSummary {
            student_count: self.table.records.len(),
            acumulated_points: self.evaluation_summaries().iter()
                .filter_map(|eval| eval.max_possible_score)
                .sum::<f32>()
                .into(),
            overall_average,
            overall_std_dev,
            approved_count,
            failed_count,
            on_track_count,
            warning_count,
            critical_count,
        }
    
    }


    pub fn summary(&self) -> GradebookSummary {
        GradebookSummary {
            students: self.student_summaries(),
            evaluations: self.evaluation_summaries(),
            class: self.class_summary(),
        }
    }
}



/// Helper to return the raw value (e.g., 9 from 9/10)
fn extract_raw_score(value: &GradeValue) -> Option<f32> {
    match value {
        GradeValue::Numeric(v) => Some(*v),
        GradeValue::Fraction { obtained, .. } => Some(*obtained),
        GradeValue::Withdrawn | GradeValue::Absent | GradeValue::Label(_) => None,
    }
}

fn compute_student_accumulated_scores(table: &AcademicTable) -> Vec<Option<f32>> {
    table.records.iter().map(|record| {
        let mut sum = 0.0;
        let mut count = 0;

        for grade in &record.grades {
            if let Some(v) = extract_raw_score(grade) {
                sum += v;
                count += 1;
            }
        }

        // If at least one grade is present, we return the sum.
        // If all are absent/withdrawn, we might return None or 0.0?
        // Old logic: if count == 0 { None }
        // Let's stick to that.
        if count == 0 { None } else { Some(sum) }
    }).collect()
}

fn compute_student_std(table: &AcademicTable, _scores: &[Option<f32>]) -> Vec<Option<f32>> {
    // Note: Standard deviation usually implies deviation from the MEAN of that student's grades.
    // If 'scores' passed here is the SUM, we can't use it as the mean.
    // We need to calculate the mean of the student's *raw* grades to find their internal consistency (std dev).
    
    table.records.iter().enumerate().map(|(_student_idx, record)| {
         let mut values = Vec::new();
         for grade in &record.grades {
             if let Some(v) = extract_raw_score(grade) {
                 values.push(v);
             }
         }

         if values.len() <= 1 {
             return None;
         }

         let count = values.len() as f32;
         let mean = values.iter().sum::<f32>() / count;
         let sum_sq_diff: f32 = values.iter().map(|v| (v - mean).powi(2)).sum();
         
         Some((sum_sq_diff / (count - 1.0)).sqrt())
    }).collect()
}

fn compute_student_percentiles(avgs: &[Option<f32>]) -> Vec<Option<f32>> {
    let mut valid: Vec<(usize, f32)> = avgs.iter()
        .enumerate()
        .filter_map(|(i, v)| v.map(|x| (i, x)))
        .collect();

    valid.sort_by(|a, b| a.1.partial_cmp(&b.1).unwrap());

    let n = valid.len();
    let mut result = vec![None; avgs.len()];

    if n <= 1 {
        for (idx, _) in valid {
            result[idx] = Some(100.0);
        }
        return result;
    }

    for (rank, (idx, _)) in valid.iter().enumerate() {
        result[*idx] = Some(rank as f32 / (n - 1) as f32 * 100.0);
    }

    result
} 

fn compute_evaluation_averages(table: &AcademicTable) -> Vec<Option<f32>> {
    // Assuming all records have the same number of grades as table.evaluations
    // We iterate over evaluations columns
    (0..table.evaluations.len()).map(|eval_idx| {
        let mut sum = 0.0;
        let mut count = 0;

        for record in &table.records {
            if let Some(grade) = record.grades.get(eval_idx) {
                if let Some(score) = extract_raw_score(grade) {
                    sum += score;
                    count += 1;
                }
            }
        }

        if count == 0 { None } else { Some(sum / count as f32) }
    }).collect()
}

fn compute_evaluation_std(table: &AcademicTable, avgs: &[Option<f32>]) -> Vec<Option<f32>> {
    (0..table.evaluations.len()).map(|eval_idx| {
         match avgs.get(eval_idx).copied().flatten() {
            Some(avg) => {
                let mut sum_sq_diff = 0.0;
                let mut count = 0;

                for record in &table.records {
                    if let Some(grade) = record.grades.get(eval_idx) {
                        if let Some(score) = extract_raw_score(grade) {
                            let diff = score - avg;
                            sum_sq_diff += diff * diff;
                            count += 1;
                        }
                    }
                }

                if count <= 1 {
                    None
                } else {
                    Some((sum_sq_diff / (count as f32 - 1.0)).sqrt())
                }
            },
            None => None,
        }
    }).collect()
}

fn compute_student_lost_points(table: &AcademicTable) -> Vec<Option<f32>> {
    table.records.iter().map(|record| {
        let mut lost = 0.0;
        let mut has_data = false;

        for grade in &record.grades {
            if let GradeValue::Fraction { obtained, total } = grade {
                if *total > 0.0 {
                    lost += total - obtained;
                    has_data = true;
                }
            }
        }

        if has_data { Some(lost) } else { None }
    }).collect()
}

#[cfg(test)]
mod tests {
    use std::fs;
    use super::*; 

    // Tu función de setup que carga el Excel real
    fn setup() -> Vec<StudentSummary> {
        // Asegúrate que la ruta sea correcta desde donde ejecutas 'cargo test'
        let data = fs::read("./data/Notas_II.xls").expect("No se pudo leer el archivo Excel");
        let (_description_headers, table) = crate::api::parse_excel(&data).expect("Error parseando Excel");
        
        // Asumiendo que tu conversión y stats funcionan así:
        let academic = AcademicTable::try_from(table).expect("Error convirtiendo a AcademicTable");
        let stats = GradeStats::new(&academic);
        
        // Esto debería devolver los summaries con el status ya calculado
        stats.student_summaries() 
    }


    // --- NUEVO TEST DE INTEGRACIÓN (Datos Reales) ---

    #[test]
    fn debug_print_real_excel_data() {
        let students = setup();

        println!("\n========================================");
        println!(" REPORTE DE ESTADO - DATOS REALES EXCEL ");
        println!("========================================");
        println!("{:<30} | {:<10} | {:<15}", "Nombre", "Nota Actual", "Estado Calculado");
        println!("{:-<30} | {:-<10} | {:-<15}", "", "", "");

        for student in students {
            // Asumo que StudentSummary tiene campos 'name', 'final_score' (o similar) y 'status'
            // Ajusta los nombres de los campos según tu struct real
            println!(
                "{:<30} | {:<10} | {:?}", 
                student.name, 
                student.accumulated_score.unwrap_or(0.0),
                student.status
            );
        }
        println!("========================================\n");
        
    }
}
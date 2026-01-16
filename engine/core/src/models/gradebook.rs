use serde::{Deserialize, Serialize};

use crate::{error::EngineError, models::raw::RawTable, rules::AcademicStatus};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GradeTable {
    pub students: Vec<String>,            // índice
    pub evaluations: Vec<String>,         // columnas
    pub scores: Vec<Vec<Option<f32>>>,    // [student][evaluation]
}

impl GradeTable {
    pub fn student_average(&self, student_idx: usize) -> Option<f32> { 
        let scores = &self.scores[student_idx];
        let valid_scores: Vec<f32> = scores.iter().filter_map(|&s| s).collect();
        if valid_scores.is_empty() {
            None
        } else {
            Some(valid_scores.iter().sum::<f32>() / valid_scores.len() as f32)
        }
    }

    pub fn get_averages(&self) -> Vec<Option<f32>> {
        self.scores
            .iter()
            .enumerate()
            .map(|(idx, _)| self.student_average(idx))
            .collect()
    }

    pub fn student_percentile(&self, student_idx: usize) -> Option<f32> {
        let student_avg = self.student_progress_average(student_idx)?;
        let mut averages: Vec<f32> = (0..self.students.len())
            .filter_map(|i| self.student_progress_average(i))
            .collect();
        averages.sort_by(|a, b| a.partial_cmp(b).unwrap());

        let n = averages.len();
        if n <= 1 {
            return Some(100.0);
        }

        // Rank del estudiante
        let rank = averages.iter().position(|&x| (x - student_avg).abs() < f32::EPSILON)?;
        
        // Percentil = rank / (N-1) * 100
        Some((rank as f32) / ((n - 1) as f32) * 100.0)
    }


    pub fn evaluation_average(&self, eval_idx: usize) -> Option<f32> {
        let mut total = 0.0;
        let mut count = 0;

        for student_scores in &self.scores {
            if let Some(score) = student_scores.get(eval_idx).and_then(|&s| s) {
                total += score;
                count += 1;
            }
        }

        if count == 0 {
            None
        } else {
            Some(total / count as f32)
        }
    }

    pub fn evaluation_std(&self, eval_idx: usize) -> Option<f32> { 
        let avg = self.evaluation_average(eval_idx)?;
        let mut sum_sq_diff = 0.0;
        let mut count = 0;

        for student_scores in &self.scores {
            if let Some(score) = student_scores.get(eval_idx).and_then(|&s| s) {
                sum_sq_diff += (score - avg).powi(2);
                count += 1;
            }
        }

        if count == 0 {
            None
        } else {
            Some((sum_sq_diff / count as f32).sqrt())
        }
     }

    pub fn student_progress_average(&self, student_idx: usize) -> Option<f32> {
        let scores = &self.scores[student_idx];
        let valid_scores: Vec<f32> = scores.iter().filter_map(|&s| s).collect();
        if valid_scores.is_empty() {
            None
        } else {
            Some(valid_scores.iter().sum::<f32>() / valid_scores.len() as f32)
        }
    }

    pub fn academic_status(&self, student_idx: usize) -> AcademicStatus {
        match self.student_progress_average(student_idx) {
            Some(avg) if avg >= 60.0 => AcademicStatus::Approved,
            Some(avg) if avg >= 40.0 => AcademicStatus::AtRisk,
            _ => AcademicStatus::Failed,
        }
    }
}


impl TryFrom<RawTable> for GradeTable {
    type Error = EngineError;

    fn try_from(raw: RawTable) -> Result<Self, Self::Error> {
        let students = raw
            .rows
            .iter()
            .map(|row| {
                row.get(0)
                    .and_then(|opt| opt.as_ref())
                    .cloned()
                    .ok_or_else(|| EngineError::CsvParseError("Missing student name".to_string()))
            })
            .collect::<Result<Vec<String>, EngineError>>()?;

        let evaluations = raw.headers[1..].to_vec();

        let mut scores = Vec::new();
        for row in raw.rows {
            let mut score_row = Vec::new();
            for cell in &row[1..] {
                let score = match cell {
                    Some(s) => s.parse::<f32>().map(Some).map_err(|_| {
                        EngineError::CsvParseError(format!("Invalid score value: {}", s))
                    })?,
                    None => None,
                };
                score_row.push(score);
            }
            scores.push(score_row);
        }

        Ok(GradeTable {
            students,
            evaluations,
            scores,
        })
    }
}


#[cfg(test)]
mod tests {
    use super::*;
    use crate::parser::parse_csv;
    use crate::error::EngineError;
    use crate::rules::AcademicStatus;

    #[test]
    fn test_grade_table_conversion() {
        let csv_data = b"Name,Exam1,Exam2\nAlice,85.5,90.0\nBob,78.0,82.5";
        let raw_table = parse_csv(csv_data).unwrap();
        let grade_table = GradeTable::try_from(raw_table).unwrap();

        assert_eq!(grade_table.students, vec!["Alice".to_string(), "Bob".to_string()]);
        assert_eq!(grade_table.evaluations, vec!["Exam1".to_string(), "Exam2".to_string()]);
        assert_eq!(
            grade_table.scores,
            vec![
                vec![Some(85.5), Some(90.0)],
                vec![Some(78.0), Some(82.5)]
            ]
        );
    }

    #[test]
    fn test_invalid_score() {
        let csv_data = b"Name,Exam1,Exam2\nAlice,85.5,abc\nBob,78.0,82.5";
        let raw_table = parse_csv(csv_data).unwrap();
        let result = GradeTable::try_from(raw_table);

        assert!(matches!(result, Err(EngineError::CsvParseError(_))));
    }

    #[test]
    fn test_missing_student_name() {
        let csv_data = b"Name,Exam1,Exam2\n,85.5,90.0\nBob,78.0,82.5";
        let raw_table = parse_csv(csv_data).unwrap();
        let result = GradeTable::try_from(raw_table);

        assert!(matches!(result, Err(EngineError::CsvParseError(_))));
    }

    #[test]
    fn test_student_average() {
        let csv_data = b"Name,Exam1,Exam2,Exam3\nAlice,80.0,90.0,100.0\nBob,70.0,80.0,90.0";
        let raw_table = parse_csv(csv_data).unwrap();
        let grade_table = GradeTable::try_from(raw_table).unwrap();
        
        // Test promedio normal
        assert_eq!(grade_table.student_average(0), Some(90.0)); // Alice: (80+90+100)/3
        assert_eq!(grade_table.student_average(1), Some(80.0)); // Bob: (70+80+90)/3
        
        // Test con datos faltantes
        let csv_data_missing = b"Name,Exam1,Exam2,Exam3\nAlice,80.0,,100.0\nBob,70.0,80.0,";
        let raw_table_missing = parse_csv(csv_data_missing).unwrap();
        let grade_table_missing = GradeTable::try_from(raw_table_missing).unwrap();
        
        assert_eq!(grade_table_missing.student_average(0), Some(90.0)); // Alice: (80+100)/2
        assert_eq!(grade_table_missing.student_average(1), Some(75.0)); // Bob: (70+80)/2
    }

    #[test]
    fn test_student_average_no_scores() {
        let csv_data = b"Name,Exam1,Exam2\nAlice,,\nBob,,";
        let raw_table = parse_csv(csv_data).unwrap();
        let grade_table = GradeTable::try_from(raw_table).unwrap();
        
        assert_eq!(grade_table.student_average(0), None);
        assert_eq!(grade_table.student_average(1), None);
    }

    #[test]
    fn test_get_averages() {
        let csv_data = b"Name,Exam1,Exam2\nAlice,80.0,90.0\nBob,70.0,80.0\nCharlie,60.0,70.0";
        let raw_table = parse_csv(csv_data).unwrap();
        let grade_table = GradeTable::try_from(raw_table).unwrap();
        
        let averages = grade_table.get_averages();
        assert_eq!(averages, vec![Some(85.0), Some(75.0), Some(65.0)]);
    }

    #[test]
    fn test_student_percentile() {
        let csv_data = b"Name,Exam1,Exam2\nAlice,90.0,95.0\nBob,80.0,85.0\nCharlie,70.0,75.0\nDavid,60.0,65.0";
        let raw_table = parse_csv(csv_data).unwrap();
        let grade_table = GradeTable::try_from(raw_table).unwrap();
        
        // Alice tiene el promedio más alto (92.5) - percentil 100%
        assert_eq!(grade_table.student_percentile(0).unwrap().round(), 100.0);
        
        // Bob tiene el segundo promedio más alto (82.5) - percentil 66.66%
        assert!((grade_table.student_percentile(1).unwrap() - 66.67).abs() < 0.1);
        
        // Charlie tiene el tercer promedio (72.5) - percentil 33.33%
        assert!((grade_table.student_percentile(2).unwrap() - 33.33).abs() < 0.1);
        
        // David tiene el promedio más bajo (62.5) - percentil 0%
        assert_eq!(grade_table.student_percentile(3).unwrap().round(), 0.0);
    }

    #[test]
    fn test_student_percentile_no_average() {
        let csv_data = b"Name,Exam1,Exam2\nAlice,,\nBob,80.0,85.0";
        let raw_table = parse_csv(csv_data).unwrap();
        let grade_table = GradeTable::try_from(raw_table).unwrap();
        
        assert_eq!(grade_table.student_percentile(0), None); // Alice no tiene promedios
        assert_eq!(grade_table.student_percentile(1), Some(100.0)); // Bob es el único con promedio
    }

    #[test]
    fn test_evaluation_average() {
        let csv_data = b"Name,Exam1,Exam2,Exam3\nAlice,80.0,90.0,100.0\nBob,70.0,85.0,95.0\nCharlie,60.0,80.0,90.0";
        let raw_table = parse_csv(csv_data).unwrap();
        let grade_table = GradeTable::try_from(raw_table).unwrap();
        
        // Exam1: (80+70+60)/3 = 70.0
        assert_eq!(grade_table.evaluation_average(0), Some(70.0));
        
        // Exam2: (90+85+80)/3 = 85.0
        assert_eq!(grade_table.evaluation_average(1), Some(85.0));
        
        // Exam3: (100+95+90)/3 = 95.0
        assert_eq!(grade_table.evaluation_average(2), Some(95.0));
    }

    #[test]
    fn test_evaluation_average_with_missing() {
        let csv_data = b"Name,Exam1,Exam2\nAlice,80.0,\nBob,,85.0\nCharlie,60.0,80.0";
        let raw_table = parse_csv(csv_data).unwrap();
        let grade_table = GradeTable::try_from(raw_table).unwrap();
        
        // Exam1: Solo Alice y Charlie tienen nota: (80+60)/2 = 70.0
        assert_eq!(grade_table.evaluation_average(0), Some(70.0));
        
        // Exam2: Solo Bob y Charlie tienen nota: (85+80)/2 = 82.5
        assert_eq!(grade_table.evaluation_average(1), Some(82.5));
    }

    #[test]
    fn test_evaluation_average_no_scores() {
        let csv_data = b"Name,Exam1,Exam2\nAlice,,\nBob,,";
        let raw_table = parse_csv(csv_data).unwrap();
        let grade_table = GradeTable::try_from(raw_table).unwrap();
        
        assert_eq!(grade_table.evaluation_average(0), None);
        assert_eq!(grade_table.evaluation_average(1), None);
    }

    #[test]
    fn test_evaluation_std() {
        let csv_data = b"Name,Exam1\nAlice,70.0\nBob,80.0\nCharlie,90.0";
        let raw_table = parse_csv(csv_data).unwrap();
        let grade_table = GradeTable::try_from(raw_table).unwrap();
        
        // Promedio: 80.0
        // Varianza: [(70-80)^2 + (80-80)^2 + (90-80)^2]/3 = (100+0+100)/3 = 66.67
        // Desviación estándar: sqrt(66.67) ≈ 8.165
        let std = grade_table.evaluation_std(0).unwrap();
        assert!((std - 8.165).abs() < 0.01);
    }

    #[test]
    fn test_evaluation_std_with_missing() {
        let csv_data = b"Name,Exam1\nAlice,70.0\nBob,\nCharlie,90.0";
        let raw_table = parse_csv(csv_data).unwrap();
        let grade_table = GradeTable::try_from(raw_table).unwrap();
        
        // Solo Alice y Charlie tienen notas
        // Promedio: (70+90)/2 = 80.0
        // Varianza: [(70-80)^2 + (90-80)^2]/2 = (100+100)/2 = 100
        // Desviación estándar: sqrt(100) = 10.0
        assert_eq!(grade_table.evaluation_std(0), Some(10.0));
    }

    #[test]
    fn test_evaluation_std_no_scores() {
        let csv_data = b"Name,Exam1\nAlice,\nBob,";
        let raw_table = parse_csv(csv_data).unwrap();
        let grade_table = GradeTable::try_from(raw_table).unwrap();
        
        assert_eq!(grade_table.evaluation_std(0), None);
    }

    #[test]
    fn test_student_progress_average() {
        // Esta función parece ser idéntica a student_average, pero la probamos igual
        let csv_data = b"Name,Exam1,Exam2,Exam3\nAlice,80.0,85.0,90.0\nBob,70.0,75.0,80.0";
        let raw_table = parse_csv(csv_data).unwrap();
        let grade_table = GradeTable::try_from(raw_table).unwrap();
        
        assert_eq!(grade_table.student_progress_average(0), Some(85.0));
        assert_eq!(grade_table.student_progress_average(1), Some(75.0));
    }

    #[test]
    fn test_academic_status() {
        let csv_data = b"Name,Exam1,Exam2,Exam3\nAlice,80.0,85.0,90.0\nBob,45.0,50.0,55.0\nCharlie,35.0,40.0,45.0";
        let raw_table = parse_csv(csv_data).unwrap();
        let grade_table = GradeTable::try_from(raw_table).unwrap();
        
        // Alice: promedio 85.0 >= 60 => Aprobado
        assert_eq!(grade_table.academic_status(0), AcademicStatus::Approved);
        
        // Bob: promedio 50.0 entre 40 y 60 => En riesgo
        assert_eq!(grade_table.academic_status(1), AcademicStatus::AtRisk);
        
        // Charlie: promedio 40.0 < 40 => Reprobado
        assert_eq!(grade_table.academic_status(2), AcademicStatus::AtRisk);
    }

    #[test]
    fn test_academic_status_with_missing() {
        let csv_data = b"Name,Exam1,Exam2\nAlice,30.0,\nBob,,";
        let raw_table = parse_csv(csv_data).unwrap();
        let grade_table = GradeTable::try_from(raw_table).unwrap();
        
        // Alice: solo tiene 30.0 => < 40 => Failed
        assert_eq!(grade_table.academic_status(0), AcademicStatus::Failed);
        
        // Bob: no tiene notas => Failed
        assert_eq!(grade_table.academic_status(1), AcademicStatus::Failed);
    }

    #[test]
    fn test_edge_cases() {
        // Test con un solo estudiante
        let csv_data = b"Name,Exam1,Exam2\nAlice,100.0,100.0";
        let raw_table = parse_csv(csv_data).unwrap();
        let grade_table = GradeTable::try_from(raw_table).unwrap();
        
        assert_eq!(grade_table.student_average(0), Some(100.0));
        assert_eq!(grade_table.student_percentile(0), Some(100.0));
        assert_eq!(grade_table.evaluation_average(0), Some(100.0));
        assert_eq!(grade_table.evaluation_std(0), Some(0.0));
        
        // Test con evaluaciones vacías
        let csv_data_empty = b"Name\nAlice";
        let raw_table_empty = parse_csv(csv_data_empty).unwrap();
        let grade_table_empty = GradeTable::try_from(raw_table_empty).unwrap();
        
        assert_eq!(grade_table_empty.evaluations.len(), 0);
        assert_eq!(grade_table_empty.scores[0].len(), 0);
        assert_eq!(grade_table_empty.student_average(0), None);
    }

    #[test]
    fn test_large_numbers() {
        // Test con números grandes
        let csv_data = b"Name,Exam1,Exam2\nAlice,999999.5,0.5\nBob,500000.0,500000.0";
        let raw_table = parse_csv(csv_data).unwrap();
        let grade_table = GradeTable::try_from(raw_table).unwrap();
        
        assert_eq!(grade_table.student_average(0), Some(500000.0));
        assert_eq!(grade_table.student_average(1), Some(500000.0));
        assert_eq!(grade_table.evaluation_average(0), Some(749999.75));
    }

    #[test]
    fn test_negative_scores() {
        // Test con calificaciones negativas (aunque no sea común en la vida real)
        let csv_data = b"Name,Exam1,Exam2\nAlice,-10.0,110.0\nBob,0.0,100.0";
        let raw_table = parse_csv(csv_data).unwrap();
        let grade_table = GradeTable::try_from(raw_table).unwrap();
        
        assert_eq!(grade_table.student_average(0), Some(50.0));
        assert_eq!(grade_table.student_average(1), Some(50.0));
    }
}
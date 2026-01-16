use serde::{Deserialize, Serialize};

use crate::{error::EngineError, models::raw::RawTable};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GradeTable {
    pub students: Vec<String>,            // índice
    pub evaluations: Vec<String>,         // columnas
    pub scores: Vec<Vec<Option<f32>>>,    // [student][evaluation]
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
}
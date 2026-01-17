use serde::{Deserialize, Serialize};

use crate::{error::EngineError, models::raw::RawTable};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GradeTable {
    pub students: Vec<String>,            // índice
    pub evaluations: Vec<String>,         // columnas
    pub scores: Vec<Vec<Option<f32>>>,    // [student][evaluation]
}

impl GradeTable {
    pub fn student_count(&self) -> usize {
        self.students.len()
    }

    pub fn evaluation_count(&self) -> usize {
        self.evaluations.len()
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


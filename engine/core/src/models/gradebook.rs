use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GradeTable {
    pub students: Vec<String>,            // índice
    pub evaluations: Vec<String>,         // columnas
    pub scores: Vec<Vec<Option<f32>>>,    // [student][evaluation]
}

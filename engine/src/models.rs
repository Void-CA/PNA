// engine/src/model.rs

use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Student {
    pub id: String,
    pub name: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Evaluation {
    pub id: String,
    pub name: String,
    pub weight: f32, // 0.0 – 1.0
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Grade {
    pub student_id: String,
    pub evaluation_id: String,
    pub value: f32, // 0 – 100 or 0 – 10 (normalized later)
}

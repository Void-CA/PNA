use serde::{Deserialize, Serialize};

#[derive(Debug, Clone)]
pub struct Rules {
    pub minimum_grade: f32,
    pub round: bool,
    pub decimals: u8,
}

#[derive(Debug, Clone, Serialize)]
pub struct StudentResult {
    pub student_id: String,
    pub name: String,
    pub average: f32,
    pub status: AcademicStatus,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum AcademicStatus {
    Approved,
    AtRisk,
    Failed,
}

use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum AcademicStatus {
    Approved,
    AtRisk,
    Failed,
}

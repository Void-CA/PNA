use serde::{Deserialize, Serialize};

use crate::api::AcademicStatus;

#[derive(Serialize, Deserialize, Debug)]
pub struct StudentSummary {
    pub id : String,
    pub name: String,
    pub accumulated_score: Option<f32>,
    pub lost_points: Option<f32>,
    pub percentile: Option<f32>,
    pub std_dev: Option<f32>,
    pub status: AcademicStatus,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct EvaluationSummary {
    pub id: String,
    pub name: String,

    pub average: Option<f32>,
    pub std_dev: Option<f32>,

    pub highest_score: Option<f32>,
    pub lowest_score: Option<f32>,
    pub max_possible_score: Option<f32>,

    pub evaluated_count: usize,
    pub missing_count: usize,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct ClassSummary {
    pub student_count: usize,

    pub acumulated_points: Option<f32>,
    pub overall_average: Option<f32>,
    pub overall_std_dev: Option<f32>,

    pub approved_count: usize,
    pub failed_count: usize,
    pub on_track_count: usize,
    pub warning_count: usize,
    pub critical_count: usize,
}   


#[derive(Serialize, Deserialize, Debug)]
pub struct GradebookSummary {
    pub students: Vec<StudentSummary>,
    pub evaluations: Vec<EvaluationSummary>,
    pub class: ClassSummary,
}


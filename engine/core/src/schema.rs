// engine/src/schema.rs

#[derive(Debug, Clone)]
pub struct Schema {
    pub student_id: String,
    pub student_name: String,
    pub evaluations: Vec<EvaluationSchema>,
}

#[derive(Debug, Clone)]
pub struct EvaluationSchema {
    pub column: String,
    pub id: String,
    pub weight: f32,
}

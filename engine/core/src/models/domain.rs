pub struct Evaluation {
    pub id: String,
    pub name: String,
    pub weight: Option<f32>,
}

pub struct Grade {
    pub student_id: String,
    pub evaluation_id: String,
    pub value: Option<f32>,
}
pub struct Student {
    pub id: String,
    pub name: String,
}
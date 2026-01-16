// engine/src/schema.rs

#[derive(Debug, Clone)]
pub struct Schema {
    pub alumno_id: String,
    pub alumno_nombre: String,
    pub evaluaciones: Vec<EvaluacionSchema>,
}

#[derive(Debug, Clone)]
pub struct EvaluacionSchema {
    pub columna: String,
    pub id: String,
    pub peso: f32,
}

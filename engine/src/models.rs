// engine/src/model.rs

use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Alumno {
    pub id: String,
    pub nombre: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Evaluacion {
    pub id: String,
    pub nombre: String,
    pub peso: f32, // 0.0 – 1.0
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Nota {
    pub alumno_id: String,
    pub evaluacion_id: String,
    pub valor: f32, // 0 – 100 o 0 – 10 (normalizado luego)
}

use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum AcademicStatus {
    Approved,           // Ya superó el 60 (Matemáticamente a salvo)
    OnTrack,            // No llega a 60 aún, pero su rendimiento actual es aprobatorio
    Warning,            // Puede pasar, pero necesita mejorar su rendimiento en lo que falta
    Critical,           // Matemáticamente posible, pero necesita notas casi perfectas
    Failed,             // Matemáticamente imposible llegar a 60 (Ej: tiene 30 y faltan 20 pts)
}
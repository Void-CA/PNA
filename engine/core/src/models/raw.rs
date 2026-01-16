use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RawTable {
    pub headers: Vec<String>,
    pub rows: Vec<Vec<Option<String>>>,
}
    
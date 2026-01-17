use pna_core::{api::{GradeStatsOwned, GradeTable, parse_csv}};
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub struct GradeEngine {
    table: GradeTable,
    stats: GradeStatsOwned,
}

#[wasm_bindgen]
impl GradeEngine {
    #[wasm_bindgen(constructor)]
    pub fn new(csv_data: &[u8]) -> Result<GradeEngine, JsValue> {
        let raw = parse_csv(csv_data)
            .map_err(|e| JsValue::from_str(&e.to_string()))?;

        let table = GradeTable::try_from(raw)
            .map_err(|e| JsValue::from_str(&e.to_string()))?;

        let stats = GradeStatsOwned::from(&table);

        Ok(Self { table, stats })
    }

    pub fn get_summary(&self) -> Result<JsValue, JsValue> {
        serde_wasm_bindgen::to_value(&self.stats)
            .map_err(|e| JsValue::from_str(&e.to_string()))
    }

    pub fn get_table(&self) -> Result<JsValue, JsValue> {
        serde_wasm_bindgen::to_value(&self.table)
            .map_err(|e| JsValue::from_str(&e.to_string()))
    }
}

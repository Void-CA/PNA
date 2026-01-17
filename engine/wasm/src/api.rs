use wasm_bindgen::prelude::*;
use pna_core::parser::parse_csv;
use pna_core::models::gradebook::GradeTable;
use serde_wasm_bindgen::to_value;


#[wasm_bindgen]
pub fn parse_csv_wasm(data: &[u8]) -> Result<JsValue, JsValue> {
    let raw = parse_csv(data)
        .map_err(|e| JsValue::from_str(&e.to_string()))?;
    to_value(&raw)
        .map_err(|e| JsValue::from_str(&e.to_string()))
}

#[wasm_bindgen]
pub fn build_grade_table(raw: JsValue) -> Result<JsValue, JsValue> {
    let raw: RawTable = serde_wasm_bindgen::from_value(raw)
        .map_err(|e| JsValue::from_str(&e.to_string()))?;

    let table = GradeTable::try_from(raw)
        .map_err(|e| JsValue::from_str(&e.to_string()))?;

    to_value(&table)
        .map_err(|e| JsValue::from_str(&e.to_string()))
}

#[wasm_bindgen]
pub fn student_average(
    table: JsValue,
    student_idx: usize,
) -> Result<JsValue, JsValue> {
    let table: GradeTable = serde_wasm_bindgen::from_value(table)
        .map_err(|e| JsValue::from_str(&e.to_string()))?;

    let avg = table.student_average(student_idx);

    serde_wasm_bindgen::to_value(&avg)
        .map_err(|e| JsValue::from_str(&e.to_string()))
}

#[wasm_bindgen]
pub fn student_percentile(
    table: JsValue,
    student_idx: usize,
) -> Result<f32, JsValue> {
    let table: GradeTable = serde_wasm_bindgen::from_value(table)
        .map_err(|e| JsValue::from_str(&e.to_string()))?;

    table.student_percentile(student_idx)
        .ok_or_else(|| JsValue::from_str("Invalid student index"))
}

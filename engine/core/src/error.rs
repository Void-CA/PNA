#[derive(Debug)]
pub enum EngineError {
    Utf8Error,
    EmptyInput,
    InconsistentColumns,
    CsvParseError(String),
}

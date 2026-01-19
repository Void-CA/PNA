#[derive(Debug)]
pub enum EngineError {
    Utf8Error,
    ExcelError,
    EmptyInput,
    InconsistentColumns,
    CsvParseError(String),
}

impl std::fmt::Display for EngineError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            EngineError::Utf8Error => write!(f, "Input data is not valid UTF-8"),
            EngineError::EmptyInput => write!(f, "Input data is empty"),
            EngineError::InconsistentColumns => write!(f, "Inconsistent number of columns in CSV data"),
            EngineError::CsvParseError(msg) => write!(f, "CSV parse error: {}", msg),
            EngineError::ExcelError => write!(f, "Error processing Excel file"),
        }
    }
}
#[derive(Debug)]
pub enum EngineError {
    ParseError(String),
    SchemaError(String),
    RulesError(String),
}

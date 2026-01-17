pub mod api {
    pub use crate::parser::parse_csv;
    pub use crate::models::raw::RawTable;
    pub use crate::models::gradebook::GradeTable;
    pub use crate::models::stats::GradeStatsOwned;
    pub use crate::rules::AcademicStatus;
}

pub mod error;
pub mod parser;
pub mod models;
pub mod rules;
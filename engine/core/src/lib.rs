pub mod api {
    pub use crate::parser::parse_excel;
    pub use crate::models::raw::RawTable;
    pub use crate::models::gradebook::AcademicTable;
    pub use crate::models::stats::{GradeStats, GradeStatsOwned};
    pub use crate::rules::AcademicStatus;
}

pub mod error;
pub mod parser;
pub mod models;
pub mod rules;
pub mod domain;
pub mod gradebook;
pub mod raw;
pub mod stats;

pub use stats::{GradeStats, GradeStatsOwned};
pub use gradebook::AcademicTable;
pub use raw::RawTable;
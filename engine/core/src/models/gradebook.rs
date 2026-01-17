#[derive(Debug, Clone)]
pub struct GradeTable {
    pub students: Vec<String>,          // índice
    pub evaluations: Vec<String>,       // columnas
    pub scores: Vec<Vec<Option<f32>>>,  // [student][evaluation]
}

impl GradeTable {
    pub fn student_count(&self) -> usize {
        self.students.len()
    }

    pub fn evaluation_count(&self) -> usize {
        self.evaluations.len()
    }

    pub fn stats(&self) -> GradeStats {
        GradeStats::new(self)
    }
}

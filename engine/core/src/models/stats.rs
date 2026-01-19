use serde::{Deserialize, Serialize};

use crate::models::domain::{ClassSummary, EvaluationSummary, GradebookSummary, StudentSummary};
use crate::models::gradebook::{AcademicTable, GradeValue};
use crate::rules::AcademicStatus;

pub struct GradeStats<'a> {
    table: &'a AcademicTable,

    student_averages: Vec<Option<f32>>,
    student_std: Vec<Option<f32>>,
    student_percentiles: Vec<Option<f32>>,

    evaluation_averages: Vec<Option<f32>>,
    evaluation_std: Vec<Option<f32>>,
}

#[derive(Serialize, Deserialize)]
pub struct GradeStatsOwned {
    pub students: Vec<StudentSummary>,
    pub evaluations: Vec<EvaluationSummary>,
    pub class: ClassSummary,
}


impl From<&AcademicTable> for GradeStatsOwned {
    fn from(table: &AcademicTable) -> Self {
        let grades_stats = GradeStats::new(table);
        Self {
            students: grades_stats.student_summaries(),
            evaluations: grades_stats.evaluation_summaries(),
            class: grades_stats.class_summary(),
        }
    }
}


impl<'a> GradeStats<'a> {
    pub fn new(table: &'a AcademicTable) -> Self {
        let student_averages = compute_student_averages(table);
        let student_std = compute_student_std(table, &student_averages);
        let student_percentiles = compute_student_percentiles(&student_averages);

        let evaluation_averages = compute_evaluation_averages(table);
        let evaluation_std = compute_evaluation_std(table, &evaluation_averages);

        Self {
            table,
            student_averages,
            student_std,
            student_percentiles,
            evaluation_averages,
            evaluation_std,
        }
    }

    pub fn academic_status(&self, student_idx: usize) -> AcademicStatus {
        match self.student_averages[student_idx] {
            Some(avg) if avg >= 60.0 => AcademicStatus::Approved,
            Some(avg) if avg >= 40.0 => AcademicStatus::AtRisk,
            _ => AcademicStatus::Failed,
        }
    }
        
    pub fn student_summaries(&self) -> Vec<StudentSummary> {
        self.table.records.iter().enumerate().map(|(i, record)| {
            StudentSummary {
                id: record.carnet.clone(),
                name: record.name.clone(),
                average: self.student_averages[i],
                percentile: self.student_percentiles[i],
                std_dev: self.student_std[i],
                status: self.academic_status(i),
            }
        }).collect()
    }

    pub fn evaluation_summaries(&self) -> Vec<EvaluationSummary> {
        self.table.evaluations.iter().enumerate().map(|(eval_idx, name)| {
            let mut highest_score = None;
            let mut lowest_score = None;
            let mut evaluated_count = 0;
            let mut missing_count = 0;

            for record in &self.table.records {
                // Ensure we don't go out of bounds if records have diff lengths (shouldn't happen in valid table)
                if let Some(grade_value) = record.grades.get(eval_idx) {
                    if let Some(score) = extract_score(grade_value) {
                         evaluated_count += 1;
                         highest_score = Some(highest_score.map_or(score, |hs:f32| hs.max(score)));
                         lowest_score = Some(lowest_score.map_or(score, |ls:f32| ls.min(score)));
                    } else {
                        missing_count += 1;
                    }
                } else {
                    missing_count += 1;
                }
            }

            EvaluationSummary {
                id: eval_idx.to_string(), // Or use name as ID if unique? Keeping index for safety
                name: name.clone(),
                average: self.evaluation_averages.get(eval_idx).copied().flatten(),
                std_dev: self.evaluation_std.get(eval_idx).copied().flatten(),
                highest_score,
                lowest_score,
                evaluated_count,
                missing_count,
            }
        }).collect()
    }

    pub fn class_summary(&self) -> ClassSummary {
        let mut count = 0;
        let mut mean = 0.0;
        let mut m2 = 0.0;

        let mut approved_count = 0;
        let mut at_risk_count = 0;
        let mut failed_count = 0;

        for (i, avg_opt) in self.student_averages.iter().enumerate() {
            let avg = match avg_opt {
                Some(v) => *v,
                None => continue,
            };

            count += 1;

            // Welford
            let delta = avg - mean;
            mean += delta / count as f32;
            let delta2 = avg - mean;
            m2 += delta * delta2;

            match self.academic_status(i) {
                AcademicStatus::Approved => approved_count += 1,
                AcademicStatus::AtRisk => at_risk_count += 1,
                AcademicStatus::Failed => failed_count += 1,
            }
        }

        let overall_average = if count > 0 { Some(mean) } else { None };
        let overall_std_dev = if count > 1 {
            Some((m2 / (count as f32 - 1.0)).sqrt())
        } else {
            None
        };

        ClassSummary {
            student_count: self.table.records.len(),
            overall_average,
            overall_std_dev,
            approved_count,
            at_risk_count,
            failed_count,
        }
    
    }


    pub fn summary(&self) -> GradebookSummary {
        GradebookSummary {
            students: self.student_summaries(),
            evaluations: self.evaluation_summaries(),
            class: self.class_summary(),
        }
    }
}

/// Helper to extract a 0-100 float from a GradeValue
fn extract_score(value: &GradeValue) -> Option<f32> {
    match value {
        GradeValue::Numeric(v) => Some(*v),
        GradeValue::Fraction { obtained, total } => {
            if *total == 0.0 {
                None
            } else {
                Some((obtained / total) * 100.0)
            }
        },
        GradeValue::Withdrawn | GradeValue::Absent | GradeValue::Label(_) => None,
    }
}

fn compute_student_averages(table: &AcademicTable) -> Vec<Option<f32>> {
    table.records.iter().map(|record| {
        let mut sum = 0.0;
        let mut count = 0;

        for grade in &record.grades {
            if let Some(v) = extract_score(grade) {
                sum += v;
                count += 1;
            }
        }

        if count == 0 { None } else { Some(sum / count as f32) }
    }).collect()
}

fn compute_student_std(table: &AcademicTable, avgs: &[Option<f32>]) -> Vec<Option<f32>> {
    table.records.iter().enumerate().map(|(student_idx, record)| {
        match avgs.get(student_idx).copied().flatten() {
            Some(avg) => {
                let mut sum_sq_diff = 0.0;
                let mut count = 0;

                for grade in &record.grades {
                    if let Some(v) = extract_score(grade) {
                        let diff = v - avg;
                        sum_sq_diff += diff * diff;
                        count += 1;
                    }
                }

                if count <= 1 {
                    None
                } else {
                    Some((sum_sq_diff / (count as f32 - 1.0)).sqrt())
                }
            },
            None => None,
        }
    }).collect()
}

fn compute_student_percentiles(avgs: &[Option<f32>]) -> Vec<Option<f32>> {
    let mut valid: Vec<(usize, f32)> = avgs.iter()
        .enumerate()
        .filter_map(|(i, v)| v.map(|x| (i, x)))
        .collect();

    valid.sort_by(|a, b| a.1.partial_cmp(&b.1).unwrap());

    let n = valid.len();
    let mut result = vec![None; avgs.len()];

    if n <= 1 {
        for (idx, _) in valid {
            result[idx] = Some(100.0);
        }
        return result;
    }

    for (rank, (idx, _)) in valid.iter().enumerate() {
        result[*idx] = Some(rank as f32 / (n - 1) as f32 * 100.0);
    }

    result
} 

fn compute_evaluation_averages(table: &AcademicTable) -> Vec<Option<f32>> {
    // Assuming all records have the same number of grades as table.evaluations
    // We iterate over evaluations columns
    (0..table.evaluations.len()).map(|eval_idx| {
        let mut sum = 0.0;
        let mut count = 0;

        for record in &table.records {
            if let Some(grade) = record.grades.get(eval_idx) {
                if let Some(score) = extract_score(grade) {
                    sum += score;
                    count += 1;
                }
            }
        }

        if count == 0 { None } else { Some(sum / count as f32) }
    }).collect()
}

fn compute_evaluation_std(table: &AcademicTable, avgs: &[Option<f32>]) -> Vec<Option<f32>> {
    (0..table.evaluations.len()).map(|eval_idx| {
         match avgs.get(eval_idx).copied().flatten() {
            Some(avg) => {
                let mut sum_sq_diff = 0.0;
                let mut count = 0;

                for record in &table.records {
                    if let Some(grade) = record.grades.get(eval_idx) {
                        if let Some(score) = extract_score(grade) {
                            let diff = score - avg;
                            sum_sq_diff += diff * diff;
                            count += 1;
                        }
                    }
                }

                if count <= 1 {
                    None
                } else {
                    Some((sum_sq_diff / (count as f32 - 1.0)).sqrt())
                }
            },
            None => None,
        }
    }).collect()
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::models::gradebook::{StudentRecord, GradeValue, AcademicTable};

    #[test]
    fn test_stats_metrics() {
        let records = vec![
            // Student 1: 9/10 (90.0) + 80.0 => Avg 85.0
            StudentRecord {
                carnet: "A".to_string(), name: "A".to_string(), email: "".to_string(), group: "".to_string(),
                grades: vec![
                    GradeValue::Fraction { obtained: 9.0, total: 10.0 }, 
                    GradeValue::Numeric(80.0)
                ],
                final_grade: GradeValue::Numeric(85.0)
            },
            // Student 2: RM + 50.0 => Avg 50.0 (RM ignored for avg)
            StudentRecord {
                carnet: "B".to_string(), name: "B".to_string(), email: "".to_string(), group: "".to_string(),
                grades: vec![
                    GradeValue::Withdrawn,
                    GradeValue::Numeric(50.0)
                ],
                final_grade: GradeValue::Withdrawn
            },
            // Student 3: NP + NP => Avg None
            StudentRecord {
                carnet: "C".to_string(), name: "C".to_string(), email: "".to_string(), group: "".to_string(),
                grades: vec![
                    GradeValue::Absent,
                    GradeValue::Absent // Same as NP
                ],
                final_grade: GradeValue::Absent
            }
        ];

        let table = AcademicTable {
            evaluations: vec!["Eval1".to_string(), "Eval2".to_string()],
            records
        };

        let stats = GradeStats::new(&table);
        let summary = stats.summary();

        // Check Student A
        let s_a = summary.students.iter().find(|s| s.id == "A").unwrap();
        assert_eq!(s_a.average, Some(85.0));
        assert_eq!(s_a.status, AcademicStatus::Approved);

        // Check Student B
        let s_b = summary.students.iter().find(|s| s.id == "B").unwrap();
        assert_eq!(s_b.average, Some(50.0));
        assert_eq!(s_b.status, AcademicStatus::AtRisk); // >= 40

        // Check Student C
        let s_c = summary.students.iter().find(|s| s.id == "C").unwrap();
        assert_eq!(s_c.average, None);
        // Status for None? academic_status implementation:
        // match self.student_averages[student_idx] { ... _ => AcademicStatus::Failed }
        // So None -> Failed
        assert_eq!(s_c.status, AcademicStatus::Failed);

        // Check Evaluation 1 Stats
        // Grades: 90.0 (A), None (B), None (C) -> Avg 90.0
        let eval1 = summary.evaluations.get(0).unwrap();
        assert_eq!(eval1.average, Some(90.0));
        assert_eq!(eval1.evaluated_count, 1);
        assert_eq!(eval1.missing_count, 2);

        // Check Evaluation 2 Stats
        // Grades: 80.0 (A), 50.0 (B), None (C) -> Avg 65.0
        let eval2 = summary.evaluations.get(1).unwrap();
        assert_eq!(eval2.average, Some(65.0));
        assert_eq!(eval2.evaluated_count, 2);

        // Check Class Stats
        // Averages: 85.0, 50.0. (C ignored). 
        // Mean = (85+50)/2 = 67.5
        let cls = summary.class;
        assert_eq!(cls.student_count, 3);
        assert_eq!(cls.overall_average, Some(67.5));
    }
}


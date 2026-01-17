pub struct GradeStats<'a> {
    table: &'a GradeTable,

    student_averages: Vec<Option<f32>>,
    student_std: Vec<Option<f32>>,
    student_percentiles: Vec<Option<f32>>,

    evaluation_averages: Vec<Option<f32>>,
    evaluation_std: Vec<Option<f32>>,
}

impl<'a> GradeStats<'a> {
    pub fn new(table: &'a GradeTable) -> Self {
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
        self.table.students.iter().enumerate().map(|(i, name)| {
            StudentSummary {
                id: i.to_string(),
                name: name.clone(),
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

            for student_scores in &self.table.scores {
                match student_scores.get(eval_idx).and_then(|v| *v) {
                    Some(score) => {
                        evaluated_count += 1;
                        highest_score = Some(highest_score.map_or(score, |hs| hs.max(score)));
                        lowest_score = Some(lowest_score.map_or(score, |ls| ls.min(score)));
                    }
                    None => {
                        missing_count += 1;
                    }
                }
            }

            EvaluationSummary {
                id: eval_idx.to_string(),
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
            student_count: self.table.student_count(),
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

fn compute_student_averages(table: &GradeTable) -> Vec<Option<f32>> {
    table.scores.iter().map(|scores| {
        let mut sum = 0.0;
        let mut count = 0;

        for &s in scores {
            if let Some(v) = s {
                sum += v;
                count += 1;
            }
        }

        if count == 0 { None } else { Some(sum / count as f32) }
    }).collect()
}

fn compute_student_std(table: &GradeTable, avgs: &[Option<f32>]) -> Vec<Option<f32>> {
    table.scores.iter().enumerate().map(|(student_idx, scores)| {
        match avgs.get(student_idx).copied().flatten() {
            Some(avg) => {
                let mut sum_sq_diff = 0.0;
                let mut count = 0;

                for &s in scores {
                    if let Some(v) = s {
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

fn compute_evaluation_averages(table: &GradeTable) -> Vec<Option<f32>> {
    table.evaluations.iter().enumerate().map(|(eval_idx, _)| {
        let mut sum = 0.0;
        let mut count = 0;

        for student_scores in &table.scores {
            if let Some(Some(score)) = student_scores.get(eval_idx) {
                sum += score;
                count += 1;
            }
        }

        if count == 0 { None } else { Some(sum / count as f32) }
    }).collect()
}

fn compute_evaluation_std(table: &GradeTable, avgs: &[Option<f32>]) -> Vec<Option<f32>> {
    table.evaluations.iter().enumerate().map(|(eval_idx, _)| {
        match avgs.get(eval_idx).copied().flatten() {
            Some(avg) => {
                let mut sum_sq_diff = 0.0;
                let mut count = 0;

                for student_scores in &table.scores {
                    if let Some(score) = student_scores[eval_idx] {
                        let diff = score - avg;
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


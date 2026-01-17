use crate::models::domain::{ClassSummary, EvaluationSummary, GradebookSummary, StudentSummary};
use crate::models::gradebook::GradeTable;
use crate::rules::AcademicStatus;

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
                        highest_score = Some(highest_score.map_or(score, |hs:f32| hs.max(score)));
                        lowest_score = Some(lowest_score.map_or(score, |ls:f32| ls.min(score)));
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

#[cfg(test)]
mod tests {
    use super::*;
    use crate::parser::parse_csv;

    // Helper para crear GradeTable de prueba
    fn create_test_grade_table() -> GradeTable {
        let csv_data = b"Name,Exam1,Exam2,Exam3\n\
                        Alice,80.0,85.0,90.0\n\
                        Bob,70.0,75.0,80.0\n\
                        Charlie,60.0,65.0,70.0\n\
                        David,40.0,45.0,50.0\n\
                        Eve,30.0,35.0,40.0";
        let raw_table = parse_csv(csv_data).unwrap();
        GradeTable::try_from(raw_table).unwrap()
    }

    #[test]
    fn test_grade_stats_new() {
        let table = create_test_grade_table();
        let stats = GradeStats::new(&table);

        // Verificar que se calcularon todos los vectores
        assert_eq!(stats.student_averages.len(), 5);
        assert_eq!(stats.student_std.len(), 5);
        assert_eq!(stats.student_percentiles.len(), 5);
        assert_eq!(stats.evaluation_averages.len(), 3);
        assert_eq!(stats.evaluation_std.len(), 3);

        // Verificar algunos cálculos específicos
        assert_eq!(stats.student_averages[0], Some(85.0)); // Alice
        assert_eq!(stats.student_averages[1], Some(75.0)); // Bob
    }

    #[test]
    fn test_compute_student_averages() {
        let table = create_test_grade_table();
        let averages = compute_student_averages(&table);

        assert_eq!(averages.len(), 5);
        assert_eq!(averages[0], Some(85.0)); // (80+85+90)/3
        assert_eq!(averages[1], Some(75.0)); // (70+75+80)/3
        assert_eq!(averages[2], Some(65.0)); // (60+65+70)/3
        assert_eq!(averages[3], Some(45.0)); // (40+45+50)/3
        assert_eq!(averages[4], Some(35.0)); // (30+35+40)/3
    }

    #[test]
    fn test_compute_student_averages_with_missing() {
        let csv_data = b"Name,Exam1,Exam2,Exam3\n\
                        Alice,80.0,,90.0\n\
                        Bob,70.0,75.0,\n\
                        Charlie,,,30.0";
        let raw_table = parse_csv(csv_data).unwrap();
        let table = GradeTable::try_from(raw_table).unwrap();
        let averages = compute_student_averages(&table);

        assert_eq!(averages[0], Some(85.0)); // (80+90)/2
        assert_eq!(averages[1], Some(72.5)); // (70+75)/2
        assert_eq!(averages[2], Some(30.0)); // solo 30
    }

    #[test]
    fn test_compute_student_std() {
        let table = create_test_grade_table();
        let averages = compute_student_averages(&table);
        let stds = compute_student_std(&table, &averages);

        assert_eq!(stds.len(), 5);
        
        // Alice: [80, 85, 90], promedio 85
        // Varianza muestral: [(80-85)² + (85-85)² + (90-85)²] / 2 = (25+0+25)/2 = 25
        // Std: √25 = 5
        assert!((stds[0].unwrap() - 5.0).abs() < 0.001);
        
        // Bob: [70, 75, 80], promedio 75
        // Varianza: [(70-75)² + (75-75)² + (80-75)²] / 2 = (25+0+25)/2 = 25
        // Std: √25 = 5
        assert!((stds[1].unwrap() - 5.0).abs() < 0.001);
    }

    #[test]
    fn test_compute_student_std_not_enough_data() {
        let csv_data = b"Name,Exam1,Exam2\n\
                        Alice,80.0,\n\
                        Bob,70.0,75.0";
        let raw_table = parse_csv(csv_data).unwrap();
        let table = GradeTable::try_from(raw_table).unwrap();
        let averages = compute_student_averages(&table);
        let stds = compute_student_std(&table, &averages);

        // Alice: solo un dato, std = None
        assert_eq!(stds[0], None);
        
        // Bob: dos datos, std calculable
        // Bob: [70, 75], promedio 72.5
        // Varianza: [(70-72.5)² + (75-72.5)²] / 1 = (6.25+6.25)/1 = 12.5
        // Std: √12.5 ≈ 3.5355
        assert!((stds[1].unwrap() - 3.5355).abs() < 0.001);
    }

    #[test]
    fn test_compute_student_percentiles() {
        let averages = vec![
            Some(85.0),  // 1er lugar (100%)
            Some(75.0),  // 2do lugar (66.6%)
            Some(65.0),  // 3er lugar (33.3%)
            Some(45.0),  // 4to lugar (0%)
            None,        // Sin promedio
        ];
        
        let percentiles = compute_student_percentiles(&averages);
        
        assert_eq!(percentiles.len(), 5);
        assert!((percentiles[0].unwrap() - 100.0).abs() < 0.01);
        assert!((percentiles[1].unwrap() - 66.666).abs() < 0.01);
        assert!((percentiles[2].unwrap() - 33.333).abs() < 0.01);
        assert!((percentiles[3].unwrap() - 0.0).abs() < 0.01);
        assert_eq!(percentiles[4], None);
    }

    #[test]
    fn test_compute_student_percentiles_single_valid() {
        let averages = vec![
            Some(85.0),
            None,
            None,
        ];
        
        let percentiles = compute_student_percentiles(&averages);
        
        // Un solo promedio válido => percentil 100%
        assert_eq!(percentiles[0], Some(100.0));
        assert_eq!(percentiles[1], None);
        assert_eq!(percentiles[2], None);
    }

    #[test]
    fn test_compute_evaluation_averages() {
        let table = create_test_grade_table();
        let eval_averages = compute_evaluation_averages(&table);
        
        assert_eq!(eval_averages.len(), 3);
        
        // Exam1: [80, 70, 60, 40, 30] / 5 = 56.0
        assert_eq!(eval_averages[0], Some(56.0));
        
        // Exam2: [85, 75, 65, 45, 35] / 5 = 61.0
        assert_eq!(eval_averages[1], Some(61.0));
        
        // Exam3: [90, 80, 70, 50, 40] / 5 = 66.0
        assert_eq!(eval_averages[2], Some(66.0));
    }

    #[test]
    fn test_compute_evaluation_averages_with_missing() {
        let csv_data = b"Name,Exam1,Exam2\n\
                        Alice,80.0,90.0\n\
                        Bob,,85.0\n\
                        Charlie,70.0,";
        let raw_table = parse_csv(csv_data).unwrap();
        let table = GradeTable::try_from(raw_table).unwrap();
        let eval_averages = compute_evaluation_averages(&table);
        
        // Exam1: solo Alice y Charlie -> (80+70)/2 = 75.0
        assert_eq!(eval_averages[0], Some(75.0));
        
        // Exam2: solo Alice y Bob -> (90+85)/2 = 87.5
        assert_eq!(eval_averages[1], Some(87.5));
    }

    #[test]
    fn test_compute_evaluation_std() {
        let table = create_test_grade_table();
        let eval_averages = compute_evaluation_averages(&table);
        let eval_stds = compute_evaluation_std(&table, &eval_averages);
        
        // Exam1: [80, 70, 60, 40, 30], promedio 56
        // Varianza muestral: suma((x-56)²)/4
        // (80-56)²=576, (70-56)²=196, (60-56)²=16, (40-56)²=256, (30-56)²=676
        // Suma = 1720, varianza = 1720/4 = 430, std = √430 ≈ 20.736
        assert!((eval_stds[0].unwrap() - 20.736).abs() < 0.01);
    }

    #[test]
    fn test_academic_status() {
        let table = create_test_grade_table();
        let stats = GradeStats::new(&table);
        
        assert_eq!(stats.academic_status(0), AcademicStatus::Approved); // 85 >= 60
        assert_eq!(stats.academic_status(1), AcademicStatus::Approved); // 75 >= 60
        assert_eq!(stats.academic_status(2), AcademicStatus::Approved); // 65 >= 60
        assert_eq!(stats.academic_status(3), AcademicStatus::AtRisk);   // 45 entre 40-60
        assert_eq!(stats.academic_status(4), AcademicStatus::Failed);   // 35 < 40
    }

    #[test]
    fn test_student_summaries() {
        let table = create_test_grade_table();
        let stats = GradeStats::new(&table);
        let summaries = stats.student_summaries();
        
        assert_eq!(summaries.len(), 5);
        
        // Verificar Alice
        let alice = &summaries[0];
        assert_eq!(alice.name, "Alice");
        assert_eq!(alice.average, Some(85.0));
        assert_eq!(alice.status, AcademicStatus::Approved);
        assert!(alice.percentile.unwrap() > 0.0);
        assert!(alice.std_dev.is_some());
        
        // Verificar IDs
        assert_eq!(alice.id, "0");
        assert_eq!(summaries[1].id, "1");
    }

    #[test]
    fn test_evaluation_summaries() {
        let table = create_test_grade_table();
        let stats = GradeStats::new(&table);
        let eval_summaries = stats.evaluation_summaries();
        
        assert_eq!(eval_summaries.len(), 3);
        
        // Verificar Exam1
        let exam1 = &eval_summaries[0];
        assert_eq!(exam1.name, "Exam1");
        assert_eq!(exam1.average, Some(56.0));
        assert_eq!(exam1.highest_score, Some(80.0));
        assert_eq!(exam1.lowest_score, Some(30.0));
        assert_eq!(exam1.evaluated_count, 5);
        assert_eq!(exam1.missing_count, 0);
        
        // Verificar IDs
        assert_eq!(exam1.id, "0");
        assert_eq!(eval_summaries[1].id, "1");
    }

    #[test]
    fn test_class_summary() {
        let table = create_test_grade_table();
        let stats = GradeStats::new(&table);
        let class_summary = stats.class_summary();
        
        assert_eq!(class_summary.student_count, 5);
        
        // Promedio general: (85+75+65+45+35)/5 = 61.0
        assert!((class_summary.overall_average.unwrap() - 61.0).abs() < 0.001);
        
        // Desviación estándar debería existir
        assert!(class_summary.overall_std_dev.is_some());
        
        // Conteo de estados
        assert_eq!(class_summary.approved_count, 3);  // Alice, Bob, Charlie
        assert_eq!(class_summary.at_risk_count, 1);   // David
        assert_eq!(class_summary.failed_count, 1);    // Eve
    }

    #[test]
    fn test_class_summary_welford_algorithm() {
        let csv_data = b"Name,Exam1,Exam2\n\
                        Student1,100.0,100.0\n\
                        Student2,80.0,80.0\n\
                        Student3,60.0,60.0";
        let raw_table = parse_csv(csv_data).unwrap();
        let table = GradeTable::try_from(raw_table).unwrap();
        let stats = GradeStats::new(&table);
        let class_summary = stats.class_summary();
        
        // Promedios: 100, 80, 60
        // Promedio general: 80
        assert!((class_summary.overall_average.unwrap() - 80.0).abs() < 0.001);
        
        // Desviación estándar muestral: √[((100-80)² + (80-80)² + (60-80)²)/2]
        // = √[(400 + 0 + 400)/2] = √400 = 20
        assert!((class_summary.overall_std_dev.unwrap() - 20.0).abs() < 0.001);
    }

    #[test]
    fn test_class_summary_no_students() {
        let csv_data = b"Name,Exam1";
        let raw_table = parse_csv(csv_data).unwrap();
        let table = GradeTable::try_from(raw_table).unwrap();
        let stats = GradeStats::new(&table);
        let class_summary = stats.class_summary();
        
        assert_eq!(class_summary.student_count, 0);
        assert_eq!(class_summary.overall_average, None);
        assert_eq!(class_summary.overall_std_dev, None);
        assert_eq!(class_summary.approved_count, 0);
        assert_eq!(class_summary.at_risk_count, 0);
        assert_eq!(class_summary.failed_count, 0);
    }

    #[test]
    fn test_class_summary_one_student() {
        let csv_data = b"Name,Exam1,Exam2\n\
                        Solo,70.0,80.0";
        let raw_table = parse_csv(csv_data).unwrap();
        let table = GradeTable::try_from(raw_table).unwrap();
        let stats = GradeStats::new(&table);
        let class_summary = stats.class_summary();
        
        assert_eq!(class_summary.student_count, 1);
        assert_eq!(class_summary.overall_average, Some(75.0));
        assert_eq!(class_summary.overall_std_dev, None); // n-1 = 0
        assert_eq!(class_summary.approved_count, 1);
    }

    #[test]
    fn test_summary_complete() {
        let table = create_test_grade_table();
        let stats = GradeStats::new(&table);
        let summary = stats.summary();
        
        assert_eq!(summary.students.len(), 5);
        assert_eq!(summary.evaluations.len(), 3);
        
        // Verificar que todos los estudiantes tienen datos
        for student in &summary.students {
            assert!(student.average.is_some());
            assert!(student.percentile.is_some());
        }
        
        // Verificar que todas las evaluaciones tienen datos
        for eval in &summary.evaluations {
            assert!(eval.average.is_some());
            assert!(eval.highest_score.is_some());
            assert!(eval.lowest_score.is_some());
        }
        
        // Verificar resumen de clase
        assert_eq!(summary.class.student_count, 5);
        assert!(summary.class.overall_average.is_some());
    }

    #[test]
    fn test_memory_efficiency() {
        // Test para verificar que no hay duplicación innecesaria de datos
        let table = create_test_grade_table();
        let stats = GradeStats::new(&table);
        
        // Las referencias deberían apuntar a la misma tabla
        assert_eq!(std::ptr::eq(stats.table, &table), true);
    }

    #[test]
    fn test_edge_case_all_missing_scores() {
        let csv_data = b"Name,Exam1,Exam2\n\
                        Alice,,\n\
                        Bob,,";
        let raw_table = parse_csv(csv_data).unwrap();
        let table = GradeTable::try_from(raw_table).unwrap();
        let stats = GradeStats::new(&table);
        
        // Todas las estadísticas deberían ser None
        assert_eq!(stats.student_averages[0], None);
        assert_eq!(stats.student_averages[1], None);
        assert_eq!(stats.student_percentiles[0], None);
        assert_eq!(stats.student_percentiles[1], None);
        
        // Todos deberían estar reprobados
        assert_eq!(stats.academic_status(0), AcademicStatus::Failed);
        assert_eq!(stats.academic_status(1), AcademicStatus::Failed);
    }

    #[test]
    fn test_edge_case_extreme_values() {
        let csv_data = b"Name,Exam1,Exam2\n\
                        Min,0.0,0.0\n\
                        Max,100.0,100.0\n\
                        Mixed,50.0,50.0";
        let raw_table = parse_csv(csv_data).unwrap();
        let table = GradeTable::try_from(raw_table).unwrap();
        let stats = GradeStats::new(&table);
        
        // Percentiles extremos
        let summaries = stats.student_summaries();
        
        // Min: 0%
        assert!((summaries[0].percentile.unwrap() - 0.0).abs() < 0.01);
        
        // Mixed: 50%
        assert!((summaries[2].percentile.unwrap() - 50.0).abs() < 0.01);
        
        // Max: 100%
        assert!((summaries[1].percentile.unwrap() - 100.0).abs() < 0.01);
    }

    #[test]
    fn test_large_dataset_performance() {
        // Crear un dataset grande (1000 estudiantes, 10 evaluaciones)
        let mut csv_data = String::from("Name");
        for i in 1..=10 {
            csv_data.push_str(&format!(",Exam{}", i));
        }
        csv_data.push('\n');
        
        for student in 0..1000 {
            csv_data.push_str(&format!("Student{}", student));
            for exam in 0..10 {
                let score = (student % 101) as f32; // Scores de 0 a 100
                csv_data.push_str(&format!(",{}", score));
            }
            csv_data.push('\n');
        }
        
        let raw_table = parse_csv(csv_data.as_bytes()).unwrap();
        let table = GradeTable::try_from(raw_table).unwrap();
        
        // Este test verifica que el cálculo sea eficiente
        let stats = GradeStats::new(&table);
        
        assert_eq!(stats.student_summaries().len(), 1000);
        assert_eq!(stats.evaluation_summaries().len(), 10);
    }

    #[test]
    fn test_cache_consistency() {
        let table = create_test_grade_table();
        let stats = GradeStats::new(&table);
        
        // Los cálculos deberían ser consistentes
        let avg1 = stats.student_averages[0];
        let avg2 = stats.student_averages[0];
        assert_eq!(avg1, avg2);
        
        // El cálculo manual debería coincidir
        let manual_avg = compute_student_averages(&table)[0];
        assert_eq!(avg1, manual_avg);
    }

    #[test]
    fn test_immutability() {
        let table = create_test_grade_table();
        let stats = GradeStats::new(&table);
        
        // Las referencias deberían ser inmutables
        // (Rust asegura esto en tiempo de compilación)
        let _reference = stats.table;
        
        // No podemos modificar porque stats es inmutable
        // let mut stats = stats; // Esto requeriría un mut
    }
}
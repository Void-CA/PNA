import { useState, useCallback } from 'react';
import { createEngine, initEngine } from '../services/engine';

export interface Student {
    id: string;
    name: string;
    accumulated_score: number;
    percentile: number;
    std_dev: number;
    status: 'Approved' | 'Failed' | 'AtRisk';
}

export interface Evaluation {
    id: string;
    name: string;
    average: number;
    std_dev: number;
    highest_score: number;
    lowest_score: number;
    max_possible_score: number;
    evaluated_count: number;
    missing_count: number;
}

export interface ClassSummary {
    student_count: number;
    overall_average: number;
    overall_std_dev: number;
    approved_count: number;
    at_risk_count: number;
    failed_count: number;
}

export interface GradeData {
    students: Student[];
    evaluations: Evaluation[];
    class: ClassSummary;
}

export interface ExtendedAnalysis {
    description_headers: string[];
    summary: GradeData;
    table: any; // Raw table data
    distributions: {
        range: string;
        count: number;
        students: Student[];
    }[];
}

export function useGradeData() {
    const [ready, setReady] = useState(false);
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState<ExtendedAnalysis | null>(null);

    const init = useCallback(async () => {
        await initEngine();
        setReady(true);
    }, []);

    const processFile = useCallback(async (file: File) => {
        if (!ready) return;
        setLoading(true);
        try {
            const bytes = new Uint8Array(await file.arrayBuffer());
            const ge = createEngine(bytes);

            const summary = ge.get_summary() as GradeData;
            const table = ge.get_table();

            // Calculate Distributions
            const students = summary.students;
            const ranges = [
                { min: 0, max: 60, label: '0-60' },
                { min: 60, max: 70, label: '60-70' },
                { min: 70, max: 80, label: '70-80' },
                { min: 80, max: 90, label: '80-90' },
                { min: 90, max: 101, label: '90-100' },
            ];

            const distributions = ranges.map(r => ({
                range: r.label,
                count: students.filter((s: Student) => s.accumulated_score >= r.min && s.accumulated_score < r.max).length,
                students: students.filter((s: Student) => s.accumulated_score >= r.min && s.accumulated_score < r.max)
            }));

            setData({
                description_headers: ge.get_description_headers(),
                summary,
                table,
                distributions
            });
        } catch (e) {
            console.error("Failed to process file", e);
        } finally {
            setLoading(false);
        }
    }, [ready]);

    return {
        ready,
        loading,
        data,
        init,
        processFile
    };
}

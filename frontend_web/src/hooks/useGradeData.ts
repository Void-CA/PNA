import { useState, useCallback } from 'react';
import { createEngine, initEngine } from '../services/engine';

export interface Student {
    id: string;
    name: string;
    accumulated_score: number;
    percentile: number;
    std_dev: number;
    status: 'Approved' | 'Failed' | 'OnTrack' | 'Warning' | 'Critical';
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
    warning_count: number;
    on_track_count: number;
    critical_count: number;
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

function getDynamicDistributions(students: Student[]) {
    // 1. Encontrar la nota más alta actual en la clase
    // Si nadie tiene nota, asumimos 1 para evitar división por cero
    const currentMaxScore = Math.max(...students.map(s => s.accumulated_score), 0) || 10;

    let ranges = [];

    // 2. Lógica Adaptativa
    if (currentMaxScore < 60) {
        // --- MODO TEMPRANO (Early Game) ---
        // Si la nota máxima es baja (ej: 40 pts), dividimos en 4 segmentos iguales
        // Ej: Si max es 40 -> [0-10], [10-20], [20-30], [30-40+]
        const steps = 4;
        const stepSize = Math.ceil(currentMaxScore / steps);

        for (let i = 0; i < steps; i++) {
            const min = i * stepSize;
            // El último rango debe atrapar todo lo que sobre hasta el infinito por seguridad
            const max = (i === steps - 1) ? currentMaxScore + 1 : (i + 1) * stepSize;
            
            ranges.push({
                min: min,
                max: max,
                label: `${min}-${(i === steps - 1) ? Math.floor(currentMaxScore) : max}`
            });
        }
    } else {
        // --- MODO ESTÁNDAR (Late Game) ---
        // Si ya hay notas altas, usamos la escala de calificación real
        ranges = [
            { min: 0, max: 60, label: '0-60 (Reprobado)' },
            { min: 60, max: 70, label: '60-70' },
            { min: 70, max: 80, label: '70-80' },
            { min: 80, max: 90, label: '80-90' },
            { min: 90, max: 1000, label: '90-100' }, // 1000 para atrapar extra credits
        ];
    }

    // 3. Mapear los estudiantes a los rangos calculados
    return ranges.map(r => {
        const studentsInBucket = students.filter((s: Student) => 
            s.accumulated_score >= r.min && s.accumulated_score < r.max
        );
        
        return {
            range: r.label,
            count: studentsInBucket.length,
            students: studentsInBucket,
            // Agregamos metadata útil para colores
            isFailing: r.max <= 60, 
            percentOfClass: (studentsInBucket.length / students.length) * 100
        };
    });
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

            const distributions = getDynamicDistributions(students);

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

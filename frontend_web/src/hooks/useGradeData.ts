import { useState, useCallback } from 'react';
import { createEngine, initEngine } from '../services/engine';

export interface ExtendedAnalysis {
    summary: any;
    table: any; // Raw table data
    distributions: {
        range: string;
        count: number;
        students: any[];
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

            const summary = ge.get_summary();
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
                count: students.filter((s: any) => s.average >= r.min && s.average < r.max).length,
                students: students.filter((s: any) => s.average >= r.min && s.average < r.max)
            }));

            console.log("Distributions:", distributions);
            console.log("Summary:", summary);
            console.log("Table:", table);
            setData({
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

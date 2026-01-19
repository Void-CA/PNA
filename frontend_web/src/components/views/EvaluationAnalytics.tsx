import { useState, useMemo } from 'react';
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '../ui/table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { ArrowUpDown, Maximize2 } from 'lucide-react';

import type { ExtendedAnalysis, Evaluation } from '../../hooks/useGradeData';
import PerformanceBoxPlot from '../charts/PerformanceBoxPlot';
import { EvaluationDetailSheet } from './EvaluationDetailSheet';

interface EvaluationAnalyticsProps {
    data: ExtendedAnalysis;
}

export function EvaluationAnalytics({ data }: EvaluationAnalyticsProps) {
    const evaluations = data.summary.evaluations;
    const [selectedEval, setSelectedEval] = useState<Evaluation | null>(null);
    const [sortConfig, setSortConfig] = useState<{ key: keyof Evaluation, direction: 'asc' | 'desc' }>({ key: 'average', direction: 'desc' });

    // Calculate global boxplot data for all evaluations
    const boxPlotData = useMemo(() => {
        if (!data.table.records) return [];
        const plotData = evaluations.map(ev => {
            const evalIndex = data.table.evaluations?.indexOf(ev.name);
            if (evalIndex === undefined || evalIndex === -1) return null;

            const scores: number[] = [];
            data.table.records.forEach((r: any) => {
                const g = r.grades[evalIndex];
                let score = 0;
                if (g && g.status === 'Numeric') score = g.value;
                else if (g && g.status === 'Fraction') score = g.value.obtained;

                if (score > 0) scores.push(score);
            });

            // Return the raw values array for Plotly to calculate box plot statistics
            return {
                name: ev.name,
                values: scores
            };
        });

        // Filter out null values with proper type narrowing
        return plotData.filter((item): item is { name: string; values: number[] } => item !== null);
    }, [evaluations, data]);

    // Sorting logic
    const sortedEvaluations = useMemo(() => {
        const items = [...evaluations];
        const { key, direction } = sortConfig;

        items.sort((a, b: any) => {
            let valA = a[key];
            let valB = b[key];

            // Handle special cases or defaults
            if (valA === undefined) valA = 0;
            if (valB === undefined) valB = 0;

            if (valA < valB) return direction === 'asc' ? -1 : 1;
            if (valA > valB) return direction === 'asc' ? 1 : -1;
            return 0;
        });
        return items;
    }, [evaluations, sortConfig]);

    const handleSort = (key: keyof Evaluation) => {
        setSortConfig(current => ({
            key,
            direction: current.key === key && current.direction === 'desc' ? 'asc' : 'desc'
        }));
    };

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold tracking-tight">Análisis de Evaluaciones</h2>

            {/* Main Distribution Chart */}
            <Card>
                <CardHeader>
                    <CardTitle>Rendimiento del Aula</CardTitle>
                    <CardDescription>Comparativa de distribuciones por evaluación (Min, Q1, Mediana, Q3, Max)</CardDescription>
                </CardHeader>
                <CardContent className="h-96">
                    <PerformanceBoxPlot data={boxPlotData} />
                </CardContent>
            </Card>

            <div className="rounded-md border border-slate-200 bg-white overflow-hidden shadow-sm mt-8">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="cursor-pointer hover:bg-slate-50" onClick={() => handleSort('name')}>
                                Evaluación <ArrowUpDown className="ml-2 inline" size={12} />
                            </TableHead>
                            <TableHead className="cursor-pointer hover:bg-slate-50" onClick={() => handleSort('average')}>
                                Promedio <ArrowUpDown className="ml-2 inline" size={12} />
                            </TableHead>
                            <TableHead className="cursor-pointer hover:bg-slate-50" onClick={() => handleSort('std_dev')}>
                                Desv. Estándar <ArrowUpDown className="ml-2 inline" size={12} />
                            </TableHead>
                            <TableHead className="cursor-pointer hover:bg-slate-50" onClick={() => handleSort('highest_score')}>
                                Max Posible / Logrado <ArrowUpDown className="ml-2 inline" size={12} />
                            </TableHead>
                            <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {sortedEvaluations.map((ev: Evaluation) => (
                            <TableRow key={ev.id} className="cursor-pointer hover:bg-slate-50" onClick={() => setSelectedEval(ev)}>
                                <TableCell className="font-medium">{ev.name}</TableCell>
                                <TableCell>
                                    <div className="flex flex-col">
                                        <span className="font-bold text-slate-700">{ev.average.toFixed(2)}</span>
                                    </div>
                                </TableCell>
                                <TableCell className="font-mono text-slate-500">{ev.std_dev?.toFixed(2) || 'N/A'}</TableCell>
                                <TableCell>{ev.max_possible_score || '?'} / {ev.highest_score}</TableCell>
                                <TableCell className="text-right">
                                    <Button variant="ghost" size="sm" onClick={() => setSelectedEval(ev)}>
                                        <Maximize2 size={16} />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            <EvaluationDetailSheet
                evaluation={selectedEval}
                data={data}
                isOpen={!!selectedEval}
                onClose={() => setSelectedEval(null)}
            />
        </div>
    );
}

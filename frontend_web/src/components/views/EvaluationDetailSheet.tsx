import { useMemo, useState } from 'react';
import {
    Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription
} from '../ui/sheet';
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '../ui/table';
import { Badge } from '../ui/badge';
import { ScrollArea } from '../ui/scroll-area';
import { Card, CardContent } from '../ui/card';
import { ArrowUpDown } from 'lucide-react';

import KDEPlot from '../charts/KDEPlot';
import type { Evaluation, ExtendedAnalysis } from '../../hooks/useGradeData';

interface EvaluationDetailSheetProps {
    evaluation: Evaluation | null;
    data: ExtendedAnalysis;
    isOpen: boolean;
    onClose: () => void;
}

export function EvaluationDetailSheet({
    evaluation,
    data,
    isOpen,
    onClose
}: EvaluationDetailSheetProps) {
    const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' }>({ key: 'score', direction: 'desc' });

    const stats = useMemo(() => {
        if (!evaluation || !data) return null;

        // Calculate distribution stats for this evaluation
        const scores: number[] = [];
        const studentGrades = data.summary.students.map((student) => {
            // Find the score for this specific evaluation
            // We need to look up in records
            const record = data.table.records?.find((r: any) => r.carnet === student.id);
            if (!record) return { student, score: 0 };

            const evalIndex = data.table.evaluations?.indexOf(evaluation.name);
            if (evalIndex === undefined || evalIndex === -1) return { student, score: 0 };

            let score = 0;
            if (record.grades && record.grades[evalIndex]) {
                const g = record.grades[evalIndex];
                // Parse Logic (duplicated from StudentDirectory - could be util)
                if (g.status === 'Numeric') score = g.value;
                else if (g.status === 'Fraction') score = g.value.obtained;
            }

            if (score > 0) scores.push(score);

            return {
                student,
                score
            };
        });

        return {
            studentGrades,
            kdeData: [{
                name: evaluation.name,
                values: scores
            }]
        };
    }, [evaluation, data]);

    const sortedGrades = useMemo(() => {
        if (!stats) return [];
        const items = [...stats.studentGrades];
        items.sort((a, b) => {
            if (sortConfig.key === 'score') {
                return sortConfig.direction === 'asc' ? a.score - b.score : b.score - a.score;
            }
            if (sortConfig.key === 'name') {
                return sortConfig.direction === 'asc'
                    ? a.student.name.localeCompare(b.student.name)
                    : b.student.name.localeCompare(a.student.name);
            }
            return 0;
        });
        return items;
    }, [stats, sortConfig]);

    const handleSort = (key: string) => {
        setSortConfig(current => ({
            key,
            direction: current.key === key && current.direction === 'desc' ? 'asc' : 'desc'
        }));
    };

    if (!evaluation || !stats) return null;

    return (
        <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <SheetContent className="w-full sm:max-w-2xl p-0 flex flex-col gap-0 bg-slate-50">
                <div className="bg-white p-6 border-b border-slate-200">
                    <SheetHeader className="text-left space-y-4">
                        <div className="flex justify-between items-start">
                            <div>
                                <SheetTitle className="text-2xl font-bold text-slate-900">{evaluation.name}</SheetTitle>
                                <SheetDescription className="mt-1">
                                    Detalles y distribución de resultados
                                </SheetDescription>
                            </div>
                            <Badge variant="outline" className="text-base px-3 py-1">
                                Max: {evaluation.max_possible_score || evaluation.highest_score}
                            </Badge>
                        </div>
                    </SheetHeader>
                </div>

                <ScrollArea className="flex-1">
                    <div className="p-6 space-y-8">
                        {/* Stats Cards */}
                        <div className="grid grid-cols-4 gap-4">
                            <Card>
                                <CardContent className="p-4 pt-5 text-center">
                                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Promedio</div>
                                    <div className="text-2xl font-black text-slate-900">{evaluation.average.toFixed(2)}</div>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardContent className="p-4 pt-5 text-center">
                                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Desv. Est.</div>
                                    <div className="text-2xl font-black text-slate-700">{evaluation.std_dev?.toFixed(2)}</div>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardContent className="p-4 pt-5 text-center">
                                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Max Posible</div>
                                    <div className="text-2xl font-black text-indigo-600">{evaluation.max_possible_score || evaluation.highest_score}</div>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardContent className="p-4 pt-5 text-center">
                                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Entregas</div>
                                    <div className="text-2xl font-black text-slate-700">{evaluation.evaluated_count}</div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Distribution Chart */}
                        <Card>
                            <CardContent className="p-6">
                                <h4 className="font-bold text-sm text-slate-900 mb-4">Distribución del Aula</h4>
                                <div className="h-48">
                                    <KDEPlot data={stats.kdeData} />
                                </div>
                            </CardContent>
                        </Card>

                        {/* Student List */}
                        <div className="rounded-md border border-slate-200 bg-white overflow-hidden shadow-sm">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="cursor-pointer hover:bg-slate-50" onClick={() => handleSort('name')}>
                                            <div className="flex items-center gap-1">
                                                Estudiante <ArrowUpDown size={12} />
                                            </div>
                                        </TableHead>
                                        <TableHead className="text-right cursor-pointer hover:bg-slate-50" onClick={() => handleSort('score')}>
                                            <div className="flex items-center gap-1 justify-end">
                                                Nota <ArrowUpDown size={12} />
                                            </div>
                                        </TableHead>
                                        <TableHead className="text-right w-[100px]">Estado</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {sortedGrades.map((item) => (
                                        <TableRow key={item.student.id}>
                                            <TableCell className="font-medium">{item.student.name}</TableCell>
                                            <TableCell className="text-right font-mono font-bold text-slate-700">
                                                {item.score}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Badge variant={item.score >= (evaluation.average || 0) ? 'secondary' : 'destructive'} className="text-[10px]">
                                                    {item.score >= (evaluation.average || 0) ? '> Avg' : '< Avg'}
                                                </Badge>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                </ScrollArea>
            </SheetContent>
        </Sheet>
    );
}

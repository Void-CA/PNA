import { useMemo } from 'react';
import {
    Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription
} from '../ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Badge } from '../ui/badge';
import { ScrollArea } from '../ui/scroll-area';
import { Card, CardContent } from '../ui/card';
import { TrendingUp, Award, AlertCircle } from 'lucide-react';
import StudentEvolutionChart from '../charts/StudentEvolutionChart';

import type { Student, Evaluation } from '../../hooks/useGradeData';

interface StudentSheetProps {
    student: Student | null;
    studentRow: any | null;
    isOpen: boolean;
    onClose: () => void;
    allEvaluations: Evaluation[];
}

export function StudentDetailSheet({
    student,
    studentRow,
    isOpen,
    onClose,
    allEvaluations
}: StudentSheetProps) {
    if (!student) return null;

    const chartData = useMemo(() => {
        if (!studentRow || !allEvaluations) return [];
        return allEvaluations.map(ev => {
            const scoreVal = studentRow[ev.name];
            // Handle number or string input safely. 
            // If scoreVal is basically undefined/null, default to 0.
            let score = 0;
            if (typeof scoreVal === 'number') {
                score = scoreVal;
            } else if (typeof scoreVal === 'string') {
                const parsed = parseFloat(scoreVal);
                score = isNaN(parsed) ? 0 : parsed;
            }

            return {
                exam: ev.name,
                score: score,
                classAverage: ev.average,
                maxScore: ev.max_possible_score || 100
            };
        });
    }, [student, studentRow, allEvaluations]);

    return (
        <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <SheetContent className="w-full sm:max-w-xl p-0 flex flex-col gap-0 bg-slate-50">
                <div className="bg-white p-6 border-b border-slate-200">
                    <SheetHeader className="text-left space-y-4">
                        <div className="flex justify-between items-start">
                            <div>
                                <SheetTitle className="text-2xl font-bold text-slate-900">{student.name}</SheetTitle>
                                <SheetDescription className="font-mono text-slate-500 mt-1">
                                    ID: {student.id}
                                </SheetDescription>
                            </div>
                            <Badge
                                variant={
                                    student.status === 'Approved' ? 'success' :
                                        student.status === 'AtRisk' ? 'warning' : 'destructive'
                                }
                                className="px-3 py-1 text-xs uppercase tracking-wide"
                            >
                                {student.status === 'Approved' ? 'Aprobado' :
                                    student.status === 'AtRisk' ? 'En Riesgo' : 'Fallido'}
                            </Badge>
                        </div>
                    </SheetHeader>
                </div>

                <ScrollArea className="flex-1">
                    <div className="p-6 space-y-8">

                        {/* Key Metrics */}
                        <div className="grid grid-cols-2 gap-4">
                            <Card>
                                <CardContent className="p-4 flex flex-col gap-2">
                                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                                        <TrendingUp size={14} /> Puntaje
                                    </span>
                                    <span className="text-3xl font-black text-slate-900">{student.accumulated_score.toFixed(2)}</span>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardContent className="p-4 flex flex-col gap-2">
                                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                                        <Award size={14} /> Percentil
                                    </span>
                                    <span className="text-3xl font-black text-slate-700">{student.percentile.toFixed(2)}%</span>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Main Content Tabs */}
                        <Tabs defaultValue="evolution" className="w-full">
                            <TabsList className="grid w-full grid-cols-2 bg-slate-200/50">
                                <TabsTrigger value="evolution">Evolución</TabsTrigger>
                                <TabsTrigger value="details">Detalle Notas</TabsTrigger>
                            </TabsList>

                            <TabsContent value="evolution" className="mt-4 space-y-4">
                                <Card>
                                    <CardContent className="p-6">
                                        <div className="mb-4">
                                            <h4 className="font-bold text-sm text-slate-900">Historial de Rendimiento</h4>
                                            <p className="text-xs text-slate-500">Comparativa vs Promedio de Clase</p>
                                        </div>
                                        <div className="-ml-3 h-64">
                                            {/* We use the chart here */}
                                            <StudentEvolutionChart data={chartData} />
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Auto-generated Insight */}
                                {student.accumulated_score < 60 && (
                                    <div className="bg-rose-50 border border-rose-100 rounded-lg p-4 flex gap-3 text-sm text-rose-800">
                                        <AlertCircle className="shrink-0" size={20} />
                                        <p>Este estudiante tiene un rendimiento inferior al crítico. Se recomienda intervención académica inmediata.</p>
                                    </div>
                                )}
                            </TabsContent>

                            <TabsContent value="details" className="mt-4">
                                <Card>
                                    <CardContent className="p-0">
                                        <div className="divide-y divide-slate-100">
                                            {chartData.map((item: any) => (
                                                <div key={item.exam} className="flex justify-between items-center p-4 hover:bg-slate-50 transition">
                                                    <span className="font-medium text-slate-700 truncate max-w-[200px]" title={item.exam}>{item.exam}</span>
                                                    <div className="flex items-center gap-4 shrink-0">
                                                        <span className="text-xs text-slate-400">Avg: {item.classAverage.toFixed(2)}</span>
                                                        <Badge variant={(item.maxScore > 0 ? (item.score / item.maxScore * 100) : 0) >= 60 ? 'secondary' : 'destructive'}>
                                                            {item.score} <span className="text-[10px] opacity-70">/ {item.maxScore}</span>
                                                        </Badge>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            </TabsContent>
                        </Tabs>

                    </div>
                </ScrollArea>
            </SheetContent>
        </Sheet>
    );
}

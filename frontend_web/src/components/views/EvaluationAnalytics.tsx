
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '../ui/table';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import type { ExtendedAnalysis } from '../../hooks/useGradeData';

interface EvaluationAnalyticsProps {
    data: ExtendedAnalysis;
}

export function EvaluationAnalytics({ data }: EvaluationAnalyticsProps) {
    const evaluations = data.summary.evaluations;

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold tracking-tight">Análisis de Evaluaciones</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {evaluations.map((ev: any) => (
                    <Card key={ev.id} className="hover:border-indigo-200 transition-colors">
                        <CardHeader>
                            <CardTitle className="text-lg">{ev.name}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex justify-between items-end mb-4">
                                <span className="text-3xl font-black text-slate-800">{ev.average.toFixed(1)}</span>
                                <span className="text-xs text-slate-400 font-medium mb-1">Promedio</span>
                            </div>

                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-slate-500">Nota Máxima</span>
                                    <span className="font-bold text-emerald-600">{ev.highest_score}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-500">Nota Mínima</span>
                                    <span className="font-bold text-rose-600">{ev.lowest_score}</span>
                                </div>
                                <div className="flex justify-between border-t border-slate-100 pt-2 mt-2">
                                    <span className="text-slate-500">Desviación Estd.</span>
                                    <span className="font-mono text-slate-700">{ev.std_dev?.toFixed(2) || '-'}</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="rounded-md border border-slate-200 bg-white overflow-hidden shadow-sm mt-8">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Evaluación</TableHead>
                            <TableHead>Promedio</TableHead>
                            <TableHead>Desv. Estándar</TableHead>
                            <TableHead>Participación</TableHead>
                            <TableHead className="text-right">Rango (Min - Max)</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {evaluations.map((ev: any) => (
                            <TableRow key={ev.id}>
                                <TableCell className="font-medium">{ev.name}</TableCell>
                                <TableCell>{ev.average.toFixed(2)}</TableCell>
                                <TableCell className="font-mono text-slate-500">{ev.std_dev?.toFixed(2) || 'N/A'}</TableCell>
                                <TableCell>{ev.evaluated_count} / {ev.evaluated_count + ev.missing_count}</TableCell>
                                <TableCell className="text-right font-mono">
                                    {ev.lowest_score} - {ev.highest_score}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}

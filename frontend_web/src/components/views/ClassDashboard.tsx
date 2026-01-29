import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { CheckCircle2, ClipboardList, TrendingUp, Users } from 'lucide-react';
import GradeDistributionChart from '../charts/GradeDistributionChart';
import StatusBarChart from '../charts/StatusBarChart';
import type { ExtendedAnalysis } from '../../hooks/useGradeData';

interface ClassDashboardProps {
    data: ExtendedAnalysis;
}

const StatCard = ({ title, value, subtext, icon: Icon, colorClass }: any) => (
    <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-500">
                {title}
            </CardTitle>
            <Icon className={`h-4 w-4 ${colorClass}`} />
        </CardHeader>
        <CardContent>
            <div className="text-3xl font-black text-slate-900">{value}</div>
            <p className="text-xs text-slate-400 mt-1 font-medium bg-slate-50 inline-block px-1.5 py-0.5 rounded">
                {subtext}
            </p>
        </CardContent>
    </Card>
);

export function ClassDashboard({ data }: ClassDashboardProps) {
    const { summary, distributions, description_headers } = data;
    const { class: metrics } = summary;

    // Extraer nombre de asignatura si existe en description_headers
    const subjectHeader = description_headers.find(h => h.startsWith('ASIGNATURA:'));
    const subjectName = subjectHeader ? subjectHeader.replace(/^ASIGNATURA:\s*\[[^\]]*\]\s*-\s*/i, '').replace(/^\[|\]$/g, '') : '';

    return (
        <div className="space-y-8">
            {subjectName && (
                <div className="mb-4">
                    <div className="flex items-center gap-3 bg-indigo-50 rounded-xl px-6 py-4 shadow-sm border border-indigo-200">
                        <h1 className="text-3xl md:text-4xl font-extrabold text-indigo-900 leading-tight tracking-tight drop-shadow-sm">
                            {subjectName}
                        </h1>
                    </div>
                </div>
            )}
            <div className="flex flex-wrap gap-3 items-center mb-3">
                {description_headers.map((header, idx) => (
                    <span
                        key={idx}
                        className="inline-block bg-slate-100 text-slate-700 font-semibold rounded px-3 py-1 text-sm shadow-sm border border-slate-200"
                    >
                        {header}
                    </span>
                ))}
            </div>
            {/* Hero Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <StatCard
                    title="Promedio General"
                    value={metrics.overall_average.toFixed(2)}
                    subtext="Calificación media del curso"
                    icon={TrendingUp}
                    colorClass="text-indigo-600"
                />
                <StatCard
                    title="Desviación Estándar"
                    value={metrics.overall_std_dev?.toFixed(2) || "N/A"}
                    subtext="Variabilidad de notas"
                    icon={TrendingUp}
                    colorClass="text-yellow-500"
                />
                <StatCard
                    title="Estudiantes"
                    value={metrics.student_count}
                    subtext="Total inscritos"
                    icon={Users}
                    colorClass="text-blue-600"
                />
                <StatCard
                    title="Total Acumulado"
                    value={metrics.acumulated_points?.toFixed(0) || "N/A"}
                    subtext="Puntos acumulados"
                    icon={CheckCircle2}
                    colorClass="text-emerald-600"
                />
                <StatCard
                    title="Evaluaciones Aplicadas"
                    value={metrics.evaluation_count}
                    subtext="Total evaluaciones aplicadas"
                    icon={ClipboardList}
                    colorClass="text-teal-800"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-7 gap-8">
                {/* Main Chart */}
                <Card className="lg:col-span-4">
                    <CardHeader>
                        <CardTitle>Distribución de Notas</CardTitle>
                        <CardDescription>
                            Histograma de promedios finales de los estudiantes.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="pl-0">
                        <div className="h-75 w-full mt-4">
                            <GradeDistributionChart data={distributions} />
                        </div>
                    </CardContent>
                </Card>

                {/* Estados de alumnos como gráfico de barra */}
                <Card className="lg:col-span-3">
                    <CardHeader>
                        <CardTitle>Estados de Alumnos</CardTitle>
                        <CardDescription>
                            Cantidad de estudiantes por estado académico
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="pl-0">
                        <div className="h-75 w-full mt-4">
                            <StatusBarChart
                                data={[
                                    { name: 'Crítico', value: metrics.critical_count, color: '#f43f5e' },
                                    { name: 'Advertencia', value: metrics.warning_count, color: '#fb923c' },
                                    { name: 'Bien', value: metrics.on_track_count, color: '#3b82f6' },
                                    { name: 'Reprobados', value: metrics.failed_count, color: '#334155' },
                                    { name: 'Aprobados', value: metrics.approved_count, color: '#22c55e' },
                                ]}
                            />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Footer Card Mejorado */}
            <div className="mt-8">
                <Card className="bg-indigo-50 shadow-none">
                    <CardContent className="flex flex-col md:flex-row items-center justify-between gap-4 py-6">
                        <div className="flex-1">
                            <h3 className="text-lg font-bold text-indigo-900 mb-1">Resumen General</h3>
                            <p className="text-slate-700 text-sm mb-2">
                                {metrics.overall_average > 70
                                    ? "La clase muestra un rendimiento sólido general."
                                    : "El promedio de la clase indica áreas de oportunidad importantes."}
                                {metrics.overall_std_dev > 15
                                    ? " Existe una alta variabilidad entre los estudiantes, sugiriendo brechas de conocimiento."
                                    : " El grupo es bastante homogéneo en su rendimiento."}
                            </p>
                            <div className="flex items-center gap-4 mt-2">
                                <span className="text-xs font-semibold text-emerald-900 bg-emerald-100 px-2 py-1 rounded-full">
                                    {((metrics.approved_count / metrics.student_count) * 100).toFixed(0)}% Aprobados
                                </span>
                                <span className="text-xs font-semibold text-rose-900 bg-rose-100 px-2 py-1 rounded-full">
                                    {metrics.failed_count} Reprobados
                                </span>
                                <span className="text-xs font-semibold text-yellow-900 bg-yellow-100 px-2 py-1 rounded-full">
                                    Desv. Est.: {metrics.overall_std_dev?.toFixed(2) || "N/A"}
                                </span>
                            </div>
                        </div>
                        <div className="flex-1 flex flex-col items-center">
                            <div className="w-full bg-slate-200 h-3 rounded-full overflow-hidden mb-2">
                                <div
                                    className="bg-emerald-500 h-full"
                                    style={{ width: `${(metrics.approved_count / metrics.student_count) * 100}%` }}
                                />
                            </div>
                            <div className="flex justify-between w-full text-xs text-slate-500 font-medium">
                                <span>Aprobados</span>
                                <span>{((metrics.approved_count / metrics.student_count) * 100).toFixed(0)}%</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

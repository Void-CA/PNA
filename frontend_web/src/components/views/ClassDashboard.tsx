import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { AlertTriangle, CheckCircle2, TrendingUp, Users } from 'lucide-react';
import GradeDistributionChart from '../charts/GradeDistributionChart';
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    title="Promedio General"
                    value={metrics.overall_average.toFixed(2)}
                    subtext="Calificación media del curso"
                    icon={TrendingUp}
                    colorClass="text-indigo-600"
                />
                <StatCard
                    title="Estudiantes"
                    value={metrics.student_count}
                    subtext="Total inscritos"
                    icon={Users}
                    colorClass="text-blue-600"
                />
                <StatCard
                    title="Tasa Aprobación"
                    value={`${((metrics.approved_count / metrics.student_count) * 100).toFixed(0)}%`}
                    subtext={`${metrics.approved_count} aprobados`}
                    icon={CheckCircle2}
                    colorClass="text-emerald-600"
                />
                <StatCard
                    title="En Riesgo"
                    value={metrics.at_risk_count}
                    subtext="Promedio < 60"
                    icon={AlertTriangle}
                    colorClass="text-rose-600"
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
                        <div className="h-[300px] w-full mt-4">
                            {/* Reusing the existing chart component but wrapped locally or directly imported */}
                            <GradeDistributionChart data={distributions} />
                        </div>
                    </CardContent>
                </Card>

                {/* Side Stats / Insights */}
                <Card className="lg:col-span-3 bg-slate-900 text-slate-50 border-slate-800">
                    <CardHeader>
                        <CardTitle className="text-white">Insights de la Clase</CardTitle>
                        <CardDescription className="text-slate-400">
                            Análisis rápido del rendimiento grupal.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex items-center justify-between border-b border-slate-700/50 pb-4">
                            <span className="text-sm font-medium text-slate-300">Desviación Estándar</span>
                            <span className="text-xl font-bold font-mono">{metrics.overall_std_dev?.toFixed(2) || "N/A"}</span>
                        </div>

                        <div className="space-y-2">
                            <p className="text-sm text-slate-300 leading-relaxed">
                                {metrics.overall_average > 70
                                    ? "La clase muestra un rendimiento sólido general."
                                    : "El promedio de la clase indica áreas de oportunidad importantes."}
                                {metrics.overall_std_dev > 15
                                    ? " Existe una alta variabilidad entre los estudiantes, sugiriendo brechas de conocimiento."
                                    : " El grupo es bastante homogéneo en su rendimiento."}
                            </p>
                        </div>

                        <div className="pt-4">
                            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                                <div
                                    className="bg-emerald-500 h-full"
                                    style={{ width: `${(metrics.approved_count / metrics.student_count) * 100}%` }}
                                />
                            </div>
                            <div className="flex justify-between text-xs mt-2 text-slate-500 font-medium">
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

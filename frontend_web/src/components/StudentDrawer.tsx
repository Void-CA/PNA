import React, { useMemo } from 'react';
import { X, TrendingUp, AlertCircle, Award } from 'lucide-react';
import StudentEvolutionChart from './charts/StudentEvolutionChart';

interface StudentDrawerProps {
    student: any | null;
    studentRow: any | null; // Raw row data with scores
    isOpen: boolean;
    onClose: () => void;
    allEvaluations: any[];
}

const StudentDrawer: React.FC<StudentDrawerProps> = ({ student, studentRow, isOpen, onClose, allEvaluations }) => {
    if (!student) return null;

    // Prepare chart data using the raw studentRow (which contains "Exam 1": "85.5", etc)
    const chartData = useMemo(() => {
        if (!studentRow || !allEvaluations) return [];

        // Map through all known evaluations directly
        return allEvaluations.map(ev => {
            const scoreVal = studentRow[ev.name]; // Access using column name (e.g., "Exam 1")
            // Parse float if it's a string, handle missing
            const score = scoreVal ? parseFloat(scoreVal) : 0;

            return {
                exam: ev.name,
                score: isNaN(score) ? 0 : score,
                classAverage: ev.average
            };
        });
    }, [student, studentRow, allEvaluations]);

    return (
        <>
            {/* Backdrop */}
            <div
                className={`fixed inset-0 bg-slate-950/40 backdrop-blur-[2px] transition-opacity z-40 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
                    }`}
                onClick={onClose}
            />

            {/* Drawer */}
            <div
                className={`fixed inset-y-0 right-0 w-full md:w-[500px] bg-white shadow-2xl z-50 transform transition-transform duration-300 cubic-bezier(0.16, 1, 0.3, 1) ${isOpen ? 'translate-x-0' : 'translate-x-full'
                    }`}
            >
                <div className="h-full flex flex-col bg-slate-50">
                    {/* Header */}
                    <div className="p-8 border-b border-slate-200/60 bg-white sticky top-0 z-10">
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-2">
                                <div className={`p-2 rounded-lg ${student.status === 'Approved' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
                                    <Award size={20} />
                                </div>
                                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${student.status === 'Approved' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                                    }`}>
                                    {student.status === 'Approved' ? 'Aprobado' : 'En Riesgo'}
                                </span>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        <h2 className="text-3xl font-bold text-slate-900 leading-tight">{student.name}</h2>
                        <p className="text-slate-500 font-medium mt-1">ID Estudiante: <span className="font-mono text-slate-400">{student.id}</span></p>
                    </div>

                    {/* Body */}
                    <div className="flex-1 overflow-y-auto p-8 space-y-8">

                        {/* Quick Stats Grid */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-6 bg-white rounded-2xl border border-slate-200/60 shadow-sm">
                                <div className="flex items-center gap-2 text-indigo-600 mb-2">
                                    <TrendingUp size={18} />
                                    <span className="text-xs font-bold uppercase tracking-wide">Promedio General</span>
                                </div>
                                <div className="text-4xl font-black text-slate-900 tracking-tight">
                                    {student.average.toFixed(2)}
                                </div>
                                <p className="text-xs text-slate-400 mt-2 font-medium">Puntaje final calculado</p>
                            </div>

                            <div className="p-6 bg-white rounded-2xl border border-slate-200/60 shadow-sm">
                                <div className="flex items-center gap-2 text-slate-500 mb-2">
                                    <Award size={18} />
                                    <span className="text-xs font-bold uppercase tracking-wide">Percentil</span>
                                </div>
                                <div className="text-4xl font-black text-slate-900 tracking-tight">
                                    {student.percentile}%
                                </div>
                                <p className="text-xs text-slate-400 mt-2 font-medium">Superior al {student.percentile}% de la clase</p>
                            </div>
                        </div>

                        {/* Performance Chart */}
                        <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Evolución Académica</h3>
                                <div className="flex gap-4 text-xs font-bold">
                                    <div className="flex items-center gap-1.5 text-indigo-600">
                                        <span className="w-2.5 h-2.5 rounded-full bg-indigo-600"></span>
                                        Estudiante
                                    </div>
                                    <div className="flex items-center gap-1.5 text-slate-400">
                                        <span className="w-2.5 h-2.5 rounded-full bg-slate-300"></span>
                                        Clase
                                    </div>
                                </div>
                            </div>

                            <div className="-ml-2">
                                <StudentEvolutionChart data={chartData} />
                            </div>
                        </div>

                        {/* Alerts / Insights */}
                        {student.average < 60 && (
                            <div className="p-5 bg-rose-50 border border-rose-100 rounded-2xl flex items-start gap-4">
                                <AlertCircle className="text-rose-500 shrink-0 mt-0.5" size={20} />
                                <div>
                                    <h4 className="text-rose-900 font-bold text-sm">Rendimiento Crítico</h4>
                                    <p className="text-rose-700 text-sm mt-1 leading-relaxed">
                                        El promedio actual está por debajo del umbral de aprobación (60). Se recomienda revisar los temas de las evaluaciones con menor puntaje.
                                    </p>
                                </div>
                            </div>
                        )}

                    </div>

                    {/* Footer */}
                    <div className="p-6 border-t border-slate-200 bg-white">
                        <button className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl transition-all shadow-lg shadow-slate-200 active:scale-[0.98]">
                            Exportar Reporte PDF
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
};

export default StudentDrawer;

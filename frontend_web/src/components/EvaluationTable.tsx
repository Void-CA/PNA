import React from 'react';

interface Evaluation {
  id: string | number;
  name: string;
  average: number;
  highest_score: number;
  lowest_score: number;
  evaluated_count: number;
  missing_count: number;
}

interface EvaluationTableProps {
  evaluations: Evaluation[];
}

const EvaluationTable: React.FC<EvaluationTableProps> = ({ evaluations }) => (
  <table className="w-full text-left">
    <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-bold">
      <tr>
        <th className="px-6 py-4">Evaluación</th>
        <th className="px-6 py-4">Promedio</th>
        <th className="px-6 py-4">Máx / Mín</th>
        <th className="px-6 py-4 text-right">Participación</th>
      </tr>
    </thead>
    <tbody className="divide-y divide-slate-100">
      {evaluations.map((e) => (
        <tr key={e.id}>
          <td className="px-6 py-4 font-semibold">{e.name}</td>
          <td className="px-6 py-4 font-mono text-indigo-600">{e.average.toFixed(2)}</td>
          <td className="px-6 py-4 text-sm text-slate-600">
            <span className="text-emerald-600">↑ {e.highest_score}</span>
            <span className="mx-2 text-slate-300">|</span>
            <span className="text-rose-600">↓ {e.lowest_score}</span>
          </td>
          <td className="px-6 py-4 text-right text-sm text-slate-500">
            {e.evaluated_count} alumnos ({e.missing_count} ausentes)
          </td>
        </tr>
      ))}
    </tbody>
  </table>
);

export default EvaluationTable;
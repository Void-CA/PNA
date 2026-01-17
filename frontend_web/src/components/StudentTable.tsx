import React from 'react';

interface Student {
  id: string | number;
  name: string;
  average: number;
  std_dev: number;
  percentile: number;
  status: 'Approved' | 'At Risk' | 'Failed';
}

interface StudentTableProps {
  students: Student[];
  onSelect: (student: Student) => void;
}

const StudentTable: React.FC<StudentTableProps> = ({ students, onSelect }) => (
  <table className="w-full text-left">
    <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-bold">
      <tr>
        <th className="px-6 py-4">Nombre</th>
        <th className="px-6 py-4">Promedio</th>
        <th className="px-6 py-4">Desv. Estándar</th>
        <th className="px-6 py-4">Percentil</th>
        <th className="px-6 py-4 text-right">Estado</th>
      </tr>
    </thead>
    <tbody className="divide-y divide-slate-100">
      {students.map((s) => (
        <tr
          key={s.id}
          onClick={() => onSelect(s)}
          className="hover:bg-indigo-50/50 cursor-pointer transition-colors active:bg-indigo-50"
        >
          <td className="px-6 py-4 font-semibold text-slate-700">{s.name}</td>
          <td className="px-6 py-4 font-mono text-indigo-600">{s.average.toFixed(2)}</td>
          <td className="px-6 py-4 text-slate-500 text-sm">{s.std_dev.toFixed(2)}</td>
          <td className="px-6 py-4">
            <div className="w-full bg-slate-100 h-1.5 rounded-full max-w-[100px]">
              <div className="bg-blue-400 h-full rounded-full" style={{ width: `${s.percentile}%` }} />
            </div>
          </td>
          <td className="px-6 py-4 text-right">
            <span className={`px-3 py-1 rounded-full text-xs font-bold ${s.status === 'Approved' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
              }`}>
              {s.status === 'Approved' ? 'Aprobado' : 'En Riesgo'}
            </span>
          </td>
        </tr>
      ))}
    </tbody>
  </table>
);

export default StudentTable;
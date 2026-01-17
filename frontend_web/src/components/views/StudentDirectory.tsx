import { useState } from 'react';
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '../ui/table';

import { Badge } from '../ui/badge';
import { Search } from 'lucide-react';
import type { ExtendedAnalysis } from '../../hooks/useGradeData';
import { StudentDetailSheet } from './StudentDetailSheet';

interface StudentDirectoryProps {
    data: ExtendedAnalysis;
}

export function StudentDirectory({ data }: StudentDirectoryProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedStudent, setSelectedStudent] = useState<any>(null);

    const students = data.summary.students.filter((s: any) =>
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.id.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Helper to find row
    const getStudentRow = (student: any) => {
        if (!student || !data.table) return null;
        // Assume Header 0 is the key for student name?? 
        // Wait, the engine returns `get_table()` with { students: string[], evaluations: string[], scores: number[][] }

        // Correction: engine.ts docs say:
        // { students: string[], evaluations: string[], scores: (number|null)[][] }
        // This is NOT an object per row. It's a matrix!
        // I need to adapt the `studentRow` logic significantly here and in the Sheet.

        // Find index of student
        const index = data.table.students.indexOf(student.name);
        if (index === -1) return null;

        // Construct a "row" object for compatibility with the Sheet logic or update Sheet logic
        // Let's construct: { "Exam 1": score, "Exam 2": score }
        const rowObj: any = {};
        data.table.evaluations.forEach((evalName: string, evalIndex: number) => {
            const score = data.table.scores[index][evalIndex];
            rowObj[evalName] = score;
        });
        return rowObj;
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold tracking-tight">Directorio de Estudiantes</h2>
                <div className="relative w-72">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
                    <input
                        className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-slate-950"
                        placeholder="Buscar por nombre o ID..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="rounded-md border border-slate-200 bg-white overflow-hidden shadow-sm">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[100px]">ID</TableHead>
                            <TableHead>Nombre</TableHead>
                            <TableHead>Promedio</TableHead>
                            <TableHead>Percentil</TableHead>
                            <TableHead className="text-right">Estado</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {students.map((student: any) => (
                            <TableRow
                                key={student.id}
                                className="cursor-pointer"
                                onClick={() => setSelectedStudent(student)}
                            >
                                <TableCell className="font-mono text-xs text-slate-500">{student.id}</TableCell>
                                <TableCell className="font-medium">{student.name}</TableCell>
                                <TableCell>{student.average.toFixed(2)}</TableCell>
                                <TableCell>{student.percentile}%</TableCell>
                                <TableCell className="text-right">
                                    <Badge variant={student.status === 'Approved' ? 'success' : 'destructive'}>
                                        {student.status === 'Approved' ? 'Aprobado' : 'Fallido'}
                                    </Badge>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            <StudentDetailSheet
                student={selectedStudent}
                studentRow={getStudentRow(selectedStudent)}
                isOpen={!!selectedStudent}
                onClose={() => setSelectedStudent(null)}
                allEvaluations={data.summary.evaluations}
            />
        </div>
    );
}

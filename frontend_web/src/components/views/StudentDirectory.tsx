import { useState } from 'react';
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '../ui/table';

import { Badge } from '../ui/badge';
import { Search } from 'lucide-react';

import type { ExtendedAnalysis, Student } from '../../hooks/useGradeData';
import { StudentDetailSheet } from './StudentDetailSheet';

interface StudentDirectoryProps {
    data: ExtendedAnalysis;
}

export function StudentDirectory({ data }: StudentDirectoryProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

    // Debug check to verify new code is running
    // console.log("StudentDirectory v1.0.1 loaded (findIndex patch)");

    const students = data.summary.students.filter((s: Student) =>
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.id.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Helper to find row
    const getStudentRow = (student: Student | null) => {
        if (!student || !data.table || !data.table.records) {
            // console.log("getStudentRow abort: missing data", { student: !!student, table: !!data.table });
            return null;
        }

        // Find the record matching the student ID (carnet)
        const record = data.table.records.find((r: any) => r.carnet === student.id);

        if (!record) {
            console.log("getStudentRow: Record not found for", student.id);
            return null;
        }

        const rowObj: any = {};
        const evalNames = data.table.evaluations || [];

        evalNames.forEach((evalName: string, index: number) => {
            if (record.grades && record.grades[index]) {
                const gradeEntry = record.grades[index];
                // gradeEntry follows { status: 'Numeric'|'Fraction'|..., value: ... } structure from Rust

                let scoreVal = 0;

                if (gradeEntry.status === 'Numeric') {
                    scoreVal = gradeEntry.value;
                } else if (gradeEntry.status === 'Fraction') {
                    scoreVal = gradeEntry.value.obtained;
                } else {
                    // Absent, Withdrawn, Label -> Treat as 0 for chart
                    scoreVal = 0;
                }

                rowObj[evalName] = scoreVal;
            }
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
                            <TableHead>Puntaje</TableHead>
                            <TableHead>Percentil</TableHead>
                            <TableHead className="text-right">Estado</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {students.map((student: Student) => (
                            <TableRow
                                key={student.id}
                                className="cursor-pointer"
                                onClick={() => setSelectedStudent(student)}
                            >
                                <TableCell className="font-mono text-xs text-slate-500">{student.id}</TableCell>
                                <TableCell className="font-medium">{student.name}</TableCell>
                                <TableCell>{student.accumulated_score}</TableCell>
                                <TableCell>{student.percentile.toFixed(2)}%</TableCell>
                                <TableCell className="text-right">
                                    <Badge variant={
                                        student.status === 'Approved' ? 'success' :
                                            student.status === 'AtRisk' ? 'warning' : 'destructive'
                                    }>
                                        {student.status === 'Approved' ? 'Aprobado' :
                                            student.status === 'AtRisk' ? 'En Riesgo' : 'Fallido'}
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

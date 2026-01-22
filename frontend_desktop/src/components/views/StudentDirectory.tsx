import { useState } from 'react';
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '../ui/table';

import { Badge } from '../ui/badge';
import { Search, ArrowUpDown } from 'lucide-react';

import type { ExtendedAnalysis, Student } from '../../hooks/useGradeData';
import { StudentDetailSheet } from './StudentDetailSheet';

interface StudentDirectoryProps {
    data: ExtendedAnalysis;
}

export function StudentDirectory({ data }: StudentDirectoryProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
    const [sortConfig, setSortConfig] = useState<{ key: keyof Student | 'status', direction: 'asc' | 'desc' }>({ key: 'accumulated_score', direction: 'desc' });

    // Debug check to verify new code is running
    // console.log("StudentDirectory v1.0.1 loaded (findIndex patch)");

    const filteredStudents = data.summary.students.filter((s: Student) =>
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.id.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Sort students based on current sort config
    const students = [...filteredStudents].sort((a, b) => {
        const { key, direction } = sortConfig;
        let valA: any = a[key as keyof Student];
        let valB: any = b[key as keyof Student];

        // Handle undefined values
        if (valA === undefined) valA = 0;
        if (valB === undefined) valB = 0;

        // String comparison for text fields
        if (typeof valA === 'string' && typeof valB === 'string') {
            return direction === 'asc'
                ? valA.localeCompare(valB)
                : valB.localeCompare(valA);
        }

        // Numeric comparison
        if (valA < valB) return direction === 'asc' ? -1 : 1;
        if (valA > valB) return direction === 'asc' ? 1 : -1;
        return 0;
    });

    const handleSort = (key: keyof Student | 'status') => {
        setSortConfig(current => ({
            key,
            direction: current.key === key && current.direction === 'desc' ? 'asc' : 'desc'
        }));
    };

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
                            <TableHead className="w-25 cursor-pointer hover:bg-slate-50" onClick={() => handleSort('id')}>
                                <div className="flex items-center gap-1">
                                    ID <ArrowUpDown size={12} />
                                </div>
                            </TableHead>
                            <TableHead className="cursor-pointer hover:bg-slate-50" onClick={() => handleSort('name')}>
                                <div className="flex items-center gap-1">
                                    Nombre <ArrowUpDown size={12} />
                                </div>
                            </TableHead>
                            <TableHead className="cursor-pointer hover:bg-slate-50" onClick={() => handleSort('accumulated_score')}>
                                <div className="flex items-center gap-1">
                                    Puntaje <ArrowUpDown size={12} />
                                </div>
                            </TableHead>
                            <TableHead className="cursor-pointer hover:bg-slate-50" onClick={() => handleSort('percentile')}>
                                <div className="flex items-center gap-1">
                                    Percentil <ArrowUpDown size={12} />
                                </div>
                            </TableHead>
                            <TableHead className="text-right cursor-pointer hover:bg-slate-50" onClick={() => handleSort('status')}>
                                <div className="flex items-center gap-1 justify-end">
                                    Estado <ArrowUpDown size={12} />
                                </div>
                            </TableHead>
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
                                        student.status === 'Failed' ? 'default' :
                                        student.status === 'OnTrack' ? 'info' :
                                        student.status === 'Warning' ? 'warning' :
                                        student.status === 'Critical' ? 'destructive' :
                                        'default'
                                    }>
                                        {student.status === 'Approved' && 'Aprobado'}
                                        {student.status === 'Failed' && 'Reprobado'}
                                        {student.status === 'OnTrack' && 'Bueno'}
                                        {student.status === 'Warning' && 'Advertencia'}
                                        {student.status === 'Critical' && 'Crítico'}
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

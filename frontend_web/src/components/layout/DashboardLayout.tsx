import React from 'react';
import {
    LayoutDashboard,
    Users,
    FileSpreadsheet,
    Menu,
    MessageCircleQuestionMark,
    GraduationCap
} from 'lucide-react';
import { Button } from '../ui/button';
import { cn } from '../../lib/utils';
import { Sheet, SheetContent, SheetTrigger } from '../ui/sheet';

interface DashboardLayoutProps {
    children: React.ReactNode;
    activeView: string;
    onViewChange: (view: string) => void;
    onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const NAV_ITEMS = [
    { id: 'overview', label: 'Resumen Clase', icon: LayoutDashboard },
    { id: 'students', label: 'Estudiantes', icon: Users },
    { id: 'evaluations', label: 'Evaluaciones', icon: FileSpreadsheet },
    { id: 'help', label: 'Ayuda', icon: MessageCircleQuestionMark }
];

export function DashboardLayout({
    children,
    activeView,
    onViewChange,
    onFileChange
}: DashboardLayoutProps) {

    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const handleUploadClick = () => {
        fileInputRef.current?.click();
    };

    const NavContent = () => (
        <div className="flex flex-col h-full py-4">
            <div className="px-6 mb-8 flex items-center gap-3">
                <div className="bg-slate-900 text-white p-2 rounded-xl">
                    <GraduationCap size={24} />
                </div>
                <span className="font-bold text-xl tracking-tight">GradeAnalytics</span>
            </div>

            <div className="space-y-1 px-3">
                {NAV_ITEMS.map((item) => (
                    <Button
                        key={item.id}
                        variant={activeView === item.id ? "secondary" : "ghost"}
                        className={cn(
                            "w-full justify-start gap-4 text-base h-12 font-medium",
                            activeView === item.id ? "bg-slate-100 text-slate-900" : "text-slate-500"
                        )}
                        onClick={() => onViewChange(item.id)}
                    >
                        <item.icon size={20} />
                        {item.label}
                    </Button>
                ))}
            </div>

            <div className="mt-auto px-6 pt-6 border-t border-slate-100">
                <div className="w-full">
                    <Button
                        onClick={handleUploadClick}
                        className="w-full h-auto py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-lg shadow-indigo-200 transition-all font-medium flex items-center justify-center gap-2"
                    >
                        Cargar Nuevo CSV
                    </Button>
                    <input
                        ref={fileInputRef}
                        type="file"
                        className="hidden"
                        onChange={onFileChange}
                    />
                </div>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-slate-50/50 flex w-full">
            {/* Sidebar Desktop */}
            <aside className="hidden lg:block w-72 bg-white border-r border-slate-200 fixed h-full z-20">
                <NavContent />
            </aside>

            {/* Mobile Header */}
            <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b border-slate-200 z-30 flex items-center px-4 justify-between">
                <div className="flex items-center gap-2 font-bold text-lg">
                    <GraduationCap className="text-indigo-600" />
                    GradeAnalytics
                </div>
                <Sheet>
                    <SheetTrigger asChild>
                        <Button variant="ghost" size="icon">
                            <Menu size={24} />
                        </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="w-72 p-0">
                        <NavContent />
                    </SheetContent>
                </Sheet>
            </div>

            {/* Main Content */}
            <main className="flex-1 lg:ml-72 min-h-screen pt-16 lg:pt-0">
                <div className="max-w-7xl mx-auto p-6 md:p-8 animate-in fade-in duration-500">
                    {children}
                </div>
            </main>
        </div>
    );
}

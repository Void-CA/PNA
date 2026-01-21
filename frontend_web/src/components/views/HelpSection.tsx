import { 
    HelpCircle, 
    BarChart2, 
    Users, 
    FileText, 
    TrendingUp, 
    Activity, 
    Info 
} from 'lucide-react';

interface ConceptCardProps {
    title: string;
    icon: React.ComponentType<{ size?: number }>;
    children: React.ReactNode;
}

// Subcomponente para tarjetas de conceptos visuales
const ConceptCard = ({ title, icon: Icon, children }: ConceptCardProps) => (
    <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                <Icon size={24} />
            </div>
            <h3 className="font-bold text-gray-800 text-lg">{title}</h3>
        </div>
        <div className="text-gray-600 text-sm leading-relaxed">
            {children}
        </div>
    </div>
);

// Subcomponente visual para explicar Desviación Estándar
const StandardDeviationVisual = () => (
    <div className="flex flex-col gap-4 mt-3 bg-gray-50 p-4 rounded-md">
        <div className="flex items-center gap-2">
            <div className="w-16 flex flex-col items-center gap-0.5">
                {/* Visualización simplificada de barras muy juntas */}
                <div className="flex items-end gap-0.5 h-8">
                    <div className="w-1 h-3 bg-green-400"></div>
                    <div className="w-1 h-6 bg-green-500"></div>
                    <div className="w-1 h-8 bg-green-600"></div>
                    <div className="w-1 h-6 bg-green-500"></div>
                    <div className="w-1 h-3 bg-green-400"></div>
                </div>
                <span className="text-[10px] text-gray-500 font-bold">Baja</span>
            </div>
            <p className="text-xs text-gray-600 flex-1">
                <strong>Grupo Homogéneo:</strong> La mayoría tiene notas similares. Todos aprenden a ritmo parecido.
            </p>
        </div>
        <div className="flex items-center gap-2">
            <div className="w-16 flex flex-col items-center gap-0.5">
                {/* Visualización simplificada de barras dispersas */}
                <div className="flex items-end gap-0.5 h-8">
                    <div className="w-1 h-4 bg-orange-400"></div>
                    <div className="w-1 h-1 bg-orange-200"></div>
                    <div className="w-1 h-2 bg-orange-300"></div>
                    <div className="w-1 h-8 bg-orange-600"></div>
                    <div className="w-1 h-2 bg-orange-300"></div>
                </div>
                <span className="text-[10px] text-gray-500 font-bold">Alta</span>
            </div>
            <p className="text-xs text-gray-600 flex-1">
                <strong>Grupo Disperso:</strong> Hay mucha diferencia entre los mejores y los que necesitan apoyo.
            </p>
        </div>
    </div>
);

// Subcomponente visual para explicar Distribución (Sesgo)
const DistributionVisual = () => (
    <div className="mt-3 grid grid-cols-2 gap-2">
        <div className="bg-gray-50 p-2 rounded text-center">
            {/* SVG simplificado de curva a la derecha */}
            <svg viewBox="0 0 100 40" className="w-full h-12 text-blue-500 fill-current opacity-80">
                <path d="M0,40 Q40,40 60,10 T100,40 Z" />
            </svg>
            <p className="text-[10px] font-semibold mt-1 text-gray-700">Mayoría notas altas</p>
            <p className="text-[10px] text-gray-500">Gráfico cargado a la derecha</p>
        </div>
        <div className="bg-gray-50 p-2 rounded text-center">
             {/* SVG simplificado de curva a la izquierda */}
             <svg viewBox="0 0 100 40" className="w-full h-12 text-red-400 fill-current opacity-80">
                <path d="M0,40 Q20,10 60,40 T100,40 Z" />
            </svg>
            <p className="text-[10px] font-semibold mt-1 text-gray-700">Mayoría notas bajas</p>
            <p className="text-[10px] text-gray-500">Gráfico cargado a la izquierda</p>
        </div>
    </div>
);

export function HelpSection() {
    return (
        <div className="max-w-4xl mx-auto p-6 space-y-8">
            {/* Header Amigable */}
            <header className="border-b pb-6">
                <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                    <HelpCircle className="text-blue-600" />
                    Guía Docente GradeAnalytics
                </h1>
                <p className="text-gray-500 mt-2 text-lg">
                 Aquí te explicamos cómo traducir los números a la realidad.
                </p>
            </header>

            {/* Sección 1: Navegación Rápida */}
            <section>
                <h2 className="text-xl font-semibold mb-4 text-gray-800 flex items-center gap-2">
                    <Users size={20} /> Tu espacio de trabajo
                </h2>
                <div className="grid md:grid-cols-3 gap-4">
                    <div className="p-4 bg-white border rounded hover:border-blue-400 transition cursor-help group">
                        <h3 className="font-bold text-gray-700 group-hover:text-blue-600">Resumen Clase</h3>
                        <p className="text-sm text-gray-500 mt-1">
                            El termómetro del grupo. Ofrece una descripcion de las notas de la clase.
                        </p>
                    </div>
                    <div className="p-4 bg-white border rounded hover:border-blue-400 transition cursor-help group">
                        <h3 className="font-bold text-gray-700 group-hover:text-blue-600">Estudiantes</h3>
                        <p className="text-sm text-gray-500 mt-1">
                            La lupa individual. Ideal para revisiones de desempeño.
                        </p>
                    </div>
                    <div className="p-4 bg-white border rounded hover:border-blue-400 transition cursor-help group">
                        <h3 className="font-bold text-gray-700 group-hover:text-blue-600">Evaluaciones</h3>
                        <p className="text-sm text-gray-500 mt-1">
                            Análisis post-aplicación. Descubra qué temas fallaron y cuáles se entendieron bien.
                        </p>
                    </div>
                </div>
            </section>

            {/* Sección 2: Interpretación de Datos (El núcleo del valor) */}
            <section>
                <h2 className="text-xl font-semibold mb-4 text-gray-800 flex items-center gap-2">
                    <Activity size={20} /> Interpretando las Estadísticas
                </h2>
                <div className="grid md:grid-cols-2 gap-6">
                    
                    {/* Gráficos de Distribución */}
                    <ConceptCard title="El Mapa de la Clase (Distribución)" icon={BarChart2}>
                        <p className="mb-2">
                            Te dice <strong>dónde está la mayoría</strong>. No mires solo el promedio, mira la forma.
                        </p>
                        <DistributionVisual />
                    </ConceptCard>

                    {/* Desviación Estándar */}
                    <ConceptCard title="¿Qué tan parejo es el grupo?" icon={TrendingUp}>
                        <p className="mb-2">
                            Técnicamente es la "Desviación Estándar". En la práctica, te dice si debes aplicar una estrategia única o diferenciada.
                        </p>
                        <StandardDeviationVisual />
                    </ConceptCard>

                    {/* Percentiles */}
                    <ConceptCard title="Percentiles" icon={FileText}>
                        <p>
                            Imagina una fila de 100 estudiantes ordenados por nota.
                        </p>
                        <ul className="list-disc list-inside mt-2 space-y-1 text-gray-600 bg-gray-50 p-3 rounded">
                            <li><strong>Percentil 90:</strong> Supera al 90% de la clase (Top de la clase).</li>
                            <li><strong>Percentil 50:</strong> Está justo en el medio (Mediana).</li>
                            <li><strong>Percentil 20:</strong> Solo supera al 20% (Peores de la clase).</li>
                        </ul>
                    </ConceptCard>

                    {/* Promedio vs Realidad */}
                    <ConceptCard title="Estadistica vs. Realidad" icon={Info}>
                        <p className="mb-2">
                            El promedio puede mentir.
                        </p>
                        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3 text-xs text-yellow-800">
                            <strong>Ejemplo:</strong> Si la mitad saca 100 y la otra mitad 0, el promedio es 50. ¡Pero nadie sacó 50! <br/>
                            <span className="italic mt-1 block">Por eso siempre mira la Desviación Estándar.</span>
                        </div>
                    </ConceptCard>
                </div>
            </section> 

            {/* Sección 3: Consejos de Acción */}
            <section className="bg-slate-900 text-white rounded-xl p-6 shadow-lg">
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                    ¿Qué hacer con la información?
                </h2>
                <div className="grid md:grid-cols-3 gap-6">
                    <div>
                        <h4 className="font-bold text-blue-100 mb-1">Si la desviación es alta...</h4>
                        <p className="text-sm text-blue-50 opacity-90">
                            El grupo es muy desigual. Considera dividir la clase en grupos de trabajo mixtos o asignar tareas de refuerzo diferenciadas.
                        </p>
                    </div>
                    <div>
                        <h4 className="font-bold text-blue-100 mb-1">Si la curva va a la izquierda...</h4>
                        <p className="text-sm text-blue-50 opacity-90">
                            Muchas notas bajas. Revisar si la evaluación fue demasiado difícil o si un tema clave no se entendió correctamente.
                        </p>
                    </div>
                    <div>
                        <h4 className="font-bold text-blue-100 mb-1">Estudiantes en Percentil bajo...</h4>
                        <p className="text-sm text-blue-50 opacity-90">
                            Son los estudiantes que se están quedando atrás respecto al ritmo del resto del grupo. Considerar apoyos adicionales
                        </p>
                    </div>
                </div>
            </section>
        </div>
    );
}


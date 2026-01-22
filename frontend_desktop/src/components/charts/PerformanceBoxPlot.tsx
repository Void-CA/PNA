import { useMemo } from 'react';
import Plot from 'react-plotly.js';

interface BoxPlotProps {
    data: Array<{
        name: string;
        values: number[]; // Asegúrate que WASM convierta sus Vec/Arrays a JS Arrays
    }>;
}

export default function PerformanceBoxPlot({ data }: BoxPlotProps) {
    // 0. Normalizar los datos en porcentajes
    const normalizedData = useMemo(() => {
        return data.map(group => {
            const maxVal = Math.max(...group.values, 1); // Evitar división por cero
            const normalizedValues = group.values.map(v => (v / maxVal) * 100);
            return {
                name: group.name,
                values: normalizedValues
            };
        });
    }, [data]);

    // 1. Memorizar Traces: Evita que Plotly recree el gráfico si los datos no han cambiado
    const traces = useMemo(() => normalizedData.map((group) => ({
        type: 'box' as const,
        y: group.values,
        name: group.name,
        boxpoints: 'outliers' as const,
        marker: { color: '#6366f1' },
        line: { color: '#4f46e5' },
        fillcolor: 'rgba(99,102,241,0.3)',
        boxmean: true as const,
    })), [data]);

    // 2. Memorizar Layout: Evita cálculos de layout innecesarios
    const layout = useMemo(() => ({
        margin: { t: 20, r: 30, l: 40, b: 40 },
        yaxis: { 
            // CAMBIO: De string a objeto
            title: { text: 'Porcentaje de Nota (%)' }, 
            automargin: true 
        },
        xaxis: { 
            // CAMBIO: De string a objeto
            title: { text: 'Group' }, 
            tickfont: { size: 12 } 
        },
        paper_bgcolor: 'rgba(0,0,0,0)',
        plot_bgcolor: 'rgba(0,0,0,0)',
        showlegend: false,
        autosize: true,
    }), []);

    return (
        <div className="h-80 w-full relative">
            <Plot
                data={traces}
                layout={layout}
                config={{ 
                    responsive: true,
                    displaylogo: false,
                    modeBarButtonsToRemove: ['select2d', 'lasso2d'] 
                }}
                style={{ width: '100%', height: '100%' }}
                useResizeHandler={true} // Obligatorio para que funcione con CSS flexible
            />
        </div>
    );
}
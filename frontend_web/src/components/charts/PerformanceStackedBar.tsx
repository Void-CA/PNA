import { useMemo } from 'react';
import Plot from 'react-plotly.js';

interface PerformanceData {
    name: string;
    values: number[];
    maxScore: number;
}

interface StackedBarProps {
    data: PerformanceData[];
}

export default function PerformanceStackedBar({ data }: StackedBarProps) {

    const processed = useMemo(() => {
        return data.map(group => {
            const total = group.values.length;

            const percentages = group.values.map(v => (v / group.maxScore) * 100);

            const bajo = percentages.filter(p => p < 60).length;
            const medio = percentages.filter(p => p >= 60 && p < 80).length;
            const alto = percentages.filter(p => p >= 80).length;

            return {
                name: group.name,
                total,
                counts: { bajo, medio, alto },
                percentages: {
                    bajo: (bajo / total) * 100,
                    medio: (medio / total) * 100,
                    alto: (alto / total) * 100
                }
            };
        });
    }, [data]);

    const categories = ['Bajo', 'Medio', 'Alto'];

    const colors = {
        Bajo: '#ff3b58',
        Medio: '#ffa73b',
        Alto: '#3b6fff'
    };

    const traces = useMemo(() => 
        categories.map(category => ({
            type: 'bar' as const,
            name: category,
            x: processed.map(p => p.name),
            y: processed.map(p => p.percentages[category.toLowerCase() as keyof typeof p.percentages]),
            // Flatten customdata to an array of arrays: [count, total]
            customdata: processed.map(p => [
                p.counts[category.toLowerCase() as keyof typeof p.counts],
                p.total
            ]),
            marker: { color: colors[category as keyof typeof colors] },
            hovertemplate:
                `<b>%{x}</b><br>` +
                `${category}: %{y:.1f}%<br>` +
                `Estudiantes: %{customdata[0]} de %{customdata[1]}` +
                `<extra></extra>`
        }))
    , [processed]);

    const layout = useMemo(() => ({
        barmode: 'stack' as const,
        margin: { t: 20, r: 30, l: 50, b: 60 },
        yaxis: {
            title: { text: 'Distribución (%)' },
            range: [0, 100]
        },
        xaxis: {
            title: { text: 'Evaluación' },
            tickangle: -20,
        },
        paper_bgcolor: 'rgba(0,0,0,0)',
        plot_bgcolor: 'rgba(0,0,0,0)',
        autosize: true,
    }), []);

    return (
        <div className="h-80 w-full relative">
            <Plot
                data={traces}
                layout={layout}
                config={{
                    responsive: true,
                    displaylogo: false
                }}
                style={{ width: '100%', height: '100%' }}
                useResizeHandler
            />
        </div>
    );
}

import { useMemo } from 'react';
import Plot from 'react-plotly.js';

interface KDEPlotProps {
    data: Array<{
        name: string;
        values: number[];
    }>;
}

// Gaussian kernel function
function gaussianKernel(x: number): number {
    return Math.exp(-0.5 * x * x) / Math.sqrt(2 * Math.PI);
}

// Calculate KDE for a set of data points
function calculateKDE(data: number[], bandwidth: number, numPoints: number = 100): { x: number[], y: number[] } {
    if (data.length === 0) return { x: [], y: [] };

    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min;
    const padding = range * 0.1; // Add 10% padding on each side

    const x: number[] = [];
    const y: number[] = [];

    // Generate evaluation points
    for (let i = 0; i < numPoints; i++) {
        const xi = min - padding + (range + 2 * padding) * i / (numPoints - 1);
        x.push(xi);

        // Calculate density at this point
        let density = 0;
        for (const dataPoint of data) {
            density += gaussianKernel((xi - dataPoint) / bandwidth);
        }
        density /= (data.length * bandwidth);
        y.push(density);
    }

    return { x, y };
}

// Silverman's rule of thumb for bandwidth selection
function silvermanBandwidth(data: number[]): number {
    const n = data.length;
    const stdDev = Math.sqrt(data.reduce((sum, val) => {
        const mean = data.reduce((a, b) => a + b, 0) / n;
        return sum + Math.pow(val - mean, 2);
    }, 0) / n);

    // Silverman's rule: 1.06 * σ * n^(-1/5)
    return 1.06 * stdDev * Math.pow(n, -0.2);
}

export default function KDEPlot({ data }: KDEPlotProps) {
    const traces = useMemo(() => {
        return data.map((group, idx) => {
            if (group.values.length === 0) {
                return {
                    type: 'scatter' as const,
                    x: [],
                    y: [],
                    name: group.name,
                    mode: 'lines' as const,
                    fill: 'tozeroy' as const,
                    line: { color: '#6366f1', width: 2 },
                    fillcolor: 'rgba(99,102,241,0.2)',
                };
            }

            const bandwidth = silvermanBandwidth(group.values);
            const kde = calculateKDE(group.values, bandwidth);

            return {
                type: 'scatter' as const,
                x: kde.x,
                y: kde.y,
                name: group.name,
                mode: 'lines' as const,
                fill: 'tozeroy' as const,
                line: {
                    color: `hsl(${(idx * 137.5) % 360}, 70%, 50%)`,
                    width: 2
                },
                fillcolor: `hsla(${(idx * 137.5) % 360}, 70%, 50%, 0.2)`,
            };
        });
    }, [data]);

    const layout = useMemo(() => ({
        margin: { t: 20, r: 30, l: 40, b: 40 },
        yaxis: {
            title: { text: 'Densidad' },
            automargin: true
        },
        xaxis: {
            title: { text: 'Puntuación' },
            tickfont: { size: 12 }
        },
        paper_bgcolor: 'rgba(0,0,0,0)',
        plot_bgcolor: 'rgba(0,0,0,0)',
        showlegend: data.length > 1,
        autosize: true,
        hovermode: 'x unified' as const,
    }), [data.length]);

    return (
        <div className="h-full w-full relative">
            <Plot
                data={traces}
                layout={layout}
                config={{
                    responsive: true,
                    displaylogo: false,
                    modeBarButtonsToRemove: ['select2d', 'lasso2d']
                }}
                style={{ width: '100%', height: '100%' }}
                useResizeHandler={true}
            />
        </div>
    );
}

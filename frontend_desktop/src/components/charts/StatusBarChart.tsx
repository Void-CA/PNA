import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  Cell, 
  LabelList,
  CartesianGrid
} from 'recharts';

interface StatusBarChartProps {
  data: {
    name: string;
    value: number;
    color: string;
  }[];
}

// Tooltip personalizado para dar más contexto
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white p-3 border border-gray-200 shadow-lg rounded-md">
        <p className="font-bold text-gray-800 mb-1">{data.name}</p>
        <div className="flex items-center gap-2 text-sm">
          <span 
            className="w-3 h-3 rounded-full" 
            style={{ backgroundColor: data.color }}
          ></span>
          <span className="text-gray-600">
            {data.value} estudiantes
          </span>
        </div>
        <p className="text-xs text-gray-400 mt-1">
            {/* Aquí podrías agregar un mensaje dinámico según el estado */}
            {data.percentage}% del total de la clase
        </p>
      </div>
    );
  }
  return null;
};

export default function StatusBarChart({ data }: StatusBarChartProps) {
  // 1. Calculamos el total para sacar porcentajes
  const totalStudents = data.reduce((acc, cur) => acc + cur.value, 0);

  // 2. Enriquecemos la data con el porcentaje para usarlo en el renderizado y la ordenamos de mayor a menor
  const processedData = data
    .map(item => ({
      ...item,
      percentage: totalStudents > 0 ? ((item.value / totalStudents) * 100).toFixed(1) : 0,
      displayValue: item.value 
    }))
    .sort((a, b) => b.value - a.value);

  return (
    <div className="w-full bg-white rounded-lg">
      <ResponsiveContainer width="100%" height={220}>
        <BarChart 
            data={processedData} 
            layout="vertical" 
            margin={{ left: 10, right: 30, top: 10, bottom: 10 }}
            barSize={24} // Barras más gruesas y legibles
        >
          {/* Grid vertical sutil para guiar la vista */}
          <CartesianGrid horizontal={false} stroke="#e5e7eb" strokeDasharray="3 3" />
          
          <XAxis type="number" hide />
          
          <YAxis 
            type="category" 
            dataKey="name" 
            width={100} 
            tick={{ fontSize: 13, fill: '#4b5563', fontWeight: 500 }} 
            axisLine={false}
            tickLine={false}
          />
          
          <Tooltip content={<CustomTooltip />} cursor={{fill: 'transparent'}} />
          
          <Bar 
            dataKey="value" 
            radius={[0, 4, 4, 0]} // Redondeado solo a la derecha
            background={{ fill: '#f3f4f6' }} // Fondo gris (efecto track)
          >
            {processedData.map((entry, idx) => (
              <Cell key={`cell-${idx}`} fill={entry.color} />
            ))}

            {/* Etiqueta al final de la barra: "5 (12%)" */}
            <LabelList 
              dataKey="value" 
              position="right" 
              content={(props: any) => {
                const { x, y, width, value, index } = props;
                // Accedemos al porcentaje precalculado
                const percent = processedData[index].percentage;
                return (
                  <text 
                    x={x + width + 5} 
                    y={y + 16} 
                    fill="#6b7280" 
                    fontSize={12} 
                    textAnchor="start"
                    fontWeight={500}
                  >
                    {value} <tspan fill="#9ca3af" fontSize={11}>({percent}%)</tspan>
                  </text>
                );
              }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
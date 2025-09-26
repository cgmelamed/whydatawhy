'use client';

import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, ScatterChart, Scatter,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell
} from 'recharts';

interface DataVisualizationProps {
  data: any[];
  chartType?: 'line' | 'bar' | 'pie' | 'scatter';
  xKey?: string;
  yKey?: string;
  title?: string;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

export default function DataVisualization({
  data,
  chartType = 'bar',
  xKey,
  yKey,
  title
}: DataVisualizationProps) {

  if (!data || data.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-gray-500">
        <p>No data to visualize</p>
      </div>
    );
  }

  // Auto-detect keys if not provided
  const keys = Object.keys(data[0] || {});
  const actualXKey = xKey || keys[0];
  const actualYKey = yKey || keys[1] || keys[0];

  const renderChart = () => {
    switch (chartType) {
      case 'line':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={actualXKey} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey={actualYKey} stroke="#8884d8" activeDot={{ r: 8 }} />
            </LineChart>
          </ResponsiveContainer>
        );

      case 'bar':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={actualXKey} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey={actualYKey} fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        );

      case 'pie':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(entry: any) => entry[actualXKey]}
                outerRadius={80}
                fill="#8884d8"
                dataKey={actualYKey}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        );

      case 'scatter':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={actualXKey} />
              <YAxis dataKey={actualYKey} />
              <Tooltip cursor={{ strokeDasharray: '3 3' }} />
              <Legend />
              <Scatter name="Data" data={data} fill="#8884d8" />
            </ScatterChart>
          </ResponsiveContainer>
        );

      default:
        return null;
    }
  };

  return (
    <div className="h-full flex flex-col">
      {title && (
        <div className="px-4 py-2 border-b bg-gray-50">
          <h3 className="text-sm font-semibold text-gray-700">{title}</h3>
        </div>
      )}
      <div className="flex-1 p-4">
        {renderChart()}
      </div>
    </div>
  );
}
import {
  RadialBarChart, RadialBar, ResponsiveContainer,
  PieChart, Pie, Cell, Tooltip,
  LineChart, Line, XAxis, YAxis, CartesianGrid, Legend,
} from 'recharts';
import { formatDayAbbr } from '../../utils/formatters';

// ── Calorie Ring ────────────────────────────────────────────────────────────
export function CalorieRing({ eaten, target }) {
  const pct = Math.min(100, Math.round((eaten / Math.max(target, 1)) * 100));
  const data = [{ value: pct, fill: '#22c55e' }];

  return (
    <div className="relative flex items-center justify-center">
      <ResponsiveContainer width={180} height={180}>
        <RadialBarChart
          cx="50%"
          cy="50%"
          innerRadius="65%"
          outerRadius="90%"
          barSize={12}
          data={data}
          startAngle={90}
          endAngle={-270}
        >
          <RadialBar background={{ fill: '#f1f5f9' }} dataKey="value" cornerRadius={6} />
        </RadialBarChart>
      </ResponsiveContainer>
      <div className="absolute text-center">
        <p className="font-mono font-bold text-2xl text-text-primary">{eaten}</p>
        <p className="text-xs text-text-muted">of {target} kcal</p>
        <p className="font-mono text-sm font-bold text-primary">{pct}%</p>
      </div>
    </div>
  );
}

// ── Macro Pie Chart ─────────────────────────────────────────────────────────
export function MacroPie({ protein, carbs, fat }) {
  const data = [
    { name: 'Protein', value: Math.round(protein || 0), color: '#3b82f6' },
    { name: 'Carbs', value: Math.round(carbs || 0), color: '#f97316' },
    { name: 'Fat', value: Math.round(fat || 0), color: '#a855f7' },
  ].filter((d) => d.value > 0);

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-32 text-text-muted text-sm">
        Log meals to see macro split
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={160}>
      <PieChart>
        <Pie data={data} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="value" paddingAngle={3}>
          {data.map((entry) => (
            <Cell key={entry.name} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip
          formatter={(val, name) => [`${val}g`, name]}
          contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
        />
        <Legend iconType="circle" iconSize={8} />
      </PieChart>
    </ResponsiveContainer>
  );
}

// ── 7-Day Trend Line Chart ──────────────────────────────────────────────────
export function WeeklyTrend({ data = [], calorieTarget }) {
  const chartData = data.map((d) => ({
    day: formatDayAbbr(d.date),
    Calories: Math.round(d.totalCalories || 0),
    Protein: Math.round(d.totalProtein || 0),
  }));

  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
        <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
        <Tooltip
          contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', fontSize: 12 }}
        />
        <Legend iconType="circle" iconSize={8} />
        {calorieTarget && (
          <Line
            type="monotone"
            dataKey="Calories"
            stroke="#22c55e"
            strokeWidth={2.5}
            dot={{ r: 4, fill: '#22c55e' }}
            activeDot={{ r: 6 }}
          />
        )}
        <Line
          type="monotone"
          dataKey="Protein"
          stroke="#3b82f6"
          strokeWidth={2}
          strokeDasharray="4 4"
          dot={{ r: 3, fill: '#3b82f6' }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

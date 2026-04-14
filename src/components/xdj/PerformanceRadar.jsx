import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer } from "recharts";

export default function PerformanceRadar({ data }) {
  return (
    <div className="lcd-cavity rounded-xl p-3 relative glass-reflection">
      <ResponsiveContainer width="100%" height={220}>
        <RadarChart data={data} cx="50%" cy="50%" outerRadius="70%">
          <PolarGrid stroke="hsl(220 8% 18%)" strokeDasharray="3 3" />
          <PolarAngleAxis
            dataKey="subject"
            tick={{ fill: 'hsl(220 10% 45%)', fontSize: 9, fontFamily: 'JetBrains Mono' }}
          />
          <Radar
            dataKey="value"
            stroke="hsl(217 90% 55%)"
            strokeWidth={2}
            fill="hsl(217 90% 55%)"
            fillOpacity={0.15}
            dot={{ r: 3, fill: 'hsl(217 90% 55%)', stroke: 'hsl(220 12% 4%)', strokeWidth: 2 }}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}

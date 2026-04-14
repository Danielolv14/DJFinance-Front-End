import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

function moedaCurta(v) {
  if (v >= 1000) return `R$${(v / 1000).toFixed(1)}k`;
  return `R$${Math.round(v)}`;
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg px-3 py-2 font-display text-xs"
         style={{
           background: 'hsl(240 8% 8% / 0.95)',
           border: '1px solid hsl(240 6% 20%)',
           boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
         }}>
      <p className="text-muted-foreground mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }} className="font-bold">{moedaCurta(p.value)}</p>
      ))}
    </div>
  );
}

export default function WaveformChart({ data }) {
  return (
    <div className="rounded-xl p-4"
         style={{
           background: 'hsl(240 12% 4%)',
           boxShadow: 'inset 3px 3px 10px rgba(0,0,0,0.5), inset -2px -2px 4px rgba(255,255,255,0.02)',
           border: '1px solid rgba(0,0,0,0.3)',
         }}>
      <div className="relative">
        <div className="absolute inset-0 rounded-lg opacity-[0.02]"
             style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.15) 0%, transparent 40%)' }} />
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
            <defs>
              <linearGradient id="gradCache" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"   stopColor="hsl(217 90% 55%)" stopOpacity={0.4} />
                <stop offset="100%" stopColor="hsl(217 90% 55%)" stopOpacity={0.02} />
              </linearGradient>
              <linearGradient id="gradLucro" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"   stopColor="hsl(30 95% 55%)" stopOpacity={0.3} />
                <stop offset="100%" stopColor="hsl(30 95% 55%)" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <XAxis dataKey="label"
                   tick={{ fill: 'hsl(220 10% 35%)', fontSize: 10, fontFamily: 'JetBrains Mono' }}
                   axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: 'hsl(220 10% 35%)', fontSize: 10, fontFamily: 'JetBrains Mono' }}
                   axisLine={false} tickLine={false} tickFormatter={moedaCurta} />
            <Tooltip content={<CustomTooltip />} />
            <Area type="monotone" dataKey="lucro"
                  stroke="hsl(30 95% 55%)" strokeWidth={2} fill="url(#gradLucro)" dot={false} />
            <Area type="monotone" dataKey="valor"
                  stroke="hsl(217 90% 55%)" strokeWidth={2} fill="url(#gradCache)"
                  dot={{ r: 3, fill: 'hsl(217 90% 55%)', stroke: 'hsl(240 12% 4%)', strokeWidth: 2 }}
                  activeDot={{ r: 5, fill: 'hsl(217 90% 55%)', strokeWidth: 0,
                               style: { filter: 'drop-shadow(0 0 4px hsl(217 90% 55%))' } }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

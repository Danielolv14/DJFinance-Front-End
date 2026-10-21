/* Peças visuais do Dashboard: cartões, títulos e linhas. */
import { motion } from 'framer-motion';
import { moeda, moedaCurta } from '../../utils/format';

export function KpiCard({ icon, label, value, sub, color, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="rounded-2xl p-5 relative overflow-hidden"
      style={{
        background: 'linear-gradient(145deg, hsl(220 10% 10%), hsl(220 10% 7%))',
        border: '1px solid hsl(220 8% 14%)',
        boxShadow: `0 4px 20px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)`,
      }}
    >
      {/* Accent top strip */}
      <div className="absolute top-0 left-0 right-0 h-0.5 rounded-t-2xl" style={{ background: color, boxShadow: `0 0 8px ${color}` }} />

      <div className="flex items-start justify-between mb-3">
        <div className="rounded-lg p-2" style={{ background: `${color}18`, border: `1px solid ${color}30` }}>
          <div style={{ color, width: 16, height: 16 }}>{icon}</div>
        </div>
        {sub && (
          <span style={{
            fontFamily: "'JetBrains Mono',monospace",
            fontSize: 9, fontWeight: 600,
            color: 'hsl(220 10% 40%)',
            letterSpacing: '0.1em', textTransform: 'uppercase',
          }}>{sub}</span>
        )}
      </div>

      <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 22, fontWeight: 700, color: '#e8e9ee', lineHeight: 1 }}>
        {value}
      </div>
      <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: 'hsl(220 10% 40%)', marginTop: 6, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
        {label}
      </div>
    </motion.div>
  );
}

export function ShowRow({ show, color }) {
  return (
    <div className="flex items-center gap-3 py-2.5 px-3 rounded-xl transition-colors hover:bg-white/[0.03]">
      <div className="w-1 rounded-full flex-shrink-0" style={{ height: 36, background: color, boxShadow: `0 0 6px ${color}60` }} />
      <div className="flex-1 min-w-0">
        <div style={{ fontFamily: "'Inter',sans-serif", fontSize: 13, fontWeight: 500, color: 'hsl(220 15% 72%)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {show.evento || 'Show'}
        </div>
        <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: 'hsl(220 10% 38%)', marginTop: 1 }}>
          {show.contratante} · {show.data}
        </div>
      </div>
      <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 13, fontWeight: 700, color, flexShrink: 0 }}>
        {moedaCurta(show.cache || 0)}
      </div>
    </div>
  );
}

export function SectionTitle({ title, right }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2">
        <div className="w-0.5 h-4 rounded-full" style={{ background: 'hsl(217 90% 55%)', boxShadow: '0 0 6px hsl(217 90% 55%)' }} />
        <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, fontWeight: 600, color: 'hsl(220 10% 45%)', letterSpacing: '0.2em', textTransform: 'uppercase' }}>{title}</span>
      </div>
      {right}
    </div>
  );
}

export function Card({ children, className = '', delay = 0, style = {} }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className={`rounded-2xl p-6 ${className}`}
      style={{
        background: 'linear-gradient(145deg, hsl(220 10% 10%), hsl(220 10% 7%))',
        border: '1px solid hsl(220 8% 14%)',
        boxShadow: '0 4px 24px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.04)',
        ...style,
      }}
    >
      {children}
    </motion.div>
  );
}

export function DistRow({ label, value, total, color }) {
  const p = total > 0 ? Math.min((value / total) * 100, 100) : 0;
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: color, boxShadow: `0 0 4px ${color}` }} />
          <span style={{ fontFamily: "'Inter',sans-serif", fontSize: 12, color: 'hsl(220 10% 50%)' }}>{label}</span>
        </div>
        <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 12, fontWeight: 700, color }}>{moeda(value)}</span>
      </div>
      <div className="rounded-full overflow-hidden" style={{ height: 4, background: 'hsl(220 8% 12%)' }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${p}%` }}
          transition={{ duration: 1, ease: 'easeOut' }}
          className="h-full rounded-full"
          style={{ background: color, boxShadow: `0 0 6px ${color}50` }}
        />
      </div>
    </div>
  );
}

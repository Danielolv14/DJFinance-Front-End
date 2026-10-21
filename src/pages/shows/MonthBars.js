/* Barras de faturamento por mês. */
import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { MESES_ABREV } from '../../utils/format';

/* ─── monthly revenue bars ─── */
export default function MonthBars({ shows }) {
  const dados = useMemo(() => {
    const map = {};
    shows.filter(s => s.status === 'CONFIRMADO').forEach(s => {
      if (s.mes) map[s.mes] = (map[s.mes] || 0) + (s.cache || 0);
    });
    return MESES_ABREV.map((label, i) => ({ label, val: map[i + 1] || 0 }));
  }, [shows]);
  const max = Math.max(...dados.map(d => d.val), 1);
  return (
    <div style={{ display: 'flex', gap: 3, alignItems: 'flex-end', height: 48, padding: '0 4px' }}>
      {dados.map((d, i) => (
        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          <div style={{
            width: '100%', height: 40,
            display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
          }}>
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: `${(d.val / max) * 100}%` }}
              transition={{ duration: 0.6, delay: i * 0.03, ease: 'easeOut' }}
              style={{
                background: d.val > 0 ? 'linear-gradient(180deg, #9a7ef8, #6a4fd8)' : 'rgba(255,255,255,0.04)',
                borderRadius: '2px 2px 0 0',
                boxShadow: d.val > 0 ? '0 0 8px rgba(154,126,248,0.4)' : 'none',
                minHeight: 2,
              }}
            />
          </div>
          <span style={{ fontSize: 7, color: 'rgba(255,255,255,0.2)', fontFamily: "'JetBrains Mono', monospace', letterSpacing: '0.05em" }}>
            {d.label}
          </span>
        </div>
      ))}
    </div>
  );
}

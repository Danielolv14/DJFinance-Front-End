/* Seletor de mês do Dashboard. */
import { motion } from 'framer-motion';
import { MESES_ABREV } from '../../utils/format';

export default function MonthSelector({ mesSel, onSelect, waveformData }) {
  const maxVal = Math.max(...waveformData.map(d => d.valor), 1);
  return (
    <div className="flex gap-1.5">
      {MESES_ABREV.map((m, i) => {
        const active = mesSel === i + 1;
        const hasData = waveformData[i]?.valor > 0;
        return (
          <motion.button
            key={m}
            whileTap={{ scale: 0.93, y: 1 }}
            onClick={() => onSelect(i + 1)}
            className="relative flex flex-col items-center gap-0.5 rounded"
            style={{
              padding: '6px 8px 4px',
              minWidth: 40,
              background: active
                ? 'linear-gradient(180deg, hsl(217 90% 55% / 0.25), hsl(217 90% 55% / 0.1))'
                : 'linear-gradient(180deg, hsl(220 9% 12%), hsl(220 8% 9%))',
              border: `1px solid ${active ? 'hsl(217 90% 55% / 0.5)' : 'hsl(220 8% 14%)'}`,
              boxShadow: active
                ? '0 0 12px hsl(217 90% 55% / 0.25), inset 0 1px 0 hsl(217 90% 55% / 0.2)'
                : 'inset 0 1px 0 rgba(255,255,255,0.04)',
              cursor: 'pointer',
            }}
          >
            {/* LED bar — volume of that month */}
            <div className="w-full rounded-sm overflow-hidden" style={{ height: 3, background: 'rgba(255,255,255,0.06)' }}>
              <div style={{
                height: '100%',
                width: `${(waveformData[i]?.valor / maxVal) * 100}%`,
                background: active ? 'hsl(217 90% 60%)' : hasData ? 'hsl(150 70% 45% / 0.5)' : 'transparent',
                borderRadius: 2,
                transition: 'width 0.5s ease',
              }} />
            </div>
            {/* Label */}
            <span style={{
              fontFamily: "'JetBrains Mono',monospace",
              fontSize: 9, fontWeight: active ? 700 : 500,
              letterSpacing: '0.08em', textTransform: 'uppercase',
              color: active ? 'hsl(217 90% 65%)' : hasData ? 'hsl(220 15% 55%)' : 'hsl(220 10% 25%)',
            }}>{m}</span>
          </motion.button>
        );
      })}
    </div>
  );
}

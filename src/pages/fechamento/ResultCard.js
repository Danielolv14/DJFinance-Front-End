/* Cartão com um valor do fechamento (bruto, Daniel, lucro...). */
import { motion } from 'framer-motion';
import { superficie } from '../../utils/tema';

export default function ResultCard({ label, val, color, detail, large }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        ...superficie,
        padding: '16px 20px',
        borderTop: `2px solid ${color}`,
        flex: large ? 2 : 1,
        minWidth: 140,
      }}
    >
      <div style={{
        fontSize: 9, color: 'rgba(255,255,255,0.25)',
        letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 8,
      }}>
        {label}
      </div>
      <div style={{
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: large ? 22 : 18, fontWeight: 700,
        color, textShadow: `0 0 16px ${color}60`,
        lineHeight: 1,
      }}>
        {val}
      </div>
      {detail && (
        <div style={{
          marginTop: 5, fontSize: 9,
          color: 'rgba(255,255,255,0.25)', letterSpacing: '0.06em',
        }}>
          {detail}
        </div>
      )}
    </motion.div>
  );
}

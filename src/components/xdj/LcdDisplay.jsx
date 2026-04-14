import { motion } from "framer-motion";
import { useEffect, useState } from "react";

const VU_COUNT = 14;

const accentMap = {
  blue:   { accent: "#3B82F6", dim: "#1e3a5f" },
  green:  { accent: "#22C55E", dim: "#14532d" },
  orange: { accent: "#F97316", dim: "#7c2d12" },
  purple: { accent: "#A855F7", dim: "#581c87" },
};

export default function LcdDisplay({ value, label, sublabel, icon, ledColor = "blue", delay = 0, vuValue = 0, vuMax = 100 }) {
  const colors = accentMap[ledColor] || accentMap.blue;
  const [liveVu, setLiveVu] = useState(vuValue);

  useEffect(() => {
    const interval = setInterval(() => {
      const jitter = (Math.random() - 0.5) * vuMax * 0.05;
      setLiveVu(Math.max(0, Math.min(vuMax, vuValue + jitter)));
    }, 200);
    return () => clearInterval(interval);
  }, [vuValue, vuMax]);

  const litCount = vuMax > 0 ? Math.round((liveVu / vuMax) * VU_COUNT) : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className="relative rounded-2xl overflow-hidden"
      style={{
        background: 'linear-gradient(180deg, #1a1c20 0%, #141518 50%, #111215 100%)',
        border: '1px solid rgba(255,255,255,0.06)',
        boxShadow: `0 1px 0 rgba(255,255,255,0.04), 0 8px 24px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05)`,
      }}
    >
      {/* Bezel overlay */}
      <div className="absolute inset-0 rounded-2xl pointer-events-none"
           style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.03) 0%, transparent 8%, transparent 92%, rgba(0,0,0,0.2) 100%)' }} />

      <div className="relative p-4 pb-3 flex gap-3">
        <div className="flex-1 flex flex-col">
          {icon && <div className="mb-2 opacity-40">{icon}</div>}

          {/* Screen cavity */}
          <div className="relative rounded-lg px-4 py-3 mb-2"
               style={{
                 background: '#0c0d10',
                 border: '1px solid rgba(255,255,255,0.04)',
                 boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.6), inset 0 0 1px rgba(0,0,0,0.8)',
               }}>
            <div className="absolute inset-0 rounded-lg pointer-events-none"
                 style={{ background: 'linear-gradient(160deg, rgba(255,255,255,0.015) 0%, transparent 30%, transparent 70%, rgba(255,255,255,0.008) 100%)' }} />
            <span className="font-display text-[22px] font-bold tracking-tight relative z-10"
                  style={{ color: '#e8eaed' }}>
              {value}
            </span>
          </div>

          <span className="text-[10px] uppercase tracking-[0.18em] font-medium" style={{ color: '#6b7080' }}>
            {label}
          </span>

          {sublabel && (
            <span className="text-[11px] mt-1" style={{ color: colors.accent }}>
              {sublabel}
            </span>
          )}
        </div>

        {/* VU meter strip */}
        <div className="flex flex-col items-center justify-center pt-1">
          <div className="flex flex-col-reverse gap-[2.5px] p-[6px] rounded-md"
               style={{
                 background: '#0a0b0d',
                 border: '1px solid rgba(255,255,255,0.03)',
                 boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.6)',
               }}>
            {Array.from({ length: VU_COUNT }, (_, i) => {
              const isLit = i < litCount;
              let segColor;
              if (i < 7)       segColor = '#22c55e';
              else if (i < 10) segColor = '#eab308';
              else if (i < 12) segColor = '#f97316';
              else             segColor = '#ef4444';
              return (
                <div key={i} className="w-[6px] h-[5px] rounded-[1px]"
                     style={{
                       background: isLit ? segColor : '#1a1c20',
                       opacity: isLit ? (i === litCount - 1 ? 0.95 : 0.85) : 0.4,
                       boxShadow: isLit ? `0 0 2px ${segColor}60` : 'none',
                       transition: 'background 0.1s, opacity 0.1s',
                     }} />
              );
            })}
          </div>
        </div>
      </div>

      {/* Color accent bar */}
      <div className="h-[2px] mx-4 mb-3 rounded-full"
           style={{
             background: `linear-gradient(90deg, ${colors.accent}, ${colors.accent}80, transparent)`,
             opacity: 0.5,
           }} />
    </motion.div>
  );
}

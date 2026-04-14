import { motion } from "framer-motion";
import { useEffect, useState } from "react";

const SEG_COLORS = [
  "hsl(150 70% 45%)", "hsl(150 70% 45%)", "hsl(150 70% 45%)", "hsl(150 65% 48%)", "hsl(150 60% 50%)",
  "hsl(50 90% 50%)",  "hsl(45 95% 50%)",  "hsl(40 95% 50%)",
  "hsl(30 95% 55%)",  "hsl(25 95% 50%)",
  "hsl(5 80% 52%)",   "hsl(0 75% 55%)",   "hsl(0 80% 50%)",
];

export default function VuMeter({ value, max, segments = 13, label, vertical = true, animate: shouldAnimate = true }) {
  const [displayValue, setDisplayValue] = useState(value);

  useEffect(() => {
    if (!shouldAnimate) { setDisplayValue(value); return; }
    const interval = setInterval(() => {
      const jitter = (Math.random() - 0.5) * max * 0.08;
      setDisplayValue(Math.max(0, Math.min(max, value + jitter)));
    }, 200);
    return () => clearInterval(interval);
  }, [value, max, shouldAnimate]);

  const litCount = max > 0 ? Math.round((displayValue / max) * segments) : 0;

  if (!vertical) {
    return (
      <div className="flex flex-col gap-1.5">
        <div className="flex gap-[2px] items-center h-3">
          {Array.from({ length: segments }, (_, i) => {
            const isLit = i < litCount;
            const color = SEG_COLORS[i] || SEG_COLORS[SEG_COLORS.length - 1];
            return (
              <motion.div
                key={i}
                className="flex-1 h-full rounded-[1px]"
                animate={{
                  background: isLit ? color : 'hsl(220 8% 8%)',
                  boxShadow: isLit ? `0 0 4px ${color}, 0 0 8px ${color}30` : 'inset 0 1px 2px rgba(0,0,0,0.5)',
                }}
                transition={{ duration: 0.1 }}
              />
            );
          })}
        </div>
        {label && <span className="text-[8px] uppercase tracking-wider text-muted-foreground font-display">{label}</span>}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="flex gap-[3px] items-end h-[55px]">
        {Array.from({ length: segments }, (_, i) => {
          const isLit = i < litCount;
          const color = SEG_COLORS[i] || SEG_COLORS[SEG_COLORS.length - 1];
          const height = 25 + (i / segments) * 50;
          return (
            <motion.div
              key={i}
              className={`w-[5px] rounded-[1.5px] ${isLit && i === litCount - 1 ? 'vu-seg-pulse' : ''}`}
              animate={{
                height: `${height}%`,
                background: isLit ? color : 'hsl(220 10% 8%)',
                boxShadow: isLit
                  ? `0 0 3px ${color}, 0 0 8px ${color}35, inset 0 1px 0 rgba(255,255,255,0.2)`
                  : 'inset 0 1px 2px rgba(0,0,0,0.5)',
              }}
              transition={{ duration: 0.12, ease: "easeOut" }}
            />
          );
        })}
      </div>
      {label && <span className="text-[8px] uppercase tracking-wider text-muted-foreground font-display">{label}</span>}
    </div>
  );
}

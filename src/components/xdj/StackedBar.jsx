import { motion } from "framer-motion";

export default function StackedBar({ segments }) {
  const total = segments.reduce((a, s) => a + s.value, 0);

  return (
    <div>
      <div className="h-5 rounded-full overflow-hidden flex"
           style={{
             background: 'hsl(240 8% 8%)',
             boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.5), 0 1px 0 rgba(255,255,255,0.02)',
           }}>
        {segments.map((s, i) => {
          const w = total > 0 ? (s.value / total) * 100 : 0;
          if (w <= 0) return null;
          return (
            <motion.div
              key={i}
              initial={{ width: 0 }}
              animate={{ width: `${w}%` }}
              transition={{ duration: 0.8, delay: i * 0.1, ease: "easeOut" }}
              style={{
                background: s.color,
                boxShadow: `0 0 8px ${s.glowColor}, inset 0 1px 0 rgba(255,255,255,0.2)`,
              }}
            />
          );
        })}
      </div>
      <div className="flex justify-between mt-1.5 px-1">
        {['0%','25%','50%','75%','100%'].map(l => (
          <span key={l} className="text-[9px] font-display text-muted-foreground/40">{l}</span>
        ))}
      </div>
    </div>
  );
}

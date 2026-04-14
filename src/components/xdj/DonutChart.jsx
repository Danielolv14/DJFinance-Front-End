import { motion } from "framer-motion";

export default function DonutChart({ data, centerLabel, centerValue }) {
  const total = data.reduce((a, d) => a + d.value, 0);
  const size = 160;
  const strokeWidth = 18;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  let cumulativeOffset = 0;

  return (
    <div className="relative flex items-center justify-center">
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size/2} cy={size/2} r={radius} fill="none"
                stroke="hsl(220 10% 8%)" strokeWidth={strokeWidth}
                style={{ filter: 'drop-shadow(0 0 2px rgba(0,0,0,0.3))' }} />
        {data.map((d, i) => {
          const pct = total > 0 ? d.value / total : 0;
          const dashLength = pct * circumference;
          const offset = cumulativeOffset;
          cumulativeOffset += dashLength;
          return (
            <motion.circle
              key={i}
              cx={size/2} cy={size/2} r={radius}
              fill="none"
              stroke={d.color}
              strokeWidth={strokeWidth - 2}
              strokeDasharray={`${dashLength} ${circumference - dashLength}`}
              strokeDashoffset={-offset}
              strokeLinecap="round"
              initial={{ strokeDasharray: `0 ${circumference}` }}
              animate={{ strokeDasharray: `${dashLength} ${circumference - dashLength}` }}
              transition={{ duration: 0.8, delay: i * 0.15, ease: "easeOut" }}
              style={{ filter: `drop-shadow(0 0 4px ${d.color}40)` }}
            />
          );
        })}
      </svg>
      {(centerLabel || centerValue) && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {centerValue && (
            <span className="font-display text-lg font-bold text-foreground">{centerValue}</span>
          )}
          {centerLabel && (
            <span className="text-[9px] uppercase tracking-wider text-muted-foreground font-display">{centerLabel}</span>
          )}
        </div>
      )}
    </div>
  );
}

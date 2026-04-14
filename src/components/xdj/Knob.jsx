import { useEffect, useState } from "react";

export default function Knob({ color, label, value, size = 52, rotation = 0, animate: shouldAnimate = true }) {
  const [displayRotation, setDisplayRotation] = useState(rotation);

  useEffect(() => {
    if (!shouldAnimate) { setDisplayRotation(rotation); return; }
    const interval = setInterval(() => {
      const jitter = (Math.random() - 0.5) * 3;
      setDisplayRotation(Math.max(0, Math.min(100, rotation + jitter)));
    }, 300);
    return () => clearInterval(interval);
  }, [rotation, shouldAnimate]);

  const indicatorAngle = -135 + (displayRotation / 100) * 270;
  const arcLength = 198;
  const arcOffset = arcLength - (displayRotation / 100) * (arcLength - 66);

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative rounded-full knob-live"
           style={{
             width: size + 14, height: size + 14,
             background: 'hsl(220 10% 5%)',
             boxShadow: 'inset 0 3px 8px rgba(0,0,0,0.7), inset 0 -1px 0 rgba(255,255,255,0.03), 0 2px 4px rgba(0,0,0,0.4)',
           }}>
        {/* Arc SVG */}
        <svg className="absolute inset-0" viewBox="0 0 100 100"
             style={{ width: size + 14, height: size + 14 }}>
          <circle cx="50" cy="50" r="42" fill="none"
                  stroke="hsl(220 8% 12%)" strokeWidth="3"
                  strokeDasharray={arcLength} strokeDashoffset="66"
                  transform="rotate(135 50 50)" />
          <circle cx="50" cy="50" r="42" fill="none"
                  stroke={color} strokeWidth="3"
                  strokeDasharray={arcLength} strokeDashoffset={arcOffset}
                  transform="rotate(135 50 50)"
                  style={{ filter: `drop-shadow(0 0 4px ${color})`, transition: 'stroke-dashoffset 0.3s ease-out' }} />
        </svg>

        {/* Knob body */}
        <div className="absolute rounded-full"
             style={{
               top: 7, left: 7, width: size, height: size,
               background: `conic-gradient(from ${indicatorAngle}deg, hsl(220 8% 24%), hsl(220 8% 16%), hsl(220 8% 22%), hsl(220 8% 14%), hsl(220 8% 20%))`,
               boxShadow: '0 3px 10px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.1), inset 0 -1px 0 rgba(0,0,0,0.4)',
               transition: 'background 0.3s',
             }}>
          {/* Knurl texture */}
          <div className="absolute inset-[2px] rounded-full"
               style={{ background: `repeating-conic-gradient(from 0deg, rgba(255,255,255,0.03) 0deg 5deg, transparent 5deg 10deg)` }} />
          {/* Indicator dot */}
          <div className="absolute top-[5px] left-1/2 w-[3px] h-[8px] -translate-x-1/2 rounded-full"
               style={{
                 background: color,
                 boxShadow: `0 0 6px ${color}, 0 0 12px ${color}50`,
                 transform: `translateX(-50%) rotate(${indicatorAngle + 135}deg)`,
                 transformOrigin: `center ${size / 2 - 5}px`,
                 transition: 'transform 0.3s ease-out',
               }} />
          {/* Center cap */}
          <div className="absolute top-1/2 left-1/2 w-3 h-3 -translate-x-1/2 -translate-y-1/2 rounded-full"
               style={{
                 background: 'radial-gradient(circle at 40% 35%, hsl(220 8% 18%), hsl(220 8% 8%))',
                 boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.6), 0 0.5px 0 rgba(255,255,255,0.05)',
               }} />
        </div>
      </div>

      <span className="text-[9px] uppercase tracking-wider text-muted-foreground font-display">{label}</span>
      {value && (
        <span className="text-[11px] font-display font-bold" style={{ color, textShadow: `0 0 6px ${color}40` }}>
          {value}
        </span>
      )}
    </div>
  );
}

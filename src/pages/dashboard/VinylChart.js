/* Disco de vinil girando com o arco do valor sobre o total (Review do mês). */
import { useState, useEffect, useRef } from 'react';
import { moeda } from '../../utils/format';

export default function VinylChart({ value, total, color, label, sublabel, size = 200 }) {
  const [rot, setRot] = useState(0);
  const rotRef = useRef(0);
  const velRef = useRef(0.25);

  useEffect(() => {
    let raf;
    const loop = () => {
      velRef.current += (0.25 - velRef.current) * 0.02;
      rotRef.current  = (rotRef.current + velRef.current) % 360;
      setRot(rotRef.current);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  const ratio    = total > 0 ? Math.min(value / total, 1) : 0;
  const radius   = 82;
  const circ     = 2 * Math.PI * radius;
  const filled   = circ * ratio;
  const sz       = size;

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative flex-shrink-0" style={{ width: sz, height: sz }}>
        {/* Outer chrome ring */}
        <div className="absolute inset-0 rounded-full" style={{
          background: 'conic-gradient(from 0deg, #18191f 0%, #24252d 25%, #18191f 50%, #22232b 75%, #18191f 100%)',
          boxShadow: '0 0 0 1px #09090c, 0 8px 32px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.07)',
        }} />

        {/* Rubber grip */}
        <div className="absolute rounded-full" style={{
          inset: sz * 0.04,
          background: 'repeating-radial-gradient(circle at center, #0d0e10 0px, #0d0e10 3px, #141518 3px, #141518 5px, #0d0e10 5px, #0d0e10 8px, #181920 8px, #181920 9px)',
          boxShadow: `inset 0 0 0 ${sz * 0.13}px #0c0d0f`,
        }} />

        {/* Silver platter */}
        <div className="absolute rounded-full" style={{
          width: sz * 0.72, height: sz * 0.72,
          top: sz * 0.14, left: sz * 0.14,
          background: `conic-gradient(from ${rot * 0.2}deg, #7c8090, #a8adb8, #88909a, #b8bdc8, #808590, #a0a5b0, #7c8090)`,
          boxShadow: 'inset 0 0 20px rgba(0,0,0,0.5), 0 0 0 1px rgba(0,0,0,0.5)',
        }}>
          <div className="absolute inset-0 rounded-full" style={{
            background: 'repeating-radial-gradient(circle at center, transparent 0px, transparent 5px, rgba(0,0,0,0.1) 5px, rgba(0,0,0,0.1) 5.5px)',
          }} />
        </div>

        {/* Spinning vinyl */}
        <div className="absolute rounded-full overflow-hidden" style={{
          width: sz * 0.54, height: sz * 0.54,
          top: sz * 0.23, left: sz * 0.23,
          transform: `rotate(${rot}deg)`,
          background: `conic-gradient(from 0deg, #12131a 0deg, #1a1b22 18deg, #12131a 36deg, #18191f 54deg, #12131a 72deg, #1a1b22 90deg, #12131a 108deg, #18191f 126deg, #12131a 144deg, #1a1b22 162deg, #12131a 180deg, #18191f 198deg, #12131a 216deg, #1a1b22 234deg, #12131a 252deg, #18191f 270deg, #12131a 288deg, #1a1b22 306deg, #12131a 324deg, #18191f 342deg, #12131a 360deg)`,
          boxShadow: 'inset 0 0 20px rgba(0,0,0,0.7)',
        }}>
          {[20,34,48,62].map(r => (
            <div key={r} className="absolute rounded-full" style={{
              width: `${r}%`, height: `${r}%`, top: '50%', left: '50%',
              transform: 'translate(-50%,-50%)',
              border: '1px solid rgba(255,255,255,0.04)',
            }} />
          ))}
        </div>

        {/* SVG arc progress overlay */}
        <svg className="absolute inset-0" viewBox="0 0 200 200" style={{ width: sz, height: sz }}>
          {/* Track */}
          <circle cx="100" cy="100" r={radius} fill="none"
            stroke="rgba(255,255,255,0.06)" strokeWidth="6"
            strokeDasharray={circ} strokeDashoffset="0"
            strokeLinecap="round"
          />
          {/* Progress */}
          <circle cx="100" cy="100" r={radius} fill="none"
            stroke={color} strokeWidth="6"
            strokeDasharray={`${filled} ${circ - filled}`}
            strokeDashoffset={circ * 0.25}
            strokeLinecap="round"
            style={{ filter: `drop-shadow(0 0 6px ${color}) drop-shadow(0 0 3px ${color})`, transition: 'stroke-dasharray 1s ease' }}
          />
        </svg>

        {/* Center hub */}
        <div className="absolute flex flex-col items-center justify-center rounded-full" style={{
          width: sz * 0.32, height: sz * 0.32,
          top: sz * 0.34, left: sz * 0.34,
          background: 'radial-gradient(circle at 38% 32%, #2a2c36, #0d0e14)',
          boxShadow: `inset 0 3px 8px rgba(0,0,0,0.8), 0 0 0 2px rgba(255,255,255,0.05), 0 0 12px ${color}20`,
          border: `1px solid ${color}30`,
        }}>
          <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: sz * 0.055, color: color, fontWeight: 700, textShadow: `0 0 8px ${color}`, lineHeight: 1 }}>
            {Math.round(ratio * 100)}%
          </span>
        </div>
      </div>

      {/* Label below disc */}
      <div className="text-center">
        <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: color, textShadow: `0 0 8px ${color}50`, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>{label}</div>
        <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 20, fontWeight: 700, color: '#e8e9ee', marginTop: 2, textShadow: '0 0 20px rgba(255,255,255,0.1)' }}>{moeda(value)}</div>
        {sublabel && <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: 'rgba(255,255,255,0.3)', marginTop: 2, letterSpacing: '0.1em' }}>{sublabel}</div>}
      </div>
    </div>
  );
}

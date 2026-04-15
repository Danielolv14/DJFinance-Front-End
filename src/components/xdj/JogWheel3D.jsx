import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function JogWheel3D({
  size = 230,
  color = '#1a6efa',
  trackName = '',
  valueLabel = '',
  valueSub = '',
  deckNum = 1,
}) {
  const [rot,     setRot]     = useState(0);
  const [pressed, setPressed] = useState(false);
  const [burst,   setBurst]   = useState(false);
  const rotRef = useRef(0);
  const velRef = useRef(0.4);
  const drag   = useRef({ active: false, lastY: 0, lastX: 0 });

  useEffect(() => {
    let raf;
    const loop = () => {
      if (!drag.current.active) {
        velRef.current += (0.4 - velRef.current) * 0.025;
        rotRef.current  = (rotRef.current + velRef.current) % 360;
        setRot(rotRef.current);
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  const onDown  = useCallback((e) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { active: true, lastY: e.clientY, lastX: e.clientX };
    setPressed(true);
  }, []);
  const onMove  = useCallback((e) => {
    if (!drag.current.active) return;
    const dy = drag.current.lastY - e.clientY;
    const dx = e.clientX - drag.current.lastX;
    velRef.current = dy * 1.0 + dx * 0.4;
    rotRef.current = (rotRef.current + velRef.current + 360) % 360;
    setRot(rotRef.current);
    drag.current.lastY = e.clientY;
    drag.current.lastX = e.clientX;
  }, []);
  const onUp    = useCallback(() => { drag.current.active = false; setPressed(false); }, []);
  const onClick = useCallback(() => {
    setBurst(true); velRef.current = 10;
    setTimeout(() => setBurst(false), 600);
  }, []);

  const rubber = size;
  const platter = size * 0.72;
  const hub     = size * 0.40;
  const ticks   = 48;

  return (
    <div
      className="relative select-none flex-shrink-0"
      style={{ width: rubber, height: rubber, cursor: pressed ? 'grabbing' : 'grab' }}
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={onUp}
      onPointerLeave={onUp}
      onClick={onClick}
    >
      {/* ── Burst glow ── */}
      <AnimatePresence>
        {burst && (
          <motion.div key="burst" className="absolute inset-0 rounded-full pointer-events-none"
            initial={{ opacity: 0.9, scale: 0.85 }}
            animate={{ opacity: 0, scale: 1.35 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.55, ease: 'easeOut' }}
            style={{ background: `radial-gradient(circle, ${color}60 0%, transparent 70%)` }}
          />
        )}
      </AnimatePresence>

      {/* ── Outer chrome bezel ring ── */}
      <div className="absolute inset-0 rounded-full" style={{
        background: `conic-gradient(from ${rot * 0.05}deg,
          #1c1d22 0%, #2a2c34 10%, #1c1d22 20%, #252730 30%,
          #1c1d22 40%, #2a2c34 50%, #1c1d22 60%, #252730 70%,
          #1c1d22 80%, #2a2c34 90%, #1c1d22 100%)`,
        boxShadow: `
          0 0 0 1px #08090b,
          0 0 0 ${pressed ? 2 : 3}px ${burst ? color + '90' : '#323440'},
          0 ${pressed ? 4 : 14}px ${pressed ? 10 : 50}px rgba(0,0,0,0.95),
          inset 0 2px 0 rgba(255,255,255,0.08),
          inset 0 -2px 0 rgba(0,0,0,0.6)`,
        transition: 'box-shadow 0.15s',
      }}>
        {/* Tick marks on chrome bezel */}
        {[...Array(ticks)].map((_, i) => (
          <div key={i} style={{
            position: 'absolute',
            width: i % 12 === 0 ? 3 : i % 4 === 0 ? 1.5 : 1,
            height: i % 12 === 0 ? 10 : i % 4 === 0 ? 7 : 5,
            top: '50%', left: '50%',
            transformOrigin: `${i % 12 === 0 ? 1.5 : i % 4 === 0 ? 0.75 : 0.5}px ${-(rubber / 2 - 4)}px`,
            transform: `translate(-50%, 0) rotate(${i * (360 / ticks)}deg)`,
            background: i % 12 === 0 ? 'rgba(255,255,255,0.28)'
              : i % 4 === 0 ? 'rgba(255,255,255,0.14)'
              : 'rgba(255,255,255,0.06)',
            borderRadius: 2,
          }} />
        ))}
      </div>

      {/* ── Rubber grip ring ── */}
      <div className="absolute rounded-full overflow-hidden" style={{
        inset: rubber * 0.04,
        /* Rubber texture: concentric grooves */
        background: `
          repeating-radial-gradient(
            circle at center,
            #0f1012 0px, #0f1012 3px,
            #151618 3px, #151618 5px,
            #0f1012 5px, #0f1012 8px,
            #1a1b1f 8px, #1a1b1f 9px
          )`,
        boxShadow: `
          inset 0 0 0 ${rubber * 0.135}px #0e0f12,
          inset 0 0 20px rgba(0,0,0,0.6)`,
      }} />

      {/* ── Silver metallic platter ── */}
      <div className="absolute rounded-full" style={{
        width: platter, height: platter,
        top: (rubber - platter) / 2,
        left: (rubber - platter) / 2,
        background: `conic-gradient(from ${rot * 0.3}deg,
          #7c8090, #a8adb8, #888d98, #b8bdc8,
          #808590, #a0a5b0, #7c8090, #b0b5c0,
          #858a95, #a5aaB5, #808590, #b8bdc8,
          #7c8090, #a8adb8, #888d98, #b0b5c0)`,
        boxShadow: `
          0 0 0 2px rgba(0,0,0,0.6),
          inset 0 0 30px rgba(0,0,0,0.4),
          inset 0 2px 0 rgba(255,255,255,0.2)`,
      }}>
        {/* Fine machining marks overlay */}
        <div className="absolute inset-0 rounded-full" style={{
          background: `repeating-radial-gradient(
            circle at center,
            transparent 0px, transparent 4px,
            rgba(0,0,0,0.12) 4px, rgba(0,0,0,0.12) 4.5px
          )`,
        }} />
        {/* Specular shine */}
        <div className="absolute inset-0 rounded-full" style={{
          background: `radial-gradient(ellipse at 30% 25%,
            rgba(255,255,255,0.35) 0%, rgba(255,255,255,0.1) 25%, transparent 55%)`,
        }} />
      </div>

      {/* ── Spinning vinyl platter (inner dark area) ── */}
      <motion.div
        className="absolute rounded-full overflow-hidden"
        style={{
          width: platter * 0.74, height: platter * 0.74,
          top: rubber / 2 - (platter * 0.74) / 2,
          left: rubber / 2 - (platter * 0.74) / 2,
          rotate: rot,
          background: `conic-gradient(from 0deg,
            #13141a 0deg, #1a1b22 15deg, #13141a 30deg, #181920 45deg,
            #13141a 60deg, #1a1b22 75deg, #13141a 90deg, #181920 105deg,
            #13141a 120deg, #1a1b22 135deg, #13141a 150deg, #181920 165deg,
            #13141a 180deg, #1a1b22 195deg, #13141a 210deg, #181920 225deg,
            #13141a 240deg, #1a1b22 255deg, #13141a 270deg, #181920 285deg,
            #13141a 300deg, #1a1b22 315deg, #13141a 330deg, #181920 345deg, #13141a 360deg)`,
          boxShadow: 'inset 0 0 24px rgba(0,0,0,0.7)',
        }}
      >
        {/* Vinyl grooves */}
        {[20, 32, 44, 56, 65, 72, 78].map(r => (
          <div key={r} className="absolute rounded-full" style={{
            width: `${r}%`, height: `${r}%`,
            top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
            border: `1px solid rgba(255,255,255,${r < 50 ? 0.05 : 0.03})`,
          }} />
        ))}
        {/* Vinyl shine */}
        <div className="absolute inset-0 rounded-full pointer-events-none" style={{
          background: 'radial-gradient(ellipse at 38% 28%, rgba(255,255,255,0.07) 0%, transparent 50%)',
        }} />
      </motion.div>

      {/* ── Center hub (label area) ── */}
      <div className="absolute rounded-full overflow-hidden z-10 pointer-events-none flex flex-col items-center justify-center" style={{
        width: hub, height: hub,
        top: rubber / 2 - hub / 2,
        left: rubber / 2 - hub / 2,
        background: `radial-gradient(circle at 40% 30%, #2a2c38, #0d0e14)`,
        boxShadow: `
          inset 0 3px 10px rgba(0,0,0,0.8),
          0 0 0 2px #1e2030,
          0 0 0 3px rgba(255,255,255,0.06),
          0 0 ${burst ? 20 : 8}px ${burst ? color : 'transparent'}`,
        border: `2px solid rgba(255,255,255,0.06)`,
        transition: 'box-shadow 0.3s',
        gap: 2,
      }}>
        {/* Pioneer DJ ring */}
        <div className="absolute inset-0 rounded-full" style={{
          border: `2px solid ${color}40`,
          boxShadow: `inset 0 0 8px ${color}20`,
        }} />
        {/* Deck number */}
        <div style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: hub * 0.1,
          color: color,
          textShadow: `0 0 8px ${color}80`,
          letterSpacing: '0.2em',
          textTransform: 'uppercase',
          opacity: 0.7,
        }}>DECK {deckNum}</div>
        {/* Value */}
        <div style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: hub * 0.18,
          fontWeight: 700,
          color: color,
          textShadow: `0 0 10px ${color}`,
          textAlign: 'center',
          lineHeight: 1.1,
          padding: '0 6px',
          maxWidth: hub - 12,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}>{valueLabel}</div>
        {/* Sub value */}
        {valueSub && (
          <div style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: hub * 0.1,
            color: 'rgba(255,255,255,0.4)',
            letterSpacing: '0.08em',
            textAlign: 'center',
          }}>{valueSub}</div>
        )}
        {/* Center dot */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full" style={{
          width: hub * 0.12, height: hub * 0.12,
          background: `radial-gradient(circle, ${color}, ${color}80)`,
          boxShadow: `0 0 8px ${color}, 0 0 16px ${color}60`,
          marginTop: hub * 0.28,
        }} />
      </div>

      {/* Pressed overlay */}
      {pressed && (
        <div className="absolute inset-0 rounded-full pointer-events-none" style={{
          background: 'radial-gradient(circle at center, rgba(0,0,0,0.25) 0%, transparent 65%)',
        }} />
      )}
    </div>
  );
}

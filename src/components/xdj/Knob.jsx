import { useEffect, useRef, useState, useCallback } from "react";
import { motion } from "framer-motion";

export default function Knob({ color, label, value, size = 52, rotation = 0, animate: shouldAnimate = true }) {
  const [displayRot, setDisplayRot] = useState(rotation);
  const [dragging, setDragging]     = useState(false);
  const [bounce, setBounce]         = useState(false);
  const dragStart                   = useRef(null);
  const baseRot                     = useRef(rotation);

  /* ── sync with external prop when not dragging ── */
  useEffect(() => {
    if (dragging) return;
    baseRot.current = rotation;

    if (!shouldAnimate) { setDisplayRot(rotation); return; }
    const id = setInterval(() => {
      setDisplayRot(Math.max(0, Math.min(100, rotation + (Math.random() - 0.5) * 2.5)));
    }, 400);
    return () => clearInterval(id);
  }, [rotation, shouldAnimate, dragging]);

  /* ── mouse drag handler ── */
  const onMouseDown = useCallback((e) => {
    e.preventDefault();
    setDragging(true);
    dragStart.current = { y: e.clientY, rot: displayRot };

    const onMove = (ev) => {
      const dy   = dragStart.current.y - ev.clientY;
      const next = Math.max(0, Math.min(100, dragStart.current.rot + dy * 0.7));
      setDisplayRot(next);
      baseRot.current = next;
    };

    const onUp = () => {
      setDragging(false);
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup",   onUp);
      /* bounce snap */
      setBounce(true);
      setTimeout(() => setBounce(false), 300);
    };

    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup",   onUp);
  }, [displayRot]);

  const indicatorAngle = -135 + (displayRot / 100) * 270;
  const arcLen  = 198;
  const arcOff  = arcLen - (displayRot / 100) * (arcLen - 66);
  const outerSz = size + 18;

  return (
    <div className="flex flex-col items-center gap-1.5 select-none">

      {/* ── Outer housing ring ── */}
      <motion.div
        animate={bounce ? { scale: [1, 1.06, 0.97, 1.02, 1] } : {}}
        transition={{ duration: 0.3 }}
        className="relative rounded-full"
        style={{
          width:  outerSz,
          height: outerSz,
          background: `radial-gradient(circle at 40% 30%, hsl(220 8% 18%), hsl(220 10% 7%))`,
          boxShadow: `
            inset 0 4px 12px rgba(0,0,0,0.8),
            inset 0 -1px 0 rgba(255,255,255,0.04),
            0 6px 20px rgba(0,0,0,0.6),
            0 2px 4px rgba(0,0,0,0.4),
            0 0 0 1px rgba(255,255,255,0.05)`,
        }}
      >
        {/* Arc track */}
        <svg className="absolute inset-0" viewBox="0 0 100 100" style={{ width: outerSz, height: outerSz }}>
          {/* Track bg */}
          <circle cx="50" cy="50" r="41" fill="none"
            stroke="hsl(220 8% 10%)" strokeWidth="3.5"
            strokeDasharray={arcLen} strokeDashoffset="66"
            strokeLinecap="round"
            transform="rotate(135 50 50)" />
          {/* Active arc */}
          <circle cx="50" cy="50" r="41" fill="none"
            stroke={color} strokeWidth="3.5"
            strokeDasharray={arcLen}
            strokeDashoffset={arcOff}
            strokeLinecap="round"
            transform="rotate(135 50 50)"
            style={{ filter: `drop-shadow(0 0 5px ${color}) drop-shadow(0 0 2px ${color})`, transition: 'stroke-dashoffset 0.25s ease-out' }} />
        </svg>

        {/* ── Knob body ── */}
        <div
          onMouseDown={onMouseDown}
          className="absolute rounded-full overflow-hidden"
          style={{
            top: 9, left: 9, width: size, height: size,
            cursor: dragging ? 'grabbing' : 'grab',
            /* metallic barrel */
            background: `conic-gradient(from ${indicatorAngle - 10}deg,
              hsl(220 6% 22%),
              hsl(220 6% 30%),
              hsl(220 6% 18%),
              hsl(220 6% 28%),
              hsl(220 6% 16%),
              hsl(220 6% 26%),
              hsl(220 6% 20%),
              hsl(220 6% 22%))`,
            boxShadow: `
              0 4px 14px rgba(0,0,0,0.7),
              inset 0 2px 0 rgba(255,255,255,0.12),
              inset 0 -2px 4px rgba(0,0,0,0.5),
              0 0 0 1px rgba(0,0,0,0.5)`,
            transition: dragging ? 'none' : 'background 0.25s',
          }}
        >
          {/* Knurl grooves */}
          <div className="absolute inset-0 rounded-full" style={{
            background: `repeating-conic-gradient(from 0deg,
              rgba(0,0,0,0.18) 0deg 4deg,
              transparent 4deg 8deg)`,
          }} />

          {/* Specular highlight (glass-like top-left shine) */}
          <div className="absolute rounded-full pointer-events-none" style={{
            top: '5%', left: '10%', width: '55%', height: '45%',
            background: `radial-gradient(ellipse at 30% 30%,
              rgba(255,255,255,0.18) 0%,
              rgba(255,255,255,0.04) 50%,
              transparent 70%)`,
          }} />

          {/* Indicator dot */}
          <div className="absolute w-[3.5px] rounded-full pointer-events-none" style={{
            height: size * 0.22,
            top: size * 0.06,
            left: '50%',
            background: `linear-gradient(180deg, ${color}, ${color}80)`,
            boxShadow: `0 0 8px ${color}, 0 0 16px ${color}60`,
            transform: `translateX(-50%) rotate(${indicatorAngle + 135}deg)`,
            transformOrigin: `50% ${size * 0.44}px`,
            transition: dragging ? 'none' : 'transform 0.25s ease-out',
          }} />

          {/* Center cap */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full pointer-events-none" style={{
            width: size * 0.28, height: size * 0.28,
            background: `radial-gradient(circle at 38% 35%, hsl(220 8% 24%), hsl(220 10% 9%))`,
            boxShadow: `inset 0 1px 3px rgba(0,0,0,0.7), 0 1px 0 rgba(255,255,255,0.06)`,
            border: '1px solid rgba(0,0,0,0.4)',
          }} />
        </div>

        {/* Drag hint ring */}
        {dragging && (
          <div className="absolute inset-0 rounded-full pointer-events-none" style={{
            border: `2px solid ${color}40`,
            boxShadow: `0 0 16px ${color}30, inset 0 0 16px ${color}10`,
            borderRadius: '50%',
          }} />
        )}
      </motion.div>

      <span className="font-display text-[8px] uppercase tracking-[0.15em]" style={{ color: 'hsl(220 10% 35%)' }}>{label}</span>
      {value && (
        <span className="font-display text-[11px] font-bold" style={{ color, textShadow: `0 0 8px ${color}50` }}>
          {value}
        </span>
      )}
    </div>
  );
}

import { motion } from "framer-motion";

function Screw({ position }) {
  const posClass = {
    "top-left":     "top-3 left-3",
    "top-right":    "top-3 right-3",
    "bottom-left":  "bottom-3 left-3",
    "bottom-right": "bottom-3 right-3",
  }[position];

  return (
    <div className={`absolute ${posClass} w-[10px] h-[10px] rounded-full z-20`}
         style={{
           background: 'radial-gradient(circle at 35% 35%, hsl(220 8% 20%), hsl(220 8% 8%))',
           boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.7), 0 0.5px 0 rgba(255,255,255,0.06)',
         }}>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[5px] h-[1px] bg-white/20 rounded-full" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1px] h-[5px] bg-white/20 rounded-full" />
    </div>
  );
}

export default function HardwarePanel({ children, className = "", delay = 0, variant = "default" }) {
  const textureClass = variant === "carbon" ? "texture-carbon" : variant === "brushed" ? "texture-brushed" : "";

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className={`relative rounded-2xl overflow-hidden ${textureClass} ${className}`}
      style={{
        background: variant === "brushed"
          ? 'linear-gradient(180deg, hsl(220 9% 13%) 0%, hsl(220 10% 9%) 100%)'
          : 'linear-gradient(180deg, hsl(220 9% 11%) 0%, hsl(220 10% 7%) 100%)',
        boxShadow: `
          inset 0 1px 0 rgba(255,255,255,0.04),
          inset 0 -1px 0 rgba(0,0,0,0.3),
          0 6px 24px rgba(0,0,0,0.45),
          0 2px 4px rgba(0,0,0,0.3)
        `,
        border: '1px solid hsl(220 8% 16%)',
      }}
    >
      {variant === "carbon" && (
        <div className="absolute inset-0 opacity-[0.04] pointer-events-none rounded-2xl"
             style={{
               backgroundImage: `
                 repeating-linear-gradient(45deg, transparent, transparent 1px, rgba(255,255,255,0.1) 1px, rgba(255,255,255,0.1) 2px),
                 repeating-linear-gradient(-45deg, transparent, transparent 1px, rgba(255,255,255,0.05) 1px, rgba(255,255,255,0.05) 2px)
               `,
               backgroundSize: '4px 4px',
             }} />
      )}
      {variant === "brushed" && (
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none rounded-2xl"
             style={{
               backgroundImage: `repeating-linear-gradient(90deg, transparent, transparent 1px, rgba(255,255,255,0.4) 1px, rgba(255,255,255,0.4) 2px)`,
               backgroundSize: '3px 100%',
             }} />
      )}
      <div className="absolute inset-0 rounded-2xl pointer-events-none"
           style={{
             background: 'linear-gradient(180deg, rgba(255,255,255,0.03) 0%, transparent 3%, transparent 97%, rgba(0,0,0,0.15) 100%)',
           }} />
      <Screw position="top-left" />
      <Screw position="top-right" />
      <Screw position="bottom-left" />
      <Screw position="bottom-right" />
      <div className="relative z-10">{children}</div>
    </motion.div>
  );
}

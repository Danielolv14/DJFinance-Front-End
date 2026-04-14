import { motion } from "framer-motion";

export default function FaderChart({ data, currentMonth }) {
  const max = Math.max(...data.map(d => d.confirmado + d.pendente), 1);

  return (
    <div className="rounded-xl p-4"
         style={{
           background: 'hsl(240 12% 4%)',
           boxShadow: 'inset 3px 3px 10px rgba(0,0,0,0.5), inset -2px -2px 4px rgba(255,255,255,0.02)',
           border: '1px solid rgba(0,0,0,0.3)',
         }}>
      <div className="relative rounded-lg overflow-hidden">
        <div className="absolute inset-0 opacity-[0.02]"
             style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.15) 0%, transparent 40%)' }} />
        <div className="flex items-end justify-between gap-2 h-[140px] px-2">
          {data.map((d, i) => {
            const isCurrent = i === currentMonth - 1;
            const total = d.confirmado + d.pendente;
            const confH = max > 0 ? (d.confirmado / max) * 100 : 0;
            const pendH = max > 0 ? (d.pendente   / max) * 100 : 0;
            const isEmpty = total === 0;
            return (
              <div key={i} className="flex flex-col items-center gap-1 flex-1">
                <span className={`text-[10px] font-display font-bold ${isEmpty ? 'text-muted-foreground/30' : isCurrent ? 'text-primary' : 'text-foreground/50'}`}>
                  {isEmpty ? '—' : total}
                </span>
                <div className="w-full max-w-[28px] rounded-sm relative overflow-hidden"
                     style={{
                       height: '100px',
                       background: 'rgba(255,255,255,0.04)',
                       boxShadow: isCurrent
                         ? 'inset 0 2px 4px rgba(0,0,0,0.4), 0 0 0 1.5px hsl(217 90% 55%), 0 0 8px rgba(26,110,250,0.35)'
                         : 'inset 0 2px 4px rgba(0,0,0,0.4)',
                     }}>
                  {d.pendente > 0 && (
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${pendH}%` }}
                      transition={{ duration: 0.6, delay: i * 0.05 }}
                      className="absolute left-0 right-0 rounded-sm"
                      style={{
                        bottom: `${confH}%`,
                        background: `repeating-linear-gradient(-45deg, hsl(30 95% 55% / 0.6), hsl(30 95% 55% / 0.6) 2px, hsl(30 95% 55% / 0.3) 2px, hsl(30 95% 55% / 0.3) 4px)`,
                      }} />
                  )}
                  {d.confirmado > 0 && (
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${confH}%` }}
                      transition={{ duration: 0.6, delay: i * 0.05 }}
                      className="absolute bottom-0 left-0 right-0 rounded-sm"
                      style={{
                        background: 'linear-gradient(180deg, hsl(217 90% 60%), hsl(217 90% 45%))',
                        boxShadow: '0 0 6px hsl(217 90% 55% / 0.3), inset 0 1px 0 rgba(255,255,255,0.15)',
                      }} />
                  )}
                </div>
              </div>
            );
          })}
        </div>
        <div className="flex justify-between gap-2 mt-2 px-2">
          {data.map((d, i) => (
            <span key={i} className={`text-[9px] font-display text-center flex-1 uppercase tracking-wider ${i === currentMonth - 1 ? 'text-primary font-bold' : 'text-muted-foreground/40'}`}>
              {d.label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

import { motion } from "framer-motion";
import VuMeter from "./VuMeter";

function moeda(v) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0 }).format(v || 0);
}

export default function ProjecaoModule({ data }) {
  const maxVal = Math.max(...data.map(d => d.valor || d.cache || 0), 1);

  return (
    <div className="space-y-2.5">
      {data.map((p, i) => {
        const val   = p.valor || p.cache || 0;
        const label = p.mes || p.label || '';
        return (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.08 }}
            className="flex items-center gap-3 py-2 px-3 rounded-lg transition-colors hover:bg-secondary/30"
          >
            <span className="font-display text-xs w-10 font-bold text-foreground">{label}</span>
            <div className="flex-1">
              <VuMeter value={val} max={maxVal} segments={10} vertical={false} animate={true} />
            </div>
            <span className="font-display text-xs font-bold min-w-[80px] text-right text-led-green"
                  style={{ textShadow: '0 0 6px hsl(150 70% 45% / 0.2)' }}>
              {moeda(val)}
            </span>
            {p.shows != null && (
              <span className="text-[10px] text-muted-foreground font-display w-14 text-right">
                {p.shows} set{p.shows !== 1 ? 's' : ''}
              </span>
            )}
          </motion.div>
        );
      })}
    </div>
  );
}

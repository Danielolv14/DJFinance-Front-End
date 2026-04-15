import { useMemo, useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, DollarSign, Clock, Music, ChevronLeft, ChevronRight } from 'lucide-react';
import { getProjecao } from '../services/api';

import WaveformChart    from '../components/xdj/WaveformChart';
import PerformanceRadar from '../components/xdj/PerformanceRadar';

/* ───────────────── helpers ───────────────── */
const MESES_LABEL = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
const MESES_FULL  = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];

function moeda(v) {
  return new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL',minimumFractionDigits:0}).format(v||0);
}
function moedaK(v) {
  if (Math.abs(v) >= 1000) return `R$${(v/1000).toFixed(1)}k`;
  return `R$${Math.round(v)}`;
}
function pct(num, den) {
  return den > 0 ? Math.round((num / den) * 100) : 0;
}

/* ───────────────── business rules ───────────────── */
const INICIO_EQUIPE            = new Date('2025-03-01');
const INICIO_PERCENTUAL_DANIEL = new Date('2026-01-01');
const INICIO_PERCENTUAL_20     = new Date('2026-04-01');

function calcDaniel(show) {
  const d = new Date(show.data + 'T00:00:00');
  if (d < INICIO_EQUIPE) return 0;
  if (d < INICIO_PERCENTUAL_DANIEL) return 90;
  const p = d < INICIO_PERCENTUAL_20 ? 0.15 : 0.20;
  const base = (show.cache || 0) - (show.custos || 0);
  return (base > 0 ? base * p : 0) + 40;
}
function calcYuri(show) {
  return new Date(show.data + 'T00:00:00') < INICIO_EQUIPE ? 0 : 300;
}

/* ════════════════════════════════════════════════════════════
   VINYL CHART — spinning disc with SVG arc overlay
   ════════════════════════════════════════════════════════════ */
function VinylChart({ value, total, color, label, sublabel, size = 200 }) {
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
  const offset   = circ * (1 - ratio);
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

/* ════════════════════════════════════════════════════════════
   KPI CARD
   ════════════════════════════════════════════════════════════ */
function KpiCard({ icon, label, value, sub, color, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="rounded-2xl p-5 relative overflow-hidden"
      style={{
        background: 'linear-gradient(145deg, hsl(220 10% 10%), hsl(220 10% 7%))',
        border: '1px solid hsl(220 8% 14%)',
        boxShadow: `0 4px 20px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)`,
      }}
    >
      {/* Accent top strip */}
      <div className="absolute top-0 left-0 right-0 h-0.5 rounded-t-2xl" style={{ background: color, boxShadow: `0 0 8px ${color}` }} />

      <div className="flex items-start justify-between mb-3">
        <div className="rounded-lg p-2" style={{ background: `${color}18`, border: `1px solid ${color}30` }}>
          <div style={{ color, width: 16, height: 16 }}>{icon}</div>
        </div>
        {sub && (
          <span style={{
            fontFamily: "'JetBrains Mono',monospace",
            fontSize: 9, fontWeight: 600,
            color: 'hsl(220 10% 40%)',
            letterSpacing: '0.1em', textTransform: 'uppercase',
          }}>{sub}</span>
        )}
      </div>

      <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 22, fontWeight: 700, color: '#e8e9ee', lineHeight: 1 }}>
        {value}
      </div>
      <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: 'hsl(220 10% 40%)', marginTop: 6, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
        {label}
      </div>
    </motion.div>
  );
}

/* ════════════════════════════════════════════════════════════
   MONTH SELECTOR — XDJ hardware button row
   ════════════════════════════════════════════════════════════ */
function MonthSelector({ mesSel, onSelect, waveformData }) {
  const maxVal = Math.max(...waveformData.map(d => d.valor), 1);
  return (
    <div className="flex gap-1.5">
      {MESES_LABEL.map((m, i) => {
        const active = mesSel === i + 1;
        const hasData = waveformData[i]?.valor > 0;
        return (
          <motion.button
            key={m}
            whileTap={{ scale: 0.93, y: 1 }}
            onClick={() => onSelect(i + 1)}
            className="relative flex flex-col items-center gap-0.5 rounded"
            style={{
              padding: '6px 8px 4px',
              minWidth: 40,
              background: active
                ? 'linear-gradient(180deg, hsl(217 90% 55% / 0.25), hsl(217 90% 55% / 0.1))'
                : 'linear-gradient(180deg, hsl(220 9% 12%), hsl(220 8% 9%))',
              border: `1px solid ${active ? 'hsl(217 90% 55% / 0.5)' : 'hsl(220 8% 14%)'}`,
              boxShadow: active
                ? '0 0 12px hsl(217 90% 55% / 0.25), inset 0 1px 0 hsl(217 90% 55% / 0.2)'
                : 'inset 0 1px 0 rgba(255,255,255,0.04)',
              cursor: 'pointer',
            }}
          >
            {/* LED bar — volume of that month */}
            <div className="w-full rounded-sm overflow-hidden" style={{ height: 3, background: 'rgba(255,255,255,0.06)' }}>
              <div style={{
                height: '100%',
                width: `${(waveformData[i]?.valor / maxVal) * 100}%`,
                background: active ? 'hsl(217 90% 60%)' : hasData ? 'hsl(150 70% 45% / 0.5)' : 'transparent',
                borderRadius: 2,
                transition: 'width 0.5s ease',
              }} />
            </div>
            {/* Label */}
            <span style={{
              fontFamily: "'JetBrains Mono',monospace",
              fontSize: 9, fontWeight: active ? 700 : 500,
              letterSpacing: '0.08em', textTransform: 'uppercase',
              color: active ? 'hsl(217 90% 65%)' : hasData ? 'hsl(220 15% 55%)' : 'hsl(220 10% 25%)',
            }}>{m}</span>
          </motion.button>
        );
      })}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   SHOW ROW
   ════════════════════════════════════════════════════════════ */
function ShowRow({ show, rank, color }) {
  return (
    <div className="flex items-center gap-3 py-2.5 px-3 rounded-xl transition-colors hover:bg-white/[0.03]">
      <div className="w-1 rounded-full flex-shrink-0" style={{ height: 36, background: color, boxShadow: `0 0 6px ${color}60` }} />
      <div className="flex-1 min-w-0">
        <div style={{ fontFamily: "'Inter',sans-serif", fontSize: 13, fontWeight: 500, color: 'hsl(220 15% 72%)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {show.evento || 'Show'}
        </div>
        <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: 'hsl(220 10% 38%)', marginTop: 1 }}>
          {show.contratante} · {show.data}
        </div>
      </div>
      <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 13, fontWeight: 700, color, flexShrink: 0 }}>
        {moedaK(show.cache || 0)}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   SECTION TITLE
   ════════════════════════════════════════════════════════════ */
function SectionTitle({ title, right }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2">
        <div className="w-0.5 h-4 rounded-full" style={{ background: 'hsl(217 90% 55%)', boxShadow: '0 0 6px hsl(217 90% 55%)' }} />
        <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, fontWeight: 600, color: 'hsl(220 10% 45%)', letterSpacing: '0.2em', textTransform: 'uppercase' }}>{title}</span>
      </div>
      {right}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   CARD WRAPPER
   ════════════════════════════════════════════════════════════ */
function Card({ children, className = '', delay = 0, style = {} }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className={`rounded-2xl p-6 ${className}`}
      style={{
        background: 'linear-gradient(145deg, hsl(220 10% 10%), hsl(220 10% 7%))',
        border: '1px solid hsl(220 8% 14%)',
        boxShadow: '0 4px 24px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.04)',
        ...style,
      }}
    >
      {children}
    </motion.div>
  );
}

/* ════════════════════════════════════════════════════════════
   DISTRIBUIÇÃO ROW
   ════════════════════════════════════════════════════════════ */
function DistRow({ label, value, total, color }) {
  const p = total > 0 ? Math.min((value / total) * 100, 100) : 0;
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: color, boxShadow: `0 0 4px ${color}` }} />
          <span style={{ fontFamily: "'Inter',sans-serif", fontSize: 12, color: 'hsl(220 10% 50%)' }}>{label}</span>
        </div>
        <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 12, fontWeight: 700, color }}>{moeda(value)}</span>
      </div>
      <div className="rounded-full overflow-hidden" style={{ height: 4, background: 'hsl(220 8% 12%)' }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${p}%` }}
          transition={{ duration: 1, ease: 'easeOut' }}
          className="h-full rounded-full"
          style={{ background: color, boxShadow: `0 0 6px ${color}50` }}
        />
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   MAIN DASHBOARD
   ════════════════════════════════════════════════════════════ */
export default function DashboardPage({ shows }) {
  const hoje     = new Date();
  const anoAtual = hoje.getFullYear();
  const mesAtual = hoje.getMonth() + 1;

  const anos = useMemo(() => [...new Set(shows.map(s => s.ano).filter(Boolean))].sort((a,b) => b - a), [shows]);
  const [anoSel, setAnoSel] = useState(() => anoAtual);
  const [mesSel, setMesSel] = useState(() => mesAtual);

  const showsAno    = useMemo(() => shows.filter(s => s.ano === Number(anoSel)), [shows, anoSel]);
  const confirmados = useMemo(() => showsAno.filter(s => s.status === 'CONFIRMADO'), [showsAno]);
  const pendentes   = useMemo(() => showsAno.filter(s => s.status === 'PENDENTE'),   [showsAno]);

  /* KPIs anuais */
  const totalBruto   = confirmados.reduce((a,s) => a + (s.cache   || 0), 0);
  const totalCustos  = confirmados.reduce((a,s) => a + (s.custos  || 0), 0);
  const totalDaniel  = confirmados.reduce((a,s) => a + calcDaniel(s),    0);
  const totalYuri    = confirmados.reduce((a,s) => a + calcYuri(s),      0);
  const lucroLiquido = totalBruto - totalDaniel - totalYuri - totalCustos;
  const aReceber     = pendentes.reduce((a,s) => a + (s.cache || 0), 0);

  /* Dados mensais */
  const waveformData = useMemo(() => {
    const cm = Array(12).fill(0), lm = Array(12).fill(0);
    confirmados.forEach(s => {
      if (!s.mes) return;
      cm[s.mes - 1] += (s.cache || 0);
      lm[s.mes - 1] += Math.max((s.cache||0) - calcDaniel(s) - calcYuri(s) - (s.custos||0), 0);
    });
    return MESES_LABEL.map((label, i) => ({ label, valor: Math.round(cm[i]), lucro: Math.round(lm[i]) }));
  }, [confirmados]);

  /* Dados do mês selecionado */
  const showsMes = useMemo(() =>
    confirmados.filter(s => s.mes === mesSel), [confirmados, mesSel]);

  const mesBruto   = showsMes.reduce((a,s) => a + (s.cache  || 0), 0);
  const mesCustos  = showsMes.reduce((a,s) => a + (s.custos || 0), 0);
  const mesDaniel  = showsMes.reduce((a,s) => a + calcDaniel(s), 0);
  const mesYuri    = showsMes.reduce((a,s) => a + calcYuri(s), 0);
  const mesLucro   = mesBruto - mesDaniel - mesYuri - mesCustos;
  const mesShows   = showsMes.length;
  const mesMedia   = mesShows > 0 ? mesBruto / mesShows : 0;

  /* Radar */
  const radarData = useMemo(() => {
    const uc = new Set(confirmados.map(s => s.contratante).filter(Boolean)).size;
    const margem = totalBruto > 0 ? (lucroLiquido / totalBruto) * 100 : 0;
    const rc = Object.values(confirmados.reduce((m,s) => {
      if (s.contratante) m[s.contratante] = (m[s.contratante]||0)+1; return m;
    }, {})).filter(n => n >= 2).length;
    const recorrencia = uc > 0 ? Math.min((rc/uc)*100,100) : 0;
    return [
      { subject: 'Cache',       value: Math.round(Math.min(((totalBruto/confirmados.length||0)/2000)*100,100)), fullMark: 100 },
      { subject: 'Shows',       value: Math.round(Math.min((confirmados.length/40)*100,100)),                   fullMark: 100 },
      { subject: 'Margem',      value: Math.round(Math.min(margem,100)),                                        fullMark: 100 },
      { subject: 'Clientes',    value: Math.round(Math.min((uc/20)*100,100)),                                   fullMark: 100 },
      { subject: 'Recorrência', value: Math.round(recorrencia),                                                 fullMark: 100 },
    ];
  }, [confirmados, totalBruto, lucroLiquido]);

  /* Ranking */
  const topContratantes = useMemo(() => {
    const map = {};
    showsAno.forEach(s => {
      if (!s.contratante) return;
      if (!map[s.contratante]) map[s.contratante] = { shows: 0, cache: 0 };
      map[s.contratante].shows++;
      map[s.contratante].cache += (s.cache || 0);
    });
    return Object.entries(map).sort((a,b) => b[1].shows - a[1].shows).slice(0,5).map(([nome,v]) => ({ nome, ...v }));
  }, [showsAno]);

  const ultimosShows = useMemo(() =>
    [...confirmados].sort((a,b) => new Date(b.data) - new Date(a.data)).slice(0,5), [confirmados]);

  const rankColors = ['hsl(217 90% 58%)','hsl(30 95% 55%)','hsl(270 70% 62%)','hsl(45 95% 52%)','hsl(150 70% 45%)'];

  const prevMes = () => setMesSel(m => m > 1 ? m - 1 : 12);
  const nextMes = () => setMesSel(m => m < 12 ? m + 1 : 1);

  /* ─────────────────────────────────────────────────────── */
  return (
    <div className="min-h-screen" style={{ background: 'hsl(220 12% 4%)', padding: '28px 28px 48px' }}>

      {/* ══ HEADER ══ */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-8"
      >
        <div>
          <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, letterSpacing: '0.4em', color: 'hsl(220 10% 35%)', textTransform: 'uppercase', marginBottom: 2 }}>
            Pioneer DJ
          </div>
          <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 28, fontWeight: 700, color: 'hsl(220 15% 88%)', lineHeight: 1 }}>
            XDJ <span style={{ color: 'hsl(217 90% 62%)', textShadow: '0 0 20px hsl(217 90% 55% / 0.4)' }}>FINANCE</span>
          </div>
        </div>

        {/* Year selector */}
        <div className="flex items-center gap-2">
          {anos.map(a => (
            <motion.button
              key={a}
              whileTap={{ scale: 0.94 }}
              onClick={() => setAnoSel(a)}
              style={{
                fontFamily: "'JetBrains Mono',monospace",
                fontSize: 12, fontWeight: 700, padding: '6px 16px',
                borderRadius: 8, cursor: 'pointer', outline: 'none',
                background: anoSel === a ? 'hsl(217 90% 55%)' : 'hsl(220 9% 12%)',
                color: anoSel === a ? '#fff' : 'hsl(220 10% 38%)',
                border: `1px solid ${anoSel === a ? 'hsl(217 90% 55%)' : 'hsl(220 8% 16%)'}`,
                boxShadow: anoSel === a ? '0 0 16px hsl(217 90% 55% / 0.4)' : 'none',
              }}
            >{a}</motion.button>
          ))}
        </div>
      </motion.div>

      {/* ══ KPI CARDS ══ */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <KpiCard icon={<TrendingUp size={16}/>} label="Faturamento Bruto" value={moeda(totalBruto)}
          sub={`${confirmados.length} shows`} color="hsl(217 90% 55%)" delay={0} />
        <KpiCard icon={<DollarSign size={16}/>} label="Lucro Líquido" value={moeda(lucroLiquido)}
          sub={totalBruto > 0 ? `${pct(lucroLiquido, totalBruto)}% margem` : undefined} color="hsl(150 70% 45%)" delay={0.06} />
        <KpiCard icon={<Clock size={16}/>} label="A Receber" value={moeda(aReceber)}
          sub={`${pendentes.length} pendentes`} color="hsl(30 95% 55%)" delay={0.12} />
        <KpiCard icon={<Music size={16}/>} label="Média por Show" value={moedaK(totalBruto / Math.max(confirmados.length, 1))}
          sub="cache médio" color="hsl(270 70% 60%)" delay={0.18} />
      </div>

      {/* ══ MONTH SELECTOR ══ */}
      <Card delay={0.2} className="mb-6" style={{ padding: '16px 20px' }}>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 flex-shrink-0">
            <button onClick={prevMes} className="rounded-lg p-1.5 transition-colors hover:bg-white/5"
              style={{ color: 'hsl(220 10% 40%)', cursor: 'pointer', border: '1px solid hsl(220 8% 16%)' }}>
              <ChevronLeft size={14} />
            </button>
            <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 12, fontWeight: 700, color: 'hsl(217 90% 60%)', minWidth: 80, textAlign: 'center' }}>
              {MESES_FULL[mesSel - 1]}
            </div>
            <button onClick={nextMes} className="rounded-lg p-1.5 transition-colors hover:bg-white/5"
              style={{ color: 'hsl(220 10% 40%)', cursor: 'pointer', border: '1px solid hsl(220 8% 16%)' }}>
              <ChevronRight size={14} />
            </button>
          </div>
          <div className="w-px self-stretch" style={{ background: 'hsl(220 8% 16%)' }} />
          <div className="flex-1">
            <MonthSelector mesSel={mesSel} onSelect={setMesSel} waveformData={waveformData} />
          </div>
        </div>
      </Card>

      {/* ══ MAIN GRID ══ */}
      <div className="grid gap-5" style={{ gridTemplateColumns: '1fr 1.6fr 1fr' }}>

        {/* ─── LEFT: Review do Mês ─── */}
        <Card delay={0.25}>
          <SectionTitle title={`Review · ${MESES_LABEL[mesSel - 1]}`} />

          <div className="flex justify-center mb-4">
            <VinylChart
              value={mesLucro}
              total={mesBruto || 1}
              color="hsl(150 70% 45%)"
              label="Lucro do Mês"
              sublabel={`${mesShows} set${mesShows !== 1 ? 's' : ''} · ${MESES_FULL[mesSel - 1]}`}
              size={190}
            />
          </div>

          <div className="space-y-3 mt-2">
            <div className="flex items-center justify-between py-2.5" style={{ borderBottom: '1px solid hsl(220 8% 13%)' }}>
              <span style={{ fontFamily: "'Inter',sans-serif", fontSize: 12, color: 'hsl(220 10% 45%)' }}>Faturamento</span>
              <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 13, fontWeight: 700, color: 'hsl(217 90% 60%)' }}>{moeda(mesBruto)}</span>
            </div>
            <div className="flex items-center justify-between py-2.5" style={{ borderBottom: '1px solid hsl(220 8% 13%)' }}>
              <span style={{ fontFamily: "'Inter',sans-serif", fontSize: 12, color: 'hsl(220 10% 45%)' }}>Lucro Líquido</span>
              <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 13, fontWeight: 700, color: 'hsl(150 70% 45%)' }}>{moeda(mesLucro)}</span>
            </div>
            <div className="flex items-center justify-between py-2.5" style={{ borderBottom: '1px solid hsl(220 8% 13%)' }}>
              <span style={{ fontFamily: "'Inter',sans-serif", fontSize: 12, color: 'hsl(220 10% 45%)' }}>Shows</span>
              <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 13, fontWeight: 700, color: 'hsl(220 15% 70%)' }}>{mesShows}</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span style={{ fontFamily: "'Inter',sans-serif", fontSize: 12, color: 'hsl(220 10% 45%)' }}>Média/show</span>
              <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 13, fontWeight: 700, color: 'hsl(220 15% 70%)' }}>{moedaK(mesMedia)}</span>
            </div>
          </div>
        </Card>

        {/* ─── CENTER: Gráfico anual + Ranking ─── */}
        <div className="flex flex-col gap-5">
          {/* Waveform anual */}
          <Card delay={0.3}>
            <SectionTitle
              title="Faturamento Anual"
              right={<span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 13, fontWeight: 700, color: 'hsl(217 90% 60%)', textShadow: '0 0 8px hsl(217 90% 55%/0.4)' }}>{moeda(totalBruto)}</span>}
            />
            <WaveformChart data={waveformData} />
            <div className="flex gap-4 mt-3">
              {[['hsl(217 90% 55%)','Cache Total'],['hsl(30 95% 55%)','Lucro DJ']].map(([c,l]) => (
                <div key={l} className="flex items-center gap-1.5">
                  <div className="w-3 h-0.5 rounded-full" style={{ background: c }} />
                  <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: 'hsl(220 10% 38%)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{l}</span>
                </div>
              ))}
            </div>
          </Card>

          {/* Últimos Shows */}
          <Card delay={0.35} style={{ flex: 1 }}>
            <SectionTitle title="Últimos Shows" />
            <div className="space-y-0.5">
              {ultimosShows.length === 0 && (
                <p style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: 'hsl(220 10% 30%)' }}>Sem shows confirmados</p>
              )}
              {ultimosShows.map((s, i) => (
                <ShowRow key={i} show={s} rank={i} color={rankColors[i % rankColors.length]} />
              ))}
            </div>
          </Card>
        </div>

        {/* ─── RIGHT: Distribuição (disco) ─── */}
        <Card delay={0.25}>
          <SectionTitle title="Distribuição de Receita" />

          <div className="flex justify-center mb-4">
            <VinylChart
              value={totalDaniel + totalYuri + totalCustos}
              total={totalBruto || 1}
              color="hsl(30 95% 55%)"
              label="Custos Totais"
              sublabel={`${pct(totalDaniel + totalYuri + totalCustos, totalBruto)}% do bruto`}
              size={190}
            />
          </div>

          <div className="space-y-4">
            <DistRow label="Lucro DJ"          value={Math.max(lucroLiquido,0)} total={totalBruto} color="hsl(217 90% 55%)" />
            <DistRow label={`Daniel (${new Date() >= INICIO_PERCENTUAL_20 ? '20' : '15'}%)`} value={totalDaniel} total={totalBruto} color="hsl(30 95% 55%)" />
            <DistRow label="Yuri (R$300/set)"   value={totalYuri}   total={totalBruto} color="hsl(150 70% 45%)" />
            <DistRow label="Custos Op."          value={totalCustos} total={totalBruto} color="hsl(0 75% 55%)" />
          </div>
        </Card>
      </div>

      {/* ══ BOTTOM ROW ══ */}
      <div className="grid grid-cols-2 gap-5 mt-5">

        {/* Ranking Contratantes */}
        <Card delay={0.4}>
          <SectionTitle title="Ranking Contratantes"
            right={<span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: 'hsl(220 10% 35%)' }}>{anoSel}</span>}
          />
          <div className="space-y-1">
            {topContratantes.length === 0 && (
              <p style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: 'hsl(220 10% 30%)' }}>Sem dados</p>
            )}
            {topContratantes.map((c, i) => (
              <div key={i} className="flex items-center gap-3 py-2.5 px-3 rounded-xl hover:bg-white/[0.03] transition-colors">
                <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, fontWeight: 700, width: 16, color: rankColors[i], flexShrink: 0 }}>{i+1}</span>
                <div className="flex-1 min-w-0">
                  <div style={{ fontFamily: "'Inter',sans-serif", fontSize: 12, fontWeight: 500, color: 'hsl(220 15% 68%)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.nome}</div>
                  <div className="mt-1 rounded-full overflow-hidden" style={{ height: 3, background: 'hsl(220 8% 12%)' }}>
                    <div style={{
                      width: `${topContratantes[0]?.shows > 0 ? (c.shows/topContratantes[0].shows)*100 : 0}%`,
                      height: '100%', borderRadius: 2,
                      background: rankColors[i], boxShadow: `0 0 4px ${rankColors[i]}60`,
                      transition: 'width 0.8s ease',
                    }} />
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, fontWeight: 700, color: rankColors[i] }}>{moedaK(c.cache)}</div>
                  <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: 'hsl(220 10% 32%)' }}>{c.shows} sets</div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Performance Radar */}
        <Card delay={0.45}>
          <SectionTitle title="Performance · Radar" />
          <PerformanceRadar data={radarData} />
        </Card>
      </div>

    </div>
  );
}

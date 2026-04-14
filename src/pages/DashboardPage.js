import { useMemo, useState, useEffect } from 'react';
import {
  AreaChart, Area,
  BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from 'recharts';
import { getProjecao } from '../services/api';
import '../dashboard.css';

/* ── Constants ─────────────────────────────────────────────────────────── */
const MESES_LABEL = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
const MESES_FULL  = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];

/* ── Formatters ─────────────────────────────────────────────────────────── */
function moeda(v) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0);
}
function moedaCurta(v) {
  if (v >= 1000) return `R$${(v / 1000).toFixed(1)}k`;
  return `R$${Math.round(v)}`;
}
function pct(a, b) {
  if (!b) return null;
  return Math.round(((a - b) / b) * 100);
}

/* ══════════════════════════════════════════════════════════════════════════
   SUB-COMPONENTS
   ══════════════════════════════════════════════════════════════════════════ */

/* ── Allen Screw ── */
function Screw({ pos }) {
  return <div className={`sw-screw sw-screw-${pos}`} />;
}

/* ── Segmented VU Meter ── */
const VU_SEGS = 13;
function vuClass(segIdx, litCount) {
  if (segIdx >= litCount) return 'sw-vu-seg';
  if (segIdx <= 4)  return 'sw-vu-seg on-green';
  if (segIdx <= 6)  return 'sw-vu-seg on-yellow';
  if (segIdx <= 7)  return 'sw-vu-seg on-orange';
  return 'sw-vu-seg on-red';
}
function VuMeter({ value, max, color }) {
  const litCount = max > 0 ? Math.round((value / max) * VU_SEGS) : 0;
  return (
    <div className="sw-vu-col" style={{ width: 14, height: 120, padding: '2px 0' }}>
      {Array.from({ length: VU_SEGS }, (_, i) => {
        let cls = color ? 'sw-vu-seg' : vuClass(i, litCount);
        const lit = i < litCount;
        return (
          <div
            key={i}
            className={cls}
            style={color && lit ? {
              background: color,
              boxShadow: `0 0 5px ${color}99, 0 0 1px ${color}`,
            } : undefined}
          />
        );
      })}
    </div>
  );
}

/* ── Custom Tooltip (Recharts) ── */
function ChartTooltip({ active, payload, label, formatter }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="sw-tooltip">
      <div className="sw-tooltip-label">{label}</div>
      {payload.map((p, i) => (
        <div key={i} className="sw-tooltip-val" style={{ color: p.color || 'var(--sw-text1)' }}>
          {formatter ? formatter(p.value) : moeda(p.value)}
        </div>
      ))}
    </div>
  );
}

/* ── Waveform Area Chart (Faturamento Mensal) ── */
function WaveformChart({ dados }) {
  return (
    <div className="sw-lcd" style={{ padding: '14px 6px 4px' }}>
      <div className="sw-chart-wrapper" style={{ position: 'relative', zIndex: 2 }}>
        <ResponsiveContainer width="100%" height={160}>
          <AreaChart data={dados} margin={{ top: 5, right: 8, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="areaBlue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"   stopColor="#1A6EFA" stopOpacity=".25" />
                <stop offset="100%" stopColor="#1A6EFA" stopOpacity="0"   />
              </linearGradient>
              <linearGradient id="areaOrange" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"   stopColor="#FF9F0A" stopOpacity=".18" />
                <stop offset="100%" stopColor="#FF9F0A" stopOpacity="0"   />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="4 4"
              stroke="rgba(0,0,0,.07)"
              vertical={false}
            />
            <XAxis
              dataKey="label"
              tick={{ fill: '#A8AAB6', fontSize: 9, fontFamily: 'JetBrains Mono,monospace' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tickFormatter={moedaCurta}
              tick={{ fill: '#A8AAB6', fontSize: 9, fontFamily: 'JetBrains Mono,monospace' }}
              axisLine={false}
              tickLine={false}
              width={36}
            />
            <Tooltip content={<ChartTooltip />} />
            {/* Orange area (lucro) — behind */}
            <Area
              type="monotone"
              dataKey="lucro"
              stroke="#FF9F0A"
              strokeWidth={1.5}
              strokeOpacity={0.6}
              fill="url(#areaOrange)"
              dot={false}
              activeDot={{ r: 4, fill: '#FF9F0A', stroke: 'white', strokeWidth: 2 }}
            />
            {/* Blue area (cache) — main, in front */}
            <Area
              type="monotone"
              dataKey="valor"
              stroke="#1A6EFA"
              strokeWidth={2}
              fill="url(#areaBlue)"
              dot={{ r: 3, fill: 'white', stroke: '#1A6EFA', strokeWidth: 1.8 }}
              activeDot={{ r: 5, fill: '#1A6EFA', stroke: 'white', strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

/* ── Fader Bar Chart (Gigs por Mês) ── */
function FaderBarChart({ dados, mesAtual }) {
  const max = Math.max(...dados.map(d => d.confirmado + d.pendente), 1);
  return (
    <div className="sw-lcd" style={{ padding: '12px 10px 10px' }}>
      <div style={{ display: 'flex', gap: 8, height: 110, alignItems: 'flex-end' }}>
        {dados.map((d, i) => {
          const isAtual   = i === mesAtual - 1;
          const isVazio   = d.confirmado === 0 && d.pendente === 0;
          const hConf     = max > 0 ? (d.confirmado / max) * 90 : 0;
          const hPend     = max > 0 ? (d.pendente   / max) * 90 : 0;
          const total     = d.confirmado + d.pendente;
          return (
            <div
              key={i}
              style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}
              className={isAtual ? 'sw-fader-active' : ''}
            >
              {/* value label */}
              <div style={{
                fontFamily: "'JetBrains Mono',monospace",
                fontSize: 10,
                fontWeight: isAtual ? 800 : 700,
                color: isAtual ? 'var(--sw-blue)' : isVazio ? 'var(--sw-text3)' : 'var(--sw-text2)',
              }}>
                {isVazio ? '—' : total}
              </div>
              {/* track */}
              <div
                className="sw-fader-track"
                style={{
                  width: '100%', height: 90,
                  ...(isAtual ? {
                    boxShadow: 'inset 2px 2px 5px rgba(0,0,0,.14),inset -1px -1px 3px rgba(255,255,255,.5),0 0 0 1.5px var(--sw-blue),0 0 12px rgba(26,110,250,.25)',
                  } : {}),
                }}
              >
                {/* pending fill (striped) */}
                {d.pendente > 0 && (
                  <div className="sw-fader-fill sw-fader-fill-pending" style={{ height: `${hPend}%`, bottom: `${hConf}%` }} />
                )}
                {/* confirmed fill */}
                {d.confirmado > 0 && (
                  <div className="sw-fader-fill sw-fader-fill-solid" style={{ height: `${hConf}%` }} />
                )}
              </div>
              {/* month label */}
              <div style={{
                fontSize: 8,
                fontWeight: isAtual ? 700 : 600,
                letterSpacing: '.06em',
                textTransform: 'uppercase',
                color: isAtual ? 'var(--sw-blue)' : 'var(--sw-text3)',
              }}>
                {MESES_LABEL[i]}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── Stacked Composition Bar ── */
function StackedBar({ segments }) {
  const total = segments.reduce((a, s) => a + s.value, 0);
  return (
    <div>
      {/* Bar */}
      <div className="sw-inset" style={{ height: 32, display: 'flex', overflow: 'hidden', marginBottom: 8 }}>
        {segments.map((s, i) => {
          const w = total > 0 ? (s.value / total) * 100 : 0;
          return w > 0 ? (
            <div key={i} style={{
              width: `${w}%`,
              background: s.gradient,
              boxShadow: i === 0 ? 'inset 0 1px 0 rgba(255,255,255,.25)' : undefined,
              transition: 'width .6s ease',
            }} />
          ) : null;
        })}
      </div>
      {/* Scale */}
      <div style={{
        display: 'flex', justifyContent: 'space-between',
        fontSize: 9, color: 'var(--sw-text3)',
        fontFamily: "'JetBrains Mono',monospace",
        marginBottom: 14,
      }}>
        {['0%','25%','50%','75%','100%'].map(l => <span key={l}>{l}</span>)}
      </div>
    </div>
  );
}

/* ── Knob — potenciômetro 3D ── */
function Knob({ color, rotate = 0, label, value }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
      {/* Aro de base: cavidade embutida no painel onde o knob gira */}
      <div style={{
        width: 44, height: 44,
        borderRadius: '50%',
        background: 'var(--sw-inset)',
        border: '1px solid rgba(0,0,0,.20)',
        boxShadow: 'inset 2px 2px 5px rgba(0,0,0,.25), inset -1px -1px 3px rgba(255,255,255,.50)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {/* --knob-rotate faz o conic-gradient girar junto com o indicador */}
        <div
          className={`sw-knob sw-knob-${color}`}
          style={{ '--knob-rotate': `${rotate}deg` }}
        >
          <div
            className="sw-knob-indicator"
            style={{ transform: `translateX(-50%) rotate(${rotate}deg)`, transformOrigin: '50% 100%' }}
          />
        </div>
      </div>
      <div style={{ fontSize: 8, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--sw-text3)' }}>
        {label}
      </div>
      {value != null && (
        <div style={{ fontSize: 9, fontFamily: "'JetBrains Mono',monospace", fontWeight: 600, color: 'var(--sw-text2)' }}>
          {value}
        </div>
      )}
    </div>
  );
}

/* ── Delta badge ── */
function DeltaBadge({ delta }) {
  if (delta === null || delta === undefined) return null;
  const up = delta >= 0;
  return (
    <span className={`sw-badge ${up ? 'sw-badge-up' : 'sw-badge-down'}`}>
      {up ? '▲' : '▼'} {Math.abs(delta)}% vs anterior
    </span>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   MAIN DASHBOARD
   ══════════════════════════════════════════════════════════════════════════ */
export default function DashboardPage({ shows }) {
  const hoje     = new Date();
  const mesAtual = hoje.getMonth() + 1;
  const anoAtual = hoje.getFullYear();

  const anos = useMemo(
    () => [...new Set(shows.map(s => s.ano).filter(Boolean))].sort((a, b) => b - a),
    [shows]
  );
  const [anoSel, setAnoSel] = useState(() => anoAtual);
  const [projecao, setProjecao] = useState([]);

  useEffect(() => { getProjecao().then(setProjecao).catch(console.error); }, [shows]);

  /* ── Business rules ── */
  const INICIO_EQUIPE            = new Date('2025-03-01');
  const INICIO_PERCENTUAL_DANIEL = new Date('2026-01-01');
  const INICIO_PERCENTUAL_20     = new Date('2026-04-01');

  const showsAno    = useMemo(() => shows.filter(s => s.ano === Number(anoSel)), [shows, anoSel]);
  const confirmados = useMemo(() => showsAno.filter(s => s.status === 'CONFIRMADO'), [showsAno]);
  const pendentes   = useMemo(() => showsAno.filter(s => s.status === 'PENDENTE'),   [showsAno]);

  /* ── KPI calculations ── */
  const totalBruto = confirmados.reduce((a, s) => a + (s.cache || 0), 0);
  const totalCustos = confirmados.reduce((a, s) => a + (s.custos || 0), 0);

  const totalDaniel = confirmados.reduce((a, s) => {
    const d = new Date(s.data + 'T00:00:00');
    if (d < INICIO_EQUIPE)            return a;
    if (d < INICIO_PERCENTUAL_DANIEL) return a + 90;
    const p    = d < INICIO_PERCENTUAL_20 ? 0.15 : 0.20;
    const base = (s.cache || 0) - (s.custos || 0);
    return a + (base > 0 ? base * p : 0) + 40;
  }, 0);

  const totalYuri = confirmados.reduce((a, s) => {
    const d = new Date(s.data + 'T00:00:00');
    if (d < INICIO_EQUIPE) return a;
    return a + 300;
  }, 0);

  const lucroLiquido  = totalBruto - totalDaniel - totalYuri - totalCustos;
  const mediaCache    = confirmados.length ? totalBruto / confirmados.length : 0;
  const granaAReceber = pendentes.reduce((a, s) => a + (s.cache || 0), 0);

  /* ── Por mês ── */
  const cachePorMes = useMemo(() => {
    const map = Array(12).fill(0);
    confirmados.forEach(s => { if (s.mes) map[s.mes - 1] += (s.cache || 0); });
    return MESES_LABEL.map((label, i) => ({ label, valor: Math.round(map[i]) }));
  }, [confirmados]);

  const lucroPorMes = useMemo(() => {
    const map = Array(12).fill(0);
    confirmados.forEach(s => {
      if (!s.mes) return;
      const d = new Date(s.data + 'T00:00:00');
      const p = d < INICIO_PERCENTUAL_20 ? 0.15 : 0.20;
      const base = (s.cache || 0) - (s.custos || 0);
      const daniel = d < INICIO_EQUIPE ? 0 : d < INICIO_PERCENTUAL_DANIEL ? 90 : (base > 0 ? base * p : 0) + 40;
      const yuri = d < INICIO_EQUIPE ? 0 : 300;
      map[s.mes - 1] += (s.cache || 0) - daniel - yuri - (s.custos || 0);
    });
    return MESES_LABEL.map((label, i) => ({ label, lucro: Math.max(Math.round(map[i]), 0) }));
  }, [confirmados]);

  /* Merge cache + lucro por mês para o waveform */
  const waveformData = useMemo(() =>
    cachePorMes.map((d, i) => ({ ...d, lucro: lucroPorMes[i].lucro })),
    [cachePorMes, lucroPorMes]
  );

  /* ── Gigs por mês ── */
  const gigsPorMes = useMemo(() => {
    const conf = Array(12).fill(0);
    const pend = Array(12).fill(0);
    confirmados.forEach(s => { if (s.mes) conf[s.mes - 1]++; });
    pendentes.forEach(s =>   { if (s.mes) pend[s.mes - 1]++; });
    return MESES_LABEL.map((label, i) => ({
      label, confirmado: conf[i], pendente: pend[i],
    }));
  }, [confirmados, pendentes]);

  /* ── Variação mês atual ── */
  const cachesMesAtual    = cachePorMes[mesAtual - 1]?.valor || 0;
  const cachesMesAnterior = cachePorMes[mesAtual - 2]?.valor || 0;
  const deltaMes = pct(cachesMesAtual, cachesMesAnterior);

  /* ── Top contratantes ── */
  const topContratantes = useMemo(() => {
    const map = {};
    showsAno.forEach(s => {
      if (!s.contratante) return;
      if (!map[s.contratante]) map[s.contratante] = { shows: 0, cache: 0 };
      map[s.contratante].shows++;
      map[s.contratante].cache += (s.cache || 0);
    });
    return Object.entries(map).sort((a, b) => b[1].shows - a[1].shows).slice(0, 5);
  }, [showsAno]);

  /* ── Últimos shows ── */
  const ultimosShows = useMemo(() =>
    [...confirmados].sort((a, b) => new Date(b.data) - new Date(a.data)).slice(0, 5),
    [confirmados]
  );

  /* ── VU meter refs ── */
  const vuMaxBruto = Math.max(totalBruto, granaAReceber, 1000);

  /* ── Composition segments ── */
  const composicaoSegments = [
    { value: lucroLiquido > 0 ? lucroLiquido : 0, gradient: 'linear-gradient(90deg,#1A6EFA,#4D92FF)', label: 'DJ' },
    { value: totalDaniel,   gradient: 'linear-gradient(90deg,#FF9F0A,#FFBA45)', label: 'Daniel' },
    { value: totalYuri,     gradient: 'linear-gradient(90deg,#28CD41,#5AE07A)', label: 'Yuri' },
    { value: totalCustos,   gradient: 'linear-gradient(90deg,#FF3B2F,#FF6B61)', label: 'Custos' },
  ];

  /* ── Colors for ranking ── */
  const rankColors = ['var(--sw-blue)','var(--sw-orange)','var(--sw-purple)','var(--sw-yellow)','var(--sw-text2)'];

  /* ═══════════════════════════════════════════════════════════════════════
     RENDER
     ══════════════════════════════════════════════════════════════════════ */
  return (
    <div className="dj-dash">

      {/* ══ PANEL 1: FATURAMENTO KPIs ══ */}
      <div className="sw-panel" style={{ padding: '26px 28px 22px' }}>
        <Screw pos="tl" /><Screw pos="tr" /><Screw pos="bl" /><Screw pos="br" />

        {/* Panel header */}
        <div className="sw-panel-head">
          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            <span className="sw-engrave">MÓDULO</span>
            <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: '-.01em' }}>
              Faturamento · {MESES_FULL[mesAtual - 1]} {anoSel}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span className="sw-engrave">REV 3.0</span>
            {/* Year selector */}
            <div className="sw-seg-ctrl">
              {anos.map(a => (
                <button
                  key={a}
                  className={`sw-seg-btn${anoSel === a ? ' active' : ''}`}
                  onClick={() => setAnoSel(a)}
                >
                  {a}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 4 KPI Cards */}
        <div className="sw-kpi-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14 }}>

          {/* 1 · Faturamento Bruto */}
          <div className="sw-kpi-card">
            <div style={{
              position: 'absolute', top: 0, left: 0, right: 0, height: 3,
              background: 'var(--sw-blue)', borderRadius: '18px 18px 0 0',
              boxShadow: '0 0 8px rgba(26,110,250,.6)',
            }} />
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
              <div style={{ flex: 1 }}>
                <div className="sw-hw-icon">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                    <path d="M3 12V8M6 12V5M9 12V7M12 12V3"/>
                  </svg>
                </div>
                <div className="sw-val-lcd">
                  <div className="sw-kpi-val">{moeda(totalBruto)}</div>
                </div>
                <div className="sw-kpi-label">Faturamento Bruto</div>
                <DeltaBadge delta={deltaMes} />
              </div>
              <VuMeter value={totalBruto} max={vuMaxBruto} />
            </div>
          </div>

          {/* 2 · Lucro Líquido */}
          <div className="sw-kpi-card">
            <div style={{
              position: 'absolute', top: 0, left: 0, right: 0, height: 3,
              background: 'var(--sw-green)', borderRadius: '18px 18px 0 0',
              boxShadow: '0 0 8px rgba(40,205,65,.6)',
            }} />
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
              <div style={{ flex: 1 }}>
                <div className="sw-hw-icon">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                    <rect x="2" y="4" width="12" height="9" rx="1.5"/>
                    <path d="M8 7v3M6.5 8.5h3"/>
                  </svg>
                </div>
                <div className="sw-val-lcd">
                  <div className="sw-kpi-val" style={{ color: '#1A8C36' }}>{moeda(lucroLiquido)}</div>
                </div>
                <div className="sw-kpi-label">Lucro Líquido</div>
                {totalBruto > 0 && (
                  <span className="sw-badge sw-badge-up">
                    ▲ {Math.round((lucroLiquido / totalBruto) * 100)}% de margem
                  </span>
                )}
              </div>
              <VuMeter value={lucroLiquido > 0 ? lucroLiquido : 0} max={vuMaxBruto} />
            </div>
          </div>

          {/* 3 · A Receber */}
          <div className="sw-kpi-card">
            <div style={{
              position: 'absolute', top: 0, left: 0, right: 0, height: 3,
              background: 'var(--sw-orange)', borderRadius: '18px 18px 0 0',
              boxShadow: '0 0 8px rgba(255,98,0,.5)',
            }} />
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
              <div style={{ flex: 1 }}>
                <div className="sw-hw-icon">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                    <path d="M8 2v12M5 10l3 3 3-3M3 6h10"/>
                  </svg>
                </div>
                <div className="sw-val-lcd">
                  <div className="sw-kpi-val" style={{ color: 'var(--sw-orange)' }}>{moeda(granaAReceber)}</div>
                </div>
                <div className="sw-kpi-label">A Receber (Pendente)</div>
                {pendentes.length > 0 && (
                  <span className="sw-badge sw-badge-pend">● {pendentes.length} show{pendentes.length !== 1 ? 's' : ''} futuros</span>
                )}
              </div>
              <VuMeter value={granaAReceber} max={vuMaxBruto} color="var(--sw-orange)" />
            </div>
          </div>

          {/* 4 · Shows */}
          <div className="sw-kpi-card">
            <div style={{
              position: 'absolute', top: 0, left: 0, right: 0, height: 3,
              background: 'var(--sw-purple)', borderRadius: '18px 18px 0 0',
              boxShadow: '0 0 8px rgba(123,92,245,.5)',
            }} />
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
              <div style={{ flex: 1 }}>
                <div className="sw-hw-icon">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                    <circle cx="8" cy="8" r="6"/>
                    <circle cx="8" cy="8" r="2"/>
                    <path d="M8 2v1M8 13v1M2 8h1M13 8h1"/>
                  </svg>
                </div>
                <div className="sw-val-lcd">
                  <div className="sw-kpi-val" style={{ color: 'var(--sw-purple)' }}>
                    {confirmados.length}{' '}
                    <span style={{ fontSize: 15, fontWeight: 500, color: 'var(--sw-text2)' }}>sets</span>
                  </div>
                </div>
                <div className="sw-kpi-label">Shows Confirmados</div>
                {showsAno.length > confirmados.length && (
                  <span className="sw-badge sw-badge-flat">+ {showsAno.length - confirmados.length} pendentes</span>
                )}
              </div>
              <VuMeter value={confirmados.length} max={Math.max(showsAno.length, 1)} color="var(--sw-purple)" />
            </div>
          </div>
        </div>

        <div className="sw-divider" />

        {/* ── Distribution + Composition ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: 28 }}>

          {/* Distribuição de Receita */}
          <div>
            <div className="sw-section-label">Distribuição de Receita</div>

            {[
              { label: 'Lucro DJ',           valor: lucroLiquido > 0 ? lucroLiquido : 0, pctVal: totalBruto ? Math.round((lucroLiquido / totalBruto) * 100) : 0, cor: 'var(--sw-blue)' },
              { label: `Daniel (${new Date() >= INICIO_PERCENTUAL_20 ? '20' : '15'}% base líq.)`, valor: totalDaniel, pctVal: totalBruto ? Math.round((totalDaniel / totalBruto) * 100) : 0, cor: '#FF9F0A' },
              { label: 'Yuri (R$300/show)',  valor: totalYuri,    pctVal: totalBruto ? Math.round((totalYuri / totalBruto) * 100) : 0,    cor: 'var(--sw-green)' },
              { label: 'Custos Operacionais',valor: totalCustos,  pctVal: totalBruto ? Math.round((totalCustos / totalBruto) * 100) : 0,  cor: 'var(--sw-red)' },
            ].map((row, i) => (
              <div key={i} className="sw-fin-row">
                <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                  <div className="sw-fin-dot" style={{ background: row.cor, color: row.cor }} />
                  <span style={{ fontSize: 12, fontWeight: 500 }}>{row.label}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontSize: 10, color: 'var(--sw-text3)', fontFamily: "'JetBrains Mono',monospace" }}>
                    {row.pctVal}%
                  </span>
                  <span style={{ fontSize: 13, fontWeight: 700, fontFamily: "'JetBrains Mono',monospace" }}>
                    {moeda(row.valor)}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Composição do Cache */}
          <div>
            <div className="sw-section-label">Composição do Cache</div>
            <StackedBar segments={composicaoSegments} />

            {/* Knobs row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 14 }}>
              <Knob color="blue"   rotate={totalBruto ? Math.round((lucroLiquido / totalBruto) * 270) - 135 : 0}   label="DJ"     value={moedaCurta(lucroLiquido > 0 ? lucroLiquido : 0)} />
              <Knob color="orange" rotate={totalBruto ? Math.round((totalDaniel  / totalBruto) * 270) - 135 : 40}  label="Daniel" value={moedaCurta(totalDaniel)} />
              <Knob color="green"  rotate={totalBruto ? Math.round((totalYuri    / totalBruto) * 270) - 135 : -20} label="Yuri"   value={moedaCurta(totalYuri)} />
              <Knob color="red"    rotate={totalBruto ? Math.round((totalCustos  / totalBruto) * 270) - 135 : 60}  label="Custos" value={moedaCurta(totalCustos)} />
              <div style={{ flex: 1, height: 1, background: 'rgba(0,0,0,.06)', marginTop: -14 }} />
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
                <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 18, fontWeight: 700, letterSpacing: '-.02em', color: 'var(--sw-text1)' }}>
                  {moeda(totalBruto)}
                </div>
                <div style={{ fontSize: 9, color: 'var(--sw-text3)', letterSpacing: '.07em', textTransform: 'uppercase' }}>
                  Total Cache
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ══ PANEL 2: CHARTS ROW ══ */}
      <div className="sw-charts-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1.7fr', gap: 18 }}>

        {/* Gigs por Mês */}
        <div className="sw-panel" style={{ padding: '22px 22px 18px' }}>
          <Screw pos="tl" /><Screw pos="tr" />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: '-.01em' }}>Gigs por Mês</div>
              <div style={{ fontSize: 9, color: 'var(--sw-text3)', letterSpacing: '.08em', textTransform: 'uppercase', marginTop: 2 }}>
                · {anoSel} ·
              </div>
            </div>
            <span className="sw-engrave">SHOWS</span>
          </div>

          <FaderBarChart dados={gigsPorMes} mesAtual={mesAtual} />

          <div style={{ display: 'flex', gap: 14, marginTop: 12 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10, color: 'var(--sw-text2)' }}>
              <span style={{ width: 10, height: 10, borderRadius: 3, background: 'var(--sw-blue)', display: 'inline-block', boxShadow: '0 0 4px rgba(26,110,250,.6)' }} />
              Confirmado
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10, color: 'var(--sw-text2)' }}>
              <span style={{ width: 10, height: 10, borderRadius: 3, display: 'inline-block', background: 'repeating-linear-gradient(45deg,rgba(255,98,0,.5) 0,rgba(255,98,0,.5) 3px,rgba(255,98,0,.12) 3px,rgba(255,98,0,.12) 6px)' }} />
              Pendente
            </span>
          </div>
        </div>

        {/* Faturamento Mensal — Waveform */}
        <div className="sw-panel" style={{ padding: '22px 22px 18px' }}>
          <Screw pos="tl" /><Screw pos="tr" />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: '-.01em' }}>Faturamento Mensal</div>
              <div style={{ fontSize: 9, color: 'var(--sw-text3)', letterSpacing: '.08em', textTransform: 'uppercase', marginTop: 2 }}>
                · Histórico {anoSel} ·
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span className="sw-engrave">LCD</span>
              <div>
                <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 16, fontWeight: 800, color: 'var(--sw-blue)', letterSpacing: '-.01em' }}>
                  {moeda(totalBruto)}
                </div>
                <div style={{ fontSize: 8, color: 'var(--sw-text3)', letterSpacing: '.07em', textAlign: 'right' }}>TOTAL ANO</div>
              </div>
            </div>
          </div>

          <WaveformChart dados={waveformData} />

          {/* Legend */}
          <div style={{ display: 'flex', gap: 16, marginTop: 10 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10, color: 'var(--sw-text2)' }}>
              <span style={{ width: 16, height: 2, borderRadius: 2, background: 'var(--sw-blue)', display: 'inline-block' }} /> Cache Bruto
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10, color: 'var(--sw-text2)' }}>
              <span style={{ width: 16, height: 2, borderRadius: 2, background: '#FF9F0A', display: 'inline-block', opacity: .7 }} /> Lucro Líquido
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10, color: 'var(--sw-text2)' }}>
              Média: <span style={{ fontFamily: "'JetBrains Mono',monospace", fontWeight: 700, marginLeft: 2 }}>{moeda(mediaCache)}</span>
            </span>
          </div>
        </div>
      </div>

      {/* ══ PANEL 3: RANKING + TIMELINE ══ */}
      <div className="sw-bottom-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>

        {/* Ranking de Contratantes */}
        <div className="sw-panel" style={{ padding: '22px 24px' }}>
          <Screw pos="tl" /><Screw pos="tr" />
          <div className="sw-panel-head">
            <span style={{ fontSize: 13, fontWeight: 700 }}>🏆 Ranking de Contratantes</span>
            <span className="sw-engrave">TOP {topContratantes.length}</span>
          </div>
          {topContratantes.length === 0 && <p className="sw-empty">Nenhum dado ainda</p>}
          {topContratantes.map(([nome, d], i) => {
            const maxShows = topContratantes[0]?.[1]?.shows || 1;
            const barra = Math.round((d.shows / maxShows) * 100);
            return (
              <div key={i} className="sw-rank-item">
                <span className="sw-rank-pos" style={{ color: rankColors[i] }}>#{i + 1}</span>
                <div className="sw-rank-info">
                  <div className="sw-rank-nome">{nome}</div>
                  <div className="sw-rank-bar-track">
                    <div className="sw-rank-bar-fill" style={{ width: `${barra}%`, background: rankColors[i] }} />
                  </div>
                </div>
                <div className="sw-rank-nums">
                  <span className="sw-rank-shows">{d.shows} set{d.shows !== 1 ? 's' : ''}</span>
                  <span className="sw-rank-cache">{moeda(d.cache)}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Últimos Sets */}
        <div className="sw-panel" style={{ padding: '22px 24px' }}>
          <Screw pos="tl" /><Screw pos="tr" />
          <div className="sw-panel-head">
            <span style={{ fontSize: 13, fontWeight: 700 }}>⏱ Últimos Sets</span>
            <span className="sw-engrave">RECENTES</span>
          </div>
          {ultimosShows.length === 0 && <p className="sw-empty">Nenhum show confirmado ainda</p>}
          {ultimosShows.map((s) => (
            <div key={s.id} className="sw-timeline-item">
              <div className="sw-timeline-dot" />
              <div className="sw-timeline-body">
                <div className="sw-timeline-evento">{s.evento || '—'}</div>
                <div className="sw-timeline-meta">
                  <span>{new Date(s.data + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}</span>
                  {s.contratante && <span>· {s.contratante}</span>}
                </div>
              </div>
              <div className="sw-timeline-cache">
                {s.cache ? moeda(s.cache) : <span style={{ opacity: 0.3 }}>—</span>}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ══ PANEL 4: PROJEÇÃO ══ */}
      {projecao.length > 0 && (
        <div className="sw-panel" style={{ padding: '22px 24px' }}>
          <Screw pos="tl" /><Screw pos="tr" />
          <div className="sw-panel-head">
            <span style={{ fontSize: 13, fontWeight: 700 }}>🔮 Projeção de Faturamento</span>
            <span className="sw-engrave">FORECAST</span>
          </div>
          <div className="sw-projecao-grid">
            {projecao.map((p, i) => (
              <div key={i} className={`sw-proj-item ${p.passado ? 'sw-proj-passado' : 'sw-proj-futuro'}`}>
                <div className="sw-proj-mes">{p.nomeMes}</div>
                <div className="sw-proj-valor">{moeda(p.totalAgendado)}</div>
                <div className="sw-proj-shows">{p.quantidadeShows} set{p.quantidadeShows !== 1 ? 's' : ''}</div>
                {!p.passado && p.totalAgendado > 0 && (
                  <div className="sw-proj-badge">Agendado</div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}

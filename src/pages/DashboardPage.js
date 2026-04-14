import { useMemo, useState, useEffect } from 'react';
import { TrendingUp, DollarSign, Clock, Disc3 } from 'lucide-react';
import { getProjecao } from '../services/api';

import HardwarePanel  from '../components/xdj/HardwarePanel';
import LcdDisplay     from '../components/xdj/LcdDisplay';
import VuMeter        from '../components/xdj/VuMeter';
import Knob           from '../components/xdj/Knob';
import WaveformChart  from '../components/xdj/WaveformChart';
import FaderChart     from '../components/xdj/FaderChart';
import DonutChart     from '../components/xdj/DonutChart';
import StackedBar     from '../components/xdj/StackedBar';
import PerformanceRadar from '../components/xdj/PerformanceRadar';
import ProjecaoModule from '../components/xdj/ProjecaoModule';

/* ── Formatters ── */
const MESES_LABEL = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
const MESES_FULL  = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];

function moeda(v) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0 }).format(v || 0);
}
function moedaCurta(v) {
  if (v >= 1000) return `R$${(v / 1000).toFixed(1)}k`;
  return `R$${Math.round(v)}`;
}

/* ── Business rule dates ── */
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
  const d = new Date(show.data + 'T00:00:00');
  return d < INICIO_EQUIPE ? 0 : 300;
}

/* ══════════════════════════════════════════════════════════════════════════
   SECTION HEADER
   ══════════════════════════════════════════════════════════════════════════ */
function SectionHeader({ title, right }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h2 className="text-[11px] font-display font-bold uppercase tracking-[0.2em] text-muted-foreground">
        {title}
      </h2>
      {right}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   YEAR SELECTOR
   ══════════════════════════════════════════════════════════════════════════ */
function YearSelector({ anos, anoSel, onSelect }) {
  return (
    <div className="flex items-center gap-1 p-0.5 rounded-lg"
         style={{ background: 'hsl(220 10% 5%)', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.4)' }}>
      {anos.map(a => (
        <button
          key={a}
          onClick={() => onSelect(a)}
          className="px-3 py-1 rounded-md text-[11px] font-display font-bold transition-all"
          style={anoSel === a ? {
            background: 'hsl(217 90% 55%)',
            color: '#fff',
            boxShadow: '0 0 10px hsl(217 90% 55% / 0.4)',
          } : {
            color: 'hsl(220 10% 45%)',
          }}
        >
          {a}
        </button>
      ))}
    </div>
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

  /* ── Filtered sets ── */
  const showsAno    = useMemo(() => shows.filter(s => s.ano === Number(anoSel)), [shows, anoSel]);
  const confirmados = useMemo(() => showsAno.filter(s => s.status === 'CONFIRMADO'), [showsAno]);
  const pendentes   = useMemo(() => showsAno.filter(s => s.status === 'PENDENTE'),   [showsAno]);

  /* ── KPI calculations ── */
  const totalBruto   = confirmados.reduce((a, s) => a + (s.cache || 0), 0);
  const totalCustos  = confirmados.reduce((a, s) => a + (s.custos || 0), 0);
  const totalDaniel  = confirmados.reduce((a, s) => a + calcDaniel(s), 0);
  const totalYuri    = confirmados.reduce((a, s) => a + calcYuri(s), 0);
  const lucroLiquido = totalBruto - totalDaniel - totalYuri - totalCustos;
  const aReceber     = pendentes.reduce((a, s) => a + (s.cache || 0), 0);
  const mediaCache   = confirmados.length ? totalBruto / confirmados.length : 0;

  /* ── Monthly data ── */
  const waveformData = useMemo(() => {
    const cacheMap  = Array(12).fill(0);
    const lucroMap  = Array(12).fill(0);
    confirmados.forEach(s => {
      if (!s.mes) return;
      cacheMap[s.mes - 1] += (s.cache || 0);
      const daniel = calcDaniel(s);
      const yuri   = calcYuri(s);
      lucroMap[s.mes - 1] += Math.max((s.cache || 0) - daniel - yuri - (s.custos || 0), 0);
    });
    return MESES_LABEL.map((label, i) => ({
      label,
      valor: Math.round(cacheMap[i]),
      lucro: Math.round(lucroMap[i]),
    }));
  }, [confirmados]);

  const gigsPorMes = useMemo(() => {
    const conf = Array(12).fill(0);
    const pend = Array(12).fill(0);
    confirmados.forEach(s => { if (s.mes) conf[s.mes - 1]++; });
    pendentes.forEach(s =>   { if (s.mes) pend[s.mes - 1]++; });
    return MESES_LABEL.map((label, i) => ({ label, confirmado: conf[i], pendente: pend[i] }));
  }, [confirmados, pendentes]);

  /* ── Top contratantes ── */
  const topContratantes = useMemo(() => {
    const map = {};
    showsAno.forEach(s => {
      if (!s.contratante) return;
      if (!map[s.contratante]) map[s.contratante] = { shows: 0, cache: 0 };
      map[s.contratante].shows++;
      map[s.contratante].cache += (s.cache || 0);
    });
    return Object.entries(map).sort((a, b) => b[1].shows - a[1].shows).slice(0, 5)
      .map(([nome, v]) => ({ nome, ...v }));
  }, [showsAno]);

  /* ── Últimos shows ── */
  const ultimosShows = useMemo(() =>
    [...confirmados].sort((a, b) => new Date(b.data) - new Date(a.data)).slice(0, 5),
    [confirmados]
  );

  /* ── Radar metrics ── */
  const radarData = useMemo(() => {
    const uniqueClients = new Set(confirmados.map(s => s.contratante).filter(Boolean)).size;
    const maxExpected   = 20;
    const margem        = totalBruto > 0 ? (lucroLiquido / totalBruto) * 100 : 0;
    const showsScore    = Math.min((confirmados.length / 40) * 100, 100);
    const cacheScore    = Math.min((mediaCache / 2000) * 100, 100);
    const clienteScore  = Math.min((uniqueClients / maxExpected) * 100, 100);
    // Recorrência: contratantes com 2+ shows
    const recount = Object.values(
      confirmados.reduce((m, s) => {
        if (s.contratante) m[s.contratante] = (m[s.contratante] || 0) + 1;
        return m;
      }, {})
    ).filter(n => n >= 2).length;
    const recorrencia = uniqueClients > 0 ? Math.min((recount / uniqueClients) * 100, 100) : 0;
    const cachesMesAtual    = waveformData[mesAtual - 1]?.valor || 0;
    const cachesMesAnterior = waveformData[mesAtual - 2]?.valor || 0;
    const crescimento = cachesMesAnterior > 0
      ? Math.min(Math.max(((cachesMesAtual - cachesMesAnterior) / cachesMesAnterior) * 100 + 50, 0), 100)
      : 50;
    return [
      { subject: 'Cache',        value: Math.round(cacheScore),     fullMark: 100 },
      { subject: 'Shows',        value: Math.round(showsScore),     fullMark: 100 },
      { subject: 'Margem',       value: Math.round(Math.min(margem, 100)), fullMark: 100 },
      { subject: 'Clientes',     value: Math.round(clienteScore),   fullMark: 100 },
      { subject: 'Recorrência',  value: Math.round(recorrencia),    fullMark: 100 },
      { subject: 'Crescimento',  value: Math.round(crescimento),    fullMark: 100 },
    ];
  }, [confirmados, totalBruto, lucroLiquido, mediaCache, waveformData, mesAtual]);

  /* ── Composition data ── */
  const donutData = [
    { label: 'DJ',     value: Math.max(lucroLiquido, 0), color: 'hsl(217 90% 55%)' },
    { label: 'Daniel', value: totalDaniel,               color: 'hsl(30 95% 55%)' },
    { label: 'Yuri',   value: totalYuri,                 color: 'hsl(150 70% 45%)' },
    { label: 'Custos', value: totalCustos,               color: 'hsl(0 75% 55%)' },
  ];

  const stackedSegments = [
    { value: Math.max(lucroLiquido, 0), color: 'linear-gradient(90deg,hsl(217 90% 55%),hsl(217 80% 65%))', glowColor: 'hsl(217 90% 55% / 0.3)', label: 'DJ' },
    { value: totalDaniel,               color: 'linear-gradient(90deg,hsl(30 95% 55%),hsl(30 90% 65%))',   glowColor: 'hsl(30 95% 55% / 0.3)',  label: 'Daniel' },
    { value: totalYuri,                 color: 'linear-gradient(90deg,hsl(150 70% 45%),hsl(150 60% 55%))', glowColor: 'hsl(150 70% 45% / 0.3)', label: 'Yuri' },
    { value: totalCustos,               color: 'linear-gradient(90deg,hsl(0 75% 55%),hsl(0 65% 60%))',     glowColor: 'hsl(0 75% 55% / 0.3)',   label: 'Custos' },
  ];

  const knobPct = (v) => totalBruto > 0 ? Math.round((v / totalBruto) * 100) : 0;

  const rankColors = [
    'hsl(217 90% 55%)', 'hsl(30 95% 55%)', 'hsl(270 70% 60%)', 'hsl(45 95% 50%)', 'hsl(220 10% 50%)',
  ];

  /* ─── RENDER ─── */
  return (
    <div className="min-h-screen p-6 space-y-4"
         style={{ background: 'hsl(220 12% 5%)' }}>

      {/* ══ HEADER ══ */}
      <div className="flex items-center justify-between mb-2">
        <div>
          <h1 className="font-display text-xl font-bold text-foreground tracking-tight">
            Faturamento · {MESES_FULL[mesAtual - 1]} {anoSel}
          </h1>
          <p className="text-[11px] text-muted-foreground mt-0.5 font-display uppercase tracking-widest">
            {confirmados.length} sets confirmados · Média {moedaCurta(mediaCache)}/set
          </p>
        </div>
        {anos.length > 0 && (
          <YearSelector anos={anos} anoSel={anoSel} onSelect={setAnoSel} />
        )}
      </div>

      {/* ══ ROW 1: 4 KPI CARDS ══ */}
      <div className="grid grid-cols-4 gap-4">
        <LcdDisplay
          delay={0}
          icon={<TrendingUp size={16} />}
          value={moeda(totalBruto)}
          label="Faturamento Bruto"
          sublabel={totalBruto > 0 ? `▲ ${confirmados.length} shows` : undefined}
          ledColor="blue"
          vuValue={totalBruto}
          vuMax={Math.max(totalBruto, aReceber, 1000)}
        />
        <LcdDisplay
          delay={0.1}
          icon={<DollarSign size={16} />}
          value={moeda(lucroLiquido)}
          label="Lucro Líquido"
          sublabel={totalBruto > 0 ? `${Math.round((lucroLiquido / totalBruto) * 100)}% de margem` : undefined}
          ledColor="green"
          vuValue={Math.max(lucroLiquido, 0)}
          vuMax={Math.max(totalBruto, aReceber, 1000)}
        />
        <LcdDisplay
          delay={0.2}
          icon={<Clock size={16} />}
          value={moeda(aReceber)}
          label="A Receber (Pendente)"
          sublabel={pendentes.length > 0 ? `${pendentes.length} shows futuros` : undefined}
          ledColor="orange"
          vuValue={aReceber}
          vuMax={Math.max(totalBruto, aReceber, 1000)}
        />
        <LcdDisplay
          delay={0.3}
          icon={<Disc3 size={16} />}
          value={`${confirmados.length} sets`}
          label="Shows Confirmados"
          sublabel={pendentes.length > 0 ? `+${pendentes.length} pendentes` : undefined}
          ledColor="purple"
          vuValue={confirmados.length}
          vuMax={Math.max(showsAno.length, 1)}
        />
      </div>

      {/* ══ ROW 2: DISTRIBUIÇÃO + DONUT + RADAR ══ */}
      <div className="grid grid-cols-3 gap-4">

        {/* Distribuição de receita */}
        <HardwarePanel delay={0.1} variant="carbon">
          <div className="p-5">
            <SectionHeader title="Distribuição de Receita" />

            {[
              { label: 'Lucro DJ',                value: Math.max(lucroLiquido, 0), color: 'hsl(217 90% 55%)' },
              { label: `Daniel (${new Date() >= INICIO_PERCENTUAL_20 ? '20' : '15'}% base líq.)`, value: totalDaniel, color: 'hsl(30 95% 55%)' },
              { label: 'Yuri (R$300/show)',        value: totalYuri,    color: 'hsl(150 70% 45%)' },
              { label: 'Custos Operacionais',      value: totalCustos,  color: 'hsl(0 75% 55%)' },
            ].map((row, i) => (
              <div key={i} className="flex items-center justify-between py-2.5 border-b border-border/40 last:border-0">
                <div className="flex items-center gap-2.5">
                  <div className="w-2 h-2 rounded-full flex-shrink-0"
                       style={{ background: row.color, boxShadow: `0 0 5px ${row.color}` }} />
                  <span className="text-[12px] text-muted-foreground">{row.label}</span>
                </div>
                <span className="font-display text-[13px] font-bold text-foreground">
                  {moeda(row.value)}
                </span>
              </div>
            ))}

            <div className="mt-4">
              <StackedBar segments={stackedSegments} />
            </div>

            <div className="flex gap-3 mt-3">
              {stackedSegments.map((s, i) => (
                <div key={i} className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full" style={{ background: s.color }} />
                  <span className="text-[9px] text-muted-foreground font-display uppercase tracking-wider">{s.label}</span>
                </div>
              ))}
            </div>
          </div>
        </HardwarePanel>

        {/* Composição do Lucro */}
        <HardwarePanel delay={0.2} variant="default">
          <div className="p-5">
            <SectionHeader title="Composição do Cache" />
            <div className="flex items-center justify-center gap-6">
              <DonutChart
                data={donutData}
                centerLabel="Total"
                centerValue={moedaCurta(totalBruto)}
              />
              <div className="space-y-2.5">
                {donutData.map((d, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                         style={{ background: d.color, boxShadow: `0 0 4px ${d.color}` }} />
                    <div>
                      <div className="text-[10px] text-muted-foreground font-display uppercase tracking-wider">{d.label}</div>
                      <div className="font-display text-[12px] font-bold" style={{ color: d.color }}>
                        {moeda(d.value)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </HardwarePanel>

        {/* Radar de desempenho */}
        <HardwarePanel delay={0.3} variant="brushed">
          <div className="p-5">
            <SectionHeader title="Desempenho · Radar" />
            <PerformanceRadar data={radarData} />
          </div>
        </HardwarePanel>
      </div>

      {/* ══ ROW 3: CHANNEL STRIP (KNOBS) ══ */}
      <HardwarePanel delay={0.2} variant="carbon" className="w-full">
        <div className="p-6">
          <SectionHeader title="Channel Strip · Distribuição" />
          <div className="flex items-center justify-around gap-4">
            {[
              { color: 'hsl(217 90% 55%)', label: 'DJ',     value: Math.max(lucroLiquido, 0) },
              { color: 'hsl(30 95% 55%)',  label: 'Daniel', value: totalDaniel },
              { color: 'hsl(150 70% 45%)', label: 'Yuri',   value: totalYuri },
              { color: 'hsl(0 75% 55%)',   label: 'Custos', value: totalCustos },
            ].map((ch, i) => (
              <div key={i} className="flex flex-col items-center gap-3">
                <Knob
                  color={ch.color}
                  label={ch.label}
                  value={moedaCurta(ch.value)}
                  size={52}
                  rotation={knobPct(ch.value)}
                  animate={true}
                />
                {/* Fader track */}
                <div className="flex flex-col items-center gap-1 w-10">
                  <VuMeter
                    value={ch.value}
                    max={Math.max(totalBruto, 1)}
                    segments={13}
                    vertical={true}
                    animate={true}
                  />
                  <span className="text-[8px] font-display uppercase tracking-wider text-muted-foreground">
                    {knobPct(ch.value)}%
                  </span>
                </div>
              </div>
            ))}

            {/* Master output */}
            <div className="flex flex-col items-center gap-3 pl-8 border-l border-border/30">
              <div className="text-[10px] font-display uppercase tracking-wider text-muted-foreground mb-1">Master</div>
              <div className="flex gap-2">
                <VuMeter value={totalBruto} max={Math.max(totalBruto, 1000)} segments={13} animate={true} />
                <VuMeter value={totalBruto} max={Math.max(totalBruto, 1000)} segments={13} animate={true} />
              </div>
              <div className="font-display text-[16px] font-bold text-foreground"
                   style={{ textShadow: '0 0 8px hsl(217 90% 55% / 0.4)' }}>
                {moeda(totalBruto)}
              </div>
            </div>
          </div>
        </div>
      </HardwarePanel>

      {/* ══ ROW 4: CHARTS ══ */}
      <div className="grid grid-cols-2 gap-4">
        <HardwarePanel delay={0.25} variant="default">
          <div className="p-5">
            <SectionHeader
              title="Gigs por Mês"
              right={
                <div className="flex gap-3 text-[10px] font-display text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-sm inline-block" style={{ background: 'hsl(217 90% 55%)' }} /> Confirmado
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-sm inline-block opacity-60"
                          style={{ background: 'hsl(30 95% 55%)' }} /> Pendente
                  </span>
                </div>
              }
            />
            <FaderChart data={gigsPorMes} currentMonth={mesAtual} />
          </div>
        </HardwarePanel>

        <HardwarePanel delay={0.3} variant="default">
          <div className="p-5">
            <SectionHeader
              title="Faturamento Mensal"
              right={
                <div className="font-display text-[13px] font-bold"
                     style={{ color: 'hsl(217 90% 55%)', textShadow: '0 0 8px hsl(217 90% 55% / 0.4)' }}>
                  {moeda(totalBruto)}
                </div>
              }
            />
            <WaveformChart data={waveformData} />
            <div className="flex gap-4 mt-3 text-[10px] font-display text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-0.5 inline-block" style={{ background: 'hsl(217 90% 55%)' }} /> Cache Total
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-0.5 inline-block" style={{ background: 'hsl(30 95% 55%)' }} /> Lucro DJ
              </span>
            </div>
          </div>
        </HardwarePanel>
      </div>

      {/* ══ ROW 5: RANKING + PROJEÇÃO + ÚLTIMOS SETS ══ */}
      <div className="grid grid-cols-3 gap-4">

        {/* Ranking contratantes */}
        <HardwarePanel delay={0.3} variant="carbon">
          <div className="p-5">
            <SectionHeader
              title="Ranking Contratantes"
              right={<span className="text-[10px] font-display text-muted-foreground">{anoSel}</span>}
            />
            <div className="space-y-2">
              {topContratantes.length === 0 && (
                <p className="text-[12px] text-muted-foreground font-display">Sem dados</p>
              )}
              {topContratantes.map((c, i) => (
                <div key={i} className="flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-secondary/30 transition-colors">
                  <span className="font-display text-[11px] font-bold w-4 flex-shrink-0"
                        style={{ color: rankColors[i] }}>
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="text-[12px] font-medium text-foreground truncate">{c.nome}</div>
                    <div className="w-full mt-1 h-1 rounded-full overflow-hidden"
                         style={{ background: 'hsl(220 8% 12%)' }}>
                      <div className="h-full rounded-full transition-all duration-700"
                           style={{
                             width: `${topContratantes[0].shows > 0 ? (c.shows / topContratantes[0].shows) * 100 : 0}%`,
                             background: rankColors[i],
                             boxShadow: `0 0 6px ${rankColors[i]}60`,
                           }} />
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="font-display text-[12px] font-bold text-foreground">{moedaCurta(c.cache)}</div>
                    <div className="text-[10px] text-muted-foreground">{c.shows} sets</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </HardwarePanel>

        {/* Projeção */}
        <HardwarePanel delay={0.35} variant="default">
          <div className="p-5">
            <SectionHeader title="Projeção" />
            {projecao.length > 0 ? (
              <ProjecaoModule data={projecao} />
            ) : (
              <p className="text-[12px] text-muted-foreground font-display">Sem projeção disponível</p>
            )}
          </div>
        </HardwarePanel>

        {/* Últimos sets */}
        <HardwarePanel delay={0.4} variant="brushed">
          <div className="p-5">
            <SectionHeader title="Últimos Sets" />
            <div className="space-y-2">
              {ultimosShows.length === 0 && (
                <p className="text-[12px] text-muted-foreground font-display">Sem shows confirmados</p>
              )}
              {ultimosShows.map((s, i) => (
                <div key={i} className="flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-secondary/30 transition-colors">
                  <div className="w-1.5 h-8 rounded-full flex-shrink-0"
                       style={{
                         background: rankColors[i % rankColors.length],
                         boxShadow: `0 0 6px ${rankColors[i % rankColors.length]}60`,
                       }} />
                  <div className="flex-1 min-w-0">
                    <div className="text-[12px] font-medium text-foreground truncate">
                      {s.evento || 'Show'}
                    </div>
                    <div className="text-[10px] text-muted-foreground truncate">
                      {s.contratante} · {s.data}
                    </div>
                  </div>
                  <div className="font-display text-[12px] font-bold flex-shrink-0"
                       style={{ color: rankColors[i % rankColors.length] }}>
                    {moedaCurta(s.cache || 0)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </HardwarePanel>
      </div>

    </div>
  );
}

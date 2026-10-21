import { useMemo, useState } from 'react';
import { useDJ } from '../../context/DJContext';
import { motion } from 'framer-motion';
import { TrendingUp, DollarSign, Clock, Music, ChevronLeft, ChevronRight } from 'lucide-react';
import WaveformChart from './WaveformChart';
import PerformanceRadar from './PerformanceRadar';
import { moeda, moedaCurta, porcentagem, MESES, MESES_ABREV } from '../../utils/format';
import VinylChart from './VinylChart';
import MonthSelector from './MonthSelector';
import { KpiCard, ShowRow, SectionTitle, Card, DistRow } from './Cartoes';
import * as resumo from './resumo';

/* ════════════════════════════════════════════════════════════
   MAIN DASHBOARD
   ════════════════════════════════════════════════════════════ */
export default function DashboardPage({ shows }) {
  const { djConfig } = useDJ();
  const isBraichi = djConfig?.id === 'BRAICHI';
  const hoje     = new Date();
  const anoAtual = hoje.getFullYear();
  const mesAtual = hoje.getMonth() + 1;

  const anos = useMemo(() => [...new Set(shows.map(s => s.ano).filter(Boolean))].sort((a,b) => b - a), [shows]);
  const [anoSel, setAnoSel] = useState(() => anoAtual);
  const [mesSel, setMesSel] = useState(() => mesAtual);

  const showsAno    = useMemo(() => shows.filter(s => s.ano === Number(anoSel)), [shows, anoSel]);
  const confirmados = useMemo(() => showsAno.filter(s => s.status === 'CONFIRMADO'), [showsAno]);
  const pendentes   = useMemo(() => showsAno.filter(s => s.status === 'PENDENTE'),   [showsAno]);

  /* Ano selecionado */
  const { bruto: totalBruto, custos: totalCustos, daniel: totalDaniel, yuri: totalYuri, lucro: lucroLiquido } = resumo.resumoFinanceiro(confirmados);
  const aReceber = pendentes.reduce((a, s) => a + (s.cache || 0), 0);

  const waveformData    = useMemo(() => resumo.faturamentoPorMes(confirmados), [confirmados]);
  const radarData       = useMemo(() => resumo.indicadoresRadar(confirmados, totalBruto, lucroLiquido), [confirmados, totalBruto, lucroLiquido]);
  const topContratantes = useMemo(() => resumo.topContratantes(showsAno), [showsAno]);
  const ultimosShows    = useMemo(() => resumo.ultimosShows(confirmados), [confirmados]);
  const proximos7Dias   = useMemo(() => resumo.proximos7Dias(shows), [shows]);
  const projecaoAnual   = anoSel === anoAtual ? resumo.projecaoAnual(waveformData, totalBruto, mesAtual) : null;

  /* Mês selecionado */
  const showsMes = useMemo(() => confirmados.filter(s => s.mes === mesSel), [confirmados, mesSel]);
  const { bruto: mesBruto, lucro: mesLucro } = resumo.resumoFinanceiro(showsMes);
  const mesShows = showsMes.length;
  const mesMedia = mesShows > 0 ? mesBruto / mesShows : 0;

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
          <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 28, fontWeight: 700, color: 'hsl(220 15% 88%)', lineHeight: 1 }}>
            {djConfig?.id || 'DRUDS'} <span style={{ color: 'hsl(217 90% 62%)', textShadow: '0 0 20px hsl(217 90% 55% / 0.4)' }}>FINANCEIRO</span>
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
      <div className="dash-kpi-grid">
        <KpiCard icon={<TrendingUp size={16}/>} label="Faturamento Bruto" value={moeda(totalBruto)}
          sub={`${confirmados.length} shows`} color="hsl(217 90% 55%)" delay={0} />
        <KpiCard icon={<DollarSign size={16}/>} label="Lucro Líquido" value={moeda(lucroLiquido)}
          sub={totalBruto > 0 ? `${porcentagem(lucroLiquido, totalBruto)}% margem` : undefined} color="hsl(150 70% 45%)" delay={0.06} />
        <KpiCard icon={<Clock size={16}/>} label="A Receber" value={moeda(aReceber)}
          sub={`${pendentes.length} pendentes`} color="hsl(30 95% 55%)" delay={0.12} />
        <KpiCard icon={<Music size={16}/>} label="Média por Show" value={moedaCurta(totalBruto / Math.max(confirmados.length, 1))}
          sub="cache médio" color="hsl(270 70% 60%)" delay={0.18} />
      </div>

      {/* ══ AUTOMAÇÕES ══ */}
      {(proximos7Dias.length > 0 || pendentes.length > 0 || projecaoAnual) && (
        <motion.div
          initial={{ opacity:0, y:8 }}
          animate={{ opacity:1, y:0 }}
          transition={{ delay:0.22 }}
          style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))', gap:10, marginBottom:20 }}
        >
          {/* Próximos 7 dias */}
          {proximos7Dias.length > 0 && (
            <div style={{
              background:'hsl(217 90% 55% / 0.07)', border:'1px solid hsl(217 90% 55% / 0.22)',
              borderLeft:'3px solid hsl(217 90% 55%)', borderRadius:12, padding:'14px 16px',
            }}>
              <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8, color:'hsl(217 90% 60%)', letterSpacing:'0.2em', textTransform:'uppercase', marginBottom:8 }}>
                ⚡ PRÓXIMOS 7 DIAS
              </div>
              <div style={{ fontFamily:"'JetBrains Mono',monospace", lineHeight:1, marginBottom:8 }}>
                <span style={{ fontSize:22, fontWeight:700, color:'hsl(220 15% 88%)' }}>{proximos7Dias.length}</span>
                <span style={{ fontSize:11, color:'hsl(217 90% 55%)', marginLeft:6 }}>SHOW{proximos7Dias.length !== 1 ? 'S' : ''}</span>
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:3 }}>
                {proximos7Dias.slice(0,3).map((s,i) => (
                  <div key={i} style={{ fontFamily:"'Inter',sans-serif", fontSize:11, color:'hsl(220 10% 48%)', display:'flex', gap:6 }}>
                    <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10, color:'hsl(217 90% 50%)', flexShrink:0 }}>
                      {s.data?.split('-').reverse().join('/')}
                    </span>
                    <span style={{ whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{s.evento}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Shows pendentes */}
          {pendentes.length > 0 && (
            <div style={{
              background:'hsl(30 95% 55% / 0.07)', border:'1px solid hsl(30 95% 55% / 0.22)',
              borderLeft:'3px solid hsl(30 95% 55%)', borderRadius:12, padding:'14px 16px',
            }}>
              <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8, color:'hsl(30 95% 60%)', letterSpacing:'0.2em', textTransform:'uppercase', marginBottom:8 }}>
                ⏳ PENDENTES
              </div>
              <div style={{ fontFamily:"'JetBrains Mono',monospace", lineHeight:1, marginBottom:6 }}>
                <span style={{ fontSize:22, fontWeight:700, color:'hsl(220 15% 88%)' }}>{pendentes.length}</span>
                <span style={{ fontSize:11, color:'hsl(30 95% 55%)', marginLeft:6 }}>SHOW{pendentes.length !== 1 ? 'S' : ''}</span>
              </div>
              <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:14, fontWeight:700, color:'hsl(30 95% 60%)', marginBottom:2 }}>
                {moeda(aReceber)}
              </div>
              <div style={{ fontFamily:"'Inter',sans-serif", fontSize:10, color:'hsl(220 10% 38%)' }}>
                aguardando confirmação
              </div>
            </div>
          )}

          {/* Projeção anual */}
          {projecaoAnual && (
            <div style={{
              background:'hsl(150 70% 45% / 0.07)', border:'1px solid hsl(150 70% 45% / 0.22)',
              borderLeft:'3px solid hsl(150 70% 45%)', borderRadius:12, padding:'14px 16px',
            }}>
              <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8, color:'hsl(150 70% 50%)', letterSpacing:'0.2em', textTransform:'uppercase', marginBottom:8 }}>
                📈 PROJEÇÃO {anoSel}
              </div>
              <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:17, fontWeight:700, color:'hsl(220 15% 88%)', lineHeight:1.1, marginBottom:6 }}>
                {moeda(projecaoAnual)}
              </div>
              <div style={{ height:4, borderRadius:2, background:'hsl(220 8% 12%)', overflow:'hidden', marginBottom:4 }}>
                <motion.div
                  initial={{ width:0 }}
                  animate={{ width:`${Math.min((totalBruto/projecaoAnual)*100, 100)}%` }}
                  transition={{ duration:1, ease:'easeOut', delay:0.5 }}
                  style={{ height:'100%', background:'hsl(150 70% 45%)', borderRadius:2 }}
                />
              </div>
              <div style={{ display:'flex', justifyContent:'space-between' }}>
                <span style={{ fontFamily:"'Inter',sans-serif", fontSize:10, color:'hsl(220 10% 38%)' }}>
                  base: {waveformData.filter(d=>d.valor>0).length} meses
                </span>
                <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10, color:'hsl(150 70% 45%)' }}>
                  {Math.round((totalBruto/projecaoAnual)*100)}%
                </span>
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* ══ MONTH SELECTOR ══ */}
      <Card delay={0.2} className="mb-6" style={{ padding: '16px 20px' }}>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 flex-shrink-0">
            <button onClick={prevMes} className="rounded-lg p-1.5 transition-colors hover:bg-white/5"
              style={{ color: 'hsl(220 10% 40%)', cursor: 'pointer', border: '1px solid hsl(220 8% 16%)' }}>
              <ChevronLeft size={14} />
            </button>
            <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 12, fontWeight: 700, color: 'hsl(217 90% 60%)', minWidth: 80, textAlign: 'center' }}>
              {MESES[mesSel - 1]}
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
      <div className="dash-main-grid">

        {/* ─── LEFT: Review do Mês ─── */}
        <Card delay={0.25}>
          <SectionTitle title={`Review · ${MESES_ABREV[mesSel - 1]}`} />

          <div className="flex justify-center mb-4">
            <VinylChart
              value={mesLucro}
              total={mesBruto || 1}
              color="hsl(150 70% 45%)"
              label="Lucro do Mês"
              sublabel={`${mesShows} set${mesShows !== 1 ? 's' : ''} · ${MESES[mesSel - 1]}`}
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
              <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 13, fontWeight: 700, color: 'hsl(220 15% 70%)' }}>{moedaCurta(mesMedia)}</span>
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
                <ShowRow key={i} show={s} color={rankColors[i % rankColors.length]} />
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
              sublabel={`${porcentagem(totalDaniel + totalYuri + totalCustos, totalBruto)}% do bruto`}
              size={190}
            />
          </div>

          <div className="space-y-4">
            <DistRow label="Lucro DJ"          value={Math.max(lucroLiquido,0)} total={totalBruto} color="hsl(217 90% 55%)" />
            <DistRow label={`Daniel (${isBraichi ? '10' : '20'}%)`} value={totalDaniel} total={totalBruto} color="hsl(30 95% 55%)" />
            {!isBraichi && <DistRow label="Yuri (R$250/set)" value={totalYuri} total={totalBruto} color="hsl(150 70% 45%)" />}
            <DistRow label="Custos Op."          value={totalCustos} total={totalBruto} color="hsl(0 75% 55%)" />
          </div>
        </Card>
      </div>

      {/* ══ BOTTOM ROW ══ */}
      <div className="dash-bottom-grid">

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
                  <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, fontWeight: 700, color: rankColors[i] }}>{moedaCurta(c.cache)}</div>
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

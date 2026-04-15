import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import BloqueioAgenda from '../components/BloqueioAgenda';

/* ─── constants ─── */
const MESES_FULL = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
const MESES_ABR  = ['JAN','FEV','MAR','ABR','MAI','JUN','JUL','AGO','SET','OUT','NOV','DEZ'];
const DIAS_SEMANA = ['DOM','SEG','TER','QUA','QUI','SEX','SÁB'];
const STATUS_COLOR = { CONFIRMADO: '#3dd457', PENDENTE: '#ffd60a', CANCELADO: '#ff453a' };

function moeda(v) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0 }).format(v || 0);
}

function LedDot({ color = '#3dd457', pulse = false, size = 8 }) {
  return (
    <span style={{
      display: 'inline-block', width: size, height: size,
      borderRadius: '50%', background: color, flexShrink: 0,
      boxShadow: `0 0 6px ${color}, 0 0 10px ${color}60`,
      animation: pulse ? 'ledPulse 1.2s ease-in-out infinite' : 'none',
    }} />
  );
}

const surface = {
  background: '#13141a',
  border: '1px solid rgba(255,255,255,0.06)',
  borderRadius: 8,
  boxShadow: '0 4px 24px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.04)',
};

/* ═══════════════ PAGE ═══════════════ */
export default function CalendarioPage({ shows, bloqueios = [], onBloqueioAtualizado }) {
  const hoje = new Date();
  const [mes,  setMes]  = useState(hoje.getMonth());
  const [ano,  setAno]  = useState(hoje.getFullYear());
  const [showSel, setShowSel] = useState(null);
  const [mostrarBloqueio, setMostrarBloqueio] = useState(false);

  function navegar(delta) {
    let nm = mes + delta, na = ano;
    if (nm < 0)  { nm = 11; na--; }
    if (nm > 11) { nm = 0;  na++; }
    setMes(nm); setAno(na); setShowSel(null);
  }

  const showsDoMes = useMemo(() =>
    shows.filter(s => s.mes === mes + 1 && s.ano === ano),
  [shows, mes, ano]);

  const showsPorDia = useMemo(() => {
    const map = {};
    showsDoMes.forEach(s => {
      const dia = new Date(s.data + 'T00:00:00').getDate();
      if (!map[dia]) map[dia] = [];
      map[dia].push(s);
    });
    return map;
  }, [showsDoMes]);

  const diasBloqueados = useMemo(() => {
    const set = new Set();
    const diasNoMes = new Date(ano, mes + 1, 0).getDate();
    bloqueios.forEach(b => {
      const inicio = new Date(b.dataInicio + 'T00:00:00');
      const fim    = new Date(b.dataFim + 'T00:00:00');
      for (let d = 1; d <= diasNoMes; d++) {
        const dia = new Date(ano, mes, d);
        if (dia >= inicio && dia <= fim) set.add(d);
      }
    });
    return set;
  }, [bloqueios, mes, ano]);

  const primeiroDia = new Date(ano, mes, 1).getDay();
  const diasNoMes   = new Date(ano, mes + 1, 0).getDate();
  const celulas     = [];
  for (let i = 0; i < primeiroDia; i++) celulas.push(null);
  for (let d = 1; d <= diasNoMes; d++) celulas.push(d);

  const isHoje = d => d === hoje.getDate() && mes === hoje.getMonth() && ano === hoje.getFullYear();

  const confirmados   = showsDoMes.filter(s => s.status === 'CONFIRMADO');
  const totalBruto    = confirmados.reduce((a, s) => a + (s.cache || 0), 0);
  const proximosShows = showsDoMes
    .filter(s => new Date(s.data + 'T00:00:00') >= hoje)
    .sort((a, b) => new Date(a.data) - new Date(b.data))
    .slice(0, 4);

  return (
    <div style={{ padding: '24px 28px', maxWidth: 1400, margin: '0 auto', fontFamily: "'JetBrains Mono', monospace" }}>

      {/* ── Page header ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <LedDot color="#3dd457" />
          <div>
            <div style={{ fontSize: 11, color: 'rgba(61,212,87,0.7)', letterSpacing: '0.2em', textTransform: 'uppercase' }}>DECK 2 · CALENDÁRIO</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: 'rgba(255,255,255,0.9)', lineHeight: 1.2 }}>
              {MESES_FULL[mes]} {ano}
            </div>
          </div>
        </div>

        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
          {/* Block button */}
          <button
            onClick={() => setMostrarBloqueio(v => !v)}
            style={{
              position: 'relative',
              padding: '8px 14px',
              background: mostrarBloqueio ? 'rgba(255,69,58,0.15)' : 'linear-gradient(180deg, #1e1f28, #17181f)',
              border: `1px solid ${mostrarBloqueio ? 'rgba(255,69,58,0.5)' : 'rgba(255,255,255,0.07)'}`,
              borderRadius: 4, cursor: 'pointer',
              color: mostrarBloqueio ? '#ff453a' : 'rgba(255,255,255,0.4)',
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 10, fontWeight: 700, letterSpacing: '0.1em',
              transition: 'all 0.15s',
            }}
          >
            <span style={{
              position: 'absolute', top: 0, left: 0, right: 0, height: 2,
              background: mostrarBloqueio ? '#ff453a' : 'transparent',
              borderRadius: '4px 4px 0 0',
            }} />
            {mostrarBloqueio ? '▲ FECHAR BLOQUEIO' : '⬡ TRAVAR AGENDA'}
          </button>

          {/* Month navigation */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 2,
            background: '#13141a',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 6, overflow: 'hidden',
          }}>
            <button onClick={() => navegar(-1)} style={{
              padding: '8px 14px', background: 'none', border: 'none',
              color: '#3dd457', cursor: 'pointer', fontSize: 14,
              fontFamily: "'JetBrains Mono', monospace",
              transition: 'background 0.1s',
            }}
              onMouseEnter={e => e.target.style.background = 'rgba(61,212,87,0.1)'}
              onMouseLeave={e => e.target.style.background = 'none'}
            >◀</button>

            <div style={{
              padding: '8px 16px',
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 12, fontWeight: 700, letterSpacing: '0.1em',
              color: 'rgba(255,255,255,0.85)',
              borderLeft: '1px solid rgba(255,255,255,0.06)',
              borderRight: '1px solid rgba(255,255,255,0.06)',
              minWidth: 120, textAlign: 'center',
            }}>
              {MESES_ABR[mes]} {ano}
            </div>

            <button onClick={() => navegar(1)} style={{
              padding: '8px 14px', background: 'none', border: 'none',
              color: '#3dd457', cursor: 'pointer', fontSize: 14,
              fontFamily: "'JetBrains Mono', monospace",
              transition: 'background 0.1s',
            }}
              onMouseEnter={e => e.target.style.background = 'rgba(61,212,87,0.1)'}
              onMouseLeave={e => e.target.style.background = 'none'}
            >▶</button>
          </div>
        </div>
      </div>

      {/* ── KPI strip ── */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
        {[
          { label: 'SHOWS NO MÊS',  val: showsDoMes.length,                              color: '#3dd457' },
          { label: 'CONFIRMADOS',   val: confirmados.length,                              color: '#3dd457' },
          { label: 'PENDENTES',     val: showsDoMes.filter(s=>s.status==='PENDENTE').length, color: '#ffd60a' },
          { label: 'FATURAMENTO',   val: moeda(totalBruto),                               color: '#9a7ef8', wide: true },
          diasBloqueados.size > 0 && { label: 'DIAS BLOQUEADOS', val: diasBloqueados.size, color: '#ff453a' },
        ].filter(Boolean).map((k, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07 }}
            style={{
              ...surface,
              padding: '12px 18px',
              borderTop: `2px solid ${k.color}`,
              flex: k.wide ? '1' : 'none',
              minWidth: 100,
            }}
          >
            <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.25)', letterSpacing: '0.15em', marginBottom: 4 }}>{k.label}</div>
            <div style={{ fontSize: k.wide ? 17 : 26, fontWeight: 700, color: k.color, textShadow: `0 0 12px ${k.color}50` }}>
              {k.val}
            </div>
          </motion.div>
        ))}
      </div>

      {/* ── Bloqueio panel ── */}
      <AnimatePresence>
        {mostrarBloqueio && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            style={{ marginBottom: 20, overflow: 'hidden' }}
          >
            <div style={{ ...surface, padding: '16px 20px', borderTop: '2px solid #ff453a' }}>
              <BloqueioAgenda bloqueios={bloqueios} onAtualizar={onBloqueioAtualizado} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Calendar + Side panel ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 16 }}>

        {/* Calendar */}
        <div style={{ ...surface, padding: 16 }}>

          {/* Weekday headers */}
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(7,1fr)',
            gap: 2, marginBottom: 4,
          }}>
            {DIAS_SEMANA.map(d => (
              <div key={d} style={{
                textAlign: 'center', padding: '6px 0',
                fontSize: 9, fontWeight: 700, letterSpacing: '0.12em',
                color: d === 'DOM' || d === 'SÁB'
                  ? 'rgba(255,255,255,0.2)'
                  : 'rgba(255,255,255,0.3)',
              }}>
                {d}
              </div>
            ))}
          </div>

          {/* Day cells */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 2 }}>
            {celulas.map((dia, i) => {
              if (!dia) return <div key={i} style={{ aspectRatio: '1', minHeight: 56 }} />;

              const showsDia  = showsPorDia[dia] || [];
              const temShow   = showsDia.length > 0;
              const bloqueado = diasBloqueados.has(dia);
              const hoje_     = isHoje(dia);
              const selecionado = showSel && showsDia.find(s => s.id === showSel.id);

              return (
                <motion.div
                  key={i}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => temShow ? setShowSel(showsDia[0]) : setShowSel(null)}
                  style={{
                    aspectRatio: '1',
                    minHeight: 56,
                    display: 'flex', flexDirection: 'column',
                    padding: '6px 5px',
                    borderRadius: 4,
                    cursor: temShow ? 'pointer' : 'default',
                    position: 'relative',
                    background: selecionado
                      ? 'rgba(61,212,87,0.12)'
                      : hoje_
                        ? 'rgba(26,110,250,0.12)'
                        : bloqueado
                          ? 'rgba(255,69,58,0.06)'
                          : temShow
                            ? 'rgba(255,255,255,0.04)'
                            : 'transparent',
                    border: `1px solid ${selecionado
                      ? 'rgba(61,212,87,0.4)'
                      : hoje_
                        ? 'rgba(26,110,250,0.4)'
                        : bloqueado
                          ? 'rgba(255,69,58,0.2)'
                          : 'rgba(255,255,255,0.04)'}`,
                    transition: 'all 0.15s',
                    boxShadow: selecionado ? '0 0 12px rgba(61,212,87,0.2)' : 'none',
                    overflow: 'hidden',
                  }}
                >
                  {/* Day number */}
                  <div style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 12, fontWeight: hoje_ ? 700 : 500,
                    color: hoje_
                      ? '#1a6efa'
                      : bloqueado && !temShow
                        ? 'rgba(255,69,58,0.6)'
                        : 'rgba(255,255,255,0.55)',
                    textShadow: hoje_ ? '0 0 10px rgba(26,110,250,0.6)' : 'none',
                    marginBottom: 3,
                  }}>
                    {dia}
                  </div>

                  {/* Block indicator */}
                  {bloqueado && !temShow && (
                    <div style={{
                      fontSize: 10, color: 'rgba(255,69,58,0.5)',
                      fontFamily: "'JetBrains Mono', monospace",
                    }}>⊗</div>
                  )}

                  {/* Show pills */}
                  {showsDia.slice(0, 2).map((s, j) => {
                    const cor = STATUS_COLOR[s.status] || '#9a7ef8';
                    return (
                      <div key={j} style={{
                        fontSize: 8, fontWeight: 700, letterSpacing: '0.04em',
                        color: cor, background: cor + '18',
                        borderLeft: `2px solid ${cor}`,
                        borderRadius: 2, padding: '1px 4px',
                        marginBottom: 1,
                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                        boxShadow: `0 0 4px ${cor}20`,
                      }}>
                        {s.evento?.slice(0, 10) || '—'}
                      </div>
                    );
                  })}
                  {showsDia.length > 2 && (
                    <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.2)', letterSpacing: '0.05em' }}>
                      +{showsDia.length - 2}
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Side panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

          {/* Selected show detail */}
          <AnimatePresence mode="wait">
            {showSel ? (
              <motion.div
                key="detail"
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 12 }}
                style={{
                  ...surface,
                  padding: '16px',
                  borderTop: `2px solid ${STATUS_COLOR[showSel.status] || '#9a7ef8'}`,
                  flex: 1,
                }}
              >
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <div style={{
                    fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.9)',
                    fontFamily: "'JetBrains Mono', monospace",
                    lineHeight: 1.3, flex: 1, marginRight: 8,
                  }}>
                    {showSel.evento}
                  </div>
                  <button
                    onClick={() => setShowSel(null)}
                    style={{
                      background: 'none', border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: 3, color: 'rgba(255,255,255,0.4)', cursor: 'pointer',
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: 12, padding: '2px 7px',
                    }}
                  >×</button>
                </div>

                {/* Status badge */}
                <div style={{ marginBottom: 14 }}>
                  <span style={{
                    fontSize: 9, fontWeight: 700, letterSpacing: '0.12em',
                    color: STATUS_COLOR[showSel.status] || '#9a7ef8',
                    background: (STATUS_COLOR[showSel.status] || '#9a7ef8') + '18',
                    border: `1px solid ${(STATUS_COLOR[showSel.status] || '#9a7ef8')}40`,
                    borderRadius: 3, padding: '3px 8px',
                    fontFamily: "'JetBrains Mono', monospace",
                  }}>
                    {showSel.status}
                  </span>
                </div>

                {/* Fields */}
                {[
                  ['DATA',        new Date(showSel.data + 'T00:00:00').toLocaleDateString('pt-BR')],
                  ['HORÁRIO',     showSel.horaInicio || '—'],
                  ['DURAÇÃO',     showSel.duracao || '—'],
                  ['CONTRATANTE', showSel.contratante || '—'],
                  ['LOCAL',       showSel.endereco || '—'],
                  ['CACHÊ',       showSel.cache ? moeda(showSel.cache) : 'Não definido'],
                ].map(([label, valor], i) => (
                  <div key={i} style={{
                    display: 'flex', justifyContent: 'space-between', gap: 8,
                    padding: '6px 0',
                    borderBottom: '1px solid rgba(255,255,255,0.04)',
                  }}>
                    <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.25)', letterSpacing: '0.1em', flexShrink: 0 }}>{label}</span>
                    <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.75)', textAlign: 'right', wordBreak: 'break-word' }}>{valor}</span>
                  </div>
                ))}

                {showSel.observacoes && (
                  <div style={{ marginTop: 10, padding: '8px 10px', background: 'rgba(255,255,255,0.03)', borderRadius: 4 }}>
                    <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.2)', marginBottom: 4, letterSpacing: '0.1em' }}>OBS</div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', lineHeight: 1.5 }}>{showSel.observacoes}</div>
                  </div>
                )}

                {/* Other shows same day */}
                {(() => {
                  const dia = new Date(showSel.data + 'T00:00:00').getDate();
                  const outros = (showsPorDia[dia] || []).filter(s => s.id !== showSel.id);
                  return outros.length > 0 ? (
                    <div style={{ marginTop: 12 }}>
                      <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.2)', letterSpacing: '0.1em', marginBottom: 6 }}>OUTROS NESTE DIA</div>
                      {outros.map(s => (
                        <div
                          key={s.id}
                          onClick={() => setShowSel(s)}
                          style={{
                            padding: '6px 10px', borderRadius: 4, cursor: 'pointer',
                            background: 'rgba(255,255,255,0.03)',
                            border: '1px solid rgba(255,255,255,0.05)',
                            marginBottom: 4, fontSize: 11,
                            color: 'rgba(255,255,255,0.6)',
                            transition: 'all 0.1s',
                          }}
                          onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                        >
                          {s.evento}
                        </div>
                      ))}
                    </div>
                  ) : null;
                })()}
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                style={{
                  ...surface,
                  padding: '32px 20px', textAlign: 'center',
                }}
              >
                <div style={{ fontSize: 28, opacity: 0.12, marginBottom: 12 }}>◎</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)', letterSpacing: '0.1em', lineHeight: 1.6 }}>
                  CLIQUE EM UM DIA<br />COM SHOW
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Next shows */}
          {proximosShows.length > 0 && (
            <div style={{ ...surface, padding: '14px 16px' }}>
              <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.2)', letterSpacing: '0.2em', marginBottom: 10 }}>
                PRÓXIMOS SHOWS
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {proximosShows.map(s => {
                  const cor = STATUS_COLOR[s.status] || '#9a7ef8';
                  return (
                    <div
                      key={s.id}
                      onClick={() => setShowSel(s)}
                      style={{
                        display: 'flex', gap: 10, alignItems: 'center',
                        padding: '8px 10px', borderRadius: 4, cursor: 'pointer',
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid rgba(255,255,255,0.04)',
                        transition: 'all 0.1s',
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                    >
                      <LedDot color={cor} size={6} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.8)', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {s.evento}
                        </div>
                        <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', marginTop: 1 }}>
                          {new Date(s.data + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }).toUpperCase()}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

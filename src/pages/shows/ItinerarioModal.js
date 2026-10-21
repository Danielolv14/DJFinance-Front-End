import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useDJ } from '../../context/DJContext';
import { COR_ABA } from '../../utils/tema';
import { fmtDateBR, fmtDateLong, minutosNoite, generateWPP, openPDF } from './itinerario';

/* ──────────────────── design tokens ──────────────────── */
const ACCENT = COR_ABA.shows;
const surface = {
  background: '#13141a',
  border: '1px solid rgba(255,255,255,0.07)',
  borderRadius: 10,
  boxShadow: '0 8px 40px rgba(0,0,0,0.6)',
};

/* ════════════════════════════════════════════════════════════
   MODAL
   ════════════════════════════════════════════════════════════ */
export default function ItinerarioModal({ shows, onClose }) {
  const { djConfig } = useDJ();
  const djNome = djConfig?.nome || 'DRUDS';
  const hoje = new Date().toISOString().split('T')[0];
  const [dataInicio, setDataInicio] = useState(hoje);
  const [dataFim,    setDataFim]    = useState(hoje);
  const [copied,     setCopied]     = useState(false);
  const [tab,        setTab]        = useState('edit'); // 'edit' | 'preview'
  const [extras,     setExtras]     = useState({});

  function setExtra(id, field, value) {
    setExtras(prev => ({ ...prev, [id]: { ...(prev[id] || {}), [field]: value } }));
  }

  const showsByDate = useMemo(() => {
    const map = {};
    shows
      .filter(s => s.data >= dataInicio && s.data <= dataFim)
      .sort((a, b) => a.data !== b.data
        ? a.data.localeCompare(b.data)
        : minutosNoite(a.horaInicio) - minutosNoite(b.horaInicio))
      .forEach(s => {
        if (!map[s.data]) map[s.data] = [];
        map[s.data].push(s);
      });
    return map;
  }, [shows, dataInicio, dataFim]);

  const totalDates = Object.keys(showsByDate).length;
  const totalShows = Object.values(showsByDate).reduce((a, b) => a + b.length, 0);
  const wppText    = useMemo(() => generateWPP(showsByDate, extras, djNome), [showsByDate, extras, djNome]);

  function copyWPP() {
    navigator.clipboard.writeText(wppText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  }

  const inputSt = {
    background: '#0c0d12', border: '1px solid rgba(255,255,255,0.09)',
    borderRadius: 4, color: 'rgba(255,255,255,0.88)',
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 12, padding: '8px 10px', outline: 'none', colorScheme: 'dark',
  };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 2000,
        background: 'rgba(0,0,0,0.85)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 20, backdropFilter: 'blur(8px)',
      }}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.94, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 360, damping: 28 }}
        onClick={e => e.stopPropagation()}
        style={{
          ...surface,
          borderTop: `2px solid ${ACCENT}`,
          width: '100%', maxWidth: 820,
          maxHeight: '92vh',
          display: 'flex', flexDirection: 'column',
        }}
      >

        {/* ─── Header ─── */}
        <div style={{
          padding: '20px 26px 16px',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 9, color: `${ACCENT}88`, letterSpacing: '0.25em', textTransform: 'uppercase', fontFamily: "'JetBrains Mono', monospace", marginBottom: 4 }}>
                📋 GERADOR DE ITINERÁRIO
              </div>
              <div style={{ fontSize: 21, fontWeight: 800, color: 'rgba(255,255,255,0.93)', fontFamily: "'JetBrains Mono', monospace", letterSpacing: '-0.3px' }}>
                Itinerário <span style={{ color: ACCENT, textShadow: `0 0 16px ${ACCENT}60` }}>{djNome.toUpperCase()}</span>
              </div>
            </div>
            <button onClick={onClose} style={{
              background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)',
              borderRadius: 6, color: 'rgba(255,255,255,0.4)', cursor: 'pointer',
              fontFamily: "'JetBrains Mono', monospace", fontSize: 14, padding: '5px 13px',
              transition: 'all 0.12s',
            }}
              onMouseEnter={e => e.target.style.background = 'rgba(255,255,255,0.08)'}
              onMouseLeave={e => e.target.style.background = 'rgba(255,255,255,0.04)'}
            >×</button>
          </div>

          {/* Date range + counters */}
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 8, color: 'rgba(255,255,255,0.22)', letterSpacing: '0.18em', fontFamily: "'JetBrains Mono', monospace" }}>DE</span>
              <input type="date" value={dataInicio} onChange={e => setDataInicio(e.target.value)} style={inputSt} />
            </div>
            <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.15)' }}>→</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 8, color: 'rgba(255,255,255,0.22)', letterSpacing: '0.18em', fontFamily: "'JetBrains Mono', monospace" }}>ATÉ</span>
              <input type="date" value={dataFim} onChange={e => setDataFim(e.target.value)} style={inputSt} />
            </div>
            {totalShows > 0 && (
              <div style={{
                marginLeft: 6, display: 'flex', gap: 6,
              }}>
                <span style={{
                  fontSize: 9, fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.1em',
                  color: ACCENT, background: `${ACCENT}18`,
                  border: `1px solid ${ACCENT}35`, borderRadius: 12, padding: '3px 10px',
                }}>
                  {totalShows} SHOW{totalShows !== 1 ? 'S' : ''}
                </span>
                <span style={{
                  fontSize: 9, fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.1em',
                  color: 'rgba(255,255,255,0.35)', background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '3px 10px',
                }}>
                  {totalDates} DIA{totalDates !== 1 ? 'S' : ''}
                </span>
              </div>
            )}

            {/* Tab switch */}
            {totalShows > 0 && (
              <div style={{ marginLeft: 'auto', display: 'flex', background: '#0c0d12', borderRadius: 5, padding: 3, border: '1px solid rgba(255,255,255,0.06)', gap: 2 }}>
                {[['edit','✏️ EDITAR'],['preview','📱 WPP']].map(([id, label]) => (
                  <button key={id} onClick={() => setTab(id)} style={{
                    padding: '5px 12px', borderRadius: 3, border: 'none', cursor: 'pointer',
                    fontFamily: "'JetBrains Mono', monospace", fontSize: 9, fontWeight: 700, letterSpacing: '0.08em',
                    background: tab === id ? `${ACCENT}20` : 'transparent',
                    color: tab === id ? ACCENT : 'rgba(255,255,255,0.3)',
                    transition: 'all 0.15s',
                  }}>{label}</button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ─── Body ─── */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '18px 26px' }}>

          {totalShows === 0 ? (
            <div style={{ textAlign: 'center', padding: '56px 0', color: 'rgba(255,255,255,0.18)', fontFamily: "'JetBrains Mono', monospace", fontSize: 12, letterSpacing: '0.12em' }}>
              NENHUM SHOW NO PERÍODO SELECIONADO
            </div>
          ) : tab === 'edit' ? (

            /* ── EDIT TAB ── */
            <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
              {Object.entries(showsByDate).sort(([a],[b]) => a.localeCompare(b)).map(([date, dayShows]) => (
                <div key={date}>
                  {/* Date header */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                    <div style={{ width: 3, height: 20, background: ACCENT, borderRadius: 2, boxShadow: `0 0 8px ${ACCENT}80`, flexShrink: 0 }} />
                    <div style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                      <span style={{ fontSize: 14, fontWeight: 800, color: 'rgba(255,255,255,0.9)' }}>{fmtDateBR(date)}</span>
                      <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', marginLeft: 10 }}>{fmtDateLong(date)}</span>
                    </div>
                  </div>

                  {dayShows.map((show, idx) => {
                    const ex       = extras[show.id] || {};
                    const evColors = ['#6366f1','#0ea5e9','#10b981','#f59e0b','#ef4444','#8b5cf6'];
                    const col      = evColors[idx % evColors.length];
                    const riderVal = ex.rider !== undefined ? ex.rider : (show.rider || 'Combo de Gin');

                    return (
                      <div key={show.id} style={{
                        background: 'linear-gradient(145deg, rgba(255,255,255,0.03), rgba(255,255,255,0.015))',
                        border: `1px solid rgba(255,255,255,0.06)`,
                        borderLeft: `4px solid ${col}`,
                        borderRadius: 8, padding: '14px 16px',
                        marginBottom: 8,
                      }}>
                        {/* Show title row */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                          <div style={{
                            width: 28, height: 28, borderRadius: 7, flexShrink: 0,
                            background: `${col}20`, border: `1.5px solid ${col}50`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontFamily: "'JetBrains Mono', monospace", fontSize: 11, fontWeight: 800, color: col,
                          }}>{idx + 1}</div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, fontWeight: 800, color: 'rgba(255,255,255,0.9)', letterSpacing: '0.04em' }}>
                              {(show.evento || '—').toUpperCase()}
                            </div>
                            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginTop: 2, fontFamily: "'JetBrains Mono', monospace" }}>
                              {[show.horaInicio, show.duracao, show.endereco].filter(Boolean).join(' · ')}
                            </div>
                          </div>
                        </div>

                        {/* Info grid */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 16px', marginBottom: 12 }}>
                          <div>
                            <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.2)', letterSpacing: '0.14em', fontFamily: "'JetBrains Mono', monospace", marginBottom: 2 }}>📍 LOCAL</div>
                            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.65)' }}>{show.endereco || '—'}</div>
                          </div>
                          <div>
                            <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.2)', letterSpacing: '0.14em', fontFamily: "'JetBrains Mono', monospace", marginBottom: 2 }}>📞 CONTATO</div>
                            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.65)' }}>{(show.contratante || '—').toUpperCase()}</div>
                          </div>
                        </div>

                        {/* Rider editable */}
                        <div style={{ marginBottom: 10 }}>
                          <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.2)', letterSpacing: '0.14em', fontFamily: "'JetBrains Mono', monospace", marginBottom: 4 }}>🍾 RIDER</div>
                          <input
                            type="text"
                            value={riderVal}
                            onChange={e => setExtra(show.id, 'rider', e.target.value)}
                            onClick={e => e.stopPropagation()}
                            placeholder="Combo de Gin"
                            style={{
                              width: '100%', background: '#0c0d12',
                              border: '1px solid rgba(255,255,255,0.1)',
                              borderRadius: 4, color: 'rgba(255,255,255,0.8)',
                              fontFamily: "'JetBrains Mono', monospace",
                              fontSize: 11, padding: '6px 10px', outline: 'none',
                            }}
                            onFocus={e => e.target.style.borderColor = col}
                            onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                          />
                        </div>

                      </div>
                    );
                  })}
                </div>
              ))}
            </div>

          ) : (

            /* ── WPP PREVIEW TAB ── */
            <div style={{
              background: '#111b21',
              borderRadius: 12, overflow: 'hidden',
              border: '1px solid rgba(255,255,255,0.06)',
            }}>
              {/* WhatsApp top bar */}
              <div style={{ background: '#1f2c34', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 34, height: 34, borderRadius: '50%', background: '#2a3942', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>🎧</div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#e9edef' }}>{djNome}</div>
                  <div style={{ fontSize: 11, color: '#8696a0' }}>online</div>
                </div>
              </div>
              {/* Chat bubble */}
              <div style={{ padding: '16px', background: 'url("data:image/png;base64,")' }}>
                <div style={{
                  background: '#1f2c34',
                  borderRadius: '4px 14px 14px 14px',
                  padding: '10px 14px 8px',
                  display: 'inline-block',
                  maxWidth: '100%',
                }}>
                  <pre style={{
                    fontFamily: "'Segoe UI', system-ui, sans-serif",
                    fontSize: 12.5,
                    lineHeight: 1.6,
                    color: '#e9edef',
                    margin: 0,
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                  }}>
                    {wppText.split('\n').map((line, i) => {
                      // Render *bold* as bold
                      const parts = line.split(/(\*[^*]+\*)/g);
                      return (
                        <span key={i}>
                          {parts.map((p, j) =>
                            p.startsWith('*') && p.endsWith('*')
                              ? <strong key={j} style={{ color: '#fff' }}>{p.slice(1,-1)}</strong>
                              : p.startsWith('_') && p.endsWith('_')
                              ? <em key={j} style={{ color: '#8696a0' }}>{p.slice(1,-1)}</em>
                              : <span key={j}>{p}</span>
                          )}
                          {'\n'}
                        </span>
                      );
                    })}
                  </pre>
                  <div style={{ fontSize: 10.5, color: '#8696a0', textAlign: 'right', marginTop: 4 }}>
                    {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} ✓✓
                  </div>
                </div>
              </div>
            </div>

          )}
        </div>

        {/* ─── Footer actions ─── */}
        <div style={{
          padding: '14px 26px', borderTop: '1px solid rgba(255,255,255,0.06)',
          display: 'flex', gap: 8, justifyContent: 'flex-end', flexShrink: 0, flexWrap: 'wrap',
        }}>
          <button onClick={onClose} style={{
            padding: '10px 16px', background: 'transparent',
            border: '1px solid rgba(255,255,255,0.07)', borderRadius: 5, cursor: 'pointer',
            color: 'rgba(255,255,255,0.35)', fontFamily: "'JetBrains Mono', monospace",
            fontSize: 10, fontWeight: 700, letterSpacing: '0.1em',
          }}>FECHAR</button>

          {totalShows > 0 && (
            <>
              <button onClick={copyWPP} style={{
                padding: '10px 18px', position: 'relative', overflow: 'hidden',
                background: copied ? 'rgba(61,212,87,0.12)' : 'rgba(37,211,102,0.1)',
                border: `1px solid ${copied ? '#3dd45770' : 'rgba(37,211,102,0.35)'}`,
                borderRadius: 5, cursor: 'pointer',
                color: copied ? '#3dd457' : '#25d366',
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 10, fontWeight: 700, letterSpacing: '0.1em',
                transition: 'all 0.2s',
              }}>
                {copied ? '✓ COPIADO!' : '📱 COPIAR WPP'}
              </button>

              <motion.button
                whileTap={{ scale: 0.96 }}
                onClick={() => openPDF(showsByDate, extras, djNome)}
                style={{
                  position: 'relative', overflow: 'hidden',
                  padding: '10px 24px',
                  background: `${ACCENT}18`,
                  border: `1px solid ${ACCENT}55`,
                  borderRadius: 5, cursor: 'pointer',
                  color: ACCENT,
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 11, fontWeight: 800, letterSpacing: '0.12em',
                  boxShadow: `0 0 20px ${ACCENT}20`,
                  transition: 'all 0.15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = `${ACCENT}28`; e.currentTarget.style.boxShadow = `0 0 28px ${ACCENT}35`; }}
                onMouseLeave={e => { e.currentTarget.style.background = `${ACCENT}18`; e.currentTarget.style.boxShadow = `0 0 20px ${ACCENT}20`; }}
              >
                <span style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: ACCENT, borderRadius: '5px 5px 0 0', boxShadow: `0 0 8px ${ACCENT}` }} />
                📄 GERAR PDF
              </motion.button>
            </>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

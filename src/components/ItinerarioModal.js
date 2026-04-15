import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/* ─── helpers ─── */
function fmtDateBR(iso) {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}
function fmtDateFull(iso) {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  const meses = ['JANEIRO','FEVEREIRO','MARÇO','ABRIL','MAIO','JUNHO',
                 'JULHO','AGOSTO','SETEMBRO','OUTUBRO','NOVEMBRO','DEZEMBRO'];
  return `${d}/${m}/${y}`;
}
function subtractMinutes(timeStr, minutes) {
  if (!timeStr || minutes === '' || minutes === undefined) return '';
  const [h, m] = timeStr.split(':').map(Number);
  const total = h * 60 + m - Number(minutes);
  const norm  = ((total % 1440) + 1440) % 1440;
  return `${String(Math.floor(norm / 60)).padStart(2, '0')}:${String(norm % 60).padStart(2, '0')}`;
}

/* ─── generate WPP text ─── */
function generateText(showsByDate, extras) {
  let out = '';
  const dates = Object.keys(showsByDate).sort();

  dates.forEach((date, di) => {
    const shows = showsByDate[date];
    if (di > 0) out += '\n\n';
    out += `*ITINERÁRIO DRUDS - ${fmtDateBR(date)}*\n\n`;
    out += `*EVENTOS:*\n`;

    shows.forEach((show, idx) => {
      const ex      = extras[show.id] || {};
      const num     = idx + 1;
      const prev    = idx > 0 ? idx : null;
      const traj    = ex.tempoTrajeto ?? '';
      const saida   = subtractMinutes(show.horaInicio, traj);
      const efeitos = ex.efeitos    ? 'Sim ✅' : 'Não 👎🏻';
      const dancers = ex.dancarias  ? 'Sim ✅' : 'Não 👎🏻';

      out += `\n*${num}. ${(show.evento || '').toUpperCase()}*\n`;
      out += `📍Endereço: ${show.endereco || '—'}\n`;
      out += `⏱ Horário de início da apresentação: ${show.horaInicio || '—'}\n`;
      out += `⏳Duração: ${show.duracao || '—'}\n`;
      out += `💥Efeitos: ${efeitos}\n`;
      out += `💃🏻Dançarinas: ${dancers}\n`;
      if (prev === null) {
        out += `🗺Tempo do trajeto (Casa do Druds até o evento ${num}): ${traj ? traj + ' min' : '—'}\n`;
        out += `⏰Horário de saída (Casa do Druds): ${saida || '—'}\n`;
      } else {
        out += `🗺Tempo do trajeto (Evento ${prev} até o evento ${num}): ${traj ? traj + ' min' : '—'}\n`;
        out += `⏰Horário de saída (Evento ${prev}): ${saida || '—'}\n`;
      }
      out += `🍾Rider: ${show.rider || ''}\n`;
      out += `📞Contato do contratante: ${(show.contratante || '').toUpperCase()}\n`;
    });
  });

  return out.trim();
}

/* ─── generate PDF (print) ─── */
function printPDF(text, showsByDate) {
  const html = `<!DOCTYPE html>
<html><head><meta charset="UTF-8">
<style>
  body { font-family: Arial, sans-serif; font-size: 13px; padding: 32px; color: #111; max-width: 700px; margin: 0 auto; }
  h1 { font-size: 16px; font-weight: bold; border-bottom: 2px solid #111; padding-bottom: 6px; margin-bottom: 16px; }
  .section { margin-bottom: 32px; }
  .date-header { font-size: 15px; font-weight: bold; letter-spacing: 1px; margin-bottom: 8px; }
  .event-block { margin-bottom: 20px; background: #f9f9f9; border-left: 4px solid #111; padding: 12px 16px; border-radius: 0 6px 6px 0; }
  .event-name { font-size: 14px; font-weight: bold; margin-bottom: 8px; }
  .field { margin: 4px 0; line-height: 1.6; }
  @media print { body { padding: 16px; } }
</style></head><body>`;

  let body = '';
  const dates = Object.keys(showsByDate).sort();
  dates.forEach(date => {
    const shows = showsByDate[date];
    body += `<div class="section">`;
    body += `<div class="date-header">ITINERÁRIO DRUDS — ${fmtDateBR(date)}</div>`;
    shows.forEach((show, idx) => {
      body += `<div class="event-block">`;
      body += `<div class="event-name">${idx + 1}. ${(show.evento || '').toUpperCase()}</div>`;
      body += `<div class="field">📍 <b>Endereço:</b> ${show.endereco || '—'}</div>`;
      body += `<div class="field">⏱ <b>Início:</b> ${show.horaInicio || '—'}</div>`;
      body += `<div class="field">⏳ <b>Duração:</b> ${show.duracao || '—'}</div>`;
      body += `<div class="field">🍾 <b>Rider:</b> ${show.rider || '—'}</div>`;
      body += `<div class="field">📞 <b>Contratante:</b> ${(show.contratante || '').toUpperCase()}</div>`;
      body += `</div>`;
    });
    body += `</div>`;
  });

  const win = window.open('', '_blank');
  win.document.write(html + body + '</body></html>');
  win.document.close();
  win.focus();
  setTimeout(() => win.print(), 400);
}

/* ─── design ─── */
const ACCENT = '#9a7ef8';
const surface = {
  background: '#13141a',
  border: '1px solid rgba(255,255,255,0.07)',
  borderRadius: 8,
  boxShadow: '0 4px 24px rgba(0,0,0,0.5)',
};

function Toggle({ checked, onChange, label }) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
      <div style={{
        width: 30, height: 16, borderRadius: 8, flexShrink: 0,
        background: checked ? ACCENT : 'rgba(255,255,255,0.1)',
        border: `1px solid ${checked ? ACCENT : 'rgba(255,255,255,0.15)'}`,
        position: 'relative', transition: 'all 0.2s',
        boxShadow: checked ? `0 0 8px ${ACCENT}50` : 'none',
      }}>
        <div style={{
          position: 'absolute', top: 2,
          left: checked ? 14 : 2,
          width: 10, height: 10, borderRadius: '50%',
          background: checked ? '#fff' : 'rgba(255,255,255,0.4)',
          transition: 'left 0.2s',
        }} />
      </div>
      <input type="checkbox" checked={checked} onChange={onChange} style={{ display: 'none' }} />
      <span style={{ fontSize: 11, color: checked ? 'rgba(255,255,255,0.75)' : 'rgba(255,255,255,0.35)', fontFamily: "'JetBrains Mono', monospace" }}>
        {label}
      </span>
    </label>
  );
}

/* ════════════════════════════════════════════════════════════
   ITINERÁRIO MODAL
   ════════════════════════════════════════════════════════════ */
export default function ItinerarioModal({ shows, onClose }) {
  const hoje = new Date().toISOString().split('T')[0];
  const [dataInicio, setDataInicio] = useState(hoje);
  const [dataFim,    setDataFim]    = useState(hoje);
  const [copied,     setCopied]     = useState(false);
  // extras: { [showId]: { efeitos, dancarias, tempoTrajeto } }
  const [extras, setExtras] = useState({});

  function setExtra(showId, field, value) {
    setExtras(prev => ({
      ...prev,
      [showId]: { ...(prev[showId] || {}), [field]: value },
    }));
  }

  /* filter + group by date */
  const showsByDate = useMemo(() => {
    const map = {};
    shows
      .filter(s => s.data >= dataInicio && s.data <= dataFim)
      .sort((a, b) => {
        if (a.data !== b.data) return a.data.localeCompare(b.data);
        return (a.horaInicio || '').localeCompare(b.horaInicio || '');
      })
      .forEach(s => {
        if (!map[s.data]) map[s.data] = [];
        map[s.data].push(s);
      });
    return map;
  }, [shows, dataInicio, dataFim]);

  const totalDates = Object.keys(showsByDate).length;
  const totalShows = Object.values(showsByDate).reduce((a, arr) => a + arr.length, 0);

  const wppText = useMemo(() => generateText(showsByDate, extras), [showsByDate, extras]);

  function copyWPP() {
    navigator.clipboard.writeText(wppText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  }

  const inputSt = {
    background: '#0d0e14', border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 4, color: 'rgba(255,255,255,0.85)',
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 12, padding: '8px 10px', outline: 'none', colorScheme: 'dark',
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 2000,
        background: 'rgba(0,0,0,0.82)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '20px', backdropFilter: 'blur(6px)',
      }}
    >
      <motion.div
        initial={{ scale: 0.92, opacity: 0, y: 16 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 380, damping: 28 }}
        onClick={e => e.stopPropagation()}
        style={{
          ...surface,
          borderTop: `2px solid ${ACCENT}`,
          width: '100%', maxWidth: 780,
          maxHeight: '90vh',
          display: 'flex', flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* ── Header ── */}
        <div style={{ padding: '18px 24px 14px', borderBottom: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 10, color: `${ACCENT}99`, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 3, fontFamily: "'JetBrains Mono', monospace" }}>
                GERADOR DE ITINERÁRIO
              </div>
              <div style={{ fontSize: 20, fontWeight: 700, color: 'rgba(255,255,255,0.92)', fontFamily: "'JetBrains Mono', monospace" }}>
                Itinerário Druds
              </div>
            </div>
            <button onClick={onClose} style={{
              background: 'none', border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 4, color: 'rgba(255,255,255,0.4)', cursor: 'pointer',
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 14, padding: '4px 12px', transition: 'all 0.1s',
            }}>×</button>
          </div>

          {/* Date range */}
          <div style={{ display: 'flex', gap: 10, marginTop: 14, alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.25)', letterSpacing: '0.15em', fontFamily: "'JetBrains Mono', monospace" }}>DE</span>
              <input type="date" value={dataInicio} onChange={e => setDataInicio(e.target.value)} style={inputSt} />
            </div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)' }}>—</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.25)', letterSpacing: '0.15em', fontFamily: "'JetBrains Mono', monospace" }}>ATÉ</span>
              <input type="date" value={dataFim} onChange={e => setDataFim(e.target.value)} style={inputSt} />
            </div>
            <div style={{ marginLeft: 'auto', fontSize: 10, color: 'rgba(255,255,255,0.25)', fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.1em' }}>
              {totalShows} SHOW{totalShows !== 1 ? 'S' : ''} · {totalDates} DIA{totalDates !== 1 ? 'S' : ''}
            </div>
          </div>
        </div>

        {/* ── Body (scrollable) ── */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 24px', display: 'flex', gap: 16 }}>

          {totalShows === 0 ? (
            <div style={{ width: '100%', textAlign: 'center', padding: '48px 0', color: 'rgba(255,255,255,0.2)', fontFamily: "'JetBrains Mono', monospace", fontSize: 12 }}>
              NENHUM SHOW NO PERÍODO SELECIONADO
            </div>
          ) : (
            <>
              {/* Left: show editor */}
              <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 20 }}>
                {Object.entries(showsByDate).sort(([a], [b]) => a.localeCompare(b)).map(([date, dayShows]) => (
                  <div key={date}>
                    {/* Date header */}
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10,
                      fontFamily: "'JetBrains Mono', monospace",
                    }}>
                      <div style={{ width: 3, height: 18, background: ACCENT, borderRadius: 2, boxShadow: `0 0 6px ${ACCENT}` }} />
                      <span style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.85)', letterSpacing: '0.06em' }}>
                        {fmtDateBR(date)}
                      </span>
                      <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.25)', letterSpacing: '0.12em' }}>
                        {dayShows.length} EVENTO{dayShows.length !== 1 ? 'S' : ''}
                      </span>
                    </div>

                    {dayShows.map((show, idx) => {
                      const ex = extras[show.id] || {};
                      const saida = subtractMinutes(show.horaInicio, ex.tempoTrajeto);

                      return (
                        <div key={show.id} style={{
                          background: 'rgba(255,255,255,0.025)',
                          border: `1px solid ${ACCENT}25`,
                          borderLeft: `3px solid ${ACCENT}`,
                          borderRadius: 6, padding: '12px 14px',
                          marginBottom: 8,
                        }}>
                          {/* Show header */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                            <span style={{
                              width: 22, height: 22, borderRadius: '50%',
                              background: `${ACCENT}25`, border: `1px solid ${ACCENT}50`,
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fontWeight: 700,
                              color: ACCENT, flexShrink: 0,
                            }}>{idx + 1}</span>
                            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.9)' }}>
                              {show.evento}
                            </span>
                            <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginLeft: 4 }}>
                              {show.horaInicio}{show.duracao ? ` · ${show.duracao}` : ''}
                            </span>
                          </div>

                          {/* Info row */}
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 12px', marginBottom: 10 }}>
                            {[
                              ['📍 ENDEREÇO', show.endereco || '—'],
                              ['📞 CONTRATANTE', show.contratante || '—'],
                              ['🍾 RIDER', show.rider || '—'],
                              ['⏰ SAÍDA CALC.', saida ? saida : (ex.tempoTrajeto ? '—' : 'Informe o trajeto')],
                            ].map(([label, val]) => (
                              <div key={label}>
                                <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.2)', letterSpacing: '0.12em', marginBottom: 2, fontFamily: "'JetBrains Mono', monospace" }}>{label}</div>
                                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.65)', fontFamily: "'JetBrains Mono', monospace", whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{val}</div>
                              </div>
                            ))}
                          </div>

                          {/* Editable extras */}
                          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', paddingTop: 8, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                            <Toggle
                              checked={!!ex.efeitos}
                              onChange={e => setExtra(show.id, 'efeitos', e.target.checked)}
                              label="💥 EFEITOS"
                            />
                            <Toggle
                              checked={!!ex.dancarias}
                              onChange={e => setExtra(show.id, 'dancarias', e.target.checked)}
                              label="💃 DANÇARINAS"
                            />
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 'auto' }}>
                              <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.25)', letterSpacing: '0.1em', fontFamily: "'JetBrains Mono', monospace' " }}>
                                🗺 TRAJETO (MIN)
                              </span>
                              <input
                                type="number"
                                min="0"
                                value={ex.tempoTrajeto ?? ''}
                                onChange={e => setExtra(show.id, 'tempoTrajeto', e.target.value)}
                                placeholder="—"
                                style={{
                                  width: 56, background: '#0d0e14',
                                  border: '1px solid rgba(255,255,255,0.1)',
                                  borderRadius: 3, color: ACCENT,
                                  fontFamily: "'JetBrains Mono', monospace",
                                  fontSize: 12, fontWeight: 700,
                                  padding: '4px 8px', outline: 'none',
                                  textAlign: 'center',
                                }}
                                onFocus={e => e.target.style.borderColor = `${ACCENT}60`}
                                onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>

              {/* Right: WPP preview */}
              <div style={{ width: 260, flexShrink: 0 }}>
                <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.2)', letterSpacing: '0.15em', textTransform: 'uppercase', fontFamily: "'JetBrains Mono', monospace", marginBottom: 8 }}>
                  PRÉVIA WPP
                </div>
                <div style={{
                  background: '#0a0b0e',
                  border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: 8, padding: '14px',
                  fontSize: 11, lineHeight: 1.65,
                  color: 'rgba(255,255,255,0.65)',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  fontFamily: 'system-ui, sans-serif',
                  maxHeight: 480, overflowY: 'auto',
                }}>
                  {wppText || <span style={{ color: 'rgba(255,255,255,0.15)', fontStyle: 'italic' }}>Selecione um período com shows...</span>}
                </div>
              </div>
            </>
          )}
        </div>

        {/* ── Footer ── */}
        <div style={{
          padding: '14px 24px', borderTop: '1px solid rgba(255,255,255,0.06)',
          display: 'flex', gap: 10, justifyContent: 'flex-end', flexShrink: 0,
        }}>
          <button onClick={onClose} style={{
            padding: '10px 18px',
            background: 'transparent', border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 4, cursor: 'pointer', color: 'rgba(255,255,255,0.4)',
            fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fontWeight: 700, letterSpacing: '0.1em',
          }}>
            FECHAR
          </button>

          {totalShows > 0 && (
            <>
              <button
                onClick={() => printPDF(wppText, showsByDate)}
                style={{
                  padding: '10px 18px',
                  background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.12)',
                  borderRadius: 4, cursor: 'pointer', color: 'rgba(255,255,255,0.6)',
                  fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fontWeight: 700, letterSpacing: '0.1em',
                  transition: 'all 0.15s',
                }}
                onMouseEnter={e => e.target.style.borderColor = 'rgba(255,255,255,0.3)'}
                onMouseLeave={e => e.target.style.borderColor = 'rgba(255,255,255,0.12)'}
              >
                📄 EXPORTAR PDF
              </button>

              <motion.button
                onClick={copyWPP}
                whileTap={{ scale: 0.96 }}
                style={{
                  position: 'relative', overflow: 'hidden',
                  padding: '10px 24px',
                  background: copied ? 'rgba(61,212,87,0.15)' : `${ACCENT}18`,
                  border: `1px solid ${copied ? '#3dd45780' : ACCENT + '60'}`,
                  borderRadius: 4, cursor: 'pointer',
                  color: copied ? '#3dd457' : ACCENT,
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 11, fontWeight: 700, letterSpacing: '0.1em',
                  boxShadow: `0 0 16px ${copied ? '#3dd45720' : ACCENT + '20'}`,
                  transition: 'all 0.2s',
                }}
              >
                <span style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: copied ? '#3dd457' : ACCENT, borderRadius: '4px 4px 0 0' }} />
                {copied ? '✓ COPIADO!' : '📱 COPIAR WPP'}
              </motion.button>
            </>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

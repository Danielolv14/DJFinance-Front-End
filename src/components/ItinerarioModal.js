import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/* ──────────────────── helpers ──────────────────── */
const MESES_FULL = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho',
                    'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
const DIAS_SEMANA = ['Domingo','Segunda-feira','Terça-feira','Quarta-feira',
                     'Quinta-feira','Sexta-feira','Sábado'];

function fmtDateBR(iso) {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}
function fmtDateLong(iso) {
  if (!iso) return '';
  const d = new Date(iso + 'T12:00:00');
  return `${DIAS_SEMANA[d.getDay()]}, ${d.getDate()} de ${MESES_FULL[d.getMonth()]} de ${d.getFullYear()}`;
}
function subtractMinutes(timeStr, minutes) {
  if (!timeStr || minutes === '' || minutes == null) return '';
  const [h, m] = timeStr.split(':').map(Number);
  const norm = ((h * 60 + m - Number(minutes)) % 1440 + 1440) % 1440;
  return `${String(Math.floor(norm / 60)).padStart(2,'0')}:${String(norm % 60).padStart(2,'0')}`;
}
function nowStamp() {
  const n = new Date();
  return n.toLocaleDateString('pt-BR') + ' às ' + n.toLocaleTimeString('pt-BR', { hour:'2-digit', minute:'2-digit' });
}

/* ──────────────────── WPP text ──────────────────── */
function generateWPP(showsByDate, extras) {
  const dates = Object.keys(showsByDate).sort();
  const lines = [];

  dates.forEach((date, di) => {
    const shows = showsByDate[date];
    if (di > 0) lines.push('');
    lines.push(`━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    lines.push(`🎧 *ITINERÁRIO DRUDS — ${fmtDateBR(date)}*`);
    lines.push(`━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

    shows.forEach((show, idx) => {
      const ex    = extras[show.id] || {};
      const num   = idx + 1;
      const traj  = ex.tempoTrajeto ?? '';
      const saida = ex.horaSaida ?? '';
      const rider = ex.rider ?? (show.rider || 'Combo de Gin');

      lines.push('');
      lines.push(`*${num}. ${(show.evento || '').toUpperCase()}*`);
      lines.push(`📍 *Local:* ${show.endereco || '—'}`);
      lines.push(`⏱ *Início:* ${show.horaInicio || '—'}    ⏳ *Duração:* ${show.duracao || '—'}`);
      lines.push(`🍾 *Rider:* ${rider}`);
      lines.push(`📞 *Contato:* ${(show.contratante || '—').toUpperCase()}`);
    });
  });

  lines.push('');
  lines.push(`_Gerado em ${nowStamp()}_`);
  return lines.join('\n');
}

/* ──────────────────── PDF HTML ──────────────────── */
function buildPDFHtml(showsByDate, extras) {
  const dates = Object.keys(showsByDate).sort();
  const totalShows = Object.values(showsByDate).reduce((a,b) => a + b.length, 0);
  const accentColors = ['#6366f1','#0ea5e9','#10b981','#f59e0b','#ef4444','#8b5cf6'];

  // Global show counter for numbering across dates
  let globalIdx = 0;

  let bodyHtml = '';
  dates.forEach((date, dateIdx) => {
    const dayShows = showsByDate[date];
    const d = new Date(date + 'T12:00:00');

    bodyHtml += `
      <div class="date-row">
        <div class="date-badge">
          <span class="date-day">${d.getDate()}</span>
          <span class="date-mon">${MESES_FULL[d.getMonth()].slice(0,3).toUpperCase()}</span>
        </div>
        <div class="date-label">
          <span class="date-full">${fmtDateLong(date)}</span>
          <span class="date-count">${dayShows.length} evento${dayShows.length !== 1 ? 's' : ''}</span>
        </div>
      </div>`;

    dayShows.forEach((show, idx) => {
      const ex    = extras[show.id] || {};
      const num   = ++globalIdx;
      const col   = accentColors[(globalIdx - 1) % accentColors.length];
      const rider = ex.rider ?? (show.rider || 'Combo de Gin');

      const statusBg  = show.status === 'CONFIRMADO' ? '#dcfce7' : show.status === 'PENDENTE' ? '#fef9c3' : '#f3f4f6';
      const statusCol = show.status === 'CONFIRMADO' ? '#15803d' : show.status === 'PENDENTE' ? '#92400e' : '#6b7280';

      bodyHtml += `
        <div class="event-row" style="border-left: 4px solid ${col};">
          <div class="ev-num" style="color:${col}; border-color:${col}40; background:${col}12;">${String(num).padStart(2,'0')}</div>
          <div class="ev-main">
            <div class="ev-name">${(show.evento || '—').toUpperCase()}
              ${show.status ? `<span class="ev-status" style="background:${statusBg}; color:${statusCol};">${show.status}</span>` : ''}
            </div>
            <div class="ev-addr">📍 ${show.endereco || '—'}</div>
          </div>
          <div class="ev-time">
            ${show.horaInicio ? `<span class="time-badge" style="background:${col}15; color:${col};">⏱ ${show.horaInicio}</span>` : ''}
            ${show.duracao    ? `<span class="time-badge" style="background:#f3f4f6; color:#6b7280;">⏳ ${show.duracao}</span>`     : ''}
          </div>
          <div class="ev-rider">
            <div class="field-lbl">Rider</div>
            <div class="field-val">🍾 ${rider}</div>
          </div>
          <div class="ev-contact">
            <div class="field-lbl">Contato</div>
            <div class="field-val">📞 ${(show.contratante || '—').toUpperCase()}</div>
          </div>
        </div>`;
    });
  });

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<title>Itinerário Druds</title>
<style>
  @page { size: A4; margin: 10mm 12mm; }
  * { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    font-family: 'Segoe UI', -apple-system, Arial, sans-serif;
    background: white;
    color: #1a1a2e;
    font-size: 11px;
    line-height: 1.4;
  }

  /* ── Header ── */
  .doc-header {
    background: linear-gradient(135deg, #1a1a2e 0%, #16213e 55%, #0f3460 100%);
    color: #fff;
    padding: 16px 20px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-radius: 8px;
    margin-bottom: 14px;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .doc-brand {
    font-size: 8px;
    letter-spacing: 3.5px;
    text-transform: uppercase;
    opacity: 0.4;
    margin-bottom: 4px;
  }
  .doc-title {
    font-size: 22px;
    font-weight: 800;
    letter-spacing: -0.3px;
    line-height: 1;
  }
  .doc-title span { color: #818cf8; }
  .doc-subtitle { font-size: 10px; opacity: 0.45; margin-top: 3px; }
  .doc-meta { text-align: right; font-size: 10px; opacity: 0.5; line-height: 1.7; }
  .doc-meta strong { font-size: 24px; opacity: 1; display: block; line-height: 1; }

  /* ── Date row ── */
  .date-row {
    display: flex;
    align-items: center;
    gap: 10px;
    margin: 12px 0 6px;
    padding-bottom: 6px;
    border-bottom: 1.5px solid #e5e7eb;
  }
  .date-badge {
    background: #1a1a2e;
    color: white;
    border-radius: 7px;
    padding: 5px 9px;
    text-align: center;
    min-width: 44px;
    flex-shrink: 0;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .date-day  { display: block; font-size: 17px; font-weight: 800; line-height: 1; }
  .date-mon  { display: block; font-size: 8px; letter-spacing: 1px; opacity: 0.6; margin-top: 1px; text-transform: uppercase; }
  .date-full { font-size: 12px; font-weight: 700; color: #1a1a2e; }
  .date-count { font-size: 10px; color: #9ca3af; margin-left: 8px; }

  /* ── Event row ── */
  .event-row {
    display: grid;
    grid-template-columns: 32px 1fr 100px 130px 130px;
    gap: 10px;
    align-items: center;
    background: #fff;
    border: 1px solid #f0f0f5;
    border-radius: 8px;
    padding: 9px 12px;
    margin-bottom: 5px;
    page-break-inside: avoid;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  .ev-num {
    width: 28px;
    height: 28px;
    border-radius: 7px;
    border: 1.5px solid;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 11px;
    font-weight: 800;
    flex-shrink: 0;
    letter-spacing: -0.5px;
  }

  .ev-name {
    font-size: 12px;
    font-weight: 800;
    color: #111827;
    letter-spacing: 0.2px;
    margin-bottom: 2px;
  }
  .ev-addr { font-size: 10px; color: #6b7280; }

  .ev-status {
    display: inline-block;
    font-size: 8.5px;
    font-weight: 700;
    padding: 1px 6px;
    border-radius: 10px;
    letter-spacing: 0.4px;
    text-transform: uppercase;
    margin-left: 6px;
    vertical-align: middle;
  }

  .ev-time { display: flex; flex-direction: column; gap: 3px; }
  .time-badge {
    display: inline-block;
    font-size: 10px;
    font-weight: 700;
    padding: 2px 7px;
    border-radius: 5px;
    white-space: nowrap;
  }

  .field-lbl { font-size: 8px; text-transform: uppercase; letter-spacing: 0.7px; color: #9ca3af; font-weight: 600; margin-bottom: 2px; }
  .field-val { font-size: 10.5px; font-weight: 500; color: #111827; }

  /* ── Footer ── */
  .doc-footer {
    margin-top: 14px;
    padding-top: 8px;
    border-top: 1px solid #e5e7eb;
    display: flex;
    justify-content: space-between;
    font-size: 9px;
    color: #9ca3af;
  }
  .footer-brand { font-weight: 700; color: #6366f1; letter-spacing: 1px; }
</style>
</head>
<body>

<div class="doc-header">
  <div>
    <div class="doc-brand">Agência DRUDS · Itinerário Oficial</div>
    <div class="doc-title">ITINERÁRIO <span>DRUDS</span></div>
    <div class="doc-subtitle">Gerado em ${nowStamp()}</div>
  </div>
  <div class="doc-meta">
    <strong>${totalShows}</strong>
    show${totalShows !== 1 ? 's' : ''} · ${dates.length} dia${dates.length !== 1 ? 's' : ''}
  </div>
</div>

${bodyHtml}

<div class="doc-footer">
  <span><span class="footer-brand">DRUDS</span> · Itinerário Oficial</span>
  <span>Gerado em ${nowStamp()}</span>
</div>

</body>
</html>`;
}

function openPDF(showsByDate, extras) {
  const html = buildPDFHtml(showsByDate, extras);
  const win  = window.open('', '_blank');
  win.document.write(html);
  win.document.close();
  win.focus();
  setTimeout(() => win.print(), 600);
}

/* ──────────────────── design tokens ──────────────────── */
const ACCENT = '#9a7ef8';
const surface = {
  background: '#13141a',
  border: '1px solid rgba(255,255,255,0.07)',
  borderRadius: 10,
  boxShadow: '0 8px 40px rgba(0,0,0,0.6)',
};

function Toggle({ checked, onChange, label }) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: 7, cursor: 'pointer', userSelect: 'none' }}>
      <div style={{
        width: 30, height: 16, borderRadius: 8, flexShrink: 0,
        background: checked ? ACCENT : 'rgba(255,255,255,0.1)',
        border: `1px solid ${checked ? ACCENT : 'rgba(255,255,255,0.12)'}`,
        position: 'relative', transition: 'all 0.2s',
        boxShadow: checked ? `0 0 8px ${ACCENT}60` : 'none',
      }}>
        <div style={{
          position: 'absolute', top: 2, left: checked ? 14 : 2,
          width: 10, height: 10, borderRadius: '50%',
          background: checked ? '#fff' : 'rgba(255,255,255,0.35)',
          transition: 'left 0.18s',
        }} />
      </div>
      <input type="checkbox" checked={checked} onChange={onChange} style={{ display: 'none' }} />
      <span style={{
        fontSize: 10, fontFamily: "'JetBrains Mono', monospace",
        color: checked ? 'rgba(255,255,255,0.75)' : 'rgba(255,255,255,0.3)',
        letterSpacing: '0.06em',
      }}>{label}</span>
    </label>
  );
}

/* ════════════════════════════════════════════════════════════
   MODAL
   ════════════════════════════════════════════════════════════ */
export default function ItinerarioModal({ shows, onClose }) {
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
        : (a.horaInicio || '').localeCompare(b.horaInicio || ''))
      .forEach(s => {
        if (!map[s.data]) map[s.data] = [];
        map[s.data].push(s);
      });
    return map;
  }, [shows, dataInicio, dataFim]);

  const totalDates = Object.keys(showsByDate).length;
  const totalShows = Object.values(showsByDate).reduce((a, b) => a + b.length, 0);
  const wppText    = useMemo(() => generateWPP(showsByDate, extras), [showsByDate, extras]);

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
                Itinerário <span style={{ color: ACCENT, textShadow: `0 0 16px ${ACCENT}60` }}>DRUDS</span>
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
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#e9edef' }}>Druds DJ</div>
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
                onClick={() => openPDF(showsByDate, extras)}
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

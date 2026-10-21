/* Geração do itinerário: texto para WhatsApp e PDF para impressão, a partir dos shows do período. */
import { MESES } from '../../utils/format';

/* ──────────────────── helpers ──────────────────── */
const DIAS_SEMANA = ['Domingo','Segunda-feira','Terça-feira','Quarta-feira',
                     'Quinta-feira','Sexta-feira','Sábado'];

export function fmtDateBR(iso) {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

export function fmtDateLong(iso) {
  if (!iso) return '';
  const d = new Date(iso + 'T12:00:00');
  return `${DIAS_SEMANA[d.getDay()]}, ${d.getDate()} de ${MESES[d.getMonth()]} de ${d.getFullYear()}`;
}

function nowStamp() {
  const n = new Date();
  return n.toLocaleDateString('pt-BR') + ' às ' + n.toLocaleTimeString('pt-BR', { hour:'2-digit', minute:'2-digit' });
}

/* ──────────────────── WPP text ──────────────────── */
export function minutosNoite(hora) {
  if (!hora) return Number.MAX_SAFE_INTEGER;
  const p = String(hora).split(':');
  let h = parseInt(p[0], 10);
  if (isNaN(h)) return Number.MAX_SAFE_INTEGER;
  const min = parseInt(p[1], 10) || 0;
  if (h < 6) h += 24; // madrugada conta como fim da noite
  return h * 60 + min;
}

export function generateWPP(showsByDate, extras, djNome) {
  const dates = Object.keys(showsByDate).sort();
  const lines = [];

  dates.forEach((date, di) => {
    const shows = showsByDate[date];
    if (di > 0) lines.push('');
    lines.push(`━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    lines.push(`🎧 *ITINERÁRIO ${djNome.toUpperCase()} — ${fmtDateBR(date)}*`);

    shows.forEach((show, idx) => {
      const ex    = extras[show.id] || {};
      const num   = idx + 1;
      const rider = ex.rider ?? (show.rider || 'Combo de Gin');

      lines.push('');
      lines.push(`*${num}. ${(show.evento || '').toUpperCase()}*`);
      lines.push(`📍 *Local:* ${show.endereco || '—'}`);
      lines.push(`⏱ *Início:* ${show.horaInicio || '—'}    ⏳ *Duração:* ${show.duracao || '—'}`);
      if (show.xdj) lines.push(`🎛️ *Equipamento:* ⚠️ Precisa levar XDJ`);
      lines.push(`🍾 *Rider:* ${rider}`);
      lines.push(`📞 *Contato:* ${(show.contratante || '—').toUpperCase()}`);
    });
  });

  lines.push('');
  lines.push(`_Gerado em ${nowStamp()}_`);
  return lines.join('\n');
}

/* ──────────────────── PDF HTML ──────────────────── */
function buildPDFHtml(showsByDate, extras, djNome) {
  const dates = Object.keys(showsByDate).sort();
  const totalShows = Object.values(showsByDate).reduce((a,b) => a + b.length, 0);
  const accentColors = ['#6366f1','#0ea5e9','#10b981','#f59e0b','#ef4444','#8b5cf6'];

  // Global show counter for numbering across dates
  let globalIdx = 0;

  let bodyHtml = '';
  dates.forEach(date => {
    const dayShows = showsByDate[date];
    const d = new Date(date + 'T12:00:00');

    bodyHtml += `
      <div class="date-row">
        <div class="date-badge">
          <span class="date-day">${d.getDate()}</span>
          <span class="date-mon">${MESES[d.getMonth()].slice(0,3).toUpperCase()}</span>
        </div>
        <div class="date-label">
          <span class="date-full">${fmtDateLong(date)}</span>
          <span class="date-count">${dayShows.length} evento${dayShows.length !== 1 ? 's' : ''}</span>
        </div>
      </div>`;

    dayShows.forEach(show => {
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
    <div class="doc-brand">Agência ${djNome.toUpperCase()} · Itinerário Oficial</div>
    <div class="doc-title">ITINERÁRIO <span>${djNome.toUpperCase()}</span></div>
    <div class="doc-subtitle">Gerado em ${nowStamp()}</div>
  </div>
  <div class="doc-meta">
    <strong>${totalShows}</strong>
    show${totalShows !== 1 ? 's' : ''} · ${dates.length} dia${dates.length !== 1 ? 's' : ''}
  </div>
</div>

${bodyHtml}

<div class="doc-footer">
  <span><span class="footer-brand">${djNome.toUpperCase()}</span> · Itinerário Oficial</span>
  <span>Gerado em ${nowStamp()}</span>
</div>

</body>
</html>`;
}

export function openPDF(showsByDate, extras, djNome) {
  const html = buildPDFHtml(showsByDate, extras, djNome);
  const win  = window.open('', '_blank');
  win.document.write(html);
  win.document.close();
  win.focus();
  setTimeout(() => win.print(), 600);
}

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const MESES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho',
               'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];

/* ─── Helpers ─────────────────────────────────────────────────── */
function moeda(v) {
  return new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(v||0);
}
function moedaShort(v) {
  return new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL',minimumFractionDigits:0}).format(v||0);
}
function fmtData(d) {
  if (!d) return '—';
  return d.toString().split('-').reverse().join('/');
}
function fmtDataShort(d) {
  if (!d) return '—';
  const parts = d.toString().split('-');
  return `${parts[2]}/${parts[1]}`;
}
function parseDuracao(d) {
  if (!d) return 0;
  const m = d.match(/(\d+)h(?:(\d+)(?:min)?)?/i);
  if (!m) return 0;
  return parseInt(m[1]) + (parseInt(m[2] || 0) / 60);
}
function formatTotalHoras(totalH) {
  if (!totalH) return '0h';
  const h = Math.floor(totalH);
  const m = Math.round((totalH - h) * 60);
  return m > 0 ? `${h}h${String(m).padStart(2,'0')}min` : `${h}h`;
}
function extrairCidade(endereco) {
  if (!endereco) return null;
  const match = endereco.match(/[—–]\s*([^,]+)/);
  if (match) return match[1].trim();
  const parts = endereco.split('-');
  if (parts.length > 1) return parts[parts.length-1].trim().split(',')[0].trim();
  return null;
}

/* ═══════════════════════════════════════════════════════════════
   MAIN EXPORT
   ═══════════════════════════════════════════════════════════════ */
export async function gerarPDFFechamento(dados) {
  const doc     = new jsPDF({ orientation:'portrait', unit:'mm', format:'a4' });
  const W       = 210;
  const H       = 297;
  const MARGIN  = 14;
  const INNER   = W - MARGIN * 2;
  const nomeMes = MESES[(dados.mes || 1) - 1];
  const shows   = dados.shows || [];

  /* ── Palette ── */
  const BG     = [13,  14,  22];
  const BG2    = [20,  22,  32];
  const BG3    = [30,  33,  50];
  const FG     = [230, 232, 240];
  const FG2    = [130, 140, 165];
  const FG3    = [65,  72,  95];
  const BLUE   = [77,  143, 255];
  const GREEN  = [61,  212, 87];
  const ORANGE = [255, 148, 38];
  const PURPLE = [155, 126, 255];
  const RED    = [255, 99,  99];
  const YELLOW = [255, 210, 60];
  const VERM   = (dados.lucroLiquido >= 0) ? GREEN : RED;

  /* ── Pre-computed stats ── */
  const showsSorted   = [...shows].sort((a,b) => (a.data||'').localeCompare(b.data||''));
  const totalHoras    = shows.reduce((a,s) => a + parseDuracao(s.duracao), 0);
  const cidades       = shows.map(s => extrairCidade(s.endereco)).filter(Boolean);
  const cidadesSet    = [...new Set(cidades)];
  const cidadesCount  = {};
  cidades.forEach(c => { cidadesCount[c] = (cidadesCount[c]||0) + 1; });
  const cidadesRank   = Object.entries(cidadesCount).sort((a,b) => b[1]-a[1]);
  const showsComCache = shows.filter(s => (s.cache||0) > 0);
  const ticketMedio   = showsComCache.length
    ? Math.round((dados.totalBruto / showsComCache.length) * 100) / 100 : 0;
  const destaque      = [...shows].sort((a,b) => (b.cache||0)-(a.cache||0))[0];

  /* ════════════════════════════════════════════
     DRAWING PRIMITIVES
     ════════════════════════════════════════════ */

  function fillBg() {
    doc.setFillColor(...BG);
    doc.rect(0, 0, W, H, 'F');
    doc.setFillColor(...BG2);
    doc.rect(0, H-13, W, 13, 'F');
    doc.setFillColor(...BLUE);
    doc.rect(0, H-13, W, 0.5, 'F');
  }

  function drawHeader(subtitle) {
    doc.setFillColor(...BG2);
    doc.rect(0, 0, W, 40, 'F');
    [[77,143,255,1.2],[100,163,255,0.7],[130,183,255,0.35]].forEach(([r,g,b,h],i) => {
      doc.setFillColor(r,g,b); doc.rect(0, i*0.8, W, h, 'F');
    });
    doc.setFillColor(...BLUE);
    doc.rect(0, 39.5, W, 0.7, 'F');

    // Left: brand
    doc.setFont('helvetica','bold'); doc.setFontSize(22); doc.setTextColor(...FG);
    doc.text('DRUDS', MARGIN, 16);
    doc.setFont('helvetica','normal'); doc.setFontSize(8); doc.setTextColor(...FG2);
    doc.text(subtitle, MARGIN, 23);
    doc.setFillColor(...BLUE);
    doc.roundedRect(MARGIN, 27.5, 52, 7.5, 2, 2, 'F');
    doc.setFont('helvetica','bold'); doc.setFontSize(6.5); doc.setTextColor(255,255,255);
    doc.text('DRUDS FINANCEIRO', MARGIN+26, 32.8, { align:'center' });

    // Right: month/year
    doc.setFont('helvetica','bold'); doc.setFontSize(22); doc.setTextColor(...FG);
    doc.text(nomeMes.toUpperCase(), W-MARGIN, 16, { align:'right' });
    doc.setFont('helvetica','bold'); doc.setFontSize(13); doc.setTextColor(...BLUE);
    doc.text(String(dados.ano), W-MARGIN, 25, { align:'right' });
    const now = new Date();
    doc.setFont('helvetica','normal'); doc.setFontSize(7); doc.setTextColor(...FG3);
    doc.text(
      `Gerado em ${now.toLocaleDateString('pt-BR')} às ${now.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})}`,
      W-MARGIN, 33, { align:'right' }
    );
  }

  function pill(text, x, y) {
    doc.setFont('helvetica','bold'); doc.setFontSize(6);
    const tw = doc.getTextWidth(text);
    const pw = tw + 8; const ph = 6;
    doc.setFillColor(...BG3);
    doc.roundedRect(x, y-4.5, pw, ph, 1.5, 1.5, 'F');
    doc.setTextColor(...FG2);
    doc.text(text, x+pw/2, y-0.5, { align:'center' });
    return y + 3;
  }

  function sectionLine(text, y) {
    const ny = pill(text, MARGIN, y);
    return ny + 2;
  }

  function kpiCard(x, y, w, h, color, label, value, sub) {
    doc.setFillColor(...BG2);
    doc.roundedRect(x, y, w, h, 2.5, 2.5, 'F');
    doc.setFillColor(...color);
    doc.roundedRect(x, y, w, 2.5, 1.5, 1.5, 'F');
    doc.rect(x, y+1.2, w, 1.3, 'F');
    doc.setFont('helvetica','bold'); doc.setFontSize(6); doc.setTextColor(...color);
    doc.text(label, x+w/2, y+8.5, { align:'center' });
    doc.setFont('helvetica','bold'); doc.setFontSize(9); doc.setTextColor(...FG);
    doc.text(value, x+w/2, y+15.5, { align:'center' });
    doc.setFont('helvetica','normal'); doc.setFontSize(5.5); doc.setTextColor(...FG3);
    doc.text(sub, x+w/2, y+21.5, { align:'center' });
  }

  function footer(pg, total, label) {
    const pH = H;
    doc.setFillColor(...BG2); doc.rect(0, pH-13, W, 13, 'F');
    doc.setFillColor(...BLUE); doc.rect(0, pH-13, W, 0.5, 'F');
    doc.setFont('helvetica','bold'); doc.setFontSize(7.5); doc.setTextColor(...BLUE);
    doc.text('DRUDS', MARGIN, pH-7);
    doc.setFont('helvetica','normal'); doc.setFontSize(6.5); doc.setTextColor(...FG3);
    doc.text('Druds Financeiro', MARGIN+14, pH-7);
    doc.text(`Página ${pg} de ${total}  ·  ${nomeMes} / ${dados.ano}  ·  ${label}`, W-MARGIN, pH-7, { align:'right' });
  }

  /* ════════════════════════════════════════════
     PÁGINA 1 — RETROSPECTIVA
     ════════════════════════════════════════════ */
  fillBg();
  drawHeader('RETROSPECTIVA MENSAL');
  let y = 48;

  /* ── MÊS EM NÚMEROS ── */
  y = sectionLine(`${nomeMes.toUpperCase()} EM NÚMEROS`, y);
  const sw = (INNER - 6) / 3;
  const sh = 28;

  // Shows
  let cx = MARGIN;
  doc.setFillColor(...BG2); doc.roundedRect(cx, y, sw, sh, 3, 3, 'F');
  doc.setFillColor(...BLUE); doc.roundedRect(cx, y, sw, 2, 1.5, 1.5, 'F'); doc.rect(cx, y+1, sw, 1, 'F');
  doc.setFont('helvetica','bold'); doc.setFontSize(28); doc.setTextColor(...FG);
  doc.text(String(dados.quantidadeShows), cx+sw/2, y+17, { align:'center' });
  doc.setFont('helvetica','normal'); doc.setFontSize(7.5); doc.setTextColor(...FG2);
  doc.text('Shows Realizados', cx+sw/2, y+22, { align:'center' });
  doc.setFontSize(6); doc.setTextColor(...FG3);
  doc.text('eventos na agenda do mês', cx+sw/2, y+26, { align:'center' });

  // Horas
  cx = MARGIN + sw + 3;
  doc.setFillColor(...BG2); doc.roundedRect(cx, y, sw, sh, 3, 3, 'F');
  doc.setFillColor(...GREEN); doc.roundedRect(cx, y, sw, 2, 1.5, 1.5, 'F'); doc.rect(cx, y+1, sw, 1, 'F');
  doc.setFont('helvetica','bold'); doc.setFontSize(totalHoras >= 10 ? 22 : 28); doc.setTextColor(...FG);
  doc.text(formatTotalHoras(totalHoras), cx+sw/2, y+17, { align:'center' });
  doc.setFont('helvetica','normal'); doc.setFontSize(7.5); doc.setTextColor(...FG2);
  doc.text('Horas de Set', cx+sw/2, y+22, { align:'center' });
  doc.setFontSize(6); doc.setTextColor(...FG3);
  doc.text('total de apresentação', cx+sw/2, y+26, { align:'center' });

  // Venues
  cx = MARGIN + 2*(sw+3);
  doc.setFillColor(...BG2); doc.roundedRect(cx, y, sw, sh, 3, 3, 'F');
  doc.setFillColor(...PURPLE); doc.roundedRect(cx, y, sw, 2, 1.5, 1.5, 'F'); doc.rect(cx, y+1, sw, 1, 'F');
  doc.setFont('helvetica','bold'); doc.setFontSize(28); doc.setTextColor(...FG);
  doc.text(String(cidadesSet.length || shows.length), cx+sw/2, y+17, { align:'center' });
  doc.setFont('helvetica','normal'); doc.setFontSize(7.5); doc.setTextColor(...FG2);
  doc.text('Venues Diferentes', cx+sw/2, y+22, { align:'center' });
  doc.setFontSize(6); doc.setTextColor(...FG3);
  doc.text('locais de apresentação', cx+sw/2, y+26, { align:'center' });

  y += sh + 7;

  /* ── Narrativa ── */
  const cidadesMencao = cidadesRank.slice(0,3).map(([c])=>c).join(', ') || 'diferentes locais';
  const narrativa = `Em ${nomeMes.toLowerCase()}, Druds DJ manteve uma agenda com ${dados.quantidadeShows} show${dados.quantidadeShows!==1?'s':''} e ${formatTotalHoras(totalHoras)} de set, passando por ${cidadesMencao}.`;
  doc.setFont('helvetica','normal'); doc.setFontSize(8); doc.setTextColor(...FG2);
  const narLines = doc.splitTextToSize(narrativa, INNER);
  doc.text(narLines, MARGIN, y);
  y += narLines.length * 5 + 7;

  /* ── DESTAQUE DO MÊS ── */
  if (destaque) {
    y = sectionLine('DESTAQUE DO MÊS', y);
    const dH = 22;
    doc.setFillColor(...BG2); doc.roundedRect(MARGIN, y, INNER, dH, 3, 3, 'F');
    // Accent left bar
    doc.setFillColor(...YELLOW); doc.roundedRect(MARGIN, y, 3, dH, 1.5, 1.5, 'F');
    doc.rect(MARGIN+1.5, y, 1.5, dH, 'F');

    doc.setFont('helvetica','bold'); doc.setFontSize(11); doc.setTextColor(...FG);
    doc.text((destaque.evento||'Show do Mês').substring(0,48), MARGIN+8, y+9);

    doc.setFont('helvetica','normal'); doc.setFontSize(7.5); doc.setTextColor(...FG2);
    const endStr = destaque.endereco ? destaque.endereco.substring(0,55) : '—';
    doc.text(endStr, MARGIN+8, y+15.5);

    // Cachê badge right side
    doc.setFont('helvetica','bold'); doc.setFontSize(11); doc.setTextColor(...YELLOW);
    doc.text(moedaShort(destaque.cache), W-MARGIN, y+9, { align:'right' });
    doc.setFont('helvetica','normal'); doc.setFontSize(6.5); doc.setTextColor(...FG3);
    doc.text('maior cachê do mês', W-MARGIN, y+15.5, { align:'right' });
    y += dH + 8;
  }

  /* ── CIDADES E REGIÕES ── */
  if (cidadesRank.length > 0) {
    y = sectionLine('CIDADES E REGIÕES', y);
    const cols = Math.min(cidadesRank.length, 5);
    const cw   = (INNER - (cols-1)*3) / cols;
    const ch   = 22;
    cidadesRank.slice(0, cols).forEach(([cidade, count], i) => {
      const x = MARGIN + i*(cw+3);
      doc.setFillColor(...BG2); doc.roundedRect(x, y, cw, ch, 2.5, 2.5, 'F');
      doc.setFont('helvetica','bold'); doc.setFontSize(22); doc.setTextColor(...FG);
      doc.text(String(count), x+cw/2, y+12, { align:'center' });
      doc.setFont('helvetica','normal'); doc.setFontSize(6.5); doc.setTextColor(...FG2);
      doc.text('Shows', x+cw/2, y+17, { align:'center' });
      doc.setFontSize(6); doc.setTextColor(...FG3);
      const cidShort = cidade.length > 14 ? cidade.substring(0,13)+'.' : cidade;
      doc.text(cidShort, x+cw/2, y+21, { align:'center' });
    });
    y += ch + 8;
  }

  /* ── AGENDA / TIMELINE ── */
  y = sectionLine('AGENDA DO MÊS', y);
  const midX    = W / 2;
  const ITEM_H  = 11;
  const maxItems = Math.floor((H - 20 - y) / ITEM_H);
  const itemsToShow = Math.min(showsSorted.length, maxItems);

  showsSorted.slice(0, itemsToShow).forEach((s, i) => {
    const dotY = y + ITEM_H / 2;
    const isLeft = i % 2 === 0;

    // Vertical line
    if (i < itemsToShow - 1) {
      doc.setDrawColor(...FG3); doc.setLineWidth(0.4);
      doc.line(midX, dotY, midX, dotY + ITEM_H);
    }
    // Horizontal connector line
    doc.setDrawColor(...FG3); doc.setLineWidth(0.3);
    if (isLeft) doc.line(midX-12, dotY, midX-2, dotY);
    else         doc.line(midX+2, dotY, midX+12, dotY);

    // Dot
    doc.setFillColor(...BLUE); doc.circle(midX, dotY, 1.8, 'F');

    // Date (bold, colored)
    const textX = isLeft ? midX - 15 : midX + 15;
    const align = isLeft ? 'right' : 'left';
    doc.setFont('helvetica','bold'); doc.setFontSize(7); doc.setTextColor(...BLUE);
    doc.text(fmtDataShort(s.data), textX, dotY - 1, { align });

    // Event + duration
    const eventText = `${(s.evento||'Show').substring(0,32)}${s.duracao?' · '+s.duracao:''}`;
    doc.setFont('helvetica','normal'); doc.setFontSize(6.5); doc.setTextColor(...FG2);
    doc.text(eventText, textX, dotY + 4, { align });

    y += ITEM_H;
  });

  if (showsSorted.length > itemsToShow) {
    doc.setFont('helvetica','normal'); doc.setFontSize(6.5); doc.setTextColor(...FG3);
    doc.text(`... e mais ${showsSorted.length - itemsToShow} shows`, midX, y + 4, { align:'center' });
  }

  /* ════════════════════════════════════════════
     PÁGINA 2 — FINANCEIRO
     ════════════════════════════════════════════ */
  doc.addPage();
  fillBg();
  drawHeader('RESUMO FINANCEIRO');
  y = 48;

  /* ── KPI Cards ── */
  y = sectionLine('PERFORMANCE FINANCEIRA', y);
  const cards = [
    { label:'FATURAMENTO',   value: moeda(dados.totalBruto),   color: BLUE,
      sub:'bruto total' },
    { label:'LUCRO LÍQUIDO', value: moeda(dados.lucroLiquido), color: VERM,
      sub:`${dados.totalBruto>0 ? Math.round((dados.lucroLiquido/dados.totalBruto)*100) : 0}% do bruto` },
    { label:'DANIEL',        value: moeda(dados.totalDaniel),  color: ORANGE,
      sub:`${dados.totalBruto>0 ? Math.round((dados.totalDaniel/dados.totalBruto)*100) : 0}% do bruto` },
    { label:'YURI',          value: moeda(dados.totalYuri),    color: PURPLE,
      sub:'R$300/show' },
    ...(dados.totalCustos > 0
      ? [{ label:'CUSTOS', value: moeda(dados.totalCustos), color: RED,
           sub:`${dados.totalBruto>0 ? Math.round((dados.totalCustos/dados.totalBruto)*100) : 0}% do bruto` }]
      : []),
  ];
  const nC = cards.length;
  const cW = (INNER - (nC-1)*3) / nC;
  const cH = 24;
  cards.forEach((card, i) => kpiCard(MARGIN + i*(cW+3), y, cW, cH, card.color, card.label, card.value, card.sub));
  y += cH + 8;

  /* ── Ticket Médio + Maior Cachê ── */
  y = sectionLine('DETALHES', y);
  const extras = [
    { label:'TICKET MÉDIO', value: moedaShort(ticketMedio), sub:'média por show', color: BLUE },
    { label:'MAIOR CACHÊ',  value: moedaShort(destaque?.cache||0),
      sub:(destaque?.evento||'').substring(0,22), color: YELLOW },
    ...(dados.totalImpostos > 0
      ? [{ label:'IMPOSTOS', value: moedaShort(dados.totalImpostos),
           sub:`${dados.totalBruto>0?Math.round(dados.totalImpostos/dados.totalBruto*100):0}% do bruto`,
           color: RED }]
      : []),
  ];
  const eN = extras.length;
  const eW = (INNER - (eN-1)*3) / eN;
  const eH = 18;
  extras.forEach((e, i) => {
    const x = MARGIN + i*(eW+3);
    doc.setFillColor(...BG2); doc.roundedRect(x, y, eW, eH, 2.5, 2.5, 'F');
    doc.setFont('helvetica','bold'); doc.setFontSize(5.5); doc.setTextColor(...e.color);
    doc.text(e.label, x+eW/2, y+6, { align:'center' });
    doc.setFont('helvetica','bold'); doc.setFontSize(9.5); doc.setTextColor(...FG);
    doc.text(e.value, x+eW/2, y+12, { align:'center' });
    doc.setFont('helvetica','normal'); doc.setFontSize(5.5); doc.setTextColor(...FG3);
    doc.text(e.sub, x+eW/2, y+eH-2, { align:'center' });
  });
  y += eH + 8;

  /* ── Bar chart ── */
  const chartShows = showsComCache.slice(0, 10);
  if (chartShows.length > 0) {
    y = sectionLine('RECEITA POR SHOW', y);
    const maxVal  = Math.max(...chartShows.map(s => s.cache), 1);
    const LABEL_W = 52; const VALUE_W = 24;
    const BAR_MAX = INNER - LABEL_W - VALUE_W - 4;
    const BAR_H   = 5.5; const BAR_GAP = 3;
    const STATUS_C = { CONFIRMADO: GREEN, PENDENTE: YELLOW, CANCELADO: RED };

    chartShows.forEach(s => {
      const barW  = ((s.cache||0) / maxVal) * BAR_MAX;
      const clr   = STATUS_C[s.status] || BLUE;
      const barX  = MARGIN + LABEL_W + 2;
      const textY = y + BAR_H - 1.2;

      doc.setFont('helvetica','normal'); doc.setFontSize(6.5); doc.setTextColor(...FG2);
      doc.text((s.evento||'Show').substring(0,24), MARGIN, textY);

      doc.setFillColor(...BG3); doc.roundedRect(barX, y, BAR_MAX, BAR_H, 1.2, 1.2, 'F');
      if (barW > 0.5) { doc.setFillColor(...clr); doc.roundedRect(barX, y, barW, BAR_H, 1.2, 1.2, 'F'); }

      doc.setFont('helvetica','bold'); doc.setFontSize(6.5); doc.setTextColor(...clr);
      doc.text(moeda(s.cache||0), barX+BAR_MAX+VALUE_W, textY, { align:'right' });
      y += BAR_H + BAR_GAP;
    });
    y += 6;
  }

  /* ── Shows Table ── */
  y = sectionLine('DETALHAMENTO DOS SHOWS', y);
  y += 2;
  const hasCustos = dados.totalCustos > 0;
  const columns = [
    { header:'DATA',         dataKey:'data'        },
    { header:'EVENTO',       dataKey:'evento'      },
    { header:'CONTRATANTE',  dataKey:'contratante' },
    { header:'CACHÊ',        dataKey:'cache'       },
    ...(hasCustos ? [{ header:'CUSTOS', dataKey:'custos' }] : []),
    { header:'STATUS',       dataKey:'status'      },
  ];
  const rows = shows.map(s => ({
    data:        fmtData(s.data),
    evento:      s.evento       || '—',
    contratante: s.contratante  || '—',
    cache:       s.cache        ? moeda(s.cache)  : '—',
    ...(hasCustos ? { custos: s.custos ? moeda(s.custos) : '—' } : {}),
    status:      s.status       || '—',
  }));

  autoTable(doc, {
    startY: y,
    columns, body: rows,
    margin: { left: MARGIN, right: MARGIN, bottom: 16 },
    styles: {
      fontSize: 7.5,
      cellPadding: { top:3.5, bottom:3.5, left:4, right:4 },
      textColor: FG2, lineColor: BG3, lineWidth: 0.15,
      fillColor: BG, font: 'helvetica',
    },
    headStyles:         { fillColor: BG3, textColor: BLUE, fontStyle:'bold', fontSize:7 },
    alternateRowStyles: { fillColor: BG2 },
    columnStyles: {
      0: { cellWidth: 20 },
      3: { halign:'right' },
      ...(hasCustos ? { 4: { halign:'right' } } : {}),
    },
    didParseCell(data) {
      if (data.section !== 'body') return;
      if (data.column.dataKey === 'cache') {
        data.cell.styles.textColor = GREEN; data.cell.styles.fontStyle = 'bold';
      }
      if (data.column.dataKey === 'status') {
        const s = data.cell.raw;
        if      (s === 'CONFIRMADO') data.cell.styles.textColor = GREEN;
        else if (s === 'PENDENTE')   data.cell.styles.textColor = YELLOW;
        else if (s === 'CANCELADO')  data.cell.styles.textColor = RED;
        data.cell.styles.fontStyle = 'bold';
      }
    },
    didAddPage() { fillBg(); drawHeader('RESUMO FINANCEIRO'); },
  });

  /* ── Footers (all pages) ── */
  const pageCount  = doc.getNumberOfPages();
  const pageLabels = Array(pageCount).fill('').map((_, i) =>
    i === 0 ? 'RETROSPECTIVA' : 'FINANCEIRO'
  );
  for (let pg = 1; pg <= pageCount; pg++) {
    doc.setPage(pg);
    footer(pg, pageCount, pageLabels[pg-1]);
  }

  doc.save(`retrospectiva-${nomeMes.toLowerCase()}-${dados.ano}.pdf`);
}

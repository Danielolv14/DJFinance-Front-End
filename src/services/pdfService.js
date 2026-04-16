import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const MESES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho',
               'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];

function moeda(v) {
  return new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(v||0);
}
function fmtData(d) {
  if (!d) return '—';
  return d.toString().split('-').reverse().join('/');
}

export async function gerarPDFFechamento(dados) {
  const doc     = new jsPDF({ orientation:'portrait', unit:'mm', format:'a4' });
  const W       = doc.internal.pageSize.getWidth();   // 210
  const H       = doc.internal.pageSize.getHeight();  // 297
  const nomeMes = MESES[(dados.mes || 1) - 1];

  /* ── Palette ─────────────────────────────────────────────── */
  const BG     = [13,  14,  22 ];
  const BG2    = [20,  22,  32 ];
  const BG3    = [30,  33,  50 ];
  const FG     = [230, 232, 240];
  const FG2    = [130, 140, 165];
  const FG3    = [65,  72,  95 ];

  const BLUE   = [77,  143, 255];
  const GREEN  = [61,  212, 87 ];
  const ORANGE = [255, 148, 38 ];
  const PURPLE = [155, 126, 255];
  const RED    = [255, 99,  99 ];
  const YELLOW = [255, 210, 60 ];
  const VERM   = dados.lucroLiquido >= 0 ? GREEN : RED;

  /* ── Fill page with dark background ─────────────────────── */
  function fillBg() {
    doc.setFillColor(...BG);
    doc.rect(0, 0, W, H, 'F');
    // Footer strip
    doc.setFillColor(...BG2);
    doc.rect(0, H - 13, W, 13, 'F');
    doc.setFillColor(...BLUE);
    doc.rect(0, H - 13, W, 0.5, 'F');
  }
  fillBg();

  let y = 0;

  /* ══ HEADER ════════════════════════════════════════════════ */
  doc.setFillColor(...BG2);
  doc.rect(0, 0, W, 40, 'F');
  // Top tri-color glow strip
  [[77,143,255,1.2],[100,163,255,0.7],[130,183,255,0.35]].forEach(([r,g,b,h],i) => {
    doc.setFillColor(r,g,b);
    doc.rect(0, i * 0.8, W, h, 'F');
  });
  // Bottom separator
  doc.setFillColor(...BLUE);
  doc.rect(0, 39.5, W, 0.7, 'F');

  // Brand
  doc.setFont('helvetica','bold');
  doc.setFontSize(22);
  doc.setTextColor(...FG);
  doc.text('DRUDS', 14, 16);

  doc.setFont('helvetica','normal');
  doc.setFontSize(8);
  doc.setTextColor(...FG2);
  doc.text('SISTEMA DE FECHAMENTO FINANCEIRO', 14, 23);

  // Blue pill
  doc.setFillColor(...BLUE);
  doc.roundedRect(14, 27.5, 52, 7.5, 2, 2, 'F');
  doc.setFont('helvetica','bold');
  doc.setFontSize(6.5);
  doc.setTextColor(255, 255, 255);
  doc.text('XDJ FINANCE  ·  PIONEER DJ', 40, 32.8, { align:'center' });

  // Month/year (right-aligned)
  doc.setFont('helvetica','bold');
  doc.setFontSize(22);
  doc.setTextColor(...FG);
  doc.text(nomeMes.toUpperCase(), W - 14, 16, { align:'right' });

  doc.setFont('helvetica','bold');
  doc.setFontSize(13);
  doc.setTextColor(...BLUE);
  doc.text(String(dados.ano), W - 14, 25, { align:'right' });

  const now = new Date();
  doc.setFont('helvetica','normal');
  doc.setFontSize(7);
  doc.setTextColor(...FG3);
  doc.text(
    `Gerado em ${now.toLocaleDateString('pt-BR')} às ${now.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})}`,
    W - 14, 33, { align:'right' }
  );

  y = 48;

  /* ══ SECTION LABEL ═════════════════════════════════════════ */
  doc.setFont('helvetica','bold');
  doc.setFontSize(7);
  doc.setTextColor(...FG3);
  doc.text(
    `◈  RESUMO FINANCEIRO  ·  ${dados.quantidadeShows} SHOW${dados.quantidadeShows !== 1 ? 'S' : ''} NO PERÍODO`,
    14, y
  );
  y += 5;

  /* ══ KPI CARDS ═════════════════════════════════════════════ */
  const cards = [
    { label:'FATURAMENTO',   value: dados.totalBruto,    color: BLUE,   sub:'bruto total' },
    { label:'LUCRO LÍQUIDO', value: dados.lucroLiquido,  color: VERM,
      sub:`${dados.totalBruto > 0 ? Math.round((dados.lucroLiquido/dados.totalBruto)*100) : 0}% do bruto` },
    { label:'DANIEL',        value: dados.totalDaniel,   color: ORANGE,
      sub:`${dados.totalBruto > 0 ? Math.round((dados.totalDaniel/dados.totalBruto)*100) : 0}% do bruto` },
    { label:'YURI',          value: dados.totalYuri,     color: PURPLE, sub:'R$300/show' },
    ...(dados.totalCustos > 0
      ? [{ label:'CUSTOS OP.',   value: dados.totalCustos, color: RED,
           sub:`${dados.totalBruto > 0 ? Math.round((dados.totalCustos/dados.totalBruto)*100) : 0}% do bruto` }]
      : []),
  ];

  const nC  = cards.length;
  const cW  = (W - 28 - (nC - 1) * 3) / nC;
  const cH  = 24;

  cards.forEach((card, i) => {
    const cx = 14 + i * (cW + 3);

    // Card background
    doc.setFillColor(...BG2);
    doc.roundedRect(cx, y, cW, cH, 2.5, 2.5, 'F');

    // Top color bar (simulated round-top + flat-bottom)
    doc.setFillColor(...card.color);
    doc.roundedRect(cx, y, cW, 2.5, 1.5, 1.5, 'F');
    doc.rect(cx, y + 1.2, cW, 1.3, 'F');

    // Label
    doc.setFont('helvetica','bold');
    doc.setFontSize(6);
    doc.setTextColor(...card.color);
    doc.text(card.label, cx + cW / 2, y + 8.5, { align:'center' });

    // Value
    doc.setFont('helvetica','bold');
    doc.setFontSize(9);
    doc.setTextColor(...FG);
    doc.text(moeda(card.value), cx + cW / 2, y + 15.5, { align:'center' });

    // Sub
    doc.setFont('helvetica','normal');
    doc.setFontSize(5.5);
    doc.setTextColor(...FG3);
    doc.text(card.sub, cx + cW / 2, y + 21.5, { align:'center' });
  });

  y += cH + 9;

  /* ══ HORIZONTAL BAR CHART ══════════════════════════════════ */
  const showsComCache = (dados.shows || []).filter(s => (s.cache || 0) > 0);
  const chartShows    = showsComCache.slice(0, 10);

  if (chartShows.length > 0) {
    // Section title
    doc.setFont('helvetica','bold');
    doc.setFontSize(7);
    doc.setTextColor(...FG3);
    doc.text('◈  RECEITA POR SHOW', 14, y);
    doc.setFillColor(...BLUE);
    doc.rect(14, y + 1.5, 32, 0.4, 'F');
    y += 7;

    const maxVal   = Math.max(...chartShows.map(s => s.cache), 1);
    const LABEL_W  = 52;
    const VALUE_W  = 24;
    const BAR_MAX  = W - 28 - LABEL_W - VALUE_W - 4;
    const BAR_H    = 4.5;
    const BAR_GAP  = 2.5;
    const STATUS_C = { CONFIRMADO: GREEN, PENDENTE: YELLOW, CANCELADO: RED };

    chartShows.forEach(s => {
      const barW   = ((s.cache || 0) / maxVal) * BAR_MAX;
      const barClr = STATUS_C[s.status] || BLUE;
      const barX   = 14 + LABEL_W + 2;
      const valX   = barX + BAR_MAX + 3;
      const textY  = y + BAR_H - 1.3;

      // Show name label
      doc.setFont('helvetica','normal');
      doc.setFontSize(6.5);
      doc.setTextColor(...FG2);
      doc.text((s.evento || 'Show').substring(0, 22), 14, textY);

      // Bar track
      doc.setFillColor(...BG3);
      doc.roundedRect(barX, y, BAR_MAX, BAR_H, 1, 1, 'F');

      // Bar fill
      if (barW > 0.5) {
        doc.setFillColor(...barClr);
        doc.roundedRect(barX, y, barW, BAR_H, 1, 1, 'F');
      }

      // Value
      doc.setFont('helvetica','bold');
      doc.setFontSize(6.5);
      doc.setTextColor(...barClr);
      doc.text(moeda(s.cache || 0), valX + VALUE_W - 2, textY, { align:'right' });

      y += BAR_H + BAR_GAP;
    });

    y += 6;
  }

  /* ══ TABLE TITLE ════════════════════════════════════════════ */
  doc.setFont('helvetica','bold');
  doc.setFontSize(7);
  doc.setTextColor(...FG3);
  doc.text('◈  DETALHAMENTO DOS SHOWS', 14, y);
  doc.setFillColor(...BLUE);
  doc.rect(14, y + 1.5, 44, 0.4, 'F');
  y += 4;

  /* ══ SHOWS TABLE ════════════════════════════════════════════ */
  const hasCustos = dados.totalCustos > 0;
  const columns   = [
    { header:'DATA',         dataKey:'data'        },
    { header:'EVENTO',       dataKey:'evento'      },
    { header:'CONTRATANTE',  dataKey:'contratante' },
    { header:'CACHÊ',        dataKey:'cache'       },
    ...(hasCustos ? [{ header:'CUSTOS', dataKey:'custos' }] : []),
    { header:'STATUS',       dataKey:'status'      },
  ];

  const rows = (dados.shows || []).map(s => ({
    data:        fmtData(s.data),
    evento:      s.evento       || '—',
    contratante: s.contratante  || '—',
    cache:       s.cache        ? moeda(s.cache)  : 'R$ 110,00',
    ...(hasCustos ? { custos: s.custos ? moeda(s.custos) : '—' } : {}),
    status:      s.status       || '—',
  }));

  autoTable(doc, {
    startY: y + 2,
    columns,
    body: rows,
    margin: { left:14, right:14, bottom:16 },
    styles: {
      fontSize:     7.5,
      cellPadding:  { top:3.5, bottom:3.5, left:4, right:4 },
      textColor:    FG2,
      lineColor:    BG3,
      lineWidth:    0.15,
      fillColor:    BG,
      font:         'helvetica',
    },
    headStyles: {
      fillColor: BG3,
      textColor: BLUE,
      fontStyle: 'bold',
      fontSize:  7,
    },
    alternateRowStyles: {
      fillColor: BG2,
    },
    columnStyles: {
      0: { cellWidth:20 },
      3: { halign:'right' },
      ...(hasCustos ? { 4: { halign:'right' } } : {}),
    },
    didParseCell(data) {
      if (data.section !== 'body') return;
      if (data.column.dataKey === 'cache') {
        data.cell.styles.textColor = GREEN;
        data.cell.styles.fontStyle = 'bold';
      }
      if (data.column.dataKey === 'status') {
        const s = data.cell.raw;
        if      (s === 'CONFIRMADO') data.cell.styles.textColor = GREEN;
        else if (s === 'PENDENTE')   data.cell.styles.textColor = YELLOW;
        else if (s === 'CANCELADO')  data.cell.styles.textColor = RED;
        data.cell.styles.fontStyle = 'bold';
      }
    },
    didAddPage() {
      fillBg();
    },
  });

  /* ══ FOOTER (all pages) ════════════════════════════════════ */
  const pageCount = doc.getNumberOfPages();
  for (let pg = 1; pg <= pageCount; pg++) {
    doc.setPage(pg);
    const pH = doc.internal.pageSize.getHeight();

    // Ensure footer strip exists (may have been drawn over by table on pg 1)
    doc.setFillColor(...BG2);
    doc.rect(0, pH - 13, W, 13, 'F');
    doc.setFillColor(...BLUE);
    doc.rect(0, pH - 13, W, 0.5, 'F');

    doc.setFont('helvetica','bold');
    doc.setFontSize(7.5);
    doc.setTextColor(...BLUE);
    doc.text('DRUDS', 14, pH - 7);

    doc.setFont('helvetica','normal');
    doc.setFontSize(6.5);
    doc.setTextColor(...FG3);
    doc.text('Sistema de Fechamento Financeiro', 28, pH - 7);

    doc.setFontSize(6.5);
    doc.text(`Página ${pg} de ${pageCount}  ·  ${nomeMes} / ${dados.ano}`, W - 14, pH - 7, { align:'right' });
  }

  doc.save(`fechamento-${nomeMes.toLowerCase()}-${dados.ano}.pdf`);
}

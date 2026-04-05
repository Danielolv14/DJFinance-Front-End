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
  const doc    = new jsPDF({ orientation:'portrait', unit:'mm', format:'a4' });
  const nomeMes = MESES[(dados.mes||1) - 1];
  const titulo  = `Fechamento Mensal — ${nomeMes}/${dados.ano}`;

  const PRETO   = [15, 15, 25];
  const CINZA   = [100, 100, 120];
  const CINZA_L = [240, 240, 245];
  const VERDE   = [52, 211, 153];
  const ROXO    = [124, 106, 255];
  const AZUL    = [96, 165, 250];
  const AMARELO = [251, 191, 36];
  const VERM    = dados.lucroLiquido < 0 ? [248,113,113] : [52,211,153];

  const W = doc.internal.pageSize.getWidth();
  let y   = 0;

  // ── Cabeçalho ──────────────────────────────────────────────────────────────
  doc.setFillColor(...PRETO);
  doc.rect(0, 0, W, 30, 'F');

  doc.setTextColor(255,255,255);
  doc.setFontSize(20);
  doc.setFont('helvetica','bold');
  doc.text('🎧 DRUDS', 14, 13);

  doc.setFontSize(10);
  doc.setFont('helvetica','normal');
  doc.setTextColor(180,180,200);
  doc.text('Sistema de Fechamento Financeiro', 14, 20);

  doc.setTextColor(255,255,255);
  doc.setFontSize(13);
  doc.setFont('helvetica','bold');
  doc.text(titulo, W - 14, 13, { align:'right' });

  doc.setFontSize(9);
  doc.setFont('helvetica','normal');
  doc.setTextColor(180,180,200);
  doc.text(`Gerado em ${new Date().toLocaleDateString('pt-BR')}`, W - 14, 20, { align:'right' });

  y = 40;

  // ── Linha de separação ─────────────────────────────────────────────────────
  doc.setDrawColor(...CINZA);
  doc.setLineWidth(0.3);
  doc.line(14, y-4, W-14, y-4);

  // ── Resumo (quantidade de shows) ───────────────────────────────────────────
  doc.setTextColor(...CINZA);
  doc.setFontSize(9);
  doc.setFont('helvetica','normal');
  doc.text(`${dados.quantidadeShows} show${dados.quantidadeShows!==1?'s':''} no período`, 14, y);
  y += 8;

  // ── Cards financeiros ──────────────────────────────────────────────────────
  const cards = [
    { label:'Total Bruto',   valor: dados.totalBruto,   cor: AZUL,    sub: 'Soma dos cachês do período' },
    { label:'Daniel',        valor: dados.totalDaniel,  cor: AMARELO, sub: '15% do cachê + R$40 transporte/dia' },
    { label:'Yuri',          valor: dados.totalYuri,    cor: ROXO,    sub: 'R$300 fixo por show' },
    ...(dados.totalCustos > 0 ? [{ label:'Outros Custos', valor: dados.totalCustos, cor:[248,113,113], sub:'Custos adicionais registrados' }] : []),
    { label:'Lucro Líquido', valor: dados.lucroLiquido, cor: VERM,    sub: 'Valor líquido após todos os descontos' },
  ];

  const cw = (W - 28 - (cards.length-1)*4) / cards.length;

  cards.forEach((card, i) => {
    const x = 14 + i * (cw + 4);

    doc.setFillColor(...CINZA_L);
    doc.roundedRect(x, y, cw, 24, 2, 2, 'F');

    doc.setDrawColor(...card.cor);
    doc.setLineWidth(1.5);
    doc.line(x, y, x, y+24);
    doc.setLineWidth(0.3);

    doc.setTextColor(...CINZA);
    doc.setFontSize(7);
    doc.setFont('helvetica','bold');
    doc.text(card.label.toUpperCase(), x+4, y+7);

    doc.setTextColor(...card.cor);
    doc.setFontSize(11);
    doc.setFont('helvetica','bold');
    doc.text(moeda(card.valor), x+4, y+15);

    doc.setTextColor(...CINZA);
    doc.setFontSize(6);
    doc.setFont('helvetica','normal');
    const linhas = doc.splitTextToSize(card.sub, cw-6);
    doc.text(linhas, x+4, y+20);
  });

  y += 34;

  // ── Tabela de shows ────────────────────────────────────────────────────────
  doc.setTextColor(...PRETO);
  doc.setFontSize(11);
  doc.setFont('helvetica','bold');
  doc.text('Shows do Período', 14, y);
  y += 4;

  const colunas = ['Data','Evento','Contratante','Cachê'];
  if (dados.totalCustos > 0) colunas.push('Custos');
  colunas.push('Status');

  const linhas = dados.shows.map(s => {
    const row = [
      fmtData(s.data),
      s.evento || '—',
      s.contratante || '—',
      s.cache ? moeda(s.cache) : 'R$ 110,00 (padrão)',
    ];
    if (dados.totalCustos > 0) row.push(s.custos ? moeda(s.custos) : '—');
    row.push(s.status || '—');
    return row;
  });

  autoTable(doc, {
    startY:  y + 2,
    head:    [colunas],
    body:    linhas,
    margin:  { left: 14, right: 14 },
    styles: {
      fontSize: 8,
      cellPadding: 3,
      textColor: PRETO,
      lineColor: [220,220,230],
      lineWidth: 0.2,
    },
    headStyles: {
      fillColor:  PRETO,
      textColor:  [255,255,255],
      fontStyle:  'bold',
      fontSize:   8,
    },
    alternateRowStyles: { fillColor: [248,248,252] },
    columnStyles: {
      0: { cellWidth:22 },
      3: { halign:'right', textColor: [52,150,80] },
    },
  });

  // ── Rodapé ─────────────────────────────────────────────────────────────────
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    const pH = doc.internal.pageSize.getHeight();
    doc.setFillColor(...CINZA_L);
    doc.rect(0, pH-10, W, 10, 'F');
    doc.setTextColor(...CINZA);
    doc.setFontSize(7);
    doc.setFont('helvetica','normal');
    doc.text('DRUDS — Sistema de Fechamento Financeiro', 14, pH-4);
    doc.text(`Página ${i} de ${pageCount}`, W-14, pH-4, { align:'right' });
  }

  doc.save(`fechamento-${nomeMes.toLowerCase()}-${dados.ano}.pdf`);
}

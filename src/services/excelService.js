/* ═══════════════════════════════════════════════════════════════
   Druds Financeiro — Exportação Excel
   Gera workbook com 3 abas: Shows, Por Mês, Por Contratante
   Carregado via dynamic import para não impactar o bundle inicial
   ═══════════════════════════════════════════════════════════════ */

/* ── Regras financeiras (idênticas ao DashboardPage) ── */
const INICIO_EQUIPE            = new Date('2025-03-01');
const INICIO_PERCENTUAL_DANIEL = new Date('2026-01-01');
const INICIO_PERCENTUAL_20     = new Date('2026-04-01');

function calcDaniel(show) {
  if (show.semCacheDaniel) return 0;
  const d = new Date(show.data + 'T00:00:00');
  if (d < INICIO_EQUIPE) return 0;
  if (d < INICIO_PERCENTUAL_DANIEL) return 50;
  const p    = d < INICIO_PERCENTUAL_20 ? 0.10 : 0.20;
  const base = (show.cache || 0) - (show.custos || 0);
  return (base > 0 ? base * p : 0) + 40;
}
function calcYuri(show) {
  if (show.semCacheYuri) return 0;
  return new Date(show.data + 'T00:00:00') < INICIO_EQUIPE ? 0 : 300;
}
function fmtData(d) {
  if (!d) return '—';
  return d.split('-').reverse().join('/');
}

const MESES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho',
               'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];

/* ── Paleta de cores (valores ARGB para ExcelJS) ── */
const C = {
  NAVY:    'FF1A3A5C',
  NAVY_D:  'FF0D1B2E',
  WHITE:   'FFFFFFFF',
  GREY_L:  'FFF2F4F8',
  GREY_D:  'FFE2E6EC',
  GREEN:   'FF1B7A3E',
  GREEN_L: 'FFD4EDDA',
  YELLOW:  'FFB45309',
  YELLOW_L:'FFFEF3C7',
  RED:     'FFB91C1C',
  RED_L:   'FFFEE2E2',
  BLUE:    'FF1D4ED8',
  TEAL:    'FF0F766E',
};

/* ── Helpers de formatação ── */
function styledHeader(cell, text) {
  cell.value = text;
  cell.font      = { bold:true, color:{ argb:C.WHITE }, name:'Arial', size:10 };
  cell.fill      = { type:'pattern', pattern:'solid', fgColor:{ argb:C.NAVY } };
  cell.alignment = { vertical:'middle', horizontal:'center', wrapText:false };
  cell.border    = { bottom:{ style:'medium', color:{ argb:C.TEAL } } };
}

function titleRow(ws, text, colCount) {
  ws.mergeCells(1, 1, 1, colCount);
  const cell   = ws.getCell('A1');
  cell.value   = text;
  cell.font    = { bold:true, name:'Arial', size:11, color:{ argb:C.WHITE } };
  cell.fill    = { type:'pattern', pattern:'solid', fgColor:{ argb:C.NAVY_D } };
  cell.alignment = { vertical:'middle', horizontal:'center' };
  ws.getRow(1).height = 28;
}

function setCurrency(cell) {
  cell.numFmt    = 'R$ #,##0.00;(R$ #,##0.00)';
  cell.alignment = { horizontal:'right', vertical:'middle' };
}

function totalsStyle(cell) {
  cell.font = { bold:true, name:'Arial', size:10, color:{ argb:C.NAVY } };
  cell.fill = { type:'pattern', pattern:'solid', fgColor:{ argb:C.GREY_D } };
  cell.border = {
    top:    { style:'medium', color:{ argb:C.NAVY } },
    bottom: { style:'medium', color:{ argb:C.NAVY } },
  };
  cell.alignment = { vertical:'middle' };
}

/* ═══════════════════════════════════════════════════════════════
   MAIN EXPORT FUNCTION
   ═══════════════════════════════════════════════════════════════ */
export async function exportarShows(shows) {
  // Dynamic import — ExcelJS só é carregado quando o botão é clicado
  const ExcelJS = (await import('exceljs')).default;

  const wb      = new ExcelJS.Workbook();
  wb.creator    = 'Druds Financeiro';
  wb.created    = new Date();
  wb.modified   = new Date();

  const agora   = new Date();
  const dataStr = agora.toLocaleDateString('pt-BR');
  const horaStr = agora.toLocaleTimeString('pt-BR', { hour:'2-digit', minute:'2-digit' });
  const anoAtual = agora.getFullYear();

  /* ══════════════════════════════════════════════
     SHEET 1 — Todos os Shows
     ══════════════════════════════════════════════ */
  const ws1 = wb.addWorksheet('Shows', {
    views:     [{ state:'frozen', ySplit:2 }],
    pageSetup: { paperSize:9, orientation:'landscape', fitToPage:true, fitToWidth:1, fitToHeight:0 },
  });

  const cols1 = [
    { key:'num',    header:'#',                width:5  },
    { key:'data',   header:'Data',             width:12 },
    { key:'evento', header:'Evento',           width:30 },
    { key:'contra', header:'Contratante',      width:22 },
    { key:'end',    header:'Endereço',         width:30 },
    { key:'status', header:'Status',           width:14 },
    { key:'inicio', header:'Início',           width:10 },
    { key:'term',   header:'Término',          width:10 },
    { key:'dur',    header:'Duração',          width:10 },
    { key:'cache',  header:'Cachê (R$)',       width:15 },
    { key:'custos', header:'Custos (R$)',      width:15 },
    { key:'lucro',  header:'Lucro DJ (R$)',    width:15 },
    { key:'daniel', header:'Daniel (R$)',      width:14 },
    { key:'yuri',   header:'Yuri (R$)',        width:14 },
    { key:'xdj',    header:'XDJ',             width:7  },
    { key:'adiant', header:'Adiant.',          width:9  },
    { key:'vadiant',header:'Vl.Adiant. (R$)', width:16 },
    { key:'rider',  header:'Rider',           width:30 },
    { key:'obs',    header:'Observações',     width:35 },
  ];
  ws1.columns = cols1.map(c => ({ key:c.key, width:c.width }));

  titleRow(ws1, `DRUDS FINANCEIRO — Todos os Shows — ${dataStr} ${horaStr}`, cols1.length);

  const hdrRow1 = ws1.getRow(2);
  hdrRow1.height = 22;
  cols1.forEach((c, i) => styledHeader(hdrRow1.getCell(i + 1), c.header));

  /* Dados */
  const sorted = [...shows].sort((a, b) => (b.data || '').localeCompare(a.data || ''));

  sorted.forEach((show, idx) => {
    const daniel = calcDaniel(show);
    const yuri   = calcYuri(show);
    const lucro  = (show.cache || 0) - daniel - yuri - (show.custos || 0);
    const isEven = idx % 2 === 0;
    const bg     = { argb: isEven ? C.WHITE : C.GREY_L };

    const row = ws1.getRow(idx + 3);
    row.height = 19;

    const vals = [
      idx + 1,
      fmtData(show.data),
      show.evento      || '—',
      show.contratante || '—',
      show.endereco    || '—',
      show.status      || '—',
      show.horaInicio  || '—',
      show.horaTermino || '—',
      show.duracao     || '—',
      show.cache       || 0,
      show.custos      || 0,
      lucro,
      daniel,
      yuri,
      show.xdj         ? 'Sim' : 'Não',
      show.adiantamento? 'Sim' : 'Não',
      show.valorAdiantamento || 0,
      show.rider       || '—',
      show.observacoes || '—',
    ];

    vals.forEach((val, ci) => {
      const cell = row.getCell(ci + 1);
      cell.value = val;
      cell.font  = { name:'Arial', size:9.5 };
      cell.fill  = { type:'pattern', pattern:'solid', fgColor:bg };
      cell.alignment = { vertical:'middle' };
      cell.border = { bottom:{ style:'hair', color:{ argb:'FFD0D5DD' } } };
    });

    /* Status colorido */
    const sCell  = row.getCell(6);
    const sCmap  = { CONFIRMADO:C.GREEN, PENDENTE:C.YELLOW, CANCELADO:C.RED };
    const sBgmap = { CONFIRMADO:C.GREEN_L, PENDENTE:C.YELLOW_L, CANCELADO:C.RED_L };
    sCell.font = { name:'Arial', size:9.5, bold:true, color:{ argb:sCmap[show.status] || 'FF666666' } };
    sCell.fill = { type:'pattern', pattern:'solid', fgColor:{ argb:sBgmap[show.status] || C.GREY_L } };
    sCell.alignment = { horizontal:'center', vertical:'middle' };

    /* Células financeiras */
    [10, 11, 13, 14, 17].forEach(ci => setCurrency(row.getCell(ci)));

    /* Lucro colorido */
    const lCell = row.getCell(12);
    setCurrency(lCell);
    lCell.font = { name:'Arial', size:9.5, bold:true, color:{ argb:lucro >= 0 ? C.GREEN : C.RED } };

    /* Centralizar */
    [1, 7, 8, 9, 15, 16].forEach(ci => {
      row.getCell(ci).alignment = { horizontal:'center', vertical:'middle' };
    });
  });

  /* Linha de totais */
  const nRows = sorted.length;
  if (nRows > 0) {
    const tot = ws1.getRow(nRows + 3);
    tot.height = 24;

    const totVals = [
      '', 'TOTAL', `${nRows} shows`, '', '', '',
      '', '', '',
      { formula:`SUM(J3:J${nRows + 2})` },
      { formula:`SUM(K3:K${nRows + 2})` },
      { formula:`SUM(L3:L${nRows + 2})` },
      { formula:`SUM(M3:M${nRows + 2})` },
      { formula:`SUM(N3:N${nRows + 2})` },
      '', '',
      { formula:`SUM(Q3:Q${nRows + 2})` },
      '', '',
    ];

    totVals.forEach((val, ci) => {
      const cell = tot.getCell(ci + 1);
      cell.value = val;
      totalsStyle(cell);
    });

    [10, 11, 12, 13, 14, 17].forEach(ci => {
      const c = tot.getCell(ci);
      c.numFmt    = 'R$ #,##0.00;(R$ #,##0.00)';
      c.alignment = { horizontal:'right', vertical:'middle' };
    });
    tot.getCell(2).alignment = { horizontal:'center', vertical:'middle' };
    tot.getCell(3).alignment = { horizontal:'center', vertical:'middle' };
  }

  ws1.autoFilter = { from:'A2', to:`S2` };

  /* ══════════════════════════════════════════════
     SHEET 2 — Resumo por Mês (ano atual)
     ══════════════════════════════════════════════ */
  const ws2 = wb.addWorksheet(`Por Mês ${anoAtual}`, {
    views: [{ state:'frozen', ySplit:2 }],
  });

  const cols2 = [
    { key:'mes',  header:'Mês',               width:16 },
    { key:'qtd',  header:'Shows',             width:9  },
    { key:'fat',  header:'Faturamento (R$)',  width:18 },
    { key:'cus',  header:'Custos (R$)',       width:15 },
    { key:'dan',  header:'Daniel (R$)',       width:15 },
    { key:'yur',  header:'Yuri (R$)',         width:15 },
    { key:'luc',  header:'Lucro DJ (R$)',     width:16 },
    { key:'mar',  header:'Margem %',          width:12 },
  ];
  ws2.columns = cols2.map(c => ({ key:c.key, width:c.width }));
  titleRow(ws2, `DRUDS FINANCEIRO — Por Mês — ${anoAtual}`, cols2.length);

  const hdrRow2 = ws2.getRow(2);
  hdrRow2.height = 22;
  cols2.forEach((c, i) => styledHeader(hdrRow2.getCell(i + 1), c.header));

  const showsAno = shows.filter(s => s.ano === anoAtual && s.status === 'CONFIRMADO');

  MESES.forEach((nomeMes, mi) => {
    const mesNum = mi + 1;
    const sm  = showsAno.filter(s => s.mes === mesNum);
    const fat = sm.reduce((a, s) => a + (s.cache  || 0), 0);
    const cus = sm.reduce((a, s) => a + (s.custos || 0), 0);
    const dan = sm.reduce((a, s) => a + calcDaniel(s),   0);
    const yur = sm.reduce((a, s) => a + calcYuri(s),     0);
    const luc = fat - cus - dan - yur;
    const mar = fat > 0 ? luc / fat : 0;

    const row = ws2.getRow(mi + 3);
    row.height = 20;
    const bg2  = { argb: mi % 2 === 0 ? C.WHITE : C.GREY_L };

    [nomeMes, sm.length, fat, cus, dan, yur, luc, mar].forEach((val, ci) => {
      const cell = row.getCell(ci + 1);
      cell.value = val;
      cell.font  = { name:'Arial', size:9.5 };
      cell.fill  = { type:'pattern', pattern:'solid', fgColor:bg2 };
      cell.alignment = { vertical:'middle' };
      cell.border = { bottom:{ style:'hair', color:{ argb:'FFD0D5DD' } } };
    });

    row.getCell(1).font = { name:'Arial', size:9.5, bold:true };
    row.getCell(2).alignment = { horizontal:'center', vertical:'middle' };

    [3, 4, 5, 6].forEach(ci => setCurrency(row.getCell(ci)));

    const lucCell = row.getCell(7);
    setCurrency(lucCell);
    if (luc !== 0) {
      lucCell.font = { name:'Arial', size:9.5, bold:true, color:{ argb:luc >= 0 ? C.GREEN : C.RED } };
    }

    const marCell = row.getCell(8);
    marCell.numFmt    = '0.0%;(0.0%)';
    marCell.alignment = { horizontal:'center', vertical:'middle' };
    marCell.font      = { name:'Arial', size:9.5, bold:true };
  });

  /* Totais Sheet 2 */
  const tot2 = ws2.getRow(15);
  tot2.height = 24;
  [
    'TOTAL',
    showsAno.length,
    { formula:'SUM(C3:C14)' },
    { formula:'SUM(D3:D14)' },
    { formula:'SUM(E3:E14)' },
    { formula:'SUM(F3:F14)' },
    { formula:'SUM(G3:G14)' },
    { formula:'IFERROR(G15/C15,0)' },
  ].forEach((val, ci) => {
    const cell = tot2.getCell(ci + 1);
    cell.value = val;
    totalsStyle(cell);
  });

  [3, 4, 5, 6, 7].forEach(ci => {
    const c = tot2.getCell(ci);
    c.numFmt    = 'R$ #,##0.00;(R$ #,##0.00)';
    c.alignment = { horizontal:'right', vertical:'middle' };
  });
  tot2.getCell(8).numFmt    = '0.0%;(0.0%)';
  tot2.getCell(8).alignment = { horizontal:'center', vertical:'middle' };
  [1, 2].forEach(ci => tot2.getCell(ci).alignment = { horizontal:'center', vertical:'middle' });

  /* ══════════════════════════════════════════════
     SHEET 3 — Por Contratante (todos os anos)
     ══════════════════════════════════════════════ */
  const ws3 = wb.addWorksheet('Por Contratante', {
    views: [{ state:'frozen', ySplit:2 }],
  });

  const cols3 = [
    { key:'rank',  header:'#',               width:6  },
    { key:'nome',  header:'Contratante',     width:28 },
    { key:'shows', header:'Shows',           width:9  },
    { key:'cache', header:'Cache Total (R$)',width:18 },
    { key:'media', header:'Média/Show (R$)', width:18 },
    { key:'conf',  header:'Confirmados',     width:13 },
    { key:'pend',  header:'Pendentes',       width:12 },
    { key:'canc',  header:'Cancelados',      width:12 },
  ];
  ws3.columns = cols3.map(c => ({ key:c.key, width:c.width }));
  titleRow(ws3, 'DRUDS FINANCEIRO — Por Contratante — Todos os Anos', cols3.length);

  const hdrRow3 = ws3.getRow(2);
  hdrRow3.height = 22;
  cols3.forEach((c, i) => styledHeader(hdrRow3.getCell(i + 1), c.header));

  /* Agrupa por contratante */
  const cmap = {};
  shows.forEach(s => {
    if (!s.contratante) return;
    if (!cmap[s.contratante]) cmap[s.contratante] = { shows:0, cache:0, conf:0, pend:0, canc:0 };
    cmap[s.contratante].shows++;
    cmap[s.contratante].cache += (s.cache || 0);
    if (s.status === 'CONFIRMADO') cmap[s.contratante].conf++;
    if (s.status === 'PENDENTE')   cmap[s.contratante].pend++;
    if (s.status === 'CANCELADO')  cmap[s.contratante].canc++;
  });

  const rank3 = Object.entries(cmap).sort((a, b) => b[1].shows - a[1].shows);

  rank3.forEach(([nome, v], idx) => {
    const media = v.shows > 0 ? v.cache / v.shows : 0;
    const bg3   = { argb: idx % 2 === 0 ? C.WHITE : C.GREY_L };
    const row   = ws3.getRow(idx + 3);
    row.height  = 20;

    [idx + 1, nome, v.shows, v.cache, media, v.conf, v.pend, v.canc].forEach((val, ci) => {
      const cell = row.getCell(ci + 1);
      cell.value = val;
      cell.font  = { name:'Arial', size:9.5 };
      cell.fill  = { type:'pattern', pattern:'solid', fgColor:bg3 };
      cell.alignment = { vertical:'middle' };
      cell.border = { bottom:{ style:'hair', color:{ argb:'FFD0D5DD' } } };
    });

    row.getCell(1).alignment = { horizontal:'center', vertical:'middle' };
    row.getCell(2).font      = { name:'Arial', size:9.5, bold:true };
    row.getCell(3).alignment = { horizontal:'center', vertical:'middle' };
    [4, 5].forEach(ci => setCurrency(row.getCell(ci)));
    [6, 7, 8].forEach(ci => {
      row.getCell(ci).alignment = { horizontal:'center', vertical:'middle' };
    });
    if (v.conf > 0) row.getCell(6).font = { name:'Arial', size:9.5, color:{ argb:C.GREEN } };
    if (v.pend > 0) row.getCell(7).font = { name:'Arial', size:9.5, color:{ argb:C.YELLOW } };
    if (v.canc > 0) row.getCell(8).font = { name:'Arial', size:9.5, color:{ argb:C.RED } };
  });

  /* Totais Sheet 3 */
  const n3 = rank3.length;
  if (n3 > 0) {
    const tot3 = ws3.getRow(n3 + 3);
    tot3.height = 24;
    [
      '', 'TOTAL',
      { formula:`SUM(C3:C${n3 + 2})` },
      { formula:`SUM(D3:D${n3 + 2})` },
      { formula:`IFERROR(D${n3+3}/C${n3+3},0)` },
      { formula:`SUM(F3:F${n3 + 2})` },
      { formula:`SUM(G3:G${n3 + 2})` },
      { formula:`SUM(H3:H${n3 + 2})` },
    ].forEach((val, ci) => {
      const cell = tot3.getCell(ci + 1);
      cell.value = val;
      totalsStyle(cell);
    });

    [4, 5].forEach(ci => {
      const c = tot3.getCell(ci);
      c.numFmt    = 'R$ #,##0.00;(R$ #,##0.00)';
      c.alignment = { horizontal:'right', vertical:'middle' };
    });
    [3, 6, 7, 8].forEach(ci => tot3.getCell(ci).alignment = { horizontal:'center', vertical:'middle' });
    tot3.getCell(2).alignment = { horizontal:'center', vertical:'middle' };
  }

  ws3.autoFilter = { from:'A2', to:`H2` };

  /* ══════════════════════════════════════════════
     DOWNLOAD
     ══════════════════════════════════════════════ */
  const buffer = await wb.xlsx.writeBuffer();
  const blob   = new Blob(
    [buffer],
    { type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }
  );
  const url    = URL.createObjectURL(blob);
  const a      = document.createElement('a');
  a.href       = url;
  a.download   = `druds-shows-${agora.toISOString().slice(0, 10)}.xlsx`;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 200);
}

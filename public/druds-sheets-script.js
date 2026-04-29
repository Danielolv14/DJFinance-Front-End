// ═══════════════════════════════════════════════════════════════════
//  DRUDS FINANCEIRO — Google Apps Script
//  Cole este código em: Extensões > Apps Script dentro do Google Sheets
//  Depois clique em "Executar" > onOpen para autorizar.
//  No menu "🎧 Druds Financeiro" que aparecerá use:
//    • Sincronizar Agora
//    • Ativar Atualização Automática (a cada 1h)
// ═══════════════════════════════════════════════════════════════════

var API_URL = 'https://djfinance-back-end-production.up.railway.app/shows';

var MESES = [
  'Janeiro','Fevereiro','Março','Abril','Maio','Junho',
  'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'
];

/* ── Regras financeiras ─────────────────────────────────────────── */
var D_EQUIPE = new Date('2025-03-01T00:00:00');
var D_DANIEL = new Date('2026-01-01T00:00:00');
var D_20PCT  = new Date('2026-04-01T00:00:00');

function calcDaniel(show) {
  if (!show || !show.data) return 0;
  if (show.semCacheEquipe) return 0;
  var d = new Date(show.data + 'T00:00:00');
  if (isNaN(d.getTime())) return 0;
  if (d < D_EQUIPE) return 0;
  if (d < D_DANIEL) return 50;
  var p    = d < D_20PCT ? 0.10 : 0.20;
  var base = (show.cache || 0) - (show.custos || 0);
  return (base > 0 ? base * p : 0) + 40;
}

function calcYuri(show) {
  if (!show || !show.data) return 0;
  if (show.semCacheEquipe) return 0;
  var d = new Date(show.data + 'T00:00:00');
  if (isNaN(d.getTime())) return 0;
  return d < D_EQUIPE ? 0 : 300;
}

function getAno(data) { return data ? parseInt(data.substring(0, 4), 10) : 0; }
function getMes(data) { return data ? parseInt(data.substring(5, 7), 10) : 0; }

function fmtData(d) {
  if (!d) return '—';
  return d.split('-').reverse().join('/');
}

function fmtMoeda(v) {
  if (!v) return 'R$ 0,00';
  return 'R$ ' + v.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

/* ── Helpers de estilo ──────────────────────────────────────────── */
function removeFilter(sheet) {
  try { var f = sheet.getFilter(); if (f) f.remove(); } catch (e) {}
}

function styleTitle(range) {
  range.merge()
       .setBackground('#0d1b2e')
       .setFontColor('#4d8fff')
       .setFontWeight('bold')
       .setFontSize(12)
       .setHorizontalAlignment('center')
       .setVerticalAlignment('middle');
}

function styleHeader(range) {
  range.setBackground('#1a3a5c')
       .setFontColor('#ffffff')
       .setFontWeight('bold')
       .setFontSize(10)
       .setHorizontalAlignment('center')
       .setVerticalAlignment('middle');
}

function styleTotals(range) {
  range.setBackground('#1a3a5c')
       .setFontColor('#ffffff')
       .setFontWeight('bold');
}

function styleKpiLabel(range) {
  range.setBackground('#0d1b2e')
       .setFontColor('#8ab4d4')
       .setFontWeight('bold')
       .setFontSize(9)
       .setHorizontalAlignment('left')
       .setVerticalAlignment('middle');
}

function styleKpiValue(range, color) {
  range.setBackground('#13243a')
       .setFontColor(color || '#ffffff')
       .setFontWeight('bold')
       .setFontSize(13)
       .setHorizontalAlignment('right')
       .setVerticalAlignment('middle');
}

/* ═══════════════════════════════════════════════════════════════════
   FUNÇÃO PRINCIPAL
   ═══════════════════════════════════════════════════════════════════ */
function atualizarPlanilha() {
  var resp;
  try {
    resp = UrlFetchApp.fetch(API_URL, { muteHttpExceptions: true });
  } catch (e) {
    SpreadsheetApp.getUi().alert('Erro de rede: ' + e.message);
    return;
  }
  if (resp.getResponseCode() !== 200) {
    SpreadsheetApp.getUi().alert('API retornou HTTP ' + resp.getResponseCode());
    return;
  }

  var raw   = JSON.parse(resp.getContentText());
  var shows = (Array.isArray(raw) ? raw : []).filter(function(s) {
    return s && typeof s === 'object' && s.id;
  });

  var agora    = new Date();
  var dataStr  = Utilities.formatDate(agora, 'America/Sao_Paulo', 'dd/MM/yyyy HH:mm');
  var anoAtual = agora.getFullYear();
  var ss       = SpreadsheetApp.getActiveSpreadsheet();

  /* ── Pré-calcular todos os dados ── */
  var confirmados = shows.filter(function(s) {
    return s.status === 'CONFIRMADO' && getAno(s.data) === anoAtual;
  });
  var pendentes = shows.filter(function(s) {
    return s.status === 'PENDENTE';
  });

  var totalBruto  = confirmados.reduce(function(a,s) { return a + (s.cache  || 0); }, 0);
  var totalCustos = confirmados.reduce(function(a,s) { return a + (s.custos || 0); }, 0);
  var totalDaniel = confirmados.reduce(function(a,s) { return a + calcDaniel(s);   }, 0);
  var totalYuri   = confirmados.reduce(function(a,s) { return a + calcYuri(s);     }, 0);
  var lucroLiq    = totalBruto - totalDaniel - totalYuri - totalCustos;
  var aReceber    = pendentes.reduce(function(a,s) { return a + (s.cache || 0); }, 0);
  var mediaPorShow = confirmados.length > 0 ? totalBruto / confirmados.length : 0;

  /* ═══════════════════════════════════════
     ABA 1 — DASHBOARD (espelho do app)
     ═══════════════════════════════════════ */
  var wsDash = ss.getSheetByName('Dashboard') || ss.insertSheet('Dashboard', 0);
  wsDash.clearContents();
  wsDash.clearFormats();

  // Título
  wsDash.setRowHeight(1, 36);
  styleTitle(wsDash.getRange(1, 1, 1, 4));
  wsDash.getRange('A1').setValue('🎧 DRUDS FINANCEIRO — Dashboard ' + anoAtual + ' — ' + dataStr);

  // Seção KPIs
  wsDash.setRowHeight(2, 10);
  wsDash.setRowHeight(3, 22);
  wsDash.getRange(3, 1, 1, 4).merge()
    .setValue('◈  KPIs DO ANO — APENAS CONFIRMADOS')
    .setBackground('#0a1520')
    .setFontColor('#4d8fff')
    .setFontSize(8)
    .setFontWeight('bold')
    .setHorizontalAlignment('left')
    .setVerticalAlignment('middle');

  var kpis = [
    ['💰 FATURAMENTO BRUTO',  fmtMoeda(totalBruto),  '#4d8fff', confirmados.length + ' shows confirmados'],
    ['📈 LUCRO LÍQUIDO',      fmtMoeda(lucroLiq),    lucroLiq >= 0 ? '#3dd457' : '#ff453a',
     totalBruto > 0 ? Math.round((lucroLiq/totalBruto)*100) + '% do bruto' : '—'],
    ['👤 DANIEL',             fmtMoeda(totalDaniel), '#ff9f40',
     totalBruto > 0 ? Math.round((totalDaniel/totalBruto)*100) + '% do bruto' : '—'],
    ['👤 YURI',               fmtMoeda(totalYuri),   '#c084fc', 'R$ 300/show'],
    ['⚠️ CUSTOS OPERACIONAIS', fmtMoeda(totalCustos), '#ff453a',
     totalBruto > 0 ? Math.round((totalCustos/totalBruto)*100) + '% do bruto' : '—'],
    ['⏳ A RECEBER',          fmtMoeda(aReceber),    '#ffd60a', pendentes.length + ' shows pendentes'],
    ['📊 MÉDIA POR SHOW',     fmtMoeda(mediaPorShow),'#9a7ef8', 'cache médio'],
    ['🎵 TOTAL DE SHOWS',     confirmados.length + ' shows', '#8ab4d4', 'confirmados em ' + anoAtual],
  ];

  kpis.forEach(function(kpi, i) {
    var row = i + 4;
    wsDash.setRowHeight(row, 32);
    styleKpiLabel(wsDash.getRange(row, 1, 1, 1));
    wsDash.getRange(row, 1).setValue(kpi[0]);
    styleKpiValue(wsDash.getRange(row, 2, 1, 2), kpi[2]);
    wsDash.getRange(row, 2, 1, 2).merge().setValue(kpi[1]).setFontSize(13);
    wsDash.getRange(row, 4).setBackground('#0a1520').setFontColor('#5a7a99').setFontSize(9)
      .setVerticalAlignment('middle').setValue(kpi[3]);
  });

  // Separador
  wsDash.setRowHeight(13, 14);
  wsDash.getRange(13, 1, 1, 4).merge()
    .setBackground('#0a1520');

  // Seção mensal
  wsDash.setRowHeight(14, 22);
  wsDash.getRange(14, 1, 1, 4).merge()
    .setValue('◈  POR MÊS — ' + anoAtual + ' — CONFIRMADOS')
    .setBackground('#0a1520')
    .setFontColor('#4d8fff')
    .setFontSize(8)
    .setFontWeight('bold')
    .setHorizontalAlignment('left')
    .setVerticalAlignment('middle');

  var hdrMes = ['Mês', 'Shows', 'Faturamento', 'Lucro DJ'];
  wsDash.getRange(15, 1, 1, 4).setValues([hdrMes]);
  styleHeader(wsDash.getRange(15, 1, 1, 4));
  wsDash.setRowHeight(15, 24);

  var maxFat = 0;
  var mesesData = MESES.map(function(nomeMes, mi) {
    var mesNum = mi + 1;
    var sm = confirmados.filter(function(s) { return getMes(s.data) === mesNum; });
    var fat = sm.reduce(function(a,s) { return a + (s.cache  || 0); }, 0);
    var cus = sm.reduce(function(a,s) { return a + (s.custos || 0); }, 0);
    var dan = sm.reduce(function(a,s) { return a + calcDaniel(s);   }, 0);
    var yur = sm.reduce(function(a,s) { return a + calcYuri(s);     }, 0);
    var luc = fat - cus - dan - yur;
    if (fat > maxFat) maxFat = fat;
    return [nomeMes, sm.length, fat, luc];
  });

  mesesData.forEach(function(rowData, mi) {
    var row = mi + 16;
    wsDash.setRowHeight(row, 22);
    wsDash.getRange(row, 1, 1, 4).setValues([rowData]);
    var bg = mi % 2 === 0 ? '#0d1b2e' : '#101e30';
    wsDash.getRange(row, 1, 1, 4).setBackground(bg).setFontColor('#c8d8e8').setVerticalAlignment('middle');
    wsDash.getRange(row, 1).setFontWeight('bold').setFontColor('#ffffff');
    wsDash.getRange(row, 2).setHorizontalAlignment('center').setFontColor('#8ab4d4');
    wsDash.getRange(row, 3).setNumberFormat('R$ #,##0.00').setHorizontalAlignment('right')
      .setFontColor('#4d8fff').setFontWeight('bold');
    var luc = rowData[3];
    wsDash.getRange(row, 4).setNumberFormat('R$ #,##0.00').setHorizontalAlignment('right')
      .setFontColor(luc >= 0 ? '#3dd457' : '#ff453a').setFontWeight('bold');
  });

  // Total mensal
  wsDash.setRowHeight(28, 26);
  wsDash.getRange(28, 1, 1, 4)
    .setValues([['TOTAL', confirmados.length,
      '=SUM(C16:C27)', '=SUM(D16:D27)']])
    .setBackground('#1a3a5c')
    .setFontColor('#ffffff')
    .setFontWeight('bold');
  wsDash.getRange(28, 2).setHorizontalAlignment('center');
  wsDash.getRange(28, 3).setNumberFormat('R$ #,##0.00').setHorizontalAlignment('right').setFontColor('#4d8fff');
  wsDash.getRange(28, 4).setNumberFormat('R$ #,##0.00').setHorizontalAlignment('right').setFontColor('#3dd457');

  // Larguras
  wsDash.setColumnWidth(1, 200);
  wsDash.setColumnWidth(2, 160);
  wsDash.setColumnWidth(3, 60);
  wsDash.setColumnWidth(4, 180);
  wsDash.setFrozenRows(1);


  /* ═══════════════════════════════════════
     ABA 2 — TODOS OS SHOWS
     ═══════════════════════════════════════ */
  var ws1 = ss.getSheetByName('Shows') || ss.insertSheet('Shows', 1);
  ws1.clearContents();
  ws1.clearFormats();
  removeFilter(ws1);

  var shows2025   = shows.filter(function(s){ return getAno(s.data) >= 2025; });
  var confAll = shows2025.filter(function(s){ return s.status==='CONFIRMADO'; });
  var pendAll = shows2025.filter(function(s){ return s.status==='PENDENTE'; });
  var cancAll = shows2025.filter(function(s){ return s.status==='CANCELADO'; });
  var totCacheAll = confAll.reduce(function(a,s){ return a+(s.cache||0); }, 0);

  // Linha 1 — Título
  ws1.setRowHeight(1, 36);
  styleTitle(ws1.getRange(1, 1, 1, 12));
  ws1.getRange('A1').setValue('🎧 DRUDS FINANCEIRO — Shows 2025+ — ' + shows2025.length + ' registros — Atualizado em ' + dataStr);

  // Linha 2 — Mini resumo
  ws1.setRowHeight(2, 24);
  var resumo = [
    '✅ CONFIRMADOS', confAll.length,
    '⏳ PENDENTES', pendAll.length,
    '❌ CANCELADOS', cancAll.length,
    '💰 FATURAMENTO (confirmados)', fmtMoeda(totCacheAll),
    '', ''
  ];
  ws1.getRange(2, 1, 1, 8).setValues([resumo.slice(0,8)]);
  [[1,'#d4edda','#155724'],[2,'#d4edda','#155724'],
   [3,'#fef3c7','#856404'],[4,'#fef3c7','#856404'],
   [5,'#fee2e2','#721c24'],[6,'#fee2e2','#721c24'],
   [7,'#e8f0fe','#1a4fa8'],[8,'#e8f0fe','#1a4fa8']].forEach(function(x){
    ws1.getRange(2,x[0]).setBackground(x[1]).setFontColor(x[2]).setFontWeight('bold').setFontSize(9).setHorizontalAlignment('center').setVerticalAlignment('middle');
  });

  // Linha 3 — Cabeçalho
  // DATA | ANO | MÊS | EVENTO | STATUS | HORA | DURAÇÃO | CACHÊ | XDJ | CONTRATANTE | ENDEREÇO | OBS
  var hdr1 = ['DATA','ANO','MÊS','EVENTO','STATUS','HORA','DURAÇÃO','CACHÊ (R$)','XDJ','CONTRATANTE','ENDEREÇO','OBS'];
  ws1.setRowHeight(3, 28);
  ws1.getRange(3, 1, 1, hdr1.length).setValues([hdr1]);
  styleHeader(ws1.getRange(3, 1, 1, hdr1.length));
  ws1.getRange(3,1,1,4).setBackground('#0d2240');
  ws1.getRange(3,5).setBackground('#1a3a5c');
  ws1.getRange(3,6,1,2).setBackground('#162d44');
  ws1.getRange(3,8).setBackground('#0d3320');
  ws1.getRange(3,9).setBackground('#221a38');
  ws1.getRange(3,10,1,3).setBackground('#1a2040');
  ws1.setFrozenRows(3);

  var MESES_ABREV = ['JAN','FEV','MAR','ABR','MAI','JUN','JUL','AGO','SET','OUT','NOV','DEZ'];
  var sorted = shows2025.slice().sort(function(a, b) {
    return (b.data || '').localeCompare(a.data || '');
  });

  var rows1 = sorted.map(function(s) {
    var mesNum = getMes(s.data);
    return [
      fmtData(s.data),
      getAno(s.data) || '—',
      mesNum > 0 ? MESES_ABREV[mesNum-1] : '—',
      s.evento        || '—',
      s.status        || '—',
      s.horaInicio    || 'A DEFINIR',
      s.duracao       || 'A DEFINIR',
      s.cache         || 0,
      s.xdj           ? '✔' : '',
      s.contratante   || '—',
      s.endereco      || '—',
      s.observacoes   || ''
    ];
  });

  if (rows1.length > 0) {
    ws1.getRange(4, 1, rows1.length, hdr1.length).setValues(rows1);

    // Zebra colorida por status
    var sBgA = { CONFIRMADO:['#f2fff5','#eafbee'], PENDENTE:['#fffef2','#fefce8'], CANCELADO:['#fff5f5','#fff0f0'] };
    sorted.forEach(function(s, i) {
      var bgs = sBgA[s.status] || ['#ffffff','#f8f9fa'];
      ws1.getRange(i+4, 1, 1, hdr1.length).setBackground(bgs[i%2]).setVerticalAlignment('middle');
      ws1.setRowHeight(i+4, 22);
    });

    // Data — bold azul escuro, centralizado
    ws1.getRange(4,1,rows1.length,1).setFontWeight('bold').setFontColor('#0d2240').setHorizontalAlignment('center');
    // Ano e Mês — cinza pequeno, centralizado
    ws1.getRange(4,2,rows1.length,2).setFontColor('#6677aa').setHorizontalAlignment('center').setFontSize(9);
    // Evento — bold preto
    ws1.getRange(4,4,rows1.length,1).setFontWeight('bold').setFontColor('#112233');

    // Status com cor (coluna 5)
    var sBgCell = { CONFIRMADO:'#d4edda', PENDENTE:'#fef3c7', CANCELADO:'#fee2e2' };
    var sFtCell = { CONFIRMADO:'#155724', PENDENTE:'#856404', CANCELADO:'#721c24' };
    sorted.forEach(function(s, i) {
      if (sBgCell[s.status]) {
        ws1.getRange(i+4, 5).setBackground(sBgCell[s.status]).setFontColor(sFtCell[s.status]).setFontWeight('bold').setHorizontalAlignment('center').setFontSize(9);
      }
    });

    // Hora e duração — centro cinza (cols 6-7)
    ws1.getRange(4,6,rows1.length,2).setHorizontalAlignment('center').setFontColor('#445566').setFontSize(9);

    // Cachê — azul bold (col 8)
    ws1.getRange(4,8,rows1.length,1).setNumberFormat('R$ #,##0.00;(R$ #,##0.00)').setHorizontalAlignment('right').setFontColor('#1a4fa8').setFontWeight('bold');

    // XDJ — verde ✔ centralizado (col 9)
    ws1.getRange(4,9,rows1.length,1).setHorizontalAlignment('center').setFontColor('#155724').setFontWeight('bold').setFontSize(12);

    // Contratante bold (col 10)
    ws1.getRange(4,10,rows1.length,1).setFontWeight('bold').setFontColor('#112233');
    // Endereço cinza pequeno (col 11)
    ws1.getRange(4,11,rows1.length,1).setFontColor('#6677aa').setFontSize(9);
    // OBS cinza pequeno (col 12)
    ws1.getRange(4,12,rows1.length,1).setFontColor('#6677aa').setFontSize(9);

    // ── Linha de totais
    var totRow = rows1.length + 4;
    ws1.setRowHeight(totRow, 30);
    styleTotals(ws1.getRange(totRow, 1, 1, hdr1.length));
    ws1.getRange(totRow, 1, 1, 4).merge().setValue('TOTAL — ' + rows1.length + ' shows').setHorizontalAlignment('left');
    ws1.getRange(totRow, 5).setValue(confAll.length + ' ✅  ' + pendAll.length + ' ⏳  ' + cancAll.length + ' ❌').setHorizontalAlignment('center').setFontSize(9);
    var sumEnd = rows1.length + 3;
    ws1.getRange(totRow, 8).setFormula('=SUM(H4:H'+sumEnd+')').setNumberFormat('R$ #,##0.00;(R$ #,##0.00)').setHorizontalAlignment('right');

    // Filtro
    removeFilter(ws1);
    ws1.getRange(3, 1, rows1.length + 1, hdr1.length).createFilter();
  }

  // Larguras: DATA, ANO, MÊS, EVENTO, STATUS, HORA, DUR, CACHÊ, XDJ, CONTRATANTE, ENDEREÇO, OBS
  [90, 44, 50, 230, 115, 82, 82, 130, 50, 180, 210, 220]
    .forEach(function(w, i) { ws1.setColumnWidth(i + 1, w); });


  /* ═══════════════════════════════════════
     ABA 3 — POR MÊS (ano atual)
     ═══════════════════════════════════════ */
  var ws2Name = 'Por Mês ' + anoAtual;
  var ws2 = ss.getSheetByName(ws2Name) || ss.insertSheet(ws2Name, 2);
  ws2.clearContents();
  ws2.clearFormats();

  ws2.setRowHeight(1, 34);
  styleTitle(ws2.getRange(1, 1, 1, 8));
  ws2.getRange('A1').setValue('🎧 DRUDS FINANCEIRO — Por Mês — ' + anoAtual + ' — Confirmados');

  var hdr2 = ['Mês','Shows','Faturamento (R$)','Custos (R$)','Daniel (R$)','Yuri (R$)','Lucro DJ (R$)','Margem %'];
  ws2.getRange(2, 1, 1, 8).setValues([hdr2]);
  styleHeader(ws2.getRange(2, 1, 1, 8));
  ws2.setRowHeight(2, 26);
  ws2.setFrozenRows(2);

  MESES.forEach(function(nomeMes, mi) {
    var mesNum = mi + 1;
    var sm = confirmados.filter(function(s) { return getMes(s.data) === mesNum; });
    var fat = sm.reduce(function(a,s) { return a + (s.cache  || 0); }, 0);
    var cus = sm.reduce(function(a,s) { return a + (s.custos || 0); }, 0);
    var dan = sm.reduce(function(a,s) { return a + calcDaniel(s);   }, 0);
    var yur = sm.reduce(function(a,s) { return a + calcYuri(s);     }, 0);
    var luc = fat - cus - dan - yur;
    var mar = fat > 0 ? luc / fat : 0;

    var row = mi + 3;
    ws2.setRowHeight(row, 22);
    ws2.getRange(row, 1, 1, 8).setValues([[nomeMes, sm.length, fat, cus, dan, yur, luc, mar]]);
    ws2.getRange(row, 1, 1, 8)
       .setBackground(mi % 2 === 0 ? '#ffffff' : '#f2f4f8')
       .setVerticalAlignment('middle');
    ws2.getRange(row, 1).setFontWeight('bold');
    ws2.getRange(row, 2).setHorizontalAlignment('center');
    [3,4,5,6].forEach(function(c) {
      ws2.getRange(row, c).setNumberFormat('R$ #,##0.00;(R$ #,##0.00)').setHorizontalAlignment('right');
    });
    ws2.getRange(row, 3).setFontColor('#1a4fa8').setFontWeight('bold');
    ws2.getRange(row, 7)
       .setNumberFormat('R$ #,##0.00;(R$ #,##0.00)')
       .setHorizontalAlignment('right')
       .setFontWeight('bold')
       .setFontColor(luc >= 0 ? '#155724' : '#721c24');
    ws2.getRange(row, 8)
       .setNumberFormat('0.0%')
       .setHorizontalAlignment('center')
       .setFontWeight('bold');
  });

  // Totais
  ws2.setRowHeight(15, 28);
  styleTotals(ws2.getRange(15, 1, 1, 8));
  ws2.getRange(15, 1).setValue('TOTAL');
  ws2.getRange(15, 2).setValue(confirmados.length).setHorizontalAlignment('center');
  ['C','D','E','F','G'].forEach(function(col, i) {
    ws2.getRange(15, i + 3)
       .setFormula('=SUM(' + col + '3:' + col + '14)')
       .setNumberFormat('R$ #,##0.00;(R$ #,##0.00)')
       .setHorizontalAlignment('right');
  });
  ws2.getRange('H15')
     .setFormula('=IFERROR(G15/C15,0)')
     .setNumberFormat('0.0%')
     .setHorizontalAlignment('center');

  [130,70,150,120,120,120,140,90]
    .forEach(function(w, i) { ws2.setColumnWidth(i + 1, w); });


  /* ═══════════════════════════════════════
     ABA 4 — POR CONTRATANTE
     ═══════════════════════════════════════ */
  var ws3 = ss.getSheetByName('Por Contratante') || ss.insertSheet('Por Contratante', 3);
  ws3.clearContents();
  ws3.clearFormats();
  removeFilter(ws3);

  ws3.setRowHeight(1, 34);
  styleTitle(ws3.getRange(1, 1, 1, 8));
  ws3.getRange('A1').setValue('🎧 DRUDS FINANCEIRO — Por Contratante — Todos os Anos');

  var hdr3 = ['#','Contratante','Shows','Cache Total (R$)','Média/Show (R$)','Confirmados','Pendentes','Cancelados'];
  ws3.getRange(2, 1, 1, 8).setValues([hdr3]);
  styleHeader(ws3.getRange(2, 1, 1, 8));
  ws3.setRowHeight(2, 26);
  ws3.setFrozenRows(2);

  var cmap = {};
  shows.forEach(function(s) {
    if (!s.contratante) return;
    if (!cmap[s.contratante]) cmap[s.contratante] = { shows:0, cache:0, conf:0, pend:0, canc:0 };
    cmap[s.contratante].shows++;
    cmap[s.contratante].cache += (s.cache || 0);
    if (s.status === 'CONFIRMADO') cmap[s.contratante].conf++;
    if (s.status === 'PENDENTE')   cmap[s.contratante].pend++;
    if (s.status === 'CANCELADO')  cmap[s.contratante].canc++;
  });

  var rank3 = Object.entries(cmap).sort(function(a, b) { return b[1].cache - a[1].cache; });

  rank3.forEach(function(entry, idx) {
    var nome = entry[0], v = entry[1];
    var media = v.shows > 0 ? v.cache / v.shows : 0;
    var row = idx + 3;
    ws3.setRowHeight(row, 22);
    ws3.getRange(row, 1, 1, 8)
       .setValues([[idx + 1, nome, v.shows, v.cache, media, v.conf, v.pend, v.canc]])
       .setBackground(idx % 2 === 0 ? '#ffffff' : '#f2f4f8')
       .setVerticalAlignment('middle');
    ws3.getRange(row, 1).setHorizontalAlignment('center').setFontColor('#888');
    ws3.getRange(row, 2).setFontWeight('bold');
    ws3.getRange(row, 3).setHorizontalAlignment('center');
    [4, 5].forEach(function(c) {
      ws3.getRange(row, c).setNumberFormat('R$ #,##0.00;(R$ #,##0.00)').setHorizontalAlignment('right');
    });
    ws3.getRange(row, 4).setFontColor('#1a4fa8').setFontWeight('bold');
    [6, 7, 8].forEach(function(c) { ws3.getRange(row, c).setHorizontalAlignment('center'); });
    if (v.conf > 0) ws3.getRange(row, 6).setFontColor('#155724').setFontWeight('bold');
    if (v.pend > 0) ws3.getRange(row, 7).setFontColor('#856404').setFontWeight('bold');
    if (v.canc > 0) ws3.getRange(row, 8).setFontColor('#721c24');
  });

  var n3 = rank3.length;
  if (n3 > 0) {
    var tot3 = n3 + 3;
    ws3.setRowHeight(tot3, 28);
    styleTotals(ws3.getRange(tot3, 1, 1, 8));
    ws3.getRange(tot3, 2).setValue('TOTAL');
    ws3.getRange(tot3, 3).setFormula('=SUM(C3:C' + (n3 + 2) + ')').setHorizontalAlignment('center');
    ws3.getRange(tot3, 4).setFormula('=SUM(D3:D' + (n3 + 2) + ')').setNumberFormat('R$ #,##0.00;(R$ #,##0.00)').setHorizontalAlignment('right');
    ws3.getRange(tot3, 5).setFormula('=IFERROR(D' + tot3 + '/C' + tot3 + ',0)').setNumberFormat('R$ #,##0.00;(R$ #,##0.00)').setHorizontalAlignment('right');
    ws3.getRange(tot3, 6).setFormula('=SUM(F3:F' + (n3 + 2) + ')').setHorizontalAlignment('center');
    ws3.getRange(tot3, 7).setFormula('=SUM(G3:G' + (n3 + 2) + ')').setHorizontalAlignment('center');
    ws3.getRange(tot3, 8).setFormula('=SUM(H3:H' + (n3 + 2) + ')').setHorizontalAlignment('center');

    removeFilter(ws3);
    ws3.getRange(2, 1, n3 + 1, 8).createFilter();
  }

  [40, 220, 70, 150, 150, 100, 90, 90]
    .forEach(function(w, i) { ws3.setColumnWidth(i + 1, w); });


  /* ── Ativar aba Dashboard ── */
  ss.setActiveSheet(wsDash);

  /* ── Notificação ── */
  ss.toast(
    '✅ ' + shows.length + ' shows · ' + confirmados.length + ' confirmados em ' + anoAtual + ' · ' + dataStr,
    '🎧 DRUDS FINANCEIRO — Atualizado',
    8
  );
}

/* ═══════════════════════════════════════════════════════════════════
   TRIGGER: atualiza automaticamente a cada 1 hora
   ═══════════════════════════════════════════════════════════════════ */
function ativarAutoUpdate() {
  ScriptApp.getProjectTriggers().forEach(function(t) {
    if (t.getHandlerFunction() === 'atualizarPlanilha') {
      ScriptApp.deleteTrigger(t);
    }
  });
  ScriptApp.newTrigger('atualizarPlanilha')
    .timeBased()
    .everyHours(1)
    .create();
  SpreadsheetApp.getUi().alert(
    '✅ Atualização automática ativada!\n\nA planilha será sincronizada com o site a cada 1 hora automaticamente.'
  );
}

/* ═══════════════════════════════════════════════════════════════════
   MENU PERSONALIZADO
   ═══════════════════════════════════════════════════════════════════ */
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('🎧 Druds Financeiro')
    .addItem('🔄  Sincronizar agora', 'atualizarPlanilha')
    .addSeparator()
    .addItem('⏱  Ativar auto-update (1h)', 'ativarAutoUpdate')
    .addToUi();
}

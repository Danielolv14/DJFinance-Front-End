// ═══════════════════════════════════════════════════════════════════
//  DRUDS FINANCEIRO — Google Apps Script
//  Cole este código em: Extensões > Apps Script dentro do Google Sheets
//  Depois clique em "Executar" > onOpen para autorizar.
//  No menu "🎧 Druds Financeiro" que aparecerá use:
//    • Atualizar Agora
//    • Ativar Atualização Automática (a cada 1h)
// ═══════════════════════════════════════════════════════════════════

const API_URL = 'https://djfinance-back-end-production.up.railway.app/shows';

const MESES = [
  'Janeiro','Fevereiro','Março','Abril','Maio','Junho',
  'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'
];

/* ── Regras financeiras ─────────────────────────────────────────── */
const D_EQUIPE  = new Date('2025-03-01');
const D_DANIEL  = new Date('2026-01-01');
const D_20PCT   = new Date('2026-04-01');

function calcDaniel(show) {
  const d = new Date(show.data + 'T00:00:00');
  if (d < D_EQUIPE)  return 0;
  if (d < D_DANIEL)  return 90;
  const p    = d < D_20PCT ? 0.15 : 0.20;
  const base = (show.cache || 0) - (show.custos || 0);
  return (base > 0 ? base * p : 0) + 40;
}

function calcYuri(show) {
  return new Date(show.data + 'T00:00:00') < D_EQUIPE ? 0 : 300;
}

function fmtData(d) {
  if (!d) return '—';
  return d.split('-').reverse().join('/');
}

/* ── Helpers de estilo ──────────────────────────────────────────── */
function styleTitle(range, numCols) {
  range.merge()
       .setBackground('#0d1b2e')
       .setFontColor('#ffffff')
       .setFontWeight('bold')
       .setFontSize(11)
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
  range.setBackground('#dce3ed')
       .setFontColor('#1a3a5c')
       .setFontWeight('bold');
}

/* ═══════════════════════════════════════════════════════════════════
   FUNÇÃO PRINCIPAL
   ═══════════════════════════════════════════════════════════════════ */
function atualizarPlanilha() {
  /* 1. Busca dados da API */
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

  var shows = JSON.parse(resp.getContentText());
  var agora = new Date();
  var dataStr = Utilities.formatDate(agora, 'America/Sao_Paulo', 'dd/MM/yyyy HH:mm');
  var anoAtual = agora.getFullYear();
  var ss = SpreadsheetApp.getActiveSpreadsheet();

  /* ═══════════════════════════════════════
     ABA 1 — TODOS OS SHOWS
     ═══════════════════════════════════════ */
  var ws1 = ss.getSheetByName('Shows') || ss.insertSheet('Shows', 0);
  ws1.clearContents();
  ws1.clearFormats();

  // Título
  ws1.setRowHeight(1, 32);
  styleTitle(
    ws1.getRange(1, 1, 1, 19),
    19
  );
  ws1.getRange('A1').setValue(
    'DRUDS FINANCEIRO — Todos os Shows — Atualizado em ' + dataStr
  );

  // Cabeçalho
  var hdr1 = [
    '#','Data','Evento','Contratante','Endereço','Status',
    'Início','Término','Duração',
    'Cachê (R$)','Custos (R$)','Lucro DJ (R$)','Daniel (R$)','Yuri (R$)',
    'XDJ','Adiant.','Vl.Adiant. (R$)','Rider','Observações'
  ];
  ws1.getRange(2, 1, 1, hdr1.length).setValues([hdr1]);
  styleHeader(ws1.getRange(2, 1, 1, hdr1.length));
  ws1.setRowHeight(2, 26);
  ws1.setFrozenRows(2);

  // Linhas de dados
  var sorted = shows.slice().sort(function(a, b) {
    return (b.data || '').localeCompare(a.data || '');
  });

  var rows1 = sorted.map(function(s, idx) {
    var daniel = calcDaniel(s);
    var yuri   = calcYuri(s);
    var lucro  = (s.cache || 0) - daniel - yuri - (s.custos || 0);
    return [
      idx + 1,
      fmtData(s.data),
      s.evento      || '—',
      s.contratante || '—',
      s.endereco    || '—',
      s.status      || '—',
      s.horaInicio  || '—',
      s.horaTermino || '—',
      s.duracao     || '—',
      s.cache       || 0,
      s.custos      || 0,
      lucro,
      daniel,
      yuri,
      s.xdj          ? 'Sim' : 'Não',
      s.adiantamento ? 'Sim' : 'Não',
      s.valorAdiantamento || 0,
      s.rider        || '—',
      s.observacoes  || '—'
    ];
  });

  if (rows1.length > 0) {
    ws1.getRange(3, 1, rows1.length, hdr1.length).setValues(rows1);

    // Linhas alternadas
    rows1.forEach(function(_, i) {
      ws1.getRange(i + 3, 1, 1, hdr1.length)
         .setBackground(i % 2 === 0 ? '#ffffff' : '#f2f4f8')
         .setVerticalAlignment('middle');
      ws1.setRowHeight(i + 3, 20);
    });

    // Status colorido
    var statusBg   = { CONFIRMADO:'#d4edda', PENDENTE:'#fef3c7', CANCELADO:'#fee2e2' };
    var statusFont = { CONFIRMADO:'#155724', PENDENTE:'#856404', CANCELADO:'#721c24' };
    sorted.forEach(function(s, i) {
      if (statusBg[s.status]) {
        ws1.getRange(i + 3, 6)
           .setBackground(statusBg[s.status])
           .setFontColor(statusFont[s.status])
           .setFontWeight('bold')
           .setHorizontalAlignment('center');
      }
    });

    // Formatos de moeda e alinhamento
    var finCols = [10, 11, 12, 13, 14, 17];
    finCols.forEach(function(col) {
      ws1.getRange(3, col, rows1.length, 1)
         .setNumberFormat('R$ #,##0.00;(R$ #,##0.00)')
         .setHorizontalAlignment('right');
    });

    // Lucro colorido
    sorted.forEach(function(s, i) {
      var daniel = calcDaniel(s);
      var yuri   = calcYuri(s);
      var lucro  = (s.cache || 0) - daniel - yuri - (s.custos || 0);
      ws1.getRange(i + 3, 12)
         .setFontWeight('bold')
         .setFontColor(lucro >= 0 ? '#155724' : '#721c24');
    });

    // Linha de totais
    var totRow = rows1.length + 3;
    ws1.getRange(totRow, 2).setValue('TOTAL');
    ws1.getRange(totRow, 3).setValue(rows1.length + ' shows');
    var sumEnd = rows1.length + 2;
    ws1.getRange(totRow, 10).setFormula('=SUM(J3:J' + sumEnd + ')');
    ws1.getRange(totRow, 11).setFormula('=SUM(K3:K' + sumEnd + ')');
    ws1.getRange(totRow, 12).setFormula('=SUM(L3:L' + sumEnd + ')');
    ws1.getRange(totRow, 13).setFormula('=SUM(M3:M' + sumEnd + ')');
    ws1.getRange(totRow, 14).setFormula('=SUM(N3:N' + sumEnd + ')');
    ws1.getRange(totRow, 17).setFormula('=SUM(Q3:Q' + sumEnd + ')');
    styleTotals(ws1.getRange(totRow, 1, 1, hdr1.length));
    finCols.forEach(function(col) {
      ws1.getRange(totRow, col)
         .setNumberFormat('R$ #,##0.00;(R$ #,##0.00)')
         .setHorizontalAlignment('right');
    });
    ws1.setRowHeight(totRow, 28);

    // Filtro automático
    ws1.getRange(2, 1, rows1.length + 1, hdr1.length).createFilter();
  }

  // Larguras de coluna
  [40,90,220,160,220,110,70,75,75,115,115,120,110,110,50,60,125,220,260]
    .forEach(function(w, i) { ws1.setColumnWidth(i + 1, w); });


  /* ═══════════════════════════════════════
     ABA 2 — POR MÊS (ano atual)
     ═══════════════════════════════════════ */
  var ws2Name = 'Por Mês ' + anoAtual;
  var ws2 = ss.getSheetByName(ws2Name) || ss.insertSheet(ws2Name);
  ws2.clearContents();
  ws2.clearFormats();

  ws2.setRowHeight(1, 32);
  styleTitle(ws2.getRange(1, 1, 1, 8), 8);
  ws2.getRange('A1').setValue('DRUDS FINANCEIRO — Por Mês — ' + anoAtual);

  var hdr2 = ['Mês','Shows','Faturamento (R$)','Custos (R$)','Daniel (R$)','Yuri (R$)','Lucro DJ (R$)','Margem %'];
  ws2.getRange(2, 1, 1, 8).setValues([hdr2]);
  styleHeader(ws2.getRange(2, 1, 1, 8));
  ws2.setRowHeight(2, 26);
  ws2.setFrozenRows(2);

  var showsAno = shows.filter(function(s) {
    return (s.ano || 0) === anoAtual && s.status === 'CONFIRMADO';
  });

  MESES.forEach(function(nomeMes, mi) {
    var mesNum = mi + 1;
    var sm = showsAno.filter(function(s) { return (s.mes || 0) === mesNum; });
    var fat = sm.reduce(function(a,s) { return a + (s.cache  || 0); }, 0);
    var cus = sm.reduce(function(a,s) { return a + (s.custos || 0); }, 0);
    var dan = sm.reduce(function(a,s) { return a + calcDaniel(s);   }, 0);
    var yur = sm.reduce(function(a,s) { return a + calcYuri(s);     }, 0);
    var luc = fat - cus - dan - yur;
    var mar = fat > 0 ? luc / fat : 0;

    var row = mi + 3;
    ws2.getRange(row, 1, 1, 8).setValues([[nomeMes, sm.length, fat, cus, dan, yur, luc, mar]]);
    ws2.getRange(row, 1, 1, 8)
       .setBackground(mi % 2 === 0 ? '#ffffff' : '#f2f4f8')
       .setVerticalAlignment('middle');
    ws2.getRange(row, 1).setFontWeight('bold');
    ws2.getRange(row, 2).setHorizontalAlignment('center');
    [3,4,5,6].forEach(function(c) {
      ws2.getRange(row, c).setNumberFormat('R$ #,##0.00;(R$ #,##0.00)').setHorizontalAlignment('right');
    });
    ws2.getRange(row, 7)
       .setNumberFormat('R$ #,##0.00;(R$ #,##0.00)')
       .setHorizontalAlignment('right')
       .setFontWeight('bold')
       .setFontColor(luc >= 0 ? '#155724' : '#721c24');
    ws2.getRange(row, 8)
       .setNumberFormat('0.0%')
       .setHorizontalAlignment('center')
       .setFontWeight('bold');
    ws2.setRowHeight(row, 22);
  });

  // Totais
  ws2.getRange(15, 1).setValue('TOTAL');
  ws2.getRange(15, 2).setValue(showsAno.length);
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
  styleTotals(ws2.getRange(15, 1, 1, 8));
  ws2.setRowHeight(15, 28);

  [130,70,145,120,120,120,130,90]
    .forEach(function(w, i) { ws2.setColumnWidth(i + 1, w); });


  /* ═══════════════════════════════════════
     ABA 3 — POR CONTRATANTE
     ═══════════════════════════════════════ */
  var ws3 = ss.getSheetByName('Por Contratante') || ss.insertSheet('Por Contratante');
  ws3.clearContents();
  ws3.clearFormats();

  ws3.setRowHeight(1, 32);
  styleTitle(ws3.getRange(1, 1, 1, 8), 8);
  ws3.getRange('A1').setValue('DRUDS FINANCEIRO — Por Contratante — Todos os Anos');

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

  var rank3 = Object.entries(cmap).sort(function(a, b) { return b[1].shows - a[1].shows; });

  rank3.forEach(function(entry, idx) {
    var nome = entry[0], v = entry[1];
    var media = v.shows > 0 ? v.cache / v.shows : 0;
    var row = idx + 3;
    ws3.getRange(row, 1, 1, 8)
       .setValues([[idx + 1, nome, v.shows, v.cache, media, v.conf, v.pend, v.canc]])
       .setBackground(idx % 2 === 0 ? '#ffffff' : '#f2f4f8')
       .setVerticalAlignment('middle');
    ws3.getRange(row, 1).setHorizontalAlignment('center');
    ws3.getRange(row, 2).setFontWeight('bold');
    ws3.getRange(row, 3).setHorizontalAlignment('center');
    [4, 5].forEach(function(c) {
      ws3.getRange(row, c).setNumberFormat('R$ #,##0.00;(R$ #,##0.00)').setHorizontalAlignment('right');
    });
    [6, 7, 8].forEach(function(c) { ws3.getRange(row, c).setHorizontalAlignment('center'); });
    if (v.conf > 0) ws3.getRange(row, 6).setFontColor('#155724');
    if (v.pend > 0) ws3.getRange(row, 7).setFontColor('#856404');
    if (v.canc > 0) ws3.getRange(row, 8).setFontColor('#721c24');
    ws3.setRowHeight(row, 22);
  });

  // Totais
  var n3 = rank3.length;
  if (n3 > 0) {
    var tot3 = n3 + 3;
    ws3.getRange(tot3, 2).setValue('TOTAL');
    ws3.getRange(tot3, 3).setFormula('=SUM(C3:C' + (n3 + 2) + ')').setHorizontalAlignment('center');
    ws3.getRange(tot3, 4).setFormula('=SUM(D3:D' + (n3 + 2) + ')').setNumberFormat('R$ #,##0.00;(R$ #,##0.00)').setHorizontalAlignment('right');
    ws3.getRange(tot3, 5).setFormula('=IFERROR(D' + tot3 + '/C' + tot3 + ',0)').setNumberFormat('R$ #,##0.00;(R$ #,##0.00)').setHorizontalAlignment('right');
    ws3.getRange(tot3, 6).setFormula('=SUM(F3:F' + (n3 + 2) + ')').setHorizontalAlignment('center');
    ws3.getRange(tot3, 7).setFormula('=SUM(G3:G' + (n3 + 2) + ')').setHorizontalAlignment('center');
    ws3.getRange(tot3, 8).setFormula('=SUM(H3:H' + (n3 + 2) + ')').setHorizontalAlignment('center');
    styleTotals(ws3.getRange(tot3, 1, 1, 8));
    ws3.setRowHeight(tot3, 28);
  }

  ws3.getRange(2, 1, n3 + 1, 8).createFilter();
  [40, 210, 70, 145, 145, 100, 90, 90]
    .forEach(function(w, i) { ws3.setColumnWidth(i + 1, w); });


  /* ── Notificação ── */
  ss.toast(
    shows.length + ' shows carregados · ' + dataStr,
    '✅ DRUDS FINANCEIRO — Atualizado',
    6
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
   MENU PERSONALIZADO (aparece ao abrir a planilha)
   ═══════════════════════════════════════════════════════════════════ */
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('🎧 Druds Financeiro')
    .addItem('🔄  Sincronizar agora', 'atualizarPlanilha')
    .addSeparator()
    .addItem('⏱  Ativar auto-update (1h)', 'ativarAutoUpdate')
    .addToUi();
}

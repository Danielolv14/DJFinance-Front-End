/* ────────────────────────────────────────────────────────────────
   DADOS DE DEMONSTRAÇÃO — usados apenas quando ?demo está na URL
   ──────────────────────────────────────────────────────────────── */

export const MOCK_SHOWS = [
  /* ── JANEIRO 2025 ── */
  { id:101, nome:'DJ Druds', data:'2025-01-18', ano:2025, mes:1,
    evento:'Aniversário 30 Anos — Renata Silva', status:'CONFIRMADO',
    horaInicio:'22:00', horaTermino:'04:00', duracao:'6h',
    cache:2800, xdj:false, adiantamento:true, valorAdiantamento:800,
    contratante:'Renata Silva', endereco:'Salão Esmeralda — Itaúna, MG',
    custos:120, observacoes:'Playlist personalizada enviada.',
    semCacheDaniel:false, semCacheYuri:false },

  /* ── FEVEREIRO 2025 ── */
  { id:102, nome:'DJ Druds', data:'2025-02-08', ano:2025, mes:2,
    evento:'Carnaval — Clube Municipal', status:'CONFIRMADO',
    horaInicio:'20:00', horaTermino:'05:00', duracao:'9h',
    cache:5500, xdj:true, adiantamento:true, valorAdiantamento:2000,
    contratante:'Clube Municipal de Itaúna', endereco:'Clube Municipal — Itaúna, MG',
    custos:0, observacoes:'Sonorização e palco inclusos pelo contratante.',
    semCacheDaniel:false, semCacheYuri:false },

  /* ── MARÇO 2025 ── */
  { id:103, nome:'DJ Druds', data:'2025-03-15', ano:2025, mes:3,
    evento:'Casamento Lara & Pedro', status:'CONFIRMADO',
    horaInicio:'19:00', horaTermino:'03:00', duracao:'8h',
    cache:6000, xdj:true, adiantamento:true, valorAdiantamento:2500,
    contratante:'Família Oliveira', endereco:'Espaço Villa Bella — Divinópolis, MG',
    custos:200, observacoes:'Cerimônia + recepção. Playlist aprovada.',
    semCacheDaniel:false, semCacheYuri:false },

  { id:104, nome:'DJ Druds', data:'2025-03-29', ano:2025, mes:3,
    evento:'Fest Corporativa — TechMinas', status:'CONFIRMADO',
    horaInicio:'20:00', horaTermino:'01:00', duracao:'5h',
    cache:4000, xdj:false, adiantamento:false, valorAdiantamento:0,
    contratante:'TechMinas Soluções', endereco:'Hotel Golden Tulip — BH, MG',
    custos:80, observacoes:'',
    semCacheDaniel:false, semCacheYuri:false },

  /* ── ABRIL 2025 ── */
  { id:105, nome:'DJ Druds', data:'2025-04-05', ano:2025, mes:4,
    evento:'Aniversário 50 Anos — Carlos Mancini', status:'CONFIRMADO',
    horaInicio:'21:00', horaTermino:'04:00', duracao:'7h',
    cache:3500, xdj:false, adiantamento:true, valorAdiantamento:1000,
    contratante:'Carlos Mancini', endereco:'Chácara São Joaquim — Itaúna, MG',
    custos:0, observacoes:'',
    semCacheDaniel:false, semCacheYuri:false },

  { id:106, nome:'DJ Druds', data:'2025-04-26', ano:2025, mes:4,
    evento:'Balada Open Bar — Club 55', status:'CONFIRMADO',
    horaInicio:'23:00', horaTermino:'06:00', duracao:'7h',
    cache:5000, xdj:true, adiantamento:false, valorAdiantamento:0,
    contratante:'Club 55 Entretenimento', endereco:'Club 55 — Divinópolis, MG',
    custos:0, observacoes:'',
    semCacheDaniel:false, semCacheYuri:false },

  /* ── MAIO 2025 ── */
  { id:107, nome:'DJ Druds', data:'2025-05-17', ano:2025, mes:5,
    evento:'Casamento Júlia & Rafael', status:'CONFIRMADO',
    horaInicio:'18:00', horaTermino:'02:00', duracao:'8h',
    cache:7200, xdj:true, adiantamento:true, valorAdiantamento:3000,
    contratante:'Família Costa', endereco:'Haras São Benedito — Pará de Minas, MG',
    custos:300, observacoes:'Cerimônia ao ar livre + recepção interna.',
    semCacheDaniel:false, semCacheYuri:false },

  /* ── JUNHO 2025 ── */
  { id:108, nome:'DJ Druds', data:'2025-06-14', ano:2025, mes:6,
    evento:'Festa Junina — Colégio São Lucas', status:'CONFIRMADO',
    horaInicio:'16:00', horaTermino:'22:00', duracao:'6h',
    cache:2200, xdj:false, adiantamento:false, valorAdiantamento:0,
    contratante:'Colégio São Lucas', endereco:'Colégio São Lucas — Itaúna, MG',
    custos:0, observacoes:'Collab — sem cachê para equipe.',
    semCacheDaniel:true, semCacheYuri:true },

  { id:109, nome:'DJ Druds', data:'2025-06-28', ano:2025, mes:6,
    evento:'Aniversário 21 Anos — Gabriela Lopes', status:'CONFIRMADO',
    horaInicio:'22:00', horaTermino:'05:00', duracao:'7h',
    cache:3200, xdj:false, adiantamento:true, valorAdiantamento:1000,
    contratante:'Gabriela Lopes', endereco:'Villa Garden Eventos — Itaúna, MG',
    custos:100, observacoes:'',
    semCacheDaniel:false, semCacheYuri:false },

  /* ── JULHO 2025 ── */
  { id:110, nome:'DJ Druds', data:'2025-07-12', ano:2025, mes:7,
    evento:'Festival Universitário UEMG', status:'CONFIRMADO',
    horaInicio:'21:00', horaTermino:'03:00', duracao:'6h',
    cache:3800, xdj:false, adiantamento:true, valorAdiantamento:1500,
    contratante:'UEMG — Diretório Acadêmico', endereco:'UEMG Campus Divinópolis',
    custos:150, observacoes:'',
    semCacheDaniel:false, semCacheYuri:false },

  { id:111, nome:'DJ Druds', data:'2025-07-26', ano:2025, mes:7,
    evento:'Pool Party Condomínio Park Life', status:'CONFIRMADO',
    horaInicio:'14:00', horaTermino:'21:00', duracao:'7h',
    cache:4500, xdj:true, adiantamento:true, valorAdiantamento:2000,
    contratante:'Condomínio Park Life', endereco:'Área de Lazer Park Life — Itaúna, MG',
    custos:200, observacoes:'',
    semCacheDaniel:false, semCacheYuri:false },

  /* ── AGOSTO 2025 ── */
  { id:112, nome:'DJ Druds', data:'2025-08-09', ano:2025, mes:8,
    evento:'Casamento Ana & Bruno', status:'CONFIRMADO',
    horaInicio:'19:00', horaTermino:'03:00', duracao:'8h',
    cache:8000, xdj:true, adiantamento:true, valorAdiantamento:3500,
    contratante:'Família Ferreira', endereco:'Espaço Recanto das Flores — BH, MG',
    custos:400, observacoes:'Show premium. Cerimônia + coquetel + festa.',
    semCacheDaniel:false, semCacheYuri:false },

  /* ── SETEMBRO 2025 ── */
  { id:113, nome:'DJ Druds', data:'2025-09-06', ano:2025, mes:9,
    evento:'Formatura Administração — UFMG', status:'CONFIRMADO',
    horaInicio:'20:00', horaTermino:'04:00', duracao:'8h',
    cache:9000, xdj:true, adiantamento:true, valorAdiantamento:4000,
    contratante:'Comissão Formatura UFMG 2025', endereco:'Centro de Convenções — BH, MG',
    custos:500, observacoes:'Rider técnico completo exigido.',
    semCacheDaniel:false, semCacheYuri:false },

  { id:114, nome:'DJ Druds', data:'2025-09-20', ano:2025, mes:9,
    evento:'Aniversário 40 Anos — Felipe Andrade', status:'CONFIRMADO',
    horaInicio:'22:00', horaTermino:'04:00', duracao:'6h',
    cache:3600, xdj:false, adiantamento:false, valorAdiantamento:0,
    contratante:'Felipe Andrade', endereco:'Espaço Requinte — Divinópolis, MG',
    custos:80, observacoes:'',
    semCacheDaniel:false, semCacheYuri:false },

  /* ── OUTUBRO 2025 ── */
  { id:115, nome:'DJ Druds', data:'2025-10-11', ano:2025, mes:10,
    evento:'Formatura Medicina — PUC Minas', status:'CONFIRMADO',
    horaInicio:'20:00', horaTermino:'04:00', duracao:'8h',
    cache:9500, xdj:true, adiantamento:true, valorAdiantamento:4000,
    contratante:'Comissão Formatura PUC Minas 2025', endereco:'Minascentro — BH, MG',
    custos:600, observacoes:'Evento premium. Rider com espelhos e laser.',
    semCacheDaniel:false, semCacheYuri:false },

  /* ── NOVEMBRO 2025 ── */
  { id:116, nome:'DJ Druds', data:'2025-11-08', ano:2025, mes:11,
    evento:'Casamento Fernanda & Lucas', status:'CONFIRMADO',
    horaInicio:'18:30', horaTermino:'02:30', duracao:'8h',
    cache:6500, xdj:true, adiantamento:true, valorAdiantamento:2500,
    contratante:'Família Martins', endereco:'Fazenda Serra Verde — Itaúna, MG',
    custos:200, observacoes:'',
    semCacheDaniel:false, semCacheYuri:false },

  { id:117, nome:'DJ Druds', data:'2025-11-22', ano:2025, mes:11,
    evento:'Balada Black Night — Club Diamond', status:'CONFIRMADO',
    horaInicio:'23:00', horaTermino:'06:00', duracao:'7h',
    cache:5200, xdj:true, adiantamento:false, valorAdiantamento:0,
    contratante:'Club Diamond Entretenimento', endereco:'Club Diamond — Divinópolis, MG',
    custos:0, observacoes:'',
    semCacheDaniel:false, semCacheYuri:false },

  /* ── DEZEMBRO 2025 ── */
  { id:118, nome:'DJ Druds', data:'2025-12-06', ano:2025, mes:12,
    evento:'Confraternização — XYZ Construtora', status:'CONFIRMADO',
    horaInicio:'19:00', horaTermino:'00:00', duracao:'5h',
    cache:4500, xdj:false, adiantamento:false, valorAdiantamento:0,
    contratante:'XYZ Construtora', endereco:'Rooftop XYZ Tower — BH, MG',
    custos:100, observacoes:'',
    semCacheDaniel:false, semCacheYuri:false },

  { id:119, nome:'DJ Druds', data:'2025-12-27', ano:2025, mes:12,
    evento:'Réveillon Privê — Alphaville Itaúna', status:'CONFIRMADO',
    horaInicio:'22:00', horaTermino:'06:00', duracao:'8h',
    cache:8500, xdj:true, adiantamento:true, valorAdiantamento:4000,
    contratante:'Condomínio Alphaville Itaúna', endereco:'Área de Lazer Alphaville — Itaúna, MG',
    custos:300, observacoes:'Réveillon 2025→2026. Fogos na virada.',
    semCacheDaniel:false, semCacheYuri:false },

  /* ── JANEIRO 2026 ── */
  { id:120, nome:'DJ Druds', data:'2026-01-17', ano:2026, mes:1,
    evento:'Casamento Camila & Diego', status:'CONFIRMADO',
    horaInicio:'19:00', horaTermino:'03:00', duracao:'8h',
    cache:7000, xdj:true, adiantamento:true, valorAdiantamento:3000,
    contratante:'Família Souza', endereco:'Espaço Grand Ville — Divinópolis, MG',
    custos:250, observacoes:'',
    semCacheDaniel:false, semCacheYuri:false },

  /* ── FEVEREIRO 2026 ── */
  { id:121, nome:'DJ Druds', data:'2026-02-28', ano:2026, mes:2,
    evento:'Carnaval — Bloco Cultural Itaúna', status:'CONFIRMADO',
    horaInicio:'14:00', horaTermino:'22:00', duracao:'8h',
    cache:4200, xdj:false, adiantamento:false, valorAdiantamento:0,
    contratante:'Associação Cultural Itaúna', endereco:'Praça Central — Itaúna, MG',
    custos:0, observacoes:'Collab com artista local.',
    semCacheDaniel:true, semCacheYuri:true },

  /* ── MARÇO 2026 ── */
  { id:122, nome:'DJ Druds', data:'2026-03-21', ano:2026, mes:3,
    evento:'Aniversário 25 Anos — Beatriz Lemos', status:'CONFIRMADO',
    horaInicio:'22:00', horaTermino:'05:00', duracao:'7h',
    cache:3200, xdj:false, adiantamento:true, valorAdiantamento:1200,
    contratante:'Beatriz Lemos', endereco:'Casa de Eventos Bella Noite — Itaúna, MG',
    custos:80, observacoes:'',
    semCacheDaniel:false, semCacheYuri:false },

  /* ── ABRIL 2026 ── */
  { id:123, nome:'DJ Druds', data:'2026-04-18', ano:2026, mes:4,
    evento:'Formatura Direito — PUC Minas', status:'CONFIRMADO',
    horaInicio:'20:00', horaTermino:'04:00', duracao:'8h',
    cache:8800, xdj:true, adiantamento:true, valorAdiantamento:4000,
    contratante:'Comissão Formatura Direito PUC 2026', endereco:'Minascentro — BH, MG',
    custos:600, observacoes:'Rider técnico completo exigido.',
    semCacheDaniel:false, semCacheYuri:false },

  /* ── MAIO 2026 (PENDENTE) ── */
  { id:124, nome:'DJ Druds', data:'2026-05-10', ano:2026, mes:5,
    evento:'Casamento Isabela & Marcos', status:'PENDENTE',
    horaInicio:'19:00', horaTermino:'03:00', duracao:'8h',
    cache:7500, xdj:true, adiantamento:true, valorAdiantamento:3000,
    contratante:'Família Pereira', endereco:'Espaço Garden Palace — BH, MG',
    custos:300, observacoes:'',
    semCacheDaniel:false, semCacheYuri:false },

  /* ── JUNHO 2026 (PENDENTE) ── */
  { id:125, nome:'DJ Druds', data:'2026-06-20', ano:2026, mes:6,
    evento:'Festa Junina Premium — Fazenda Boa Vista', status:'PENDENTE',
    horaInicio:'17:00', horaTermino:'23:00', duracao:'6h',
    cache:5000, xdj:false, adiantamento:false, valorAdiantamento:0,
    contratante:'Fazenda Boa Vista Eventos', endereco:'Fazenda Boa Vista — Itaúna, MG',
    custos:0, observacoes:'',
    semCacheDaniel:false, semCacheYuri:false },

  /* ── JULHO 2026 (PENDENTE) ── */
  { id:126, nome:'DJ Druds', data:'2026-07-12', ano:2026, mes:7,
    evento:'Balada Verão — Club Diamond', status:'PENDENTE',
    horaInicio:'23:00', horaTermino:'06:00', duracao:'7h',
    cache:6000, xdj:true, adiantamento:false, valorAdiantamento:0,
    contratante:'Club Diamond Entretenimento', endereco:'Club Diamond — Divinópolis, MG',
    custos:0, observacoes:'',
    semCacheDaniel:false, semCacheYuri:false },

  /* ── AGOSTO 2026 (PENDENTE) ── */
  { id:127, nome:'DJ Druds', data:'2026-08-29', ano:2026, mes:8,
    evento:'Casamento Vitória & Rodrigo', status:'PENDENTE',
    horaInicio:'18:30', horaTermino:'03:00', duracao:'8h30',
    cache:8200, xdj:true, adiantamento:true, valorAdiantamento:3500,
    contratante:'Família Ramos', endereco:'Espaço Alto das Pedras — Nova Lima, MG',
    custos:400, observacoes:'',
    semCacheDaniel:false, semCacheYuri:false },
];

/* ── Cálculo local do fechamento para demo mode ── */
const INICIO_EQUIPE   = new Date('2025-03-01');
const INICIO_PERC_10  = new Date('2026-01-01');
const INICIO_PERC_20  = new Date('2026-04-01');

function calcDanielLocal(show) {
  if (show.semCacheDaniel) return 0;
  const d = new Date(show.data + 'T00:00:00');
  if (d < INICIO_EQUIPE) return 0;
  if (d < INICIO_PERC_10) return 50;
  const p = d < INICIO_PERC_20 ? 0.10 : 0.20;
  const base = (show.cache || 0) - (show.custos || 0);
  return (base > 0 ? base * p : 0) + 40;
}
function calcYuriLocal(show) {
  if (show.semCacheYuri) return 0;
  return new Date(show.data + 'T00:00:00') < INICIO_EQUIPE ? 0 : 300;
}

export function getMockFechamento(mes, ano, aliquota) {
  const shows = MOCK_SHOWS.filter(s => s.mes === mes && s.ano === ano);
  const totalBruto    = shows.reduce((a, s) => a + (s.cache  || 0), 0);
  const totalCustos   = shows.reduce((a, s) => a + (s.custos || 0), 0);
  const totalDaniel   = shows.reduce((a, s) => a + calcDanielLocal(s), 0);
  const totalYuri     = shows.reduce((a, s) => a + calcYuriLocal(s),   0);
  const totalImpostos = aliquota ? Math.round(totalBruto * (aliquota / 100) * 100) / 100 : 0;
  const lucroLiquido  = totalBruto - totalDaniel - totalYuri - totalCustos - totalImpostos;
  return {
    mes, ano,
    quantidadeShows: shows.length,
    totalBruto:    Math.round(totalBruto    * 100) / 100,
    totalDaniel:   Math.round(totalDaniel   * 100) / 100,
    totalYuri:     Math.round(totalYuri     * 100) / 100,
    totalCustos:   Math.round(totalCustos   * 100) / 100,
    totalImpostos,
    lucroLiquido:  Math.round(lucroLiquido  * 100) / 100,
    shows,
  };
}

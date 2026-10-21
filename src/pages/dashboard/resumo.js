/* Contas do Dashboard. Funções puras: recebem shows e devolvem números prontos para a tela. */

import { pagamentoDaniel, pagamentoYuri } from '../../utils/pagamentos';
import { MESES_ABREV } from '../../utils/format';

const soma = (shows, valor) => shows.reduce((total, s) => total + valor(s), 0);

/** Bruto, custos, pagamentos e lucro de um conjunto de shows. */
export function resumoFinanceiro(shows) {
  const bruto  = soma(shows, s => s.cache || 0);
  const custos = soma(shows, s => s.custos || 0);
  const daniel = soma(shows, pagamentoDaniel);
  const yuri   = soma(shows, pagamentoYuri);
  return { bruto, custos, daniel, yuri, lucro: bruto - daniel - yuri - custos };
}

/** Cachê e lucro de cada mês do ano (para os gráficos e o seletor de mês). */
export function faturamentoPorMes(confirmados) {
  const cache = Array(12).fill(0), lucro = Array(12).fill(0);
  confirmados.forEach(s => {
    if (!s.mes) return;
    cache[s.mes - 1] += (s.cache || 0);
    lucro[s.mes - 1] += Math.max((s.cache || 0) - pagamentoDaniel(s) - pagamentoYuri(s) - (s.custos || 0), 0);
  });
  return MESES_ABREV.map((label, i) => ({ label, valor: Math.round(cache[i]), lucro: Math.round(lucro[i]) }));
}

/** Notas de 0 a 100 do radar de performance. */
export function indicadoresRadar(confirmados, bruto, lucro) {
  const clientes = new Set(confirmados.map(s => s.contratante).filter(Boolean)).size;
  const margem = bruto > 0 ? (lucro / bruto) * 100 : 0;
  const showsPorCliente = confirmados.reduce((m, s) => {
    if (s.contratante) m[s.contratante] = (m[s.contratante] || 0) + 1;
    return m;
  }, {});
  const recorrentes = Object.values(showsPorCliente).filter(n => n >= 2).length;
  const recorrencia = clientes > 0 ? Math.min((recorrentes / clientes) * 100, 100) : 0;
  return [
    { subject: 'Cache',       value: Math.round(Math.min(((bruto / confirmados.length || 0) / 2000) * 100, 100)), fullMark: 100 },
    { subject: 'Shows',       value: Math.round(Math.min((confirmados.length / 40) * 100, 100)),                    fullMark: 100 },
    { subject: 'Margem',      value: Math.round(Math.min(margem, 100)),                                             fullMark: 100 },
    { subject: 'Clientes',    value: Math.round(Math.min((clientes / 20) * 100, 100)),                              fullMark: 100 },
    { subject: 'Recorrência', value: Math.round(recorrencia),                                                       fullMark: 100 },
  ];
}

/** Os 5 contratantes com mais shows no ano. */
export function topContratantes(showsAno) {
  const porContratante = {};
  showsAno.forEach(s => {
    if (!s.contratante) return;
    if (!porContratante[s.contratante]) porContratante[s.contratante] = { shows: 0, cache: 0 };
    porContratante[s.contratante].shows++;
    porContratante[s.contratante].cache += (s.cache || 0);
  });
  return Object.entries(porContratante)
    .sort((a, b) => b[1].shows - a[1].shows)
    .slice(0, 5)
    .map(([nome, v]) => ({ nome, ...v }));
}

export const ultimosShows = confirmados =>
  [...confirmados].sort((a, b) => new Date(b.data) - new Date(a.data)).slice(0, 5);

/** Shows de agora até daqui a 7 dias. */
export function proximos7Dias(shows, agora = new Date()) {
  const limite = new Date(agora.getTime() + 7 * 24 * 60 * 60 * 1000);
  return shows
    .filter(s => { const d = new Date(s.data + 'T00:00:00'); return d >= agora && d <= limite; })
    .sort((a, b) => new Date(a.data) - new Date(b.data));
}

/** Faturamento previsto para o ano atual, pela média dos meses que já tiveram shows. */
export function projecaoAnual(porMes, bruto, mesAtual) {
  const mesesComDados = porMes.filter(d => d.valor > 0).length;
  if (mesesComDados === 0) return null;
  const mesesRestantes = 12 - mesAtual;
  if (mesesRestantes <= 0) return null;
  return Math.round(bruto + (bruto / mesesComDados) * mesesRestantes);
}

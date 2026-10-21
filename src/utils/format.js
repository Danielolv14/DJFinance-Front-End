/* Formatação de valores e datas usada em todo o front. */

const BRL = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0 });
const BRL_CENTAVOS = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

/** R$ 1.500 (centavos só quando existem). */
export const moeda = v => BRL.format(v || 0);

/** R$ 1.500,00 (sempre com centavos). */
export const moedaComCentavos = v => BRL_CENTAVOS.format(v || 0);

/** '2026-10-25' → '25/10/2026'; vazio → '—'. */
export const dataBR = iso => (iso ? iso.toString().split('-').reverse().join('/') : '—');

export const MESES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

export const MESES_ABREV = MESES.map(m => m.slice(0, 3));

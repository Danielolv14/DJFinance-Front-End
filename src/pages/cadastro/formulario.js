/* Estado inicial do formulário de show e contas auxiliares do cadastro. */
export const VAZIO = {
  nome:'', data:'', ano: new Date().getFullYear(), mes: new Date().getMonth()+1,
  evento:'', status:'CONFIRMADO',
  horaInicio:'', horaTermino:'', duracao:'',
  cache:'', xdj:false, adiantamento:false, valorAdiantamento:'',
  semCacheDaniel: false, semCacheYuri: false,
  temProdutor: false, valorProdutor: '',
  contratante:'', endereco:'', rider:'', custos:'', observacoes:'',
};

export function calcularDuracao(inicio, termino) {
  if (!inicio || !termino) return '';
  const [h1,m1] = inicio.split(':').map(Number);
  const [h2,m2] = termino.split(':').map(Number);
  let totalMin = (h2*60+m2) - (h1*60+m1);
  if (totalMin < 0) totalMin += 24*60;
  const h = Math.floor(totalMin/60);
  const m = totalMin%60;
  if (h === 0) return `${m}min`;
  if (m === 0) return `${h}h`;
  return `${h}h${String(m).padStart(2,'0')}min`;
}

export function dataBloqueada(data, bloqueios) {
  if (!data || !bloqueios?.length) return null;
  const d = new Date(data + 'T00:00:00');
  return bloqueios.find(b => {
    const inicio = new Date(b.dataInicio + 'T00:00:00');
    const fim    = new Date(b.dataFim    + 'T00:00:00');
    return d >= inicio && d <= fim;
  }) || null;
}

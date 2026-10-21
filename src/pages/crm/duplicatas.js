/* Acha nomes parecidos de contratantes e locais (mesmas 5 primeiras letras, sem acento nem símbolo). */
/* ─── helpers ─── */
function normalizar(s) {
  return (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '').trim();
}

export function detectarDuplicatas(lista) {
  const grupos = {};
  lista.forEach(item => {
    const chave = normalizar(item.nome).slice(0, 5);
    if (!grupos[chave]) grupos[chave] = [];
    grupos[chave].push(item);
  });
  return Object.values(grupos).filter(g => g.length > 1);
}

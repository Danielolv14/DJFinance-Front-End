const BASE_URL = 'https://djfinance-back-end-production.up.railway.app';

export async function getShows() {
  const res = await fetch(`${BASE_URL}/shows`);
  if (!res.ok) throw new Error('Erro ao buscar shows');
  return res.json();
}

export async function createShow(show) {
  const res = await fetch(`${BASE_URL}/shows`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(show),
  });
  if (!res.ok) { const e = await res.json(); throw new Error(e.mensagem || 'Erro ao cadastrar show'); }
  return res.json();
}

export async function updateShow(id, show) {
  const res = await fetch(`${BASE_URL}/shows/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(show),
  });
  if (!res.ok) { const e = await res.json(); throw new Error(e.mensagem || 'Erro ao atualizar show'); }
  return res.json();
}

export async function deleteShow(id) {
  const res = await fetch(`${BASE_URL}/shows/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Erro ao deletar show');
}

export async function getFechamento(mes, ano, imposto = null) {
  const params = new URLSearchParams({ mes, ano });
  if (imposto) params.append('imposto', imposto);
  const res = await fetch(`${BASE_URL}/fechamento?${params}`);
  if (!res.ok) throw new Error('Erro ao buscar fechamento');
  return res.json();
}

export async function getStatsContratantes() {
  const res = await fetch(`${BASE_URL}/stats/contratantes`);
  if (!res.ok) throw new Error('Erro ao buscar stats de contratantes');
  return res.json();
}

export async function getStatsLocais() {
  const res = await fetch(`${BASE_URL}/stats/locais`);
  if (!res.ok) throw new Error('Erro ao buscar stats de locais');
  return res.json();
}

export async function getProjecao() {
  const res = await fetch(`${BASE_URL}/stats/projecao`);
  if (!res.ok) throw new Error('Erro ao buscar projeção');
  return res.json();
}

export async function normalizarLocal(de, para) {
  const res = await fetch(`http://localhost:8080/shows/normalizar-local`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ de, para }),
  });
  if (!res.ok) throw new Error('Erro ao normalizar local');
  return res.json();
}

export async function normalizarContratante(de, para) {
  const res = await fetch(`http://localhost:8080/shows/normalizar-contratante`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ de, para }),
  });
  if (!res.ok) throw new Error('Erro ao normalizar contratante');
  return res.json();
}

const BASE_URL = 'https://djfinance-back-end-production.up.railway.app';

function getDJ() {
  return localStorage.getItem('djAtivo') || 'DRUDS';
}

export async function getShows() {
  const res = await fetch(`${BASE_URL}/shows?dj=${getDJ()}`);
  if (!res.ok) throw new Error('Erro ao buscar shows');
  return res.json();
}

export async function createShow(show) {
  const payload = { ...show, dj: getDJ() };
  const res = await fetch(`${BASE_URL}/shows`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) { const e = await res.json(); throw new Error(e.mensagem || 'Erro ao cadastrar show'); }
  return res.json();
}

export async function updateShow(id, show) {
  const payload = { ...show, dj: getDJ() };
  const res = await fetch(`${BASE_URL}/shows/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) { const e = await res.json(); throw new Error(e.mensagem || 'Erro ao atualizar show'); }
  return res.json();
}

export async function deleteShow(id) {
  const res = await fetch(`${BASE_URL}/shows/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Erro ao deletar show');
}

export async function getFechamento(mes, ano, imposto = null) {
  const params = new URLSearchParams({ mes, ano, dj: getDJ() });
  if (imposto) params.append('imposto', imposto);
  const res = await fetch(`${BASE_URL}/fechamento?${params}`);
  if (!res.ok) throw new Error('Erro ao buscar fechamento');
  return res.json();
}

export async function getStatsContratantes() {
  const res = await fetch(`${BASE_URL}/stats/contratantes?dj=${getDJ()}`);
  if (!res.ok) throw new Error('Erro ao buscar stats de contratantes');
  return res.json();
}

export async function getStatsLocais() {
  const res = await fetch(`${BASE_URL}/stats/locais?dj=${getDJ()}`);
  if (!res.ok) throw new Error('Erro ao buscar stats de locais');
  return res.json();
}

export async function getProjecao() {
  const res = await fetch(`${BASE_URL}/stats/projecao?dj=${getDJ()}`);
  if (!res.ok) throw new Error('Erro ao buscar projeção');
  return res.json();
}

export async function getBloqueios() {
  const res = await fetch(`${BASE_URL}/bloqueios?dj=${getDJ()}`);
  if (!res.ok) throw new Error('Erro ao buscar bloqueios');
  return res.json();
}

export async function createBloqueio(bloqueio) {
  const res = await fetch(`${BASE_URL}/bloqueios?dj=${getDJ()}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(bloqueio),
  });
  if (!res.ok) { const e = await res.json(); throw new Error(e.mensagem || 'Erro ao criar bloqueio'); }
  return res.json();
}

export async function deleteBloqueio(id) {
  const res = await fetch(`${BASE_URL}/bloqueios/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Erro ao deletar bloqueio');
}

export async function normalizarLocal(de, para) {
  const res = await fetch(`${BASE_URL}/shows/normalizar-local`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ de, para }),
  });
  if (!res.ok) throw new Error('Erro ao normalizar local');
  return res.json();
}

export async function normalizarContratante(de, para) {
  const res = await fetch(`${BASE_URL}/shows/normalizar-contratante`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ de, para }),
  });
  if (!res.ok) throw new Error('Erro ao normalizar contratante');
  return res.json();
}

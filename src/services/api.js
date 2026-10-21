/* Todas as chamadas ao back-end. O DJ ativo vai em cada requisição (?dj=).
   No modo demonstração nada chega ao servidor: o CRM usa dados fictícios e o resto falha com aviso. */

import { IS_DEMO } from '../utils/demo';
import { getMockStatsContratantes, getMockStatsLocais } from '../mockData';

const BASE_URL = process.env.REACT_APP_API_URL || 'https://djfinance-back-end-production.up.railway.app';

function djAtivo() {
  return localStorage.getItem('djAtivo') || 'DRUDS';
}

/** Faz a requisição; em erro, usa a mensagem do back quando existir. */
async function requisitar(caminho, mensagemErro, opcoes) {
  if (IS_DEMO) throw new Error('Modo demonstração: nada é salvo no servidor.');
  const res = await fetch(`${BASE_URL}${caminho}`, opcoes);
  if (!res.ok) {
    const corpo = await res.json().catch(() => ({}));
    throw new Error(corpo.mensagem || mensagemErro);
  }
  return res.status === 204 ? null : res.json();
}

const comJson = (method, dados) => ({
  method,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(dados),
});

/* ── Shows ── */
export const getShows = () =>
  requisitar(`/shows?dj=${djAtivo()}`, 'Erro ao buscar shows');

export const createShow = show =>
  requisitar('/shows', 'Erro ao cadastrar show', comJson('POST', { ...show, dj: djAtivo() }));

export const updateShow = (id, show) =>
  requisitar(`/shows/${id}`, 'Erro ao atualizar show', comJson('PUT', { ...show, dj: djAtivo() }));

export const deleteShow = id =>
  requisitar(`/shows/${id}`, 'Erro ao deletar show', { method: 'DELETE' });

export const removerDuplicados = () =>
  requisitar(`/shows/duplicados?dj=${djAtivo()}`, 'Erro ao remover duplicados', { method: 'DELETE' });

export function importarCSV(arquivo) {
  const formData = new FormData();
  formData.append('arquivo', arquivo);
  return requisitar(`/shows/importar?dj=${djAtivo()}`, 'Erro ao importar', { method: 'POST', body: formData });
}

/* ── Fechamento e estatísticas ── */
export function getFechamento(mes, ano, imposto = null) {
  const params = new URLSearchParams({ mes, ano, dj: djAtivo() });
  if (imposto) params.append('imposto', imposto);
  return requisitar(`/fechamento?${params}`, 'Erro ao buscar fechamento');
}

export const getStatsContratantes = () => IS_DEMO
  ? Promise.resolve(getMockStatsContratantes())
  : requisitar(`/stats/contratantes?dj=${djAtivo()}`, 'Erro ao buscar stats de contratantes');

export const getStatsLocais = () => IS_DEMO
  ? Promise.resolve(getMockStatsLocais())
  : requisitar(`/stats/locais?dj=${djAtivo()}`, 'Erro ao buscar stats de locais');

/* ── Bloqueios de agenda ── */
export const getBloqueios = () =>
  requisitar(`/bloqueios?dj=${djAtivo()}`, 'Erro ao buscar bloqueios');

export const createBloqueio = bloqueio =>
  requisitar(`/bloqueios?dj=${djAtivo()}`, 'Erro ao criar bloqueio', comJson('POST', bloqueio));

export const deleteBloqueio = id =>
  requisitar(`/bloqueios/${id}`, 'Erro ao deletar bloqueio', { method: 'DELETE' });

/* ── Normalização (CRM) ── */
export const normalizarLocal = (de, para) =>
  requisitar(`/shows/normalizar-local?dj=${djAtivo()}`, 'Erro ao normalizar local', comJson('PUT', { de, para }));

export const normalizarContratante = (de, para) =>
  requisitar(`/shows/normalizar-contratante?dj=${djAtivo()}`, 'Erro ao normalizar contratante', comJson('PUT', { de, para }));

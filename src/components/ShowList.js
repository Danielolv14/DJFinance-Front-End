// components/ShowList.js
// Lista todos os shows cadastrados no banco.
// Permite deletar um show com confirmação.

import { deleteShow } from '../services/api';

export default function ShowList({ shows, loading, onShowDeletado }) {
  async function handleDelete(id, local) {
    if (!window.confirm(`Deletar o show em "${local}"?`)) return;
    try {
      await deleteShow(id);
      onShowDeletado();
    } catch (err) {
      alert('Erro ao deletar show: ' + err.message);
    }
  }

  function formatarData(data) {
    // Converte "2026-03-06" para "06/03/2026"
    const [ano, mes, dia] = data.split('-');
    return `${dia}/${mes}/${ano}`;
  }

  function formatarCache(valor) {
    if (!valor) return <span className="sem-valor">Não definido</span>;
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(valor);
  }

  return (
    <div className="card">
      <h2 className="card-title">
        <span className="icon">📋</span> Shows Cadastrados
        <span className="badge">{shows.length}</span>
      </h2>

      {loading && <div className="loading">Carregando...</div>}

      {!loading && shows.length === 0 && (
        <div className="empty">Nenhum show cadastrado ainda.</div>
      )}

      {!loading && shows.length > 0 && (
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Data</th>
                <th>Local</th>
                <th>Cachê</th>
                <th>Observações</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {shows.map((show) => (
                <tr key={show.id}>
                  <td className="data-cell">{formatarData(show.data)}</td>
                  <td>{show.local}</td>
                  <td className="cache-cell">{formatarCache(show.valorCache)}</td>
                  <td className="obs-cell">{show.observacoes || '—'}</td>
                  <td>
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => handleDelete(show.id, show.local)}
                    >
                      Deletar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

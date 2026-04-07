import { useState } from 'react';
import { createBloqueio, deleteBloqueio } from '../services/api';

export default function BloqueioAgenda({ bloqueios, onAtualizar }) {
  const [form, setForm] = useState({ dataInicio: '', dataFim: '', motivo: '' });
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');

  function handleChange(e) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setErro('');
  }

  async function handleCriar(e) {
    e.preventDefault();
    if (!form.dataInicio || !form.dataFim) { setErro('Preencha as duas datas.'); return; }
    if (form.dataFim < form.dataInicio) { setErro('Data fim não pode ser antes da data início.'); return; }

    setLoading(true);
    try {
      await createBloqueio({
        dataInicio: form.dataInicio,
        dataFim: form.dataFim,
        motivo: form.motivo || null,
      });
      setForm({ dataInicio: '', dataFim: '', motivo: '' });
      onAtualizar();
    } catch (err) {
      setErro(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleDeletar(id) {
    if (!window.confirm('Remover este bloqueio?')) return;
    try {
      await deleteBloqueio(id);
      onAtualizar();
    } catch (err) {
      alert('Erro ao remover bloqueio: ' + err.message);
    }
  }

  function formatarData(data) {
    const [ano, mes, dia] = data.split('-');
    return `${dia}/${mes}/${ano}`;
  }

  return (
    <div className="bloqueio-box">
      <div className="bloqueio-titulo">🔒 Travar Agenda</div>
      <div className="bloqueio-sub">Defina períodos onde nenhum show pode ser agendado</div>

      <form onSubmit={handleCriar} className="bloqueio-form">
        <div className="bloqueio-inputs">
          <div>
            <label className="bloqueio-label">Data início</label>
            <input type="date" name="dataInicio" value={form.dataInicio}
              onChange={handleChange} className="input bloqueio-input" />
          </div>
          <div>
            <label className="bloqueio-label">Data fim</label>
            <input type="date" name="dataFim" value={form.dataFim}
              onChange={handleChange} className="input bloqueio-input" />
          </div>
          <div style={{ flex: 2 }}>
            <label className="bloqueio-label">Motivo (opcional)</label>
            <input type="text" name="motivo" value={form.motivo}
              onChange={handleChange} className="input bloqueio-input"
              placeholder="Ex: Férias, viagem, indisponível..." />
          </div>
        </div>

        {erro && <div className="alert alert-erro" style={{ marginTop: 8 }}>❌ {erro}</div>}

        <button type="submit" className="btn btn-danger" disabled={loading} style={{ marginTop: 10 }}>
          {loading ? '⏳ Salvando...' : '🔒 Bloquear Período'}
        </button>
      </form>

      {bloqueios.length > 0 && (
        <div className="bloqueio-lista">
          <div className="bloqueio-lista-titulo">Períodos bloqueados:</div>
          {bloqueios.map(b => (
            <div key={b.id} className="bloqueio-item">
              <span className="bloqueio-lock">🔒</span>
              <span className="bloqueio-datas">
                {formatarData(b.dataInicio)} → {formatarData(b.dataFim)}
              </span>
              {b.motivo && <span className="bloqueio-motivo">{b.motivo}</span>}
              <button className="btn btn-ghost btn-sm bloqueio-del"
                onClick={() => handleDeletar(b.id)}>✕</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

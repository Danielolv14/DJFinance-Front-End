import { useState, useRef } from 'react';

const BASE_URL = 'https://djfinance-back-end-production.up.railway.app';

export default function ImportarCSV({ onImportado }) {
  const [loading, setLoading]       = useState(false);
  const [resultado, setResultado]   = useState(null);
  const [erro, setErro]             = useState('');
  const [limpando, setLimpando]     = useState(false);
  const [msgLimpeza, setMsgLimpeza] = useState('');
  const inputRef = useRef();

  async function handleLimparDuplicados() {
    if (!window.confirm('Remover todos os shows duplicados? Será mantido apenas o primeiro registro de cada show (mesma data + mesmo evento).')) return;
    setLimpando(true);
    setMsgLimpeza('');
    try {
      const res = await fetch(`${BASE_URL}/shows/duplicados`, { method: 'DELETE' });
      const data = await res.json();
      setMsgLimpeza(data.mensagem);
      onImportado();
    } catch (err) {
      setMsgLimpeza('Erro ao limpar duplicados: ' + err.message);
    } finally {
      setLimpando(false);
    }
  }

  async function handleArquivo(e) {
    const arquivo = e.target.files[0];
    if (!arquivo) return;

    setLoading(true);
    setResultado(null);
    setErro('');

    const formData = new FormData();
    formData.append('arquivo', arquivo);

    try {
      const res = await fetch(`${BASE_URL}/shows/importar`, {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.mensagem || 'Erro ao importar');
      setResultado(data);
      onImportado();
    } catch (err) {
      setErro(err.message);
    } finally {
      setLoading(false);
      inputRef.current.value = '';
    }
  }

  return (
    <div className="importar-box">
      <div className="importar-info">
        <div className="importar-icon">📥</div>
        <div>
          <div className="importar-titulo">Importar da Planilha</div>
          <div className="importar-sub">Exporte como CSV e faça o upload aqui</div>
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept=".csv"
        onChange={handleArquivo}
        style={{ display: 'none' }}
        id="csv-upload"
      />

      <label htmlFor="csv-upload" className={'btn btn-import' + (loading ? ' disabled' : '')}>
        {loading ? '⏳ Importando...' : '📂 Selecionar CSV'}
      </label>

      {resultado && (
        <div className="alert alert-sucesso" style={{marginTop: 12}}>
          ✅ {resultado.mensagem}
          {resultado.erros?.length > 0 && (
            <div style={{marginTop: 6, fontSize: 12, opacity: 0.8}}>
              {resultado.erros.length} linha(s) ignorada(s)
            </div>
          )}
        </div>
      )}

      {erro && (
        <div className="alert alert-erro" style={{marginTop: 12}}>❌ {erro}</div>
      )}

      <div style={{marginTop: 12, borderTop: '1px solid var(--border)', paddingTop: 12}}>
        <button
          className="btn btn-ghost btn-sm"
          onClick={handleLimparDuplicados}
          disabled={limpando}
          title="Remove shows duplicados mantendo apenas o primeiro registro"
        >
          {limpando ? '⏳ Limpando...' : '🧹 Remover Duplicados'}
        </button>
        {msgLimpeza && (
          <div className="alert alert-sucesso" style={{marginTop: 8}}>✅ {msgLimpeza}</div>
        )}
      </div>
    </div>
  );
}

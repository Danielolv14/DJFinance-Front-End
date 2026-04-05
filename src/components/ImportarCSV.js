import { useState, useRef } from 'react';

const BASE_URL = 'http://localhost:8080';

export default function ImportarCSV({ onImportado }) {
  const [loading, setLoading]   = useState(false);
  const [resultado, setResultado] = useState(null);
  const [erro, setErro]         = useState('');
  const inputRef = useRef();

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
    </div>
  );
}

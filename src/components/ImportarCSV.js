import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const BASE_URL = 'https://djfinance-back-end-production.up.railway.app';

export default function ImportarCSV({ onImportado }) {
  const [loading,    setLoading]    = useState(false);
  const [resultado,  setResultado]  = useState(null);
  const [erro,       setErro]       = useState('');
  const [limpando,   setLimpando]   = useState(false);
  const [msgLimpeza, setMsgLimpeza] = useState('');
  const inputRef = useRef();

  async function handleLimparDuplicados() {
    if (!window.confirm('Remover todos os shows duplicados? Será mantido apenas o primeiro registro de cada show.')) return;
    setLimpando(true); setMsgLimpeza('');
    try {
      const res = await fetch(`${BASE_URL}/shows/duplicados`, { method: 'DELETE' });
      const data = await res.json();
      setMsgLimpeza(data.mensagem);
      onImportado();
    } catch (err) { setMsgLimpeza('Erro: ' + err.message); }
    finally { setLimpando(false); }
  }

  async function handleArquivo(e) {
    const arquivo = e.target.files[0];
    if (!arquivo) return;
    setLoading(true); setResultado(null); setErro('');
    const formData = new FormData();
    formData.append('arquivo', arquivo);
    try {
      const res = await fetch(`${BASE_URL}/shows/importar`, { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.mensagem || 'Erro ao importar');
      setResultado(data);
      onImportado();
    } catch (err) { setErro(err.message); }
    finally { setLoading(false); inputRef.current.value = ''; }
  }

  return (
    <div style={{
      background: '#13141a',
      border: '1px solid rgba(255,255,255,0.06)',
      borderRadius: 8,
      padding: '14px 20px',
      marginBottom: 16,
      display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center',
      boxShadow: '0 2px 12px rgba(0,0,0,0.3)',
    }}>
      {/* Label */}
      <div style={{ flex: 1, minWidth: 160 }}>
        <div style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 9, color: 'rgba(255,255,255,0.25)', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 3,
        }}>
          IMPORTAR PLANILHA
        </div>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>
          Exporte como CSV e faça upload aqui
        </div>
      </div>

      {/* Upload button */}
      <input ref={inputRef} type="file" accept=".csv" onChange={handleArquivo} style={{ display: 'none' }} id="csv-upload" />
      <label
        htmlFor="csv-upload"
        style={{
          padding: '8px 16px', borderRadius: 4, cursor: loading ? 'not-allowed' : 'pointer',
          background: loading ? 'rgba(255,255,255,0.04)' : 'linear-gradient(180deg, #1e1f28, #17181f)',
          border: '1px solid rgba(255,255,255,0.1)',
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 10, fontWeight: 700, letterSpacing: '0.1em',
          color: loading ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.6)',
          transition: 'all 0.15s',
          pointerEvents: loading ? 'none' : 'auto',
        }}
        onMouseEnter={e => { if (!loading) e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; }}
        onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'}
      >
        {loading ? 'IMPORTANDO···' : '↑ CSV'}
      </label>

      {/* Dedup button */}
      <button
        onClick={handleLimparDuplicados} disabled={limpando}
        style={{
          padding: '8px 14px', borderRadius: 4, cursor: limpando ? 'not-allowed' : 'pointer',
          background: 'transparent',
          border: '1px solid rgba(255,69,58,0.2)',
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 10, fontWeight: 700, letterSpacing: '0.08em',
          color: 'rgba(255,69,58,0.6)', transition: 'all 0.15s',
          opacity: limpando ? 0.5 : 1,
        }}
        onMouseEnter={e => { if (!limpando) { e.target.style.borderColor = 'rgba(255,69,58,0.5)'; e.target.style.color = '#ff453a'; }}}
        onMouseLeave={e => { e.target.style.borderColor = 'rgba(255,69,58,0.2)'; e.target.style.color = 'rgba(255,69,58,0.6)'; }}
      >
        {limpando ? 'LIMPANDO···' : 'REMOV. DUPLICADOS'}
      </button>

      {/* Feedback */}
      <AnimatePresence>
        {resultado && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{
              width: '100%', padding: '8px 12px',
              background: 'rgba(61,212,87,0.08)', border: '1px solid rgba(61,212,87,0.25)', borderRadius: 4,
              fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: '#3dd457', letterSpacing: '0.06em',
            }}
          >
            ✓ {resultado.mensagem}
            {resultado.erros?.length > 0 && (
              <span style={{ marginLeft: 8, color: 'rgba(255,255,255,0.3)' }}>
                ({resultado.erros.length} linha(s) ignorada(s))
              </span>
            )}
          </motion.div>
        )}
        {erro && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{
              width: '100%', padding: '8px 12px',
              background: 'rgba(255,69,58,0.08)', border: '1px solid rgba(255,69,58,0.25)', borderRadius: 4,
              fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: '#ff453a', letterSpacing: '0.06em',
            }}
          >
            ERRO: {erro}
          </motion.div>
        )}
        {msgLimpeza && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{
              width: '100%', padding: '8px 12px',
              background: 'rgba(61,212,87,0.08)', border: '1px solid rgba(61,212,87,0.25)', borderRadius: 4,
              fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: '#3dd457', letterSpacing: '0.06em',
            }}
          >
            ✓ {msgLimpeza}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

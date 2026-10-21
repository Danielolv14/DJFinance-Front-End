/* Janelas do CRM para renomear um nome ou juntar nomes parecidos. ACCENT é a cor da aba CRM. */
import { useState } from 'react';
import { motion } from 'framer-motion';
import { normalizarLocal, normalizarContratante } from '../../services/api';
import { moeda } from '../../utils/format';
import { superficie, COR_ABA } from '../../utils/tema';

/* ─── design tokens ─── */
export const ACCENT = COR_ABA.crm;

/* ─── Modal base ─── */
function ModalBase({ onClose, children }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.75)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        backdropFilter: 'blur(4px)',
      }}
    >
      <motion.div
        initial={{ scale: 0.92, opacity: 0, y: 12 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        onClick={e => e.stopPropagation()}
        style={{
          ...superficie,
          borderTop: `2px solid ${ACCENT}`,
          padding: 24,
          width: 440,
          maxWidth: '90vw',
        }}
      >
        {children}
      </motion.div>
    </motion.div>
  );
}

function ModalInput({ value, onChange, onKeyDown, autoFocus }) {
  return (
    <input
      value={value} onChange={onChange} onKeyDown={onKeyDown} autoFocus={autoFocus}
      style={{
        width: '100%', boxSizing: 'border-box',
        background: '#0d0e14', border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 4, color: 'rgba(255,255,255,0.85)',
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 13, padding: '10px 12px', outline: 'none',
        marginTop: 4,
      }}
      onFocus={e => e.target.style.borderColor = `${ACCENT}60`}
      onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
    />
  );
}

function ModalBtn({ onClick, disabled, primary, danger, children }) {
  const col = danger ? '#ff453a' : primary ? ACCENT : 'rgba(255,255,255,0.5)';
  return (
    <button
      onClick={onClick} disabled={disabled}
      style={{
        padding: '9px 18px',
        background: primary || danger ? `${col}18` : 'transparent',
        border: `1px solid ${col}40`,
        borderRadius: 4, cursor: disabled ? 'not-allowed' : 'pointer',
        color: col,
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 11, fontWeight: 700, letterSpacing: '0.08em',
        opacity: disabled ? 0.5 : 1,
        transition: 'all 0.15s',
      }}
    >
      {children}
    </button>
  );
}

/* ─── Rename modal ─── */
export function ModalRenomear({ item, tipo, onSalvar, onFechar }) {
  const [nome, setNome]     = useState(item.nome);
  const [loading, setLoading] = useState(false);
  const [sucesso, setSucesso] = useState('');

  async function salvar() {
    if (!nome.trim() || nome === item.nome) { onFechar(); return; }
    setLoading(true);
    try {
      const fn = tipo === 'local' ? normalizarLocal : normalizarContratante;
      const res = await fn(item.nome, nome.trim());
      setSucesso(res.mensagem);
      setTimeout(() => { onSalvar(); onFechar(); }, 1500);
    } catch (err) {
      alert('Erro: ' + err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <ModalBase onClose={onFechar}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, fontWeight: 700, color: ACCENT, letterSpacing: '0.08em' }}>
          RENOMEAR {tipo === 'local' ? 'LOCAL' : 'CONTRATANTE'}
        </div>
        <button onClick={onFechar} style={{
          background: 'none', border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 3, color: 'rgba(255,255,255,0.4)', cursor: 'pointer',
          fontSize: 14, padding: '2px 8px', fontFamily: "'JetBrains Mono', monospace",
        }}>×</button>
      </div>

      <div style={{ padding: '10px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: 4, marginBottom: 16 }}>
        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', letterSpacing: '0.1em', marginBottom: 4 }}>DE</div>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', fontFamily: "'JetBrains Mono', monospace", fontWeight: 600 }}>
          {item.nome}
        </div>
        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginTop: 3 }}>
          {item.totalShows} shows · {moeda(item.totalFaturamento)}
        </div>
      </div>

      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.25)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 6 }}>NOVO NOME</div>
        <ModalInput value={nome} onChange={e => setNome(e.target.value)} onKeyDown={e => e.key === 'Enter' && salvar()} autoFocus />
      </div>

      {sucesso && (
        <div style={{
          padding: '8px 12px', background: 'rgba(61,212,87,0.1)',
          border: '1px solid rgba(61,212,87,0.3)', borderRadius: 4,
          color: '#3dd457', fontSize: 11, marginBottom: 12,
          fontFamily: "'JetBrains Mono', monospace",
        }}>
          {sucesso}
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
        <ModalBtn onClick={onFechar}>CANCELAR</ModalBtn>
        <ModalBtn onClick={salvar} disabled={loading} primary>
          {loading ? 'SALVANDO···' : 'RENOMEAR TODOS'}
        </ModalBtn>
      </div>
    </ModalBase>
  );
}

/* ─── Merge modal ─── */
export function ModalMerge({ grupo, tipo, onSalvar, onFechar }) {
  const [nomeFinal, setNomeFinal]   = useState(grupo[0].nome);
  const [loading, setLoading]       = useState(false);
  const [progresso, setProgresso]   = useState([]);

  async function mesclar() {
    setLoading(true);
    const fn = tipo === 'local' ? normalizarLocal : normalizarContratante;
    const resultados = [];
    for (const item of grupo) {
      if (item.nome === nomeFinal) continue;
      try {
        await fn(item.nome, nomeFinal);
        resultados.push({ ok: true, msg: `"${item.nome}" → "${nomeFinal}"` });
        setProgresso([...resultados]);
      } catch {
        resultados.push({ ok: false, msg: `Erro ao renomear "${item.nome}"` });
      }
    }
    setLoading(false);
    setTimeout(() => { onSalvar(); onFechar(); }, 1500);
  }

  return (
    <ModalBase onClose={onFechar}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, fontWeight: 700, color: ACCENT, letterSpacing: '0.08em' }}>
          MESCLAR NOMES
        </div>
        <button onClick={onFechar} style={{
          background: 'none', border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 3, color: 'rgba(255,255,255,0.4)', cursor: 'pointer',
          fontSize: 14, padding: '2px 8px', fontFamily: "'JetBrains Mono', monospace",
        }}>×</button>
      </div>

      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 14, lineHeight: 1.5 }}>
        Esses nomes parecem ser o mesmo {tipo}. Escolha o nome final.
      </div>

      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.25)', letterSpacing: '0.12em', marginBottom: 8 }}>NOME FINAL</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {grupo.map((item, i) => (
            <div
              key={i}
              onClick={() => setNomeFinal(item.nome)}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 12px', borderRadius: 4, cursor: 'pointer',
                background: nomeFinal === item.nome ? `${ACCENT}15` : 'rgba(255,255,255,0.02)',
                border: `1px solid ${nomeFinal === item.nome ? ACCENT + '50' : 'rgba(255,255,255,0.05)'}`,
                transition: 'all 0.15s',
              }}
            >
              <div style={{
                width: 12, height: 12, borderRadius: '50%',
                border: `2px solid ${nomeFinal === item.nome ? ACCENT : 'rgba(255,255,255,0.2)'}`,
                background: nomeFinal === item.nome ? ACCENT : 'transparent',
                flexShrink: 0, transition: 'all 0.15s',
              }} />
              <div>
                <div style={{ fontSize: 12, color: nomeFinal === item.nome ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.6)', fontWeight: 600 }}>
                  {item.nome}
                </div>
                <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.25)' }}>{item.totalShows} shows</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {progresso.length > 0 && (
        <div style={{ padding: '10px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: 4, marginBottom: 12 }}>
          {progresso.map((p, i) => (
            <div key={i} style={{
              fontSize: 10, color: p.ok ? '#3dd457' : '#ff453a',
              fontFamily: "'JetBrains Mono', monospace", marginBottom: 3,
            }}>
              {p.ok ? '✓' : '✗'} {p.msg}
            </div>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
        <ModalBtn onClick={onFechar}>CANCELAR</ModalBtn>
        <ModalBtn onClick={mesclar} disabled={loading} primary>
          {loading ? 'MESCLANDO···' : `MESCLAR COMO "${nomeFinal}"`}
        </ModalBtn>
      </div>
    </ModalBase>
  );
}

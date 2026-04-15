import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getStatsContratantes, getStatsLocais, normalizarLocal, normalizarContratante } from '../services/api';
import useIsMobile from '../hooks/useIsMobile';

/* ─── helpers ─── */
function moeda(v) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0 }).format(v || 0);
}
function normalizar(s) {
  return (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '').trim();
}
function detectarDuplicatas(lista) {
  const grupos = {};
  lista.forEach(item => {
    const chave = normalizar(item.nome).slice(0, 5);
    if (!grupos[chave]) grupos[chave] = [];
    grupos[chave].push(item);
  });
  return Object.values(grupos).filter(g => g.length > 1);
}

/* ─── design tokens ─── */
const ACCENT = '#ff8040';
const surface = {
  background: '#13141a',
  border: '1px solid rgba(255,255,255,0.06)',
  borderRadius: 8,
  boxShadow: '0 4px 24px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.04)',
};

function LedDot({ color, size = 8 }) {
  return (
    <span style={{
      display: 'inline-block', width: size, height: size,
      borderRadius: '50%', background: color, flexShrink: 0,
      boxShadow: `0 0 6px ${color}, 0 0 10px ${color}60`,
    }} />
  );
}

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
          ...surface,
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
function ModalRenomear({ item, tipo, onSalvar, onFechar }) {
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
function ModalMerge({ grupo, tipo, onSalvar, onFechar }) {
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

/* ═══════════════ PAGE ═══════════════ */
export default function CRMPage({ shows }) {
  const isMobile = useIsMobile();
  const [aba,          setAba]          = useState('locais');
  const [contratantes, setContratantes] = useState([]);
  const [locais,       setLocais]       = useState([]);
  const [loading,      setLoading]      = useState(false);
  const [busca,        setBusca]        = useState('');
  const [modalItem,    setModalItem]    = useState(null);
  const [modalMerge,   setModalMerge]   = useState(null);

  async function carregar() {
    setLoading(true);
    try {
      const [c, l] = await Promise.all([getStatsContratantes(), getStatsLocais()]);
      setContratantes(c); setLocais(l);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }

  useEffect(() => { carregar(); }, [shows]);

  const dadosAtivos    = aba === 'locais' ? locais : contratantes;
  const duplicatas     = detectarDuplicatas(dadosAtivos);
  const dadosFiltrados = dadosAtivos.filter(d =>
    !busca || d.nome.toLowerCase().includes(busca.toLowerCase())
  );
  const max = Math.max(...dadosFiltrados.map(d => d.totalFaturamento), 1);

  const totalContratantes = new Set(shows.map(s => s.contratante).filter(Boolean)).size;
  const totalLocais       = new Set(shows.map(s => s.endereco).filter(Boolean)).size;
  const topContratante    = contratantes[0];
  const topLocal          = locais[0];

  const kpis = [
    { label: 'CONTRATANTES ÚNICOS', val: totalContratantes,          color: ACCENT },
    { label: 'LOCAIS ÚNICOS',       val: totalLocais,                 color: '#ffd60a' },
    topContratante && { label: 'TOP CONTRATANTE', val: topContratante.nome, color: '#9a7ef8', small: true },
    topLocal       && { label: 'LOCAL FREQUENTE', val: topLocal.nome,       color: '#3dd457', small: true },
  ].filter(Boolean);

  return (
    <div style={{ padding: isMobile ? '0' : '24px 28px', maxWidth: 1200, margin: '0 auto', fontFamily: "'JetBrains Mono', monospace" }}>

      {/* ── Page header ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <LedDot color={ACCENT} />
        <div>
          <div style={{ fontSize: 11, color: `${ACCENT}99`, letterSpacing: '0.2em', textTransform: 'uppercase' }}>DECK 4 · CRM</div>
          <div style={{ fontSize: isMobile ? 18 : 22, fontWeight: 700, color: 'rgba(255,255,255,0.9)', lineHeight: 1.2 }}>Relacionamentos</div>
        </div>
      </div>

      {/* ── KPIs ── */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4,1fr)', gap: 10, marginBottom: 20 }}>
        {kpis.map((k, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07 }}
            style={{ ...surface, padding: '14px 18px', borderTop: `2px solid ${k.color}` }}
          >
            <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.25)', letterSpacing: '0.15em', marginBottom: 6 }}>{k.label}</div>
            <div style={{
              fontSize: k.small ? 13 : 28, fontWeight: 700, color: k.color,
              textShadow: `0 0 14px ${k.color}50`,
              whiteSpace: k.small ? 'nowrap' : 'normal',
              overflow: 'hidden', textOverflow: 'ellipsis',
            }}>
              {k.val}
            </div>
          </motion.div>
        ))}
      </div>

      {/* ── Duplicate warning ── */}
      <AnimatePresence>
        {duplicatas.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            style={{
              ...surface,
              borderTop: '2px solid #ffd60a',
              padding: '14px 18px', marginBottom: 16,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <LedDot color="#ffd60a" size={6} />
              <span style={{ fontSize: 10, color: '#ffd60a', letterSpacing: '0.15em', fontWeight: 700 }}>
                {duplicatas.length} GRUPO{duplicatas.length > 1 ? 'S' : ''} DE NOMES SIMILARES DETECTADO{duplicatas.length > 1 ? 'S' : ''}
              </span>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {duplicatas.map((grupo, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '6px 12px', background: 'rgba(255,214,10,0.06)',
                  border: '1px solid rgba(255,214,10,0.2)', borderRadius: 4,
                }}>
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                    {grupo.map((item, j) => (
                      <span key={j} style={{
                        fontSize: 10, color: 'rgba(255,255,255,0.7)',
                        background: 'rgba(255,255,255,0.05)', borderRadius: 2, padding: '1px 6px',
                      }}>
                        {item.nome} <span style={{ opacity: 0.4 }}>({item.totalShows})</span>
                      </span>
                    ))}
                  </div>
                  <button
                    onClick={() => setModalMerge({ grupo, tipo: aba === 'locais' ? 'local' : 'contratante' })}
                    style={{
                      padding: '4px 10px', background: 'rgba(255,214,10,0.12)',
                      border: '1px solid rgba(255,214,10,0.4)', borderRadius: 3,
                      color: '#ffd60a', cursor: 'pointer', fontSize: 9, fontWeight: 700,
                      letterSpacing: '0.1em', fontFamily: "'JetBrains Mono', monospace",
                    }}
                  >
                    MESCLAR
                  </button>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Toolbar ── */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, alignItems: 'center' }}>
        {/* Tab buttons */}
        <div style={{ display: 'flex', gap: 2, background: '#0d0e14', borderRadius: 5, padding: 3, border: '1px solid rgba(255,255,255,0.06)' }}>
          {[
            { id: 'locais',       label: `LOCAIS (${locais.length})`,            color: ACCENT },
            { id: 'contratantes', label: `CONTRATANTES (${contratantes.length})`, color: '#ffd60a' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => { setAba(tab.id); setBusca(''); }}
              style={{
                position: 'relative',
                padding: '7px 16px', borderRadius: 3,
                background: aba === tab.id ? `${tab.color}15` : 'transparent',
                border: `1px solid ${aba === tab.id ? tab.color + '40' : 'transparent'}`,
                color: aba === tab.id ? tab.color : 'rgba(255,255,255,0.3)',
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 10, fontWeight: 700, letterSpacing: '0.1em',
                cursor: 'pointer', transition: 'all 0.15s',
                boxShadow: aba === tab.id ? `0 0 10px ${tab.color}20` : 'none',
              }}
            >
              {aba === tab.id && (
                <span style={{
                  position: 'absolute', top: 0, left: 0, right: 0, height: 2,
                  background: tab.color, borderRadius: '3px 3px 0 0',
                  boxShadow: `0 0 6px ${tab.color}`,
                }} />
              )}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <input
          value={busca}
          onChange={e => setBusca(e.target.value)}
          placeholder={`BUSCAR ${aba === 'locais' ? 'LOCAL' : 'CONTRATANTE'}···`}
          style={{
            flex: 1, maxWidth: 300,
            background: '#0d0e14', border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 4, color: 'rgba(255,255,255,0.85)',
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 11, padding: '8px 12px', outline: 'none',
          }}
          onFocus={e => e.target.style.borderColor = `${ACCENT}50`}
          onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
        />

        <div style={{ marginLeft: 'auto', fontSize: 10, color: 'rgba(255,255,255,0.2)', letterSpacing: '0.12em' }}>
          {dadosFiltrados.length} RESULTADO{dadosFiltrados.length !== 1 ? 'S' : ''}
        </div>
      </div>

      {/* ── List ── */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: 'rgba(255,255,255,0.2)', letterSpacing: '0.2em', fontSize: 12 }}>
          CARREGANDO···
        </div>
      ) : dadosFiltrados.length === 0 ? (
        <div style={{ ...surface, padding: '48px 32px', textAlign: 'center' }}>
          <div style={{ fontSize: 28, opacity: 0.15, marginBottom: 10 }}>◎</div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.25)', letterSpacing: '0.12em' }}>NENHUM DADO ENCONTRADO</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {dadosFiltrados.map((item, i) => {
            const pct = (item.totalFaturamento / max) * 100;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03, duration: 0.25 }}
                style={{
                  ...surface,
                  padding: '14px 18px',
                  display: 'flex', alignItems: 'center', gap: 14,
                }}
              >
                {/* Rank */}
                <div style={{
                  width: 28, height: 28, borderRadius: '50%',
                  background: i < 3 ? `${ACCENT}18` : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${i < 3 ? ACCENT + '40' : 'rgba(255,255,255,0.06)'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 10, fontWeight: 700, flexShrink: 0,
                  color: i < 3 ? ACCENT : 'rgba(255,255,255,0.2)',
                }}>
                  {i + 1}
                </div>

                {/* Info + bar */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
                    <div style={{
                      fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.85)',
                      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                      fontFamily: "'JetBrains Mono', monospace",
                    }}>
                      {item.nome}
                    </div>
                    <div style={{
                      fontSize: 14, fontWeight: 700, color: ACCENT,
                      textShadow: `0 0 12px ${ACCENT}60`,
                      flexShrink: 0, marginLeft: 12,
                      fontFamily: "'JetBrains Mono', monospace",
                    }}>
                      {moeda(item.totalFaturamento)}
                    </div>
                  </div>

                  {/* Revenue bar */}
                  <div style={{
                    height: 3, background: 'rgba(255,255,255,0.04)', borderRadius: 2, overflow: 'hidden',
                    marginBottom: 6,
                  }}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.6, delay: i * 0.04, ease: 'easeOut' }}
                      style={{
                        height: '100%',
                        background: `linear-gradient(90deg, ${ACCENT}, ${ACCENT}80)`,
                        borderRadius: 2,
                        boxShadow: `0 0 6px ${ACCENT}40`,
                      }}
                    />
                  </div>

                  {/* Meta */}
                  <div style={{ display: 'flex', gap: 16 }}>
                    <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.06em' }}>
                      {item.totalShows} SHOW{item.totalShows !== 1 ? 'S' : ''}
                    </span>
                    <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)' }}>
                      MÉDIA {moeda(item.mediaCache)}
                    </span>
                    <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)' }}>
                      ÚLTIMO {item.ultimoShow}
                    </span>
                  </div>
                </div>

                {/* Rename btn */}
                <button
                  onClick={() => setModalItem({ item, tipo: aba === 'locais' ? 'local' : 'contratante' })}
                  style={{
                    padding: '6px 12px', flexShrink: 0,
                    background: 'linear-gradient(180deg, #1e1f28, #17181f)',
                    border: `1px solid ${ACCENT}25`, borderRadius: 4,
                    color: ACCENT, cursor: 'pointer', fontSize: 9, fontWeight: 700,
                    letterSpacing: '0.1em', fontFamily: "'JetBrains Mono', monospace",
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={e => { e.target.style.background = `${ACCENT}15`; e.target.style.borderColor = `${ACCENT}60`; }}
                  onMouseLeave={e => { e.target.style.background = 'linear-gradient(180deg, #1e1f28, #17181f)'; e.target.style.borderColor = `${ACCENT}25`; }}
                >
                  EDIT
                </button>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* ── Modals ── */}
      <AnimatePresence>
        {modalItem && (
          <ModalRenomear
            key="rename"
            item={modalItem.item}
            tipo={modalItem.tipo}
            onSalvar={carregar}
            onFechar={() => setModalItem(null)}
          />
        )}
        {modalMerge && (
          <ModalMerge
            key="merge"
            grupo={modalMerge.grupo}
            tipo={modalMerge.tipo}
            onSalvar={carregar}
            onFechar={() => setModalMerge(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { deleteShow } from '../services/api';

/* ─── constants ─── */
const MESES = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];

const STATUS_COLOR  = { CONFIRMADO:'#3dd457', PENDENTE:'#ffd60a', CANCELADO:'#ff453a' };
const STATUS_BG     = { CONFIRMADO:'rgba(61,212,87,.1)', PENDENTE:'rgba(255,214,10,.1)', CANCELADO:'rgba(255,69,58,.1)' };
const STATUS_LABELS = { CONFIRMADO:'CONFIRMADO', PENDENTE:'PENDENTE', CANCELADO:'CANCELADO' };

function moeda(v) {
  return new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL',minimumFractionDigits:0}).format(v||0);
}
function fmtData(d) {
  if (!d) return '—';
  const [a,m,dia] = d.toString().split('-');
  return `${dia}/${m}/${a}`;
}

/* ─── sub-components ─── */
function LedDot({ color = '#3dd457', pulse = false }) {
  return (
    <span style={{
      display: 'inline-block',
      width: 8, height: 8,
      borderRadius: '50%',
      background: color,
      boxShadow: `0 0 6px ${color}, 0 0 12px ${color}60`,
      flexShrink: 0,
      animation: pulse ? 'ledPulse 1.2s ease-in-out infinite' : 'none',
    }} />
  );
}

function HwButton({ active, color, onClick, children, small }) {
  return (
    <button
      onClick={onClick}
      style={{
        position: 'relative',
        padding: small ? '6px 12px' : '8px 16px',
        background: active
          ? `linear-gradient(180deg, ${color}22, ${color}0d)`
          : 'linear-gradient(180deg, #1e1f28, #17181f)',
        border: `1px solid ${active ? color + '40' : 'rgba(255,255,255,0.07)'}`,
        borderRadius: 4,
        color: active ? color : 'rgba(255,255,255,0.45)',
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        cursor: 'pointer',
        transition: 'all 0.15s',
        boxShadow: active ? `0 0 12px ${color}25, inset 0 0 8px ${color}10` : '0 2px 6px rgba(0,0,0,0.4)',
        overflow: 'hidden',
      }}
    >
      {/* LED strip */}
      <span style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 2,
        background: active ? color : 'transparent',
        boxShadow: active ? `0 0 6px ${color}` : 'none',
        borderRadius: '4px 4px 0 0',
        transition: 'all 0.15s',
      }} />
      {children}
    </button>
  );
}

function HwInput({ value, onChange, placeholder, style }) {
  return (
    <input
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      style={{
        background: '#0d0e14',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 4,
        color: 'rgba(255,255,255,0.85)',
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 12,
        padding: '8px 12px',
        outline: 'none',
        transition: 'border-color 0.15s',
        ...style,
      }}
      onFocus={e => e.target.style.borderColor = 'rgba(154,126,248,0.5)'}
      onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
    />
  );
}

function HwSelect({ value, onChange, children, style }) {
  return (
    <select
      value={value}
      onChange={onChange}
      style={{
        background: '#0d0e14',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 4,
        color: 'rgba(255,255,255,0.75)',
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 11,
        padding: '8px 10px',
        outline: 'none',
        cursor: 'pointer',
        ...style,
      }}
    >
      {children}
    </select>
  );
}

/* ─── monthly revenue bars ─── */
function MonthBars({ shows }) {
  const dados = useMemo(() => {
    const map = {};
    shows.filter(s => s.status === 'CONFIRMADO').forEach(s => {
      if (s.mes) map[s.mes] = (map[s.mes] || 0) + (s.cache || 0);
    });
    return MESES.map((label, i) => ({ label, val: map[i + 1] || 0 }));
  }, [shows]);
  const max = Math.max(...dados.map(d => d.val), 1);
  return (
    <div style={{ display: 'flex', gap: 3, alignItems: 'flex-end', height: 48, padding: '0 4px' }}>
      {dados.map((d, i) => (
        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          <div style={{
            width: '100%', height: 40,
            display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
          }}>
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: `${(d.val / max) * 100}%` }}
              transition={{ duration: 0.6, delay: i * 0.03, ease: 'easeOut' }}
              style={{
                background: d.val > 0 ? 'linear-gradient(180deg, #9a7ef8, #6a4fd8)' : 'rgba(255,255,255,0.04)',
                borderRadius: '2px 2px 0 0',
                boxShadow: d.val > 0 ? '0 0 8px rgba(154,126,248,0.4)' : 'none',
                minHeight: 2,
              }}
            />
          </div>
          <span style={{ fontSize: 7, color: 'rgba(255,255,255,0.2)', fontFamily: "'JetBrains Mono', monospace', letterSpacing: '0.05em" }}>
            {d.label}
          </span>
        </div>
      ))}
    </div>
  );
}

/* ─── show card ─── */
function ShowCard({ show, onEditar, onDelete, deletando }) {
  const cor    = STATUS_COLOR[show.status] || '#9a7ef8';
  const bgCor  = STATUS_BG[show.status] || 'transparent';
  const label  = STATUS_LABELS[show.status] || show.status || 'SEM STATUS';

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={{ duration: 0.2 }}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        padding: '14px 20px',
        background: '#13141a',
        border: '1px solid rgba(255,255,255,0.06)',
        borderLeft: `3px solid ${cor}`,
        borderRadius: 6,
        boxShadow: `0 2px 12px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.03)`,
        transition: 'box-shadow 0.15s',
      }}
    >
      {/* Status LED */}
      <LedDot color={cor} pulse={show.status === 'PENDENTE'} />

      {/* Date block */}
      <div style={{
        minWidth: 50,
        textAlign: 'center',
        fontFamily: "'JetBrains Mono', monospace",
        lineHeight: 1.2,
      }}>
        <div style={{ fontSize: 18, fontWeight: 700, color: 'rgba(255,255,255,0.9)' }}>
          {show.data ? new Date(show.data + 'T00:00:00').getDate().toString().padStart(2, '0') : '—'}
        </div>
        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          {show.mes ? MESES[show.mes - 1] : '—'} {show.ano ? String(show.ano).slice(2) : ''}
        </div>
      </div>

      {/* Divider */}
      <div style={{ width: 1, height: 36, background: 'rgba(255,255,255,0.06)', flexShrink: 0 }} />

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontWeight: 700,
          fontSize: 14,
          color: 'rgba(255,255,255,0.9)',
          marginBottom: 4,
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>
          {show.evento || '—'}
        </div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          {show.contratante && (
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontFamily: "'JetBrains Mono', monospace" }}>
              {show.contratante}
            </span>
          )}
          {show.endereco && (
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', fontFamily: "'JetBrains Mono', monospace" }}>
              {show.endereco.length > 30 ? show.endereco.slice(0, 30) + '…' : show.endereco}
            </span>
          )}
          {show.horaInicio && (
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', fontFamily: "'JetBrains Mono', monospace" }}>
              {show.horaInicio}{show.duracao ? ` · ${show.duracao}` : ''}
            </span>
          )}
          <div style={{ display: 'flex', gap: 4 }}>
            {show.xdj && (
              <span style={{
                fontSize: 9, fontFamily: "'JetBrains Mono', monospace", fontWeight: 700,
                color: '#1a6efa', background: 'rgba(26,110,250,0.15)',
                border: '1px solid rgba(26,110,250,0.3)', borderRadius: 2, padding: '1px 5px',
                letterSpacing: '0.1em',
              }}>XDJ</span>
            )}
            {show.adiantamento && (
              <span style={{
                fontSize: 9, fontFamily: "'JetBrains Mono', monospace", fontWeight: 700,
                color: '#3dd457', background: 'rgba(61,212,87,0.1)',
                border: '1px solid rgba(61,212,87,0.25)', borderRadius: 2, padding: '1px 5px',
                letterSpacing: '0.1em',
              }}>ADT</span>
            )}
          </div>
        </div>
      </div>

      {/* Cache + status */}
      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <div style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 15, fontWeight: 700,
          color: show.cache ? '#9a7ef8' : 'rgba(255,255,255,0.2)',
          textShadow: show.cache ? '0 0 12px rgba(154,126,248,0.4)' : 'none',
          marginBottom: 4,
        }}>
          {show.cache ? moeda(show.cache) : 'S/ CACHÊ'}
        </div>
        <span style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 9, fontWeight: 700, letterSpacing: '0.1em',
          color: cor, background: bgCor,
          border: `1px solid ${cor}40`,
          borderRadius: 3, padding: '2px 7px',
        }}>
          {label}
        </span>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
        <button
          onClick={() => onEditar(show)}
          style={{
            padding: '6px 12px',
            background: 'linear-gradient(180deg, #1e1f28, #17181f)',
            border: '1px solid rgba(154,126,248,0.25)',
            borderRadius: 4, cursor: 'pointer',
            color: '#9a7ef8',
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 10, fontWeight: 700, letterSpacing: '0.08em',
            transition: 'all 0.15s',
          }}
          onMouseEnter={e => { e.target.style.background = 'rgba(154,126,248,0.12)'; e.target.style.borderColor = 'rgba(154,126,248,0.5)'; }}
          onMouseLeave={e => { e.target.style.background = 'linear-gradient(180deg, #1e1f28, #17181f)'; e.target.style.borderColor = 'rgba(154,126,248,0.25)'; }}
        >
          EDIT
        </button>
        <button
          onClick={() => onDelete(show)}
          disabled={deletando === show.id}
          style={{
            padding: '6px 10px',
            background: 'linear-gradient(180deg, #1e1f28, #17181f)',
            border: '1px solid rgba(255,69,58,0.2)',
            borderRadius: 4, cursor: 'pointer',
            color: '#ff453a',
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 10, fontWeight: 700,
            opacity: deletando === show.id ? 0.5 : 1,
            transition: 'all 0.15s',
          }}
          onMouseEnter={e => { if (deletando !== show.id) e.target.style.background = 'rgba(255,69,58,0.12)'; }}
          onMouseLeave={e => { e.target.style.background = 'linear-gradient(180deg, #1e1f28, #17181f)'; }}
        >
          {deletando === show.id ? '···' : 'DEL'}
        </button>
      </div>
    </motion.div>
  );
}

/* ═══════════════ PAGE ═══════════════ */
export default function VisaoGeralPage({ shows, loading, onEditar, onAtualizar }) {
  const [busca,        setBusca]        = useState('');
  const [filtroStatus, setFiltroStatus] = useState('TODOS');
  const [filtroAno,    setFiltroAno]    = useState('TODOS');
  const [ordem,        setOrdem]        = useState('data_desc');
  const [deletando,    setDeletando]    = useState(null);

  const confirmados = shows.filter(s => s.status === 'CONFIRMADO');
  const pendentes   = shows.filter(s => s.status === 'PENDENTE');
  const cancelados  = shows.filter(s => s.status === 'CANCELADO');
  const totalCache  = confirmados.reduce((acc, s) => acc + (s.cache || 0), 0);
  const media       = confirmados.length ? totalCache / confirmados.length : 0;

  const anos = [...new Set(shows.map(s => s.ano).filter(Boolean))].sort((a, b) => b - a);

  const showsFiltrados = useMemo(() => {
    let lista = [...shows];
    if (busca) {
      const q = busca.toLowerCase();
      lista = lista.filter(s =>
        (s.evento || '').toLowerCase().includes(q) ||
        (s.contratante || '').toLowerCase().includes(q) ||
        (s.endereco || '').toLowerCase().includes(q)
      );
    }
    if (filtroStatus !== 'TODOS') lista = lista.filter(s => s.status === filtroStatus);
    if (filtroAno    !== 'TODOS') lista = lista.filter(s => String(s.ano) === filtroAno);
    lista.sort((a, b) => {
      if (ordem === 'data_desc')  return new Date(b.data) - new Date(a.data);
      if (ordem === 'data_asc')   return new Date(a.data) - new Date(b.data);
      if (ordem === 'cache_desc') return (b.cache || 0) - (a.cache || 0);
      if (ordem === 'evento_asc') return (a.evento || '').localeCompare(b.evento || '');
      return 0;
    });
    return lista;
  }, [shows, busca, filtroStatus, filtroAno, ordem]);

  async function handleDelete(show) {
    if (!window.confirm(`Deletar "${show.evento}"?`)) return;
    setDeletando(show.id);
    try { await deleteShow(show.id); onAtualizar(); }
    catch (err) { alert('Erro: ' + err.message); }
    finally { setDeletando(null); }
  }

  /* ── styles ── */
  const surface = {
    background: '#13141a',
    border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: 8,
    boxShadow: '0 4px 24px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.04)',
  };

  const kpis = [
    { label: 'TOTAL SHOWS',   val: shows.length,      color: '#9a7ef8' },
    { label: 'CONFIRMADOS',   val: confirmados.length, color: '#3dd457' },
    { label: 'PENDENTES',     val: pendentes.length,   color: '#ffd60a' },
    { label: 'CANCELADOS',    val: cancelados.length,  color: '#ff453a' },
    { label: 'FATURAMENTO',   val: moeda(totalCache),  color: '#9a7ef8', mono: true },
    { label: 'MÉDIA / SHOW',  val: moeda(media),       color: '#1a6efa', mono: true },
  ];

  return (
    <div style={{ padding: '24px 28px', maxWidth: 1400, margin: '0 auto', fontFamily: "'JetBrains Mono', monospace" }}>

      {/* ── Page header ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <LedDot color="#9a7ef8" />
        <div>
          <div style={{ fontSize: 11, color: 'rgba(154,126,248,0.7)', letterSpacing: '0.2em', textTransform: 'uppercase' }}>
            DECK 3 · SHOWS
          </div>
          <div style={{ fontSize: 22, fontWeight: 700, color: 'rgba(255,255,255,0.9)', lineHeight: 1.2 }}>
            Visão Geral
          </div>
        </div>
        <div style={{ marginLeft: 'auto', fontSize: 11, color: 'rgba(255,255,255,0.2)', letterSpacing: '0.1em' }}>
          {shows.length} SHOWS NO SISTEMA
        </div>
      </div>

      {/* ── KPI Cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6,1fr)', gap: 10, marginBottom: 20 }}>
        {kpis.map((k, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06, duration: 0.35 }}
            style={{
              ...surface,
              padding: '14px 16px',
              borderTop: `2px solid ${k.color}`,
            }}
          >
            <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 6 }}>
              {k.label}
            </div>
            <div style={{
              fontSize: k.mono ? 16 : 28,
              fontWeight: 700,
              color: k.color,
              textShadow: `0 0 16px ${k.color}50`,
              lineHeight: 1,
            }}>
              {k.val}
            </div>
          </motion.div>
        ))}
      </div>

      {/* ── Month revenue bars ── */}
      {shows.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          style={{ ...surface, padding: '16px 20px', marginBottom: 20 }}
        >
          <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.25)', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 12 }}>
            CACHÊ POR MÊS · CONFIRMADOS
          </div>
          <MonthBars shows={shows} />
        </motion.div>
      )}

      {/* ── Toolbar ── */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <HwInput
          value={busca}
          onChange={e => setBusca(e.target.value)}
          placeholder="BUSCAR EVENTO / CONTRATANTE / LOCAL..."
          style={{ flex: 1, minWidth: 220 }}
        />
        <div style={{ display: 'flex', gap: 6 }}>
          {['TODOS', 'CONFIRMADO', 'PENDENTE', 'CANCELADO'].map(s => (
            <HwButton
              key={s}
              active={filtroStatus === s}
              color={s === 'TODOS' ? '#9a7ef8' : STATUS_COLOR[s]}
              onClick={() => setFiltroStatus(s)}
              small
            >
              {s === 'TODOS' ? 'TODOS' : STATUS_LABELS[s]}
            </HwButton>
          ))}
        </div>
        <HwSelect value={filtroAno} onChange={e => setFiltroAno(e.target.value)}>
          <option value="TODOS">TODOS OS ANOS</option>
          {anos.map(a => <option key={a} value={a}>{a}</option>)}
        </HwSelect>
        <HwSelect value={ordem} onChange={e => setOrdem(e.target.value)}>
          <option value="data_desc">MAIS RECENTES</option>
          <option value="data_asc">MAIS ANTIGOS</option>
          <option value="cache_desc">MAIOR CACHÊ</option>
          <option value="evento_asc">A–Z EVENTO</option>
        </HwSelect>
      </div>

      {/* ── Results count ── */}
      <div style={{
        fontSize: 10, color: 'rgba(255,255,255,0.2)', letterSpacing: '0.15em',
        textTransform: 'uppercase', marginBottom: 10,
      }}>
        {showsFiltrados.length} RESULTADO{showsFiltrados.length !== 1 ? 'S' : ''}
      </div>

      {/* ── List ── */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: 'rgba(255,255,255,0.2)', letterSpacing: '0.2em', fontSize: 12 }}>
          CARREGANDO···
        </div>
      ) : showsFiltrados.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: '64px 32px',
          ...surface,
        }}>
          <div style={{ fontSize: 32, marginBottom: 12, opacity: 0.2 }}>◎</div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.1em' }}>
            NENHUM SHOW ENCONTRADO
          </div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.15)', marginTop: 4 }}>
            Ajuste os filtros ou cadastre um novo show
          </div>
        </div>
      ) : (
        <AnimatePresence>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {showsFiltrados.map(show => (
              <ShowCard
                key={show.id}
                show={show}
                onEditar={onEditar}
                onDelete={handleDelete}
                deletando={deletando}
              />
            ))}
          </div>
        </AnimatePresence>
      )}
    </div>
  );
}

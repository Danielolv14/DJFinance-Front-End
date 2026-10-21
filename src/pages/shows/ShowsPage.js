import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { deleteShow } from '../../services/api';
import { exportarShows } from '../../services/excelService';
import ItinerarioModal from './ItinerarioModal';
import { usePlanilhaUrl } from './PlanilhaOnlineModal';
import useIsMobile from '../../hooks/useIsMobile';
import { useDJ } from '../../context/DJContext';
import { moeda } from '../../utils/format';
import { STATUS_COR } from '../../utils/tema';
import LedDot from '../../components/LedDot';
import { HwButton, HwInput, HwSelect } from './Controles';
import MonthBars from './MonthBars';
import ShowCard from './ShowCard';

/* ═══════════════ PAGE ═══════════════ */
export default function ShowsPage({ shows, loading, onEditar, onAtualizar }) {
  const isMobile = useIsMobile();
  const [busca,         setBusca]        = useState('');
  const [filtroStatus,  setFiltroStatus] = useState('TODOS');
  const [filtroAno,     setFiltroAno]    = useState('TODOS');
  const [ordem,         setOrdem]        = useState('data_desc');
  const [deletando,     setDeletando]    = useState(null);
  const [itinerario,    setItinerario]   = useState(false);
  const [exportando,    setExportando]   = useState(false);
  const [showUrlInput,  setShowUrlInput] = useState(false);
  const [urlInput,      setUrlInput]     = useState('');
  const [sheetsUrl, setSheetsUrl]         = usePlanilhaUrl();
  const { djConfig } = useDJ();

  async function handleExportar() {
    if (exportando || shows.length === 0) return;
    setExportando(true);
    try { await exportarShows(shows, djConfig); }
    catch (e) { console.error('Export error:', e); }
    finally { setExportando(false); }
  }

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
    <div style={{ padding: isMobile ? '0' : '24px 28px', maxWidth: 1400, margin: '0 auto', fontFamily: "'JetBrains Mono', monospace" }}>

      {/* ── Page header ── */}
      <div style={{ display: 'flex', alignItems: isMobile ? 'flex-start' : 'center', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <LedDot brilho={12} color="#9a7ef8" />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 11, color: 'rgba(154,126,248,0.7)', letterSpacing: '0.2em', textTransform: 'uppercase' }}>
            DECK 3 · SHOWS
          </div>
          <div style={{ fontSize: isMobile ? 18 : 22, fontWeight: 700, color: 'rgba(255,255,255,0.9)', lineHeight: 1.2 }}>
            Visão Geral
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0, flexWrap: 'wrap' }}>
          {!isMobile && (
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)', letterSpacing: '0.1em' }}>
              {shows.length} SHOWS NO SISTEMA
            </span>
          )}

          {/* Exportar Excel */}
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={handleExportar}
            disabled={exportando || shows.length === 0}
            style={{
              position: 'relative', overflow: 'hidden',
              padding: '9px 16px',
              background: exportando ? 'rgba(61,212,87,0.05)' : 'rgba(61,212,87,0.1)',
              border: '1px solid rgba(61,212,87,0.35)',
              borderRadius: 5, cursor: exportando ? 'wait' : 'pointer',
              color: '#3dd457',
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 10, fontWeight: 700, letterSpacing: '0.1em',
              boxShadow: '0 0 14px rgba(61,212,87,0.15)',
              transition: 'all 0.15s',
              opacity: shows.length === 0 ? 0.4 : 1,
            }}
            onMouseEnter={e => { if (!exportando) e.currentTarget.style.background = 'rgba(61,212,87,0.18)'; }}
            onMouseLeave={e => { if (!exportando) e.currentTarget.style.background = 'rgba(61,212,87,0.1)'; }}
          >
            <span style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: '#3dd457', borderRadius: '5px 5px 0 0', boxShadow: '0 0 6px #3dd457' }} />
            {exportando ? '⏳ EXPORTANDO…' : (isMobile ? '📊 XLS' : '📊 EXPORTAR EXCEL')}
          </motion.button>

          {/* Planilha Online */}
          <div style={{ position: 'relative' }}>
            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={() => {
                if (sheetsUrl) {
                  window.open(sheetsUrl, '_blank');
                } else {
                  setUrlInput('');
                  setShowUrlInput(v => !v);
                }
              }}
              onContextMenu={e => {
                e.preventDefault();
                setUrlInput(sheetsUrl || '');
                setShowUrlInput(v => !v);
              }}
              style={{
                position: 'relative', overflow: 'hidden',
                padding: '9px 16px',
                background: sheetsUrl ? 'rgba(52,211,153,0.12)' : 'rgba(52,211,153,0.06)',
                border: `1px solid rgba(52,211,153,${sheetsUrl ? '0.4' : '0.25'})`,
                borderRadius: 5, cursor: 'pointer',
                color: '#34d399',
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 10, fontWeight: 700, letterSpacing: '0.1em',
                boxShadow: sheetsUrl ? '0 0 14px rgba(52,211,153,0.2)' : 'none',
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(52,211,153,0.2)'}
              onMouseLeave={e => e.currentTarget.style.background = sheetsUrl ? 'rgba(52,211,153,0.12)' : 'rgba(52,211,153,0.06)'}
              title={sheetsUrl ? 'Abrir · clique direito para trocar link' : 'Colar link da planilha'}
            >
              <span style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: '#34d399', borderRadius: '5px 5px 0 0', opacity: sheetsUrl ? 1 : 0.4 }} />
              {isMobile
                ? (sheetsUrl ? '🟢' : '📊')
                : (sheetsUrl ? '🟢 PLANILHA ONLINE' : '📊 PLANILHA ONLINE')
              }
            </motion.button>

            {/* Mini dropdown para colar/trocar URL */}
            <AnimatePresence>
              {showUrlInput && (
                <motion.div
                  initial={{ opacity: 0, y: -6, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6, scale: 0.97 }}
                  transition={{ duration: 0.15 }}
                  style={{
                    position: 'absolute', top: 'calc(100% + 8px)', right: 0,
                    zIndex: 200,
                    background: '#13141a',
                    border: '1px solid rgba(52,211,153,0.3)',
                    borderRadius: 7,
                    padding: '12px 14px',
                    width: 320,
                    boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
                  }}
                >
                  <div style={{ fontSize: 9, color: 'rgba(52,211,153,0.7)', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 8, fontFamily: "'JetBrains Mono', monospace" }}>
                    🔗 Link do Google Sheets
                  </div>
                  <input
                    autoFocus
                    value={urlInput}
                    onChange={e => setUrlInput(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        const v = urlInput.trim();
                        if (!v) { setSheetsUrl(''); setShowUrlInput(false); return; }
                        if (!v.startsWith('https://docs.google.com/spreadsheets')) {
                          alert('Cole um link válido do Google Sheets');
                          return;
                        }
                        setSheetsUrl(v);
                        setShowUrlInput(false);
                        window.open(v, '_blank');
                      }
                      if (e.key === 'Escape') setShowUrlInput(false);
                    }}
                    placeholder="https://docs.google.com/spreadsheets/d/..."
                    style={{
                      width: '100%', boxSizing: 'border-box',
                      background: '#0d0e14',
                      border: '1px solid rgba(52,211,153,0.3)',
                      borderRadius: 5,
                      color: 'rgba(255,255,255,0.85)',
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: 11, padding: '8px 10px', outline: 'none',
                    }}
                  />
                  <div style={{ display: 'flex', gap: 6, marginTop: 8, justifyContent: 'flex-end' }}>
                    <button
                      onClick={() => setShowUrlInput(false)}
                      style={{ padding: '5px 12px', background: 'transparent', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 4, cursor: 'pointer', color: 'rgba(255,255,255,0.3)', fontFamily: "'JetBrains Mono', monospace", fontSize: 9, fontWeight: 700 }}
                    >ESC</button>
                    <button
                      onClick={() => {
                        const v = urlInput.trim();
                        if (!v) { setSheetsUrl(''); setShowUrlInput(false); return; }
                        if (!v.startsWith('https://docs.google.com/spreadsheets')) {
                          alert('Cole um link válido do Google Sheets');
                          return;
                        }
                        setSheetsUrl(v);
                        setShowUrlInput(false);
                        window.open(v, '_blank');
                      }}
                      style={{ padding: '5px 14px', background: 'rgba(52,211,153,0.15)', border: '1px solid rgba(52,211,153,0.4)', borderRadius: 4, cursor: 'pointer', color: '#34d399', fontFamily: "'JetBrains Mono', monospace", fontSize: 9, fontWeight: 700 }}
                    >SALVAR & ABRIR</button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Itinerário */}
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={() => setItinerario(true)}
            style={{
              position: 'relative', overflow: 'hidden',
              padding: '9px 18px',
              background: 'rgba(154,126,248,0.12)',
              border: '1px solid rgba(154,126,248,0.4)',
              borderRadius: 5, cursor: 'pointer',
              color: '#9a7ef8',
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 10, fontWeight: 700, letterSpacing: '0.12em',
              boxShadow: '0 0 14px rgba(154,126,248,0.18)',
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(154,126,248,0.2)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(154,126,248,0.12)'}
          >
            <span style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: '#9a7ef8', borderRadius: '5px 5px 0 0', boxShadow: '0 0 6px #9a7ef8' }} />
            {isMobile ? '📋' : '📋 ITINERÁRIO'}
          </motion.button>
        </div>
      </div>

      {/* ── KPI Cards ── */}
      <div className="visao-kpi-grid">
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
              color={s === 'TODOS' ? '#9a7ef8' : STATUS_COR[s]}
              onClick={() => setFiltroStatus(s)}
              small
            >
              {s}
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

      {/* ── Itinerário Modal ── */}
      <AnimatePresence>
        {itinerario && (
          <ItinerarioModal
            shows={shows}
            onClose={() => setItinerario(false)}
          />
        )}
      </AnimatePresence>

    </div>
  );
}

/* Cartão de um show na lista, com status, valores e ações. */
import { motion } from 'framer-motion';
import { moeda, MESES_ABREV } from '../../utils/format';
import { STATUS_COR } from '../../utils/tema';
import LedDot from '../../components/LedDot';

const STATUS_BG     = { CONFIRMADO:'rgba(61,212,87,.1)', PENDENTE:'rgba(255,214,10,.1)', CANCELADO:'rgba(255,69,58,.1)' };

/* ─── show card ─── */
export default function ShowCard({ show, onEditar, onDelete, deletando }) {
  const cor    = STATUS_COR[show.status] || '#9a7ef8';
  const bgCor  = STATUS_BG[show.status] || 'transparent';
  const label  = show.status || 'SEM STATUS';

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
      <LedDot brilho={12} color={cor} pulse={show.status === 'PENDENTE'} />

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
          {show.mes ? MESES_ABREV[show.mes - 1] : '—'} {show.ano ? String(show.ano).slice(2) : ''}
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

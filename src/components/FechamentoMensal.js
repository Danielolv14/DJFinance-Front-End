import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getFechamento } from '../services/api';
import { gerarPDFFechamento } from '../services/pdfService';

/* ─── constants ─── */
const MESES = [
  {value:1,label:'JANEIRO'},{value:2,label:'FEVEREIRO'},{value:3,label:'MARÇO'},
  {value:4,label:'ABRIL'},{value:5,label:'MAIO'},{value:6,label:'JUNHO'},
  {value:7,label:'JULHO'},{value:8,label:'AGOSTO'},{value:9,label:'SETEMBRO'},
  {value:10,label:'OUTUBRO'},{value:11,label:'NOVEMBRO'},{value:12,label:'DEZEMBRO'},
];

const ACCENT = '#ff6058';

function moeda(v) {
  return new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL',minimumFractionDigits:0}).format(v||0);
}
function fmtData(d) {
  if (!d) return '—';
  return d.toString().split('-').reverse().join('/');
}
function abrirMaps(endereco) {
  if (!endereco) return;
  window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(endereco)}`, '_blank');
}

const surface = {
  background: '#13141a',
  border: '1px solid rgba(255,255,255,0.06)',
  borderRadius: 8,
  boxShadow: '0 4px 24px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.04)',
};

const inputStyle = {
  background: '#0d0e14',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 4,
  color: 'rgba(255,255,255,0.88)',
  fontFamily: "'JetBrains Mono', monospace",
  fontSize: 12, padding: '10px 12px', outline: 'none',
};

function ResultCard({ label, val, color, detail, large }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        ...surface,
        padding: '16px 20px',
        borderTop: `2px solid ${color}`,
        flex: large ? 2 : 1,
        minWidth: 140,
      }}
    >
      <div style={{
        fontSize: 9, color: 'rgba(255,255,255,0.25)',
        letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 8,
      }}>
        {label}
      </div>
      <div style={{
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: large ? 22 : 18, fontWeight: 700,
        color, textShadow: `0 0 16px ${color}60`,
        lineHeight: 1,
      }}>
        {val}
      </div>
      {detail && (
        <div style={{
          marginTop: 5, fontSize: 9,
          color: 'rgba(255,255,255,0.25)', letterSpacing: '0.06em',
        }}>
          {detail}
        </div>
      )}
    </motion.div>
  );
}

const STATUS_COLOR = { CONFIRMADO: '#3dd457', PENDENTE: '#ffd60a', CANCELADO: '#ff453a' };

export default function FechamentoMensal() {
  const hoje = new Date();
  const [mes,        setMes]        = useState(hoje.getMonth()+1);
  const [ano,        setAno]        = useState(hoje.getFullYear());
  const [imposto,    setImposto]    = useState('');
  const [dados,      setDados]      = useState(null);
  const [loading,    setLoading]    = useState(false);
  const [erro,       setErro]       = useState('');
  const [gerandoPDF, setGerandoPDF] = useState(false);

  async function buscar() {
    setErro(''); setDados(null); setLoading(true);
    try {
      const aliquota = imposto ? parseFloat(imposto) : null;
      setDados(await getFechamento(mes, ano, aliquota));
    } catch (err) { setErro(err.message); }
    finally { setLoading(false); }
  }

  async function exportarPDF() {
    if (!dados) return;
    setGerandoPDF(true);
    try { await gerarPDFFechamento(dados); }
    catch (err) { alert('Erro ao gerar PDF: ' + err.message); }
    finally { setGerandoPDF(false); }
  }

  const nomeMes = MESES.find(m => m.value === Number(mes))?.label;

  return (
    <div style={{ padding: '24px 28px', maxWidth: 1100, margin: '0 auto', fontFamily: "'JetBrains Mono', monospace" }}>

      {/* ── Page header ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: ACCENT, boxShadow: `0 0 8px ${ACCENT}` }} />
        <div>
          <div style={{ fontSize: 11, color: `${ACCENT}99`, letterSpacing: '0.2em', textTransform: 'uppercase' }}>DECK 6 · FECHAMENTO</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: 'rgba(255,255,255,0.9)', lineHeight: 1.2 }}>Fechamento Mensal</div>
        </div>
      </div>

      {/* ── Controls ── */}
      <div style={{ ...surface, padding: '20px 24px', borderTop: `2px solid ${ACCENT}`, marginBottom: 20 }}>
        <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.2)', letterSpacing: '0.2em', marginBottom: 14 }}>PARÂMETROS DO RELATÓRIO</div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <label style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.15em' }}>MÊS</label>
            <select
              value={mes} onChange={e => setMes(e.target.value)}
              style={{ ...inputStyle, minWidth: 150 }}
            >
              {MESES.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <label style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.15em' }}>ANO</label>
            <input
              type="number" value={ano} onChange={e => setAno(e.target.value)}
              min="2020" max="2099"
              style={{ ...inputStyle, width: 90 }}
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <label style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.15em' }}>IMPOSTO NF (%)</label>
            <input
              type="number" value={imposto} onChange={e => setImposto(e.target.value)}
              placeholder="Ex: 6" min="0" max="100" step="0.1"
              style={{ ...inputStyle, width: 110 }}
            />
          </div>

          <motion.button
            onClick={buscar} disabled={loading}
            whileTap={{ scale: 0.97 }}
            style={{
              position: 'relative', overflow: 'hidden',
              padding: '10px 28px',
              background: loading ? `${ACCENT}10` : `${ACCENT}18`,
              border: `1px solid ${ACCENT}50`,
              borderRadius: 5, cursor: loading ? 'not-allowed' : 'pointer',
              color: ACCENT,
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 11, fontWeight: 700, letterSpacing: '0.12em',
              boxShadow: loading ? 'none' : `0 0 16px ${ACCENT}25`,
              opacity: loading ? 0.7 : 1,
              alignSelf: 'flex-end',
            }}
          >
            <span style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: ACCENT, borderRadius: '5px 5px 0 0' }} />
            {loading ? 'CALCULANDO···' : 'CALCULAR'}
          </motion.button>

          {dados && (
            <motion.button
              onClick={exportarPDF} disabled={gerandoPDF}
              whileTap={{ scale: 0.97 }}
              style={{
                padding: '10px 20px',
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: 5, cursor: gerandoPDF ? 'not-allowed' : 'pointer',
                color: 'rgba(255,255,255,0.6)',
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 11, fontWeight: 700, letterSpacing: '0.1em',
                alignSelf: 'flex-end',
              }}
            >
              {gerandoPDF ? 'GERANDO···' : 'EXPORTAR PDF'}
            </motion.button>
          )}
        </div>
      </div>

      {/* ── Error ── */}
      <AnimatePresence>
        {erro && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{
              padding: '12px 16px', background: 'rgba(255,69,58,0.1)',
              border: '1px solid rgba(255,69,58,0.3)', borderRadius: 6,
              color: '#ff453a', fontSize: 11, marginBottom: 16, letterSpacing: '0.05em',
            }}
          >
            ERRO: {erro}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Results ── */}
      <AnimatePresence>
        {dados && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>

            {/* Subtitle */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: ACCENT, boxShadow: `0 0 6px ${ACCENT}` }} />
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', letterSpacing: '0.08em' }}>
                {nomeMes} / {ano} · {dados.quantidadeShows} SHOW{dados.quantidadeShows !== 1 ? 'S' : ''}
              </div>
            </div>

            {/* KPI cards */}
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 20 }}>
              <ResultCard label="TOTAL BRUTO"   val={moeda(dados.totalBruto)}    color="#9a7ef8" large />
              <ResultCard label="DANIEL"        val={moeda(dados.totalDaniel)}   color="#1a6efa" detail="% + R$40 transporte" />
              <ResultCard label="YURI"          val={moeda(dados.totalYuri)}     color="#3dd457" detail="R$300 fixo por show" />
              {dados.totalCustos > 0 && (
                <ResultCard label="OUTROS CUSTOS" val={moeda(dados.totalCustos)} color="#ffd60a" />
              )}
              {dados.totalImpostos > 0 && (
                <ResultCard label={`IMPOSTOS (${imposto}%)`} val={moeda(dados.totalImpostos)} color="#ff8040" detail="Deduzido do lucro" />
              )}
              <ResultCard
                label="LUCRO LÍQUIDO"
                val={moeda(dados.lucroLiquido)}
                color={dados.lucroLiquido >= 0 ? '#3dd457' : '#ff453a'}
                large
              />
            </div>

            {/* Shows table */}
            {dados.shows.length > 0 && (
              <div style={{ ...surface, padding: '20px 24px', borderTop: `2px solid rgba(255,255,255,0.08)` }}>
                <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.2)', letterSpacing: '0.2em', marginBottom: 16 }}>
                  SHOWS DO PERÍODO
                </div>

                {/* Table header */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '90px 1fr 1fr 110px 48px 110px 36px',
                  gap: '0 12px',
                  padding: '6px 12px',
                  marginBottom: 4,
                }}>
                  {['DATA','EVENTO','LOCAL / CONTRATANTE','CACHÊ','XDJ','STATUS',''].map((h, i) => (
                    <div key={i} style={{
                      fontSize: 8, color: 'rgba(255,255,255,0.2)',
                      letterSpacing: '0.15em', textTransform: 'uppercase',
                    }}>{h}</div>
                  ))}
                </div>

                {/* Table rows */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  {dados.shows.map((s, i) => {
                    const cor = STATUS_COLOR[s.status] || '#9a7ef8';
                    return (
                      <motion.div
                        key={s.id}
                        initial={{ opacity: 0, x: -6 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.03 }}
                        style={{
                          display: 'grid',
                          gridTemplateColumns: '90px 1fr 1fr 110px 48px 110px 36px',
                          gap: '0 12px',
                          padding: '10px 12px',
                          background: 'rgba(255,255,255,0.02)',
                          border: '1px solid rgba(255,255,255,0.04)',
                          borderLeft: `2px solid ${cor}`,
                          borderRadius: 4,
                          alignItems: 'center',
                        }}
                      >
                        {/* Data */}
                        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: 'rgba(255,255,255,0.6)' }}>
                          {fmtData(s.data)}
                        </div>
                        {/* Evento */}
                        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.85)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {s.evento || '—'}
                        </div>
                        {/* Local */}
                        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: 'rgba(255,255,255,0.4)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {s.endereco || s.contratante || '—'}
                        </div>
                        {/* Cache */}
                        <div style={{
                          fontFamily: "'JetBrains Mono', monospace", fontSize: 12, fontWeight: 700,
                          color: s.cache ? '#9a7ef8' : 'rgba(255,255,255,0.15)',
                          textShadow: s.cache ? '0 0 10px rgba(154,126,248,0.4)' : 'none',
                        }}>
                          {s.cache ? moeda(s.cache) : '—'}
                        </div>
                        {/* XDJ */}
                        <div style={{ textAlign: 'center' }}>
                          {s.xdj ? (
                            <span style={{
                              fontFamily: "'JetBrains Mono', monospace", fontSize: 8, fontWeight: 700,
                              color: '#1a6efa', background: 'rgba(26,110,250,0.15)',
                              border: '1px solid rgba(26,110,250,0.3)', borderRadius: 2, padding: '1px 5px',
                            }}>XDJ</span>
                          ) : (
                            <span style={{ color: 'rgba(255,255,255,0.12)', fontSize: 10 }}>—</span>
                          )}
                        </div>
                        {/* Status */}
                        <div>
                          <span style={{
                            fontFamily: "'JetBrains Mono', monospace", fontSize: 8, fontWeight: 700,
                            letterSpacing: '0.08em', color: cor,
                            background: cor + '15', border: `1px solid ${cor}30`,
                            borderRadius: 3, padding: '2px 6px',
                          }}>
                            {s.status || '—'}
                          </span>
                        </div>
                        {/* Maps */}
                        <div>
                          {s.endereco && (
                            <button
                              onClick={() => abrirMaps(s.endereco)}
                              title="Abrir no Google Maps"
                              style={{
                                background: 'none', border: '1px solid rgba(255,255,255,0.08)',
                                borderRadius: 3, cursor: 'pointer', padding: '3px 6px',
                                color: 'rgba(255,255,255,0.35)', fontSize: 11,
                                transition: 'all 0.1s',
                              }}
                              onMouseEnter={e => { e.target.style.color = 'rgba(255,255,255,0.7)'; e.target.style.borderColor = 'rgba(255,255,255,0.2)'; }}
                              onMouseLeave={e => { e.target.style.color = 'rgba(255,255,255,0.35)'; e.target.style.borderColor = 'rgba(255,255,255,0.08)'; }}
                            >
                              ↗
                            </button>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

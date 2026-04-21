import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const LS_KEY  = 'druds_sheets_url';
const ACCENT  = '#34d399';   // verde Google Sheets
const SCRIPT_URL = window.location.origin + '/druds-sheets-script.js';

const surface = {
  background: '#13141a',
  border: '1px solid rgba(255,255,255,0.06)',
  borderRadius: 10,
  boxShadow: '0 8px 40px rgba(0,0,0,0.6)',
};

const inputStyle = {
  background: '#0d0e14',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 5,
  color: 'rgba(255,255,255,0.88)',
  fontFamily: "'JetBrains Mono', monospace",
  fontSize: 11,
  padding: '10px 12px',
  outline: 'none',
  width: '100%',
  boxSizing: 'border-box',
};

const STEPS = [
  {
    num: '1',
    title: 'Criar Google Sheets',
    desc: 'Acesse sheets.google.com, crie uma planilha em branco e deixe ela aberta.',
    action: { label: '↗ Abrir Google Sheets', href: 'https://sheets.google.com' },
    color: '#4ade80',
  },
  {
    num: '2',
    title: 'Abrir Apps Script',
    desc: 'Na planilha: menu Extensões → Apps Script. Apague o código existente.',
    color: '#60a5fa',
  },
  {
    num: '3',
    title: 'Colar o Script',
    desc: 'Baixe e cole o script abaixo no editor. Depois clique em 💾 Salvar.',
    action: { label: '⬇ Baixar Script', href: SCRIPT_URL, download: 'druds-sheets-script.js' },
    color: '#c084fc',
  },
  {
    num: '4',
    title: 'Executar e Autorizar',
    desc: 'Clique em ▶ Executar → selecione "onOpen". Autorize quando solicitado. Volte à planilha.',
    color: '#f97316',
  },
  {
    num: '5',
    title: 'Sincronizar e Compartilhar',
    desc: 'No menu "🎧 Druds Financeiro" → Sincronizar Agora. Depois copie o link da planilha e cole abaixo.',
    color: '#34d399',
  },
];

export function usePlanilhaUrl() {
  const [url, setUrlState] = useState(() => localStorage.getItem(LS_KEY) || '');
  function setUrl(v) {
    setUrlState(v);
    if (v) localStorage.setItem(LS_KEY, v);
    else localStorage.removeItem(LS_KEY);
  }
  return [url, setUrl];
}

export default function PlanilhaOnlineModal({ onClose }) {
  const [url, setUrl]     = usePlanilhaUrl();
  const [input, setInput] = useState(url);
  const [copied, setCopied] = useState(false);

  function salvar() {
    const v = input.trim();
    if (v && !v.startsWith('https://docs.google.com/spreadsheets')) {
      alert('Cole um link válido do Google Sheets (começa com https://docs.google.com/spreadsheets)');
      return;
    }
    setUrl(v);
    if (v) onClose();
  }

  function copiarScript() {
    fetch(SCRIPT_URL)
      .then(r => r.text())
      .then(txt => {
        navigator.clipboard.writeText(txt).then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 2500);
        });
      })
      .catch(() => {
        window.open(SCRIPT_URL, '_blank');
      });
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.75)',
          backdropFilter: 'blur(4px)',
          zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '16px',
        }}
        onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      >
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.97 }}
          style={{ ...surface, width: '100%', maxWidth: 560, maxHeight: '90vh', overflowY: 'auto' }}
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div style={{
            padding: '18px 22px 14px',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <div>
              <div style={{ fontSize: 9, color: `${ACCENT}99`, letterSpacing: '0.2em', textTransform: 'uppercase' }}>
                CONFIGURAR
              </div>
              <div style={{ fontSize: 18, fontWeight: 700, color: 'rgba(255,255,255,0.9)', fontFamily: "'JetBrains Mono', monospace" }}>
                Planilha Online
              </div>
            </div>
            <button
              onClick={onClose}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'rgba(255,255,255,0.3)', fontSize: 20, lineHeight: 1, padding: 4,
              }}
            >×</button>
          </div>

          <div style={{ padding: '18px 22px' }}>

            {/* Intro */}
            <p style={{
              fontSize: 12, color: 'rgba(255,255,255,0.45)',
              lineHeight: 1.6, marginBottom: 20,
              fontFamily: "'Inter', sans-serif",
            }}>
              Crie um Google Sheets que busca os dados automaticamente do site e se atualiza a cada 1 hora. Siga os 5 passos:
            </p>

            {/* Steps */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 22 }}>
              {STEPS.map(step => (
                <div key={step.num} style={{
                  display: 'flex', gap: 12, alignItems: 'flex-start',
                  padding: '12px 14px',
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.05)',
                  borderLeft: `3px solid ${step.color}`,
                  borderRadius: 6,
                }}>
                  <span style={{
                    width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                    background: `${step.color}20`,
                    border: `1px solid ${step.color}50`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 10, fontWeight: 700, color: step.color,
                  }}>
                    {step.num}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.8)',
                      marginBottom: 3,
                    }}>
                      {step.title}
                    </div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', lineHeight: 1.5, fontFamily: "'Inter', sans-serif" }}>
                      {step.desc}
                    </div>
                    {step.action && (
                      <div style={{ marginTop: 7, display: 'flex', gap: 8 }}>
                        <a
                          href={step.action.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          download={step.action.download}
                          style={{
                            padding: '5px 12px',
                            background: `${step.color}15`,
                            border: `1px solid ${step.color}40`,
                            borderRadius: 4, textDecoration: 'none',
                            color: step.color,
                            fontFamily: "'JetBrains Mono', monospace",
                            fontSize: 9, fontWeight: 700, letterSpacing: '0.08em',
                          }}
                        >
                          {step.action.label}
                        </a>
                        {step.num === '3' && (
                          <button
                            onClick={copiarScript}
                            style={{
                              padding: '5px 12px',
                              background: copied ? `${step.color}15` : 'transparent',
                              border: `1px solid ${step.color}30`,
                              borderRadius: 4, cursor: 'pointer',
                              color: copied ? step.color : 'rgba(255,255,255,0.3)',
                              fontFamily: "'JetBrains Mono', monospace",
                              fontSize: 9, fontWeight: 700, letterSpacing: '0.08em',
                              transition: 'all 0.2s',
                            }}
                          >
                            {copied ? '✓ COPIADO!' : '📋 COPIAR SCRIPT'}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* URL input */}
            <div style={{ marginBottom: 16 }}>
              <label style={{
                display: 'block',
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 9, color: `${ACCENT}99`,
                letterSpacing: '0.15em', textTransform: 'uppercase',
                marginBottom: 7,
              }}>
                🔗 COLE O LINK DO GOOGLE SHEETS AQUI
              </label>
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="https://docs.google.com/spreadsheets/d/..."
                style={inputStyle}
                onFocus={e => e.target.style.borderColor = `${ACCENT}60`}
                onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
              />
            </div>

            {/* Action buttons */}
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={onClose} style={{
                padding: '10px 20px',
                background: 'transparent', border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 5, cursor: 'pointer', color: 'rgba(255,255,255,0.3)',
                fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fontWeight: 700,
              }}>
                CANCELAR
              </button>
              <button onClick={salvar} style={{
                padding: '10px 24px',
                background: `linear-gradient(135deg, ${ACCENT}22, ${ACCENT}0d)`,
                border: `1px solid ${ACCENT}60`,
                borderRadius: 5, cursor: 'pointer', color: ACCENT,
                fontFamily: "'JetBrains Mono', monospace", fontSize: 11, fontWeight: 700,
                letterSpacing: '0.1em',
                boxShadow: `0 0 20px ${ACCENT}20`,
              }}>
                {url ? 'ATUALIZAR LINK' : 'SALVAR E ABRIR'}
              </button>
            </div>

          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

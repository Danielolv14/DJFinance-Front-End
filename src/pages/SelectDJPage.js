import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DJ_CONFIG, useDJ } from '../context/DJContext';

export default function SelectDJPage() {
  const { login } = useDJ();
  const [djSelecionado, setDjSelecionado] = useState(null);
  const [pin, setPin] = useState('');
  const [erro, setErro] = useState('');
  const [shake, setShake] = useState(false);

  const abrirPin = (djId) => {
    setDjSelecionado(djId);
    setPin('');
    setErro('');
  };

  const fecharPin = () => {
    setDjSelecionado(null);
    setPin('');
    setErro('');
  };

  const confirmar = () => {
    const config = DJ_CONFIG[djSelecionado];
    if (pin === config.pin) {
      login(djSelecionado);
    } else {
      setErro('PIN incorreto');
      setShake(true);
      setPin('');
      setTimeout(() => setShake(false), 500);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') confirmar();
    if (e.key === 'Escape') fecharPin();
  };

  return (
    <div style={{
      minHeight: '100vh', background: '#0a0a0a',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      fontFamily: "'JetBrains Mono', 'Courier New', monospace",
    }}>
      {/* Logo / título */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ textAlign: 'center', marginBottom: 56 }}
      >
        <div style={{
          fontSize: 11, letterSpacing: '0.35em', color: 'rgba(255,255,255,0.3)',
          marginBottom: 8, textTransform: 'uppercase',
        }}>
          SISTEMA FINANCEIRO
        </div>
        <div style={{ fontSize: 28, fontWeight: 700, color: '#fff', letterSpacing: '0.1em' }}>
          DJ <span style={{ color: '#1a6efa' }}>FINANCE</span>
        </div>
        <div style={{
          marginTop: 10, fontSize: 10, color: 'rgba(255,255,255,0.2)',
          letterSpacing: '0.2em',
        }}>
          SELECIONE O PAINEL
        </div>
      </motion.div>

      {/* Cards */}
      <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', justifyContent: 'center' }}>
        {Object.values(DJ_CONFIG).map((dj, i) => (
          <motion.button
            key={dj.id}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => abrirPin(dj.id)}
            style={{
              width: 220, padding: '32px 24px',
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 12, cursor: 'pointer',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
              textAlign: 'center',
            }}
          >
            <div style={{
              width: 56, height: 56, borderRadius: '50%',
              background: 'rgba(26,110,250,0.15)',
              border: '1px solid rgba(26,110,250,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 22,
            }}>
              🎧
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#fff', letterSpacing: '0.05em' }}>
                {dj.nome}
              </div>
              <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.2em', marginTop: 4 }}>
                {dj.subtitulo.toUpperCase()}
              </div>
            </div>
            <div style={{
              marginTop: 4, fontSize: 9, letterSpacing: '0.15em',
              color: '#1a6efa', background: 'rgba(26,110,250,0.1)',
              border: '1px solid rgba(26,110,250,0.2)',
              borderRadius: 4, padding: '3px 10px',
            }}>
              ACESSAR →
            </div>
          </motion.button>
        ))}
      </div>

      {/* Modal PIN */}
      <AnimatePresence>
        {djSelecionado && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={fecharPin}
            style={{
              position: 'fixed', inset: 0,
              background: 'rgba(0,0,0,0.7)',
              backdropFilter: 'blur(6px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              zIndex: 100,
            }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={shake ? { x: [0, -10, 10, -10, 10, 0], scale: 1, opacity: 1 } : { scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              style={{
                background: '#111', border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 16, padding: '40px 48px',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20,
                minWidth: 280,
              }}
            >
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 22 }}>🔒</div>
                <div style={{
                  fontSize: 14, fontWeight: 700, color: '#fff',
                  letterSpacing: '0.05em', marginTop: 8,
                }}>
                  {DJ_CONFIG[djSelecionado].nome}
                </div>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.2em', marginTop: 4 }}>
                  INSIRA O PIN
                </div>
              </div>

              <input
                type="password"
                value={pin}
                onChange={e => { setPin(e.target.value); setErro(''); }}
                onKeyDown={handleKeyDown}
                autoFocus
                maxLength={6}
                placeholder="••••"
                style={{
                  width: '100%', padding: '12px 16px',
                  background: 'rgba(255,255,255,0.05)',
                  border: `1px solid ${erro ? '#ff453a' : 'rgba(255,255,255,0.1)'}`,
                  borderRadius: 8, color: '#fff',
                  fontSize: 20, textAlign: 'center',
                  letterSpacing: '0.4em',
                  fontFamily: 'inherit', outline: 'none',
                }}
              />

              {erro && (
                <motion.div
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  style={{ fontSize: 11, color: '#ff453a', letterSpacing: '0.1em' }}
                >
                  {erro.toUpperCase()}
                </motion.div>
              )}

              <button
                onClick={confirmar}
                style={{
                  width: '100%', padding: '12px',
                  background: '#1a6efa', border: 'none',
                  borderRadius: 8, color: '#fff',
                  fontFamily: 'inherit', fontSize: 12,
                  fontWeight: 700, letterSpacing: '0.15em',
                  cursor: 'pointer',
                }}
              >
                ENTRAR
              </button>

              <button
                onClick={fecharPin}
                style={{
                  background: 'none', border: 'none',
                  color: 'rgba(255,255,255,0.3)', fontSize: 10,
                  letterSpacing: '0.15em', cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                CANCELAR
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

import { useState, useEffect, useCallback } from 'react';
import CadastroPage    from './pages/CadastroPage';
import VisaoGeralPage  from './pages/VisaoGeralPage';
import DashboardPage   from './pages/DashboardPage';
import CalendarioPage  from './pages/CalendarioPage';
import CRMPage         from './pages/CRMPage';
import PressKitPage    from './pages/PressKitPage';
import FechamentoMensal from './components/FechamentoMensal';
import ImportarCSV     from './components/ImportarCSV';
import { getShows, getBloqueios } from './services/api';
import useIsMobile from './hooks/useIsMobile';
import './App.css';

const ABAS = [
  { id:'dashboard',  label:'Dashboard',  color:'#4d8fff', shortcut:'F1' },
  { id:'calendario', label:'Calendário', color:'#3dd457', shortcut:'F2' },
  { id:'visao',      label:'Shows',      color:'#9a7ef8', shortcut:'F3' },
  { id:'crm',        label:'CRM',        color:'#ff8040', shortcut:'F4' },
  { id:'cadastro',   label:'Cadastrar',  color:'#ffd60a', shortcut:'F5' },
  { id:'fechamento', label:'Fechamento', color:'#ff6058', shortcut:'F6' },
  { id:'presskit',   label:'Press Kit',  color:'#22d3ee', shortcut:'F7' },
];

export default function App() {
  const isMobile = useIsMobile();
  const [aba, setAba]                       = useState('dashboard');
  const [shows, setShows]                   = useState([]);
  const [bloqueios, setBloqueios]           = useState([]);
  const [showParaEditar, setShowParaEditar] = useState(null);
  const [loading, setLoading]               = useState(false);

  const carregarShows = useCallback(async () => {
    setLoading(true);
    try { setShows(await getShows()); }
    catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, []);

  const carregarBloqueios = useCallback(async () => {
    try { setBloqueios(await getBloqueios()); }
    catch (err) { console.error(err); }
  }, []);

  useEffect(() => { carregarShows(); carregarBloqueios(); }, [carregarShows, carregarBloqueios]);

  function handleEditar(show) {
    setShowParaEditar(show);
    setAba('cadastro');
    window.scrollTo({ top:0, behavior:'smooth' });
  }

  function handleShowSalvo() {
    carregarShows();
    if (showParaEditar) setShowParaEditar(null);
  }

  return (
    <div className="app">
      <header className="header">
        <div className="header-inner">

          {/* ── Logo XDJ ── */}
          <div className="logo">
            <div className="logo-vinyl">
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                <circle cx="16" cy="16" r="14" stroke="rgba(255,255,255,0.12)" strokeWidth="1"/>
                <circle cx="16" cy="16" r="10" stroke="rgba(255,255,255,0.07)" strokeWidth="1"/>
                <circle cx="16" cy="16" r="6"  stroke="rgba(255,255,255,0.05)" strokeWidth="1"/>
                <circle cx="16" cy="16" r="3"  fill="#1A6EFA" opacity="0.9"/>
                <circle cx="16" cy="16" r="1.4" fill="#0a0b0e"/>
                {[0,45,90,135,180,225,270,315].map((deg,i) => (
                  <line key={i}
                    x1={16 + 13*Math.cos(deg*Math.PI/180)}
                    y1={16 + 13*Math.sin(deg*Math.PI/180)}
                    x2={16 + 11*Math.cos(deg*Math.PI/180)}
                    y2={16 + 11*Math.sin(deg*Math.PI/180)}
                    stroke="rgba(255,255,255,0.15)" strokeWidth="1" strokeLinecap="round"
                  />
                ))}
              </svg>
            </div>
            {!isMobile && (
              <div className="logo-text-block">
                <div className="logo-product">DRUDS <span className="logo-accent">FINANCEIRO</span></div>
              </div>
            )}
          </div>

          {/* ── Hardware nav buttons ── */}
          <nav className="nav">
            {ABAS.map(a => (
              <button
                key={a.id}
                className={'nav-btn' + (aba === a.id ? ' active' : '')}
                style={{ '--btn-color': a.color }}
                onClick={() => { setAba(a.id); if (a.id !== 'cadastro') setShowParaEditar(null); }}
              >
                <span className="nav-led" />
                <span className="nav-label">{a.label}</span>
                {!isMobile && <span className="nav-shortcut">{a.shortcut}</span>}
                {a.id === 'visao' && shows.length > 0 && (
                  <span className="nav-badge">{shows.length}</span>
                )}
              </button>
            ))}
          </nav>

          {/* ── Status cluster — hidden on mobile ── */}
          {!isMobile && (
            <div className="header-status-cluster">
              <div className="status-item status-online">
                <span className="status-led status-led--green" />
                <span>ONLINE</span>
              </div>
              <div className="status-item">
                <span className="status-led status-led--blue" />
                <span>SYNC</span>
              </div>
              {loading && (
                <div className="status-item">
                  <span className="status-led status-led--orange status-led--blink" />
                  <span>LOAD</span>
                </div>
              )}
            </div>
          )}

        </div>
      </header>

      <main className="main">
        {aba === 'dashboard'  && <DashboardPage  shows={shows} />}
        {aba === 'calendario' && <CalendarioPage shows={shows} bloqueios={bloqueios} onBloqueioAtualizado={carregarBloqueios} />}
        {aba === 'visao'      && (
          <VisaoGeralPage shows={shows} loading={loading}
            onEditar={handleEditar} onAtualizar={carregarShows} />
        )}
        {aba === 'crm'        && <CRMPage shows={shows} />}
        {aba === 'cadastro'   && (
          <>
            <div style={{ padding: isMobile ? '0 0 16px' : '24px 28px 0', maxWidth: 860, margin: '0 auto' }}>
              <ImportarCSV onImportado={carregarShows} />
            </div>
            <CadastroPage
              onShowSalvo={handleShowSalvo}
              showParaEditar={showParaEditar}
              onCancelarEdicao={() => setShowParaEditar(null)}
              bloqueios={bloqueios}
              shows={shows}
            />
          </>
        )}
        {aba === 'fechamento' && <FechamentoMensal />}
        {aba === 'presskit'   && <PressKitPage />}
      </main>
    </div>
  );
}

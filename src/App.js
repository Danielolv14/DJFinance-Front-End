import { useState, useEffect, useCallback } from 'react';
import CadastroPage    from './pages/CadastroPage';
import VisaoGeralPage  from './pages/VisaoGeralPage';
import DashboardPage   from './pages/DashboardPage';
import CalendarioPage  from './pages/CalendarioPage';
import CRMPage         from './pages/CRMPage';
import FechamentoMensal from './components/FechamentoMensal';
import ImportarCSV     from './components/ImportarCSV';
import { getShows, getBloqueios } from './services/api';
import './App.css';

const ABAS = [
  { id:'dashboard',   label:'Dashboard',   icon:'📈' },
  { id:'calendario',  label:'Calendário',  icon:'📅' },
  { id:'visao',       label:'Shows',       icon:'📊' },
  { id:'crm',         label:'CRM',         icon:'👥' },
  { id:'cadastro',    label:'+ Cadastrar', icon:'🎵' },
  { id:'fechamento',  label:'Fechamento',  icon:'💰' },
];

export default function App() {
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
          <div className="logo">
            <div className="logo-icon-wrap">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <circle cx="10" cy="10" r="7" stroke="white" strokeWidth="1.4"/>
                <circle cx="10" cy="10" r="3" fill="white"/>
                <circle cx="10" cy="10" r="1.2" fill="#0E0F12"/>
                <line x1="10" y1="3" x2="10" y2="1.2" stroke="white" strokeWidth="1.4" strokeLinecap="round"/>
                <line x1="10" y1="18.8" x2="10" y2="17" stroke="white" strokeWidth="1.4" strokeLinecap="round"/>
                <line x1="1.2" y1="10" x2="3" y2="10" stroke="white" strokeWidth="1.4" strokeLinecap="round"/>
                <line x1="17" y1="10" x2="18.8" y2="10" stroke="white" strokeWidth="1.4" strokeLinecap="round"/>
              </svg>
            </div>
            <div>
              <div className="logo-text">DJFinance</div>
              <div className="logo-sub">Studio Edition</div>
            </div>
          </div>

          <nav className="nav">
            {ABAS.map(a => (
              <button key={a.id}
                className={'nav-btn' + (aba === a.id ? ' active' : '')}
                onClick={() => { setAba(a.id); if (a.id !== 'cadastro') setShowParaEditar(null); }}>
                <span className="nav-icon">{a.icon}</span>
                {a.label}
                {a.id === 'visao' && shows.length > 0 && (
                  <span className="nav-badge">{shows.length}</span>
                )}
              </button>
            ))}
          </nav>

          <div className="header-status">
            <div className="header-led" />
            ONLINE
          </div>
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
          <div className="page">
            <ImportarCSV onImportado={carregarShows} />
            <CadastroPage
              onShowSalvo={handleShowSalvo}
              showParaEditar={showParaEditar}
              onCancelarEdicao={() => setShowParaEditar(null)}
              bloqueios={bloqueios}
            />
          </div>
        )}
        {aba === 'fechamento' && <FechamentoMensal />}
      </main>
    </div>
  );
}

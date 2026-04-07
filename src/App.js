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
            <span className="logo-icon">🎧</span>
            <span className="logo-text">DRUDS</span>
            <span className="logo-sub">Financeiro</span>
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

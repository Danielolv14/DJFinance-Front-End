import { useState, useEffect, useCallback } from 'react';
import Cabecalho from './components/Cabecalho';
import DashboardPage from './pages/dashboard/DashboardPage';
import CalendarioPage from './pages/calendario/CalendarioPage';
import ShowsPage from './pages/shows/ShowsPage';
import CRMPage from './pages/crm/CRMPage';
import CadastroPage from './pages/cadastro/CadastroPage';
import ImportarCSV from './pages/cadastro/ImportarCSV';
import FechamentoPage from './pages/fechamento/FechamentoPage';
import PressKitPage from './pages/presskit/PressKitPage';
import SelectDJPage from './pages/selecao-dj/SelectDJPage';
import { getShows, getBloqueios } from './services/api';
import { MOCK_SHOWS, getMockFechamento } from './mockData';
import { DJProvider, useDJ } from './context/DJContext';
import useIsMobile from './hooks/useIsMobile';
import { IS_DEMO } from './utils/demo';
import './App.css';

export default function App() {
  return (
    <DJProvider>
      <AppInner />
    </DJProvider>
  );
}

/** Carrega os shows e bloqueios do DJ ativo e mostra a aba escolhida. */
function AppInner() {
  const isMobile = useIsMobile();
  const { djAtivo } = useDJ();

  const [aba, setAba]                       = useState('dashboard');
  const [shows, setShows]                   = useState([]);
  const [bloqueios, setBloqueios]           = useState([]);
  const [showParaEditar, setShowParaEditar] = useState(null);
  const [loading, setLoading]               = useState(false);

  const carregarShows = useCallback(async () => {
    setLoading(true);
    try {
      if (IS_DEMO) { setShows(MOCK_SHOWS); return; }
      const todos = await getShows();
      // Shows antes de 2025 foram removidos do sistema e não devem aparecer.
      setShows(todos.filter(s => !s.data || parseInt(s.data.substring(0, 4), 10) >= 2025));
    }
    catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, []);

  const carregarBloqueios = useCallback(async () => {
    if (IS_DEMO) return;
    try { setBloqueios(await getBloqueios()); }
    catch (err) { console.error(err); }
  }, []);

  // Trocar de DJ zera a tela e recarrega os dados dele
  useEffect(() => {
    if (!djAtivo && !IS_DEMO) return;
    setShows([]);
    setBloqueios([]);
    setShowParaEditar(null);
    setAba('dashboard');
    carregarShows();
    carregarBloqueios();
  }, [djAtivo, carregarShows, carregarBloqueios]);

  if (!djAtivo && !IS_DEMO) return <SelectDJPage />;

  function trocarAba(id) {
    setAba(id);
    if (id !== 'cadastro') setShowParaEditar(null);
  }

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
      <Cabecalho aba={aba} onTrocarAba={trocarAba} totalShows={shows.length} carregando={loading} />

      <main className="main">
        {aba === 'dashboard'  && <DashboardPage  shows={shows} />}
        {aba === 'calendario' && <CalendarioPage shows={shows} bloqueios={bloqueios} onBloqueioAtualizado={carregarBloqueios} />}
        {aba === 'shows'      && (
          <ShowsPage shows={shows} loading={loading}
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
        {aba === 'fechamento' && <FechamentoPage mockFechamento={IS_DEMO ? getMockFechamento : null} />}
        {aba === 'presskit'   && <PressKitPage />}
      </main>
    </div>
  );
}

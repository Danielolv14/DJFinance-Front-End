import { useState, useEffect } from 'react';
import { getStatsContratantes, getStatsLocais, normalizarLocal, normalizarContratante } from '../services/api';

function moeda(v) {
  return new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(v||0);
}

// Normaliza string para comparação: minúsculo, sem acento, sem espaços extras
function normalizar(s) {
  return (s||'')
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '')
    .trim();
}

// Detecta grupos de nomes similares (mesmos 4 primeiros chars normalizados)
function detectarDuplicatas(lista) {
  const grupos = {};
  lista.forEach(item => {
    const chave = normalizar(item.nome).slice(0, 5);
    if (!grupos[chave]) grupos[chave] = [];
    grupos[chave].push(item);
  });
  // Só retorna grupos com mais de 1 item (possíveis duplicatas)
  return Object.values(grupos).filter(g => g.length > 1);
}

function ModalRenomear({ item, tipo, onSalvar, onFechar }) {
  const [novoNome, setNovoNome] = useState(item.nome);
  const [loading, setLoading]   = useState(false);
  const [sucesso, setSucesso]   = useState('');

  async function salvar() {
    if (!novoNome.trim() || novoNome === item.nome) { onFechar(); return; }
    setLoading(true);
    try {
      const fn = tipo === 'local' ? normalizarLocal : normalizarContratante;
      const res = await fn(item.nome, novoNome.trim());
      setSucesso(res.mensagem);
      setTimeout(() => { onSalvar(); onFechar(); }, 1500);
    } catch (err) {
      alert('Erro: ' + err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={onFechar}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-titulo">✏️ Renomear {tipo === 'local' ? 'Local' : 'Contratante'}</div>
          <button className="cal-fechar" onClick={onFechar}>×</button>
        </div>
        <div className="modal-info">
          <div className="modal-de">De: <strong>{item.nome}</strong></div>
          <div className="modal-stats">{item.totalShows} shows · {moeda(item.totalFaturamento)}</div>
        </div>
        <label className="modal-label">Novo nome</label>
        <input className="input" value={novoNome}
          onChange={e => setNovoNome(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && salvar()}
          autoFocus />
        {sucesso && <div className="alert alert-sucesso" style={{marginTop:10}}>✅ {sucesso}</div>}
        <div className="modal-actions">
          <button className="btn btn-ghost" onClick={onFechar}>Cancelar</button>
          <button className="btn btn-primary" onClick={salvar} disabled={loading}>
            {loading ? 'Salvando...' : 'Renomear todos os shows'}
          </button>
        </div>
      </div>
    </div>
  );
}

function ModalMerge({ grupo, tipo, onSalvar, onFechar }) {
  const [nomeFinal, setNomeFinal] = useState(grupo[0].nome);
  const [loading, setLoading]     = useState(false);
  const [progresso, setProgresso] = useState([]);

  async function mesclar() {
    setLoading(true);
    const fn = tipo === 'local' ? normalizarLocal : normalizarContratante;
    const resultados = [];
    for (const item of grupo) {
      if (item.nome === nomeFinal) continue;
      try {
        const res = await fn(item.nome, nomeFinal);
        resultados.push(`✅ "${item.nome}" → "${nomeFinal}"`);
        setProgresso([...resultados]);
      } catch {
        resultados.push(`❌ Erro ao renomear "${item.nome}"`);
      }
    }
    setLoading(false);
    setTimeout(() => { onSalvar(); onFechar(); }, 1500);
  }

  return (
    <div className="modal-overlay" onClick={onFechar}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-titulo">🔗 Mesclar Nomes Similares</div>
          <button className="cal-fechar" onClick={onFechar}>×</button>
        </div>
        <div className="modal-info">
          Esses nomes parecem ser o mesmo {tipo}. Escolha o nome final e todos os shows serão atualizados.
        </div>

        <label className="modal-label">Nome final (canônico)</label>
        <div className="merge-opcoes">
          {grupo.map((item, i) => (
            <label key={i} className={'merge-opcao' + (nomeFinal === item.nome ? ' selecionada' : '')}>
              <input type="radio" name="nomeFinal" value={item.nome}
                checked={nomeFinal === item.nome}
                onChange={() => setNomeFinal(item.nome)} hidden />
              <div className="merge-opcao-nome">{item.nome}</div>
              <div className="merge-opcao-info">{item.totalShows} shows</div>
            </label>
          ))}
        </div>

        {progresso.length > 0 && (
          <div className="merge-progresso">
            {progresso.map((p,i) => <div key={i} style={{fontSize:12, marginBottom:4}}>{p}</div>)}
          </div>
        )}

        <div className="modal-actions">
          <button className="btn btn-ghost" onClick={onFechar}>Cancelar</button>
          <button className="btn btn-primary" onClick={mesclar} disabled={loading}>
            {loading ? 'Mesclando...' : '🔗 Mesclar tudo como "' + nomeFinal + '"'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function CRMPage({ shows }) {
  const [aba,           setAba]           = useState('locais');
  const [contratantes,  setContratantes]  = useState([]);
  const [locais,        setLocais]        = useState([]);
  const [loading,       setLoading]       = useState(false);
  const [busca,         setBusca]         = useState('');
  const [modalItem,     setModalItem]     = useState(null);
  const [modalMerge,    setModalMerge]    = useState(null);

  async function carregar() {
    setLoading(true);
    try {
      const [c, l] = await Promise.all([getStatsContratantes(), getStatsLocais()]);
      setContratantes(c);
      setLocais(l);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }

  useEffect(() => { carregar(); }, [shows]);

  const dadosAtivos   = aba === 'locais' ? locais : contratantes;
  const duplicatas    = detectarDuplicatas(dadosAtivos);
  const dadosFiltrados = dadosAtivos
    .filter(d => !busca || d.nome.toLowerCase().includes(busca.toLowerCase()));

  const totalContratantes = new Set(shows.map(s => s.contratante).filter(Boolean)).size;
  const totalLocais       = new Set(shows.map(s => s.endereco).filter(Boolean)).size;
  const topContratante    = contratantes[0];
  const topLocal          = locais[0];

  const max = Math.max(...dadosFiltrados.map(d => d.totalFaturamento), 1);

  return (
    <div className="crm-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">👥 CRM</h1>
          <p className="page-subtitle">Histórico de contratantes e locais</p>
        </div>
      </div>

      {/* KPIs */}
      <div className="crm-kpis">
        {[
          { icon:'🤝', val: totalContratantes, label:'Contratantes únicos' },
          { icon:'📍', val: totalLocais,       label:'Locais únicos' },
          topContratante && { icon:'🏆', val: topContratante.nome, label:`Maior contratante (${topContratante.totalShows} shows)` },
          topLocal       && { icon:'⭐', val: topLocal.nome,       label:`Local mais frequente (${topLocal.totalShows}x)` },
        ].filter(Boolean).map((k,i) => (
          <div key={i} className="crm-kpi-card">
            <div className="crm-kpi-icon">{k.icon}</div>
            <div>
              <div className="crm-kpi-val" style={{fontSize: typeof k.val === 'string' ? 13 : 18}}>{k.val}</div>
              <div className="crm-kpi-label">{k.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Alerta de duplicatas */}
      {duplicatas.length > 0 && (
        <div className="duplicatas-alerta">
          <div className="duplicatas-titulo">
            ⚠️ {duplicatas.length} grupo{duplicatas.length > 1 ? 's' : ''} de nomes similares detectado{duplicatas.length > 1 ? 's' : ''}
          </div>
          <div className="duplicatas-lista">
            {duplicatas.map((grupo, i) => (
              <div key={i} className="duplicata-grupo">
                <div className="duplicata-nomes">
                  {grupo.map((item, j) => (
                    <span key={j} className="duplicata-tag">{item.nome} <em>({item.totalShows})</em></span>
                  ))}
                </div>
                <button className="btn-mesclar" onClick={() => setModalMerge({ grupo, tipo: aba === 'locais' ? 'local' : 'contratante' })}>
                  🔗 Mesclar
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Toolbar */}
      <div className="crm-toolbar">
        <div className="crm-abas">
          <button className={'crm-aba' + (aba === 'locais' ? ' ativa' : '')}
            onClick={() => { setAba('locais'); setBusca(''); }}>
            📍 Locais ({locais.length})
          </button>
          <button className={'crm-aba' + (aba === 'contratantes' ? ' ativa' : '')}
            onClick={() => { setAba('contratantes'); setBusca(''); }}>
            🤝 Contratantes ({contratantes.length})
          </button>
        </div>
        <input className="input busca-input" style={{maxWidth:280}}
          placeholder={`Buscar ${aba}...`}
          value={busca} onChange={e => setBusca(e.target.value)} />
      </div>

      {/* Lista */}
      {loading ? (
        <div className="loading">Carregando...</div>
      ) : dadosFiltrados.length === 0 ? (
        <div className="empty">Nenhum dado encontrado.</div>
      ) : (
        <div className="crm-lista">
          {dadosFiltrados.map((item, i) => (
            <div key={i} className="crm-item">
              <div className="crm-rank">#{i+1}</div>
              <div className="crm-info">
                <div className="crm-nome">{item.nome}</div>
                <div className="crm-bar-track">
                  <div className="crm-bar-fill" style={{width:`${(item.totalFaturamento/max)*100}%`}} />
                </div>
                <div className="crm-meta">
                  <span>🎵 {item.totalShows} show{item.totalShows !== 1 ? 's' : ''}</span>
                  <span>💰 Média: {moeda(item.mediaCache)}</span>
                  <span>📅 Último: {item.ultimoShow}</span>
                </div>
              </div>
              <div className="crm-acoes">
                <div className="crm-total">{moeda(item.totalFaturamento)}</div>
                <button className="btn-renomear"
                  onClick={() => setModalItem({ item, tipo: aba === 'locais' ? 'local' : 'contratante' })}>
                  ✏️
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal renomear */}
      {modalItem && (
        <ModalRenomear
          item={modalItem.item}
          tipo={modalItem.tipo}
          onSalvar={carregar}
          onFechar={() => setModalItem(null)}
        />
      )}

      {/* Modal mesclar */}
      {modalMerge && (
        <ModalMerge
          grupo={modalMerge.grupo}
          tipo={modalMerge.tipo}
          onSalvar={carregar}
          onFechar={() => setModalMerge(null)}
        />
      )}
    </div>
  );
}

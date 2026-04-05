import { useState, useMemo } from 'react';
import { deleteShow } from '../services/api';

const MESES_LABEL = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
const STATUS_COR  = { CONFIRMADO:'#34d399', PENDENTE:'#fbbf24', CANCELADO:'#f87171' };
const STATUS_BG   = { CONFIRMADO:'rgba(52,211,153,.15)', PENDENTE:'rgba(251,191,36,.15)', CANCELADO:'rgba(248,113,113,.15)' };

function moeda(v) {
  return new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(v||0);
}

function fmtData(d) {
  if (!d) return '—';
  const [a,m,dia] = d.toString().split('-');
  return `${dia}/${m}/${a}`;
}

function MiniBarChart({ dados }) {
  const max = Math.max(...dados.map(d => d.valor), 1);
  return (
    <div className="mini-chart">
      {dados.map((d,i) => (
        <div key={i} className="mini-bar-col">
          <div className="mini-bar-wrap">
            <div className="mini-bar" style={{height:`${(d.valor/max)*100}%`, background:d.color||'var(--accent)'}} />
          </div>
          <div className="mini-bar-label">{d.label}</div>
        </div>
      ))}
    </div>
  );
}

export default function VisaoGeralPage({ shows, onEditar, onAtualizar }) {
  const [busca,        setBusca]        = useState('');
  const [filtroStatus, setFiltroStatus] = useState('TODOS');
  const [filtroAno,    setFiltroAno]    = useState('TODOS');
  const [ordem,        setOrdem]        = useState('data_desc');
  const [deletando,    setDeletando]    = useState(null);

  const confirmados    = shows.filter(s => s.status === 'CONFIRMADO');
  const pendentes      = shows.filter(s => s.status === 'PENDENTE');
  const cancelados     = shows.filter(s => s.status === 'CANCELADO');
  const totalCache     = confirmados.reduce((acc,s) => acc + (s.cache || 0), 0);
  const mediaCacheShow = confirmados.length ? totalCache / confirmados.length : 0;

  const dadosMes = useMemo(() => {
    const map = {};
    confirmados.forEach(s => { if (s.mes) map[s.mes] = (map[s.mes]||0) + (s.cache||0); });
    return MESES_LABEL.map((label,i) => ({ label, valor: map[i+1]||0, color:'var(--accent)' }));
  }, [shows]);

  const anos = [...new Set(shows.map(s => s.ano).filter(Boolean))].sort((a,b) => b-a);

  const showsFiltrados = useMemo(() => {
    let lista = [...shows];
    if (busca) {
      const q = busca.toLowerCase();
      lista = lista.filter(s =>
        (s.evento||'').toLowerCase().includes(q) ||
        (s.contratante||'').toLowerCase().includes(q) ||
        (s.endereco||'').toLowerCase().includes(q)
      );
    }
    if (filtroStatus !== 'TODOS') lista = lista.filter(s => s.status === filtroStatus);
    if (filtroAno    !== 'TODOS') lista = lista.filter(s => String(s.ano) === filtroAno);

    lista.sort((a,b) => {
      if (ordem === 'data_desc')  return new Date(b.data) - new Date(a.data);
      if (ordem === 'data_asc')   return new Date(a.data) - new Date(b.data);
      if (ordem === 'cache_desc') return (b.cache||0) - (a.cache||0);
      if (ordem === 'evento_asc') return (a.evento||'').localeCompare(b.evento||'');
      return 0;
    });
    return lista;
  }, [shows, busca, filtroStatus, filtroAno, ordem]);

  async function handleDelete(show) {
    if (!window.confirm(`Deletar "${show.evento}"? Essa ação não pode ser desfeita.`)) return;
    setDeletando(show.id);
    try {
      await deleteShow(show.id);
      onAtualizar();
    } catch (err) {
      alert('Erro: ' + err.message);
    } finally {
      setDeletando(null);
    }
  }

  return (
    <div className="visao-page">

      <div className="page-header">
        <div>
          <h1 className="page-title">📊 Visão Geral</h1>
          <p className="page-subtitle">{shows.length} shows cadastrados no sistema</p>
        </div>
      </div>

      <div className="kpi-grid">
        {[
          { icon:'🎵', val: shows.length,              label:'Total de Shows',  cor:'var(--accent)', bg:'rgba(124,106,255,.15)' },
          { icon:'✅', val: confirmados.length,         label:'Confirmados',    cor:'var(--green)',  bg:'rgba(52,211,153,.15)' },
          { icon:'⏳', val: pendentes.length,           label:'Pendentes',      cor:'var(--yellow)', bg:'rgba(251,191,36,.15)' },
          { icon:'💰', val: moeda(totalCache),          label:'Total em Cachê', cor:'var(--blue)',   bg:'rgba(96,165,250,.15)' },
          { icon:'📈', val: moeda(mediaCacheShow),      label:'Média por Show', cor:'var(--yellow)', bg:'rgba(251,191,36,.15)' },
          { icon:'❌', val: cancelados.length,          label:'Cancelados',     cor:'var(--red)',    bg:'rgba(248,113,113,.15)' },
        ].map((k,i) => (
          <div key={i} className="kpi-card">
            <div className="kpi-icon" style={{background:k.bg, color:k.cor}}>{k.icon}</div>
            <div className="kpi-info">
              <div className="kpi-valor" style={{color:k.cor}}>{k.val}</div>
              <div className="kpi-label">{k.label}</div>
            </div>
          </div>
        ))}
      </div>

      {shows.length > 0 && (
        <div className="charts-grid">
          <div className="chart-card">
            <div className="chart-title">💰 Cachê por Mês (confirmados)</div>
            <MiniBarChart dados={dadosMes} />
          </div>
          <div className="chart-card">
            <div className="chart-title">📊 Distribuição por Status</div>
            <div style={{display:'flex', flexDirection:'column', gap:12, marginTop:8}}>
              {[
                {label:'Confirmados', val:confirmados.length, cor:'var(--green)'},
                {label:'Pendentes',   val:pendentes.length,   cor:'var(--yellow)'},
                {label:'Cancelados',  val:cancelados.length,  cor:'var(--red)'},
              ].map((s,i) => {
                const pct = shows.length ? Math.round((s.val/shows.length)*100) : 0;
                return (
                  <div key={i} style={{display:'flex', alignItems:'center', gap:10}}>
                    <div style={{width:90, fontSize:12, color:s.cor, fontWeight:600}}>{s.label}</div>
                    <div style={{flex:1, height:6, background:'var(--bg-input)', borderRadius:3, overflow:'hidden'}}>
                      <div style={{width:`${pct}%`, height:'100%', background:s.cor, borderRadius:3}}/>
                    </div>
                    <div style={{fontSize:12, fontFamily:'DM Mono, monospace', minWidth:50, textAlign:'right', color:'var(--text)'}}>
                      {s.val} ({pct}%)
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <div className="filtros-bar">
        <input className="input busca-input" placeholder="🔍 Buscar por evento, contratante ou local..."
          value={busca} onChange={e => setBusca(e.target.value)} />
        <select className="input select-sm" value={filtroStatus} onChange={e => setFiltroStatus(e.target.value)}>
          <option value="TODOS">Todos os status</option>
          <option value="CONFIRMADO">Confirmado</option>
          <option value="PENDENTE">Pendente</option>
          <option value="CANCELADO">Cancelado</option>
        </select>
        <select className="input select-sm" value={filtroAno} onChange={e => setFiltroAno(e.target.value)}>
          <option value="TODOS">Todos os anos</option>
          {anos.map(a => <option key={a} value={a}>{a}</option>)}
        </select>
        <select className="input select-sm" value={ordem} onChange={e => setOrdem(e.target.value)}>
          <option value="data_desc">Mais recentes</option>
          <option value="data_asc">Mais antigos</option>
          <option value="cache_desc">Maior cachê</option>
          <option value="evento_asc">A-Z evento</option>
        </select>
      </div>

      <div className="lista-header">
        <span className="lista-count">{showsFiltrados.length} show{showsFiltrados.length !== 1 ? 's' : ''}</span>
      </div>

      {showsFiltrados.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🎵</div>
          <div className="empty-text">Nenhum show encontrado</div>
          <div className="empty-sub">Tente ajustar os filtros ou cadastre um novo show</div>
        </div>
      ) : (
        <div className="shows-lista">
          {showsFiltrados.map(show => (
            <div key={show.id} className="show-card">
              <div className="show-card-left">
                <div className="show-tipo-icon">🎵</div>
                <div className="show-card-info">
                  <div className="show-card-evento">{show.evento || '—'}</div>
                  <div className="show-card-meta">
                    <span>📅 {fmtData(show.data)}</span>
                    {show.horaInicio && <span>🕐 {show.horaInicio}{show.duracao ? ` · ${show.duracao}` : ''}</span>}
                    {show.contratante && <span>👤 {show.contratante}</span>}
                    {show.endereco && <span>📍 {show.endereco}</span>}
                  </div>
                  <div className="show-card-tags">
                    {show.xdj && <span className="tag tag-blue">XDJ</span>}
                    {show.adiantamento && <span className="tag tag-green">Adiantamento</span>}
                  </div>
                </div>
              </div>
              <div className="show-card-right">
                <div className="show-card-cache">
                  {show.cache ? moeda(show.cache) : <span className="muted">Sem cachê</span>}
                </div>
                <span className="status-pill"
                  style={{color:STATUS_COR[show.status]||'var(--text-muted)', background:STATUS_BG[show.status]||'transparent'}}>
                  {show.status || 'SEM STATUS'}
                </span>
                <div className="show-card-actions">
                  <button className="btn btn-edit" onClick={() => onEditar(show)}>✏️ Editar</button>
                  <button className="btn btn-danger btn-sm"
                    onClick={() => handleDelete(show)}
                    disabled={deletando === show.id}>
                    {deletando === show.id ? '...' : '🗑️'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

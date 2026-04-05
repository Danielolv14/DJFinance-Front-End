import { useState, useMemo } from 'react';

const MESES_FULL = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho',
                    'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
const DIAS_SEMANA = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];
const STATUS_COR  = { CONFIRMADO:'var(--green)', PENDENTE:'var(--yellow)', CANCELADO:'var(--red)' };

function moeda(v) {
  return new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(v||0);
}

export default function CalendarioPage({ shows }) {
  const hoje      = new Date();
  const [mes, setMes]   = useState(hoje.getMonth());
  const [ano, setAno]   = useState(hoje.getFullYear());
  const [showSel, setShowSel] = useState(null);

  function navegar(delta) {
    let novoMes = mes + delta;
    let novoAno = ano;
    if (novoMes < 0)  { novoMes = 11; novoAno--; }
    if (novoMes > 11) { novoMes = 0;  novoAno++; }
    setMes(novoMes);
    setAno(novoAno);
    setShowSel(null);
  }

  // Shows do mês selecionado
  const showsDoMes = useMemo(() =>
    shows.filter(s => s.mes === mes+1 && s.ano === ano),
  [shows, mes, ano]);

  // Mapa: dia -> shows
  const showsPorDia = useMemo(() => {
    const map = {};
    showsDoMes.forEach(s => {
      const dia = new Date(s.data + 'T00:00:00').getDate();
      if (!map[dia]) map[dia] = [];
      map[dia].push(s);
    });
    return map;
  }, [showsDoMes]);

  // Gerar células do calendário
  const primeiroDia   = new Date(ano, mes, 1).getDay();
  const diasNoMes     = new Date(ano, mes+1, 0).getDate();
  const celulas       = [];
  for (let i = 0; i < primeiroDia; i++) celulas.push(null);
  for (let d = 1; d <= diasNoMes; d++) celulas.push(d);

  const isHoje = (dia) =>
    dia === hoje.getDate() && mes === hoje.getMonth() && ano === hoje.getFullYear();

  // KPIs do mês
  const confirmados    = showsDoMes.filter(s => s.status === 'CONFIRMADO');
  const totalBruto     = confirmados.reduce((a,s) => a+(s.cache||110), 0);
  const proximosShows  = showsDoMes
    .filter(s => new Date(s.data+'T00:00:00') >= hoje)
    .sort((a,b) => new Date(a.data) - new Date(b.data))
    .slice(0,3);

  return (
    <div className="calendario-page">

      {/* HEADER */}
      <div className="page-header">
        <div>
          <h1 className="page-title">📅 Calendário</h1>
          <p className="page-subtitle">{showsDoMes.length} show{showsDoMes.length!==1?'s':''} em {MESES_FULL[mes]} / {ano}</p>
        </div>
        <div className="cal-nav">
          <button className="cal-nav-btn" onClick={() => navegar(-1)}>←</button>
          <span className="cal-mes-label">{MESES_FULL[mes]} {ano}</span>
          <button className="cal-nav-btn" onClick={() => navegar(1)}>→</button>
        </div>
      </div>

      {/* MINI KPIs */}
      <div className="cal-kpis">
        <div className="cal-kpi">
          <span className="cal-kpi-num">{showsDoMes.length}</span>
          <span className="cal-kpi-label">Shows</span>
        </div>
        <div className="cal-kpi">
          <span className="cal-kpi-num" style={{color:'var(--green)'}}>{confirmados.length}</span>
          <span className="cal-kpi-label">Confirmados</span>
        </div>
        <div className="cal-kpi">
          <span className="cal-kpi-num" style={{color:'var(--blue)'}}>{moeda(totalBruto)}</span>
          <span className="cal-kpi-label">Total em Cachê</span>
        </div>
        <div className="cal-kpi">
          <span className="cal-kpi-num" style={{color:'var(--yellow)'}}>
            {showsDoMes.filter(s=>s.status==='PENDENTE').length}
          </span>
          <span className="cal-kpi-label">Pendentes</span>
        </div>
      </div>

      <div className="cal-layout">

        {/* CALENDÁRIO */}
        <div className="cal-wrapper">
          {/* Dias da semana */}
          <div className="cal-grid cal-header-grid">
            {DIAS_SEMANA.map(d => (
              <div key={d} className="cal-dia-semana">{d}</div>
            ))}
          </div>

          {/* Células */}
          <div className="cal-grid">
            {celulas.map((dia, i) => {
              if (!dia) return <div key={i} className="cal-celula cal-vazia" />;
              const showsDia  = showsPorDia[dia] || [];
              const temShow   = showsDia.length > 0;
              const ativo     = showSel && showsDia.find(s => s.id === showSel.id);
              return (
                <div
                  key={i}
                  className={'cal-celula' + (isHoje(dia)?' cal-hoje':'') + (temShow?' cal-tem-show':'') + (ativo?' cal-ativo':'')}
                  onClick={() => temShow ? setShowSel(showsDia[0]) : setShowSel(null)}
                >
                  <span className="cal-dia-num">{dia}</span>
                  {showsDia.slice(0,3).map((s,j) => (
                    <div key={j} className="cal-evento-pill"
                      style={{background: STATUS_COR[s.status]||'var(--accent)', opacity:0.85}}>
                      {s.evento?.length > 10 ? s.evento.slice(0,10)+'…' : s.evento}
                    </div>
                  ))}
                  {showsDia.length > 3 && (
                    <div className="cal-mais">+{showsDia.length-3}</div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* PAINEL LATERAL */}
        <div className="cal-painel">

          {/* Show selecionado */}
          {showSel ? (
            <div className="cal-detalhe">
              <div className="cal-detalhe-header">
                <div className="cal-detalhe-evento">{showSel.evento}</div>
                <button className="cal-fechar" onClick={() => setShowSel(null)}>×</button>
              </div>
              <span className="status-pill" style={{
                color: STATUS_COR[showSel.status]||'var(--text-muted)',
                background: (STATUS_COR[showSel.status]||'var(--text-muted)')+'22',
                marginBottom: 12, display:'inline-block'
              }}>
                {showSel.status || 'SEM STATUS'}
              </span>
              {[
                ['📅 Data',        new Date(showSel.data+'T00:00:00').toLocaleDateString('pt-BR')],
                ['🕐 Hora',        showSel.horaInicio || '—'],
                ['⏱ Duração',      showSel.duracao    || '—'],
                ['👤 Contratante', showSel.contratante || '—'],
                ['📍 Local',       showSel.endereco    || '—'],
                ['💰 Cachê',       showSel.cache ? moeda(showSel.cache) : 'Não definido'],
              ].map(([label, valor], i) => (
                <div key={i} className="cal-detalhe-row">
                  <span className="cal-detalhe-label">{label}</span>
                  <span className="cal-detalhe-valor">{valor}</span>
                </div>
              ))}
              {showSel.observacoes && (
                <div className="cal-detalhe-obs">
                  <div className="cal-detalhe-label">📋 Observações</div>
                  <div style={{marginTop:4, fontSize:13, color:'var(--text-muted)'}}>{showSel.observacoes}</div>
                </div>
              )}

              {/* Outros shows no mesmo dia */}
              {(() => {
                const dia = new Date(showSel.data+'T00:00:00').getDate();
                const outros = (showsPorDia[dia]||[]).filter(s=>s.id!==showSel.id);
                return outros.length > 0 ? (
                  <div style={{marginTop:16}}>
                    <div className="cal-detalhe-label" style={{marginBottom:8}}>Outros shows neste dia:</div>
                    {outros.map(s => (
                      <div key={s.id} className="cal-outro-show" onClick={()=>setShowSel(s)}>
                        {s.evento}
                      </div>
                    ))}
                  </div>
                ) : null;
              })()}
            </div>
          ) : (
            <div className="cal-painel-vazio">
              <div style={{fontSize:32,marginBottom:8}}>👆</div>
              <div style={{fontWeight:600,marginBottom:4}}>Clique em um dia com show</div>
              <div style={{fontSize:12,color:'var(--text-muted)'}}>para ver os detalhes</div>
            </div>
          )}

          {/* Próximos shows */}
          {proximosShows.length > 0 && (
            <div className="cal-proximos">
              <div className="dash-card-title" style={{marginBottom:12}}>🔜 Próximos Shows</div>
              {proximosShows.map(s => (
                <div key={s.id} className="cal-proximo-item" onClick={()=>setShowSel(s)}>
                  <div className="cal-proximo-data">
                    {new Date(s.data+'T00:00:00').toLocaleDateString('pt-BR',{day:'2-digit',month:'short'})}
                  </div>
                  <div className="cal-proximo-info">
                    <div className="cal-proximo-evento">{s.evento}</div>
                    <div className="cal-proximo-local">{s.contratante || s.endereco || '—'}</div>
                  </div>
                  <div style={{color: STATUS_COR[s.status]||'var(--text-muted)', fontSize:10, fontWeight:700}}>
                    {s.status}
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

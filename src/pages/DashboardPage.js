import { useMemo, useState, useEffect } from 'react';
import { getProjecao } from '../services/api';

const MESES_LABEL = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
const MESES_FULL  = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];

function moeda(v) {
  return new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(v||0);
}

function BarChart({ dados, altura = 140, cor = 'var(--accent)', mostrarValor = true }) {
  const max = Math.max(...dados.map(d => d.valor), 1);
  return (
    <div className="barchart">
      {dados.map((d, i) => (
        <div key={i} className="barchart-col">
          {mostrarValor && d.valor > 0 && (
            <div className="barchart-val">{d.valor}</div>
          )}
          <div className="barchart-track" style={{height: altura}}>
            <div
              className="barchart-bar"
              style={{
                height: `${Math.max((d.valor / max) * 100, d.valor > 0 ? 4 : 0)}%`,
                background: d.cor || cor,
              }}
            />
          </div>
          <div className="barchart-label">{d.label}</div>
        </div>
      ))}
    </div>
  );
}

function LineChart({ dados, altura = 120 }) {
  const max = Math.max(...dados.map(d => d.valor), 1);
  const pts = dados.map((d, i) => {
    const x = (i / (dados.length - 1)) * 100;
    const y = 100 - (d.valor / max) * 90;
    return `${x},${y}`;
  });
  const pontos = pts.join(' ');

  return (
    <div className="linechart" style={{height: altura}}>
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{width:'100%',height:'100%'}}>
        <defs>
          <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.3"/>
            <stop offset="100%" stopColor="var(--accent)" stopOpacity="0"/>
          </linearGradient>
        </defs>
        <polygon
          points={`0,100 ${pontos} 100,100`}
          fill="url(#grad)"
        />
        <polyline
          points={pontos}
          fill="none"
          stroke="var(--accent)"
          strokeWidth="2"
          vectorEffect="non-scaling-stroke"
        />
        {dados.map((d, i) => {
          const x = (i / (dados.length - 1)) * 100;
          const y = 100 - (d.valor / max) * 90;
          return d.valor > 0
            ? <circle key={i} cx={x} cy={y} r="1.5" fill="var(--accent)" vectorEffect="non-scaling-stroke"/>
            : null;
        })}
      </svg>
      <div className="linechart-labels">
        {dados.map((d,i) => <span key={i}>{d.label}</span>)}
      </div>
    </div>
  );
}

export default function DashboardPage({ shows }) {
  const anos = useMemo(() => [...new Set(shows.map(s => s.ano).filter(Boolean))].sort((a,b) => b-a), [shows]);
  const [anoSel, setAnoSel]     = useState(() => new Date().getFullYear());
  const [projecao, setProjecao] = useState([]);

  useEffect(() => {
    getProjecao().then(setProjecao).catch(console.error);
  }, [shows]);

  const showsAno = useMemo(() => shows.filter(s => s.ano === Number(anoSel)), [shows, anoSel]);
  const confirmados = showsAno.filter(s => s.status === 'CONFIRMADO');

  // ── Dados por mês ──────────────────────────────────────────────────────────
  const cachePorMes = useMemo(() => {
    const map = Array(12).fill(0);
    confirmados.forEach(s => { if (s.mes) map[s.mes-1] += (s.cache||110); });
    return MESES_LABEL.map((label,i) => ({ label, valor: Math.round(map[i]) }));
  }, [confirmados]);

  const showsPorMes = useMemo(() => {
    const map = Array(12).fill(0);
    showsAno.forEach(s => { if (s.mes) map[s.mes-1]++; });
    return MESES_LABEL.map((label,i) => ({ label, valor: map[i] }));
  }, [showsAno]);

  // ── Dados por status ───────────────────────────────────────────────────────
  const porStatus = [
    { label:'Confirmados', valor: showsAno.filter(s=>s.status==='CONFIRMADO').length, cor:'var(--green)' },
    { label:'Pendentes',   valor: showsAno.filter(s=>s.status==='PENDENTE').length,   cor:'var(--yellow)' },
    { label:'Cancelados',  valor: showsAno.filter(s=>s.status==='CANCELADO').length,  cor:'var(--red)' },
  ];

  // ── KPIs ───────────────────────────────────────────────────────────────────
  const INICIO_EQUIPE            = new Date('2025-03-01');
  const INICIO_PERCENTUAL_DANIEL = new Date('2026-01-01');

  const totalBruto = confirmados.reduce((a,s) => a+(s.cache||0), 0);

  const totalDaniel = confirmados.reduce((a,s) => {
    const dataShow = new Date(s.data + 'T00:00:00');
    if (dataShow < INICIO_EQUIPE) return a;
    if (dataShow < INICIO_PERCENTUAL_DANIEL) return a + 90; // fixo antigo
    return a + (s.cache||0) * 0.15 + 40;                   // 15% + transporte
  }, 0);

  const totalYuri = confirmados.reduce((a,s) => {
    const dataShow = new Date(s.data + 'T00:00:00');
    if (dataShow < INICIO_EQUIPE) return a;
    return a + 300;
  }, 0);

  const lucroLiquido = totalBruto - totalDaniel - totalYuri;
  const melhorMes     = cachePorMes.reduce((a,b) => b.valor > a.valor ? b : a, {label:'—',valor:0});
  const mediaCache    = confirmados.length ? totalBruto/confirmados.length : 0;

  // ── Top contratantes ──────────────────────────────────────────────────────
  const topContratantes = useMemo(() => {
    const map = {};
    showsAno.forEach(s => { if (s.contratante) map[s.contratante]=(map[s.contratante]||0)+1; });
    return Object.entries(map).sort((a,b)=>b[1]-a[1]).slice(0,5);
  }, [showsAno]);

  return (
    <div className="dashboard-page">

      {/* HEADER */}
      <div className="page-header">
        <div>
          <h1 className="page-title">📈 Dashboard</h1>
          <p className="page-subtitle">Visão financeira completa dos shows</p>
        </div>
        <select className="input select-sm" value={anoSel} onChange={e=>setAnoSel(e.target.value)}>
          {anos.map(a => <option key={a} value={a}>{a}</option>)}
        </select>
      </div>

      {/* KPI CARDS */}
      <div className="dash-kpi-grid">
        {[
          { icon:'💰', label:'Total Bruto',    valor: moeda(totalBruto),   cor:'var(--blue)',   bg:'var(--blue-bg)' },
          { icon:'✅', label:'Lucro Líquido',  valor: moeda(lucroLiquido), cor: lucroLiquido>=0?'var(--green)':'var(--red)', bg: lucroLiquido>=0?'var(--green-bg)':'var(--red-bg)' },
          { icon:'🎵', label:'Shows Realizados',valor: confirmados.length,  cor:'var(--accent)', bg:'var(--accent-glow)' },
          { icon:'📊', label:'Média por Show',  valor: moeda(mediaCache),   cor:'var(--yellow)', bg:'var(--yellow-bg)' },
          { icon:'👤', label:'Total Daniel',    valor: moeda(totalDaniel),  cor:'var(--yellow)', bg:'var(--yellow-bg)' },
          { icon:'👤', label:'Total Yuri',      valor: moeda(totalYuri),    cor:'var(--accent)', bg:'var(--accent-glow)' },
          { icon:'🏆', label:'Melhor Mês',      valor: melhorMes.label,     cor:'var(--green)',  bg:'var(--green-bg)' },
          { icon:'📅', label:'Total de Shows',  valor: showsAno.length,     cor:'var(--text)',   bg:'var(--bg-input)' },
        ].map((k,i) => (
          <div key={i} className="dash-kpi">
            <div className="dash-kpi-icon" style={{background:k.bg, color:k.cor}}>{k.icon}</div>
            <div>
              <div className="dash-kpi-valor" style={{color:k.cor}}>{k.valor}</div>
              <div className="dash-kpi-label">{k.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* GRÁFICO CACHÊ POR MÊS */}
      <div className="dash-card dash-card-full">
        <div className="dash-card-header">
          <div className="dash-card-title">💰 Cachê por Mês — {anoSel}</div>
          <div className="dash-card-sub">Total: {moeda(totalBruto)}</div>
        </div>
        <LineChart dados={cachePorMes} altura={160} />
      </div>

      <div className="dash-grid-2">

        {/* SHOWS POR MÊS */}
        <div className="dash-card">
          <div className="dash-card-header">
            <div className="dash-card-title">🎵 Shows por Mês</div>
            <div className="dash-card-sub">{showsAno.length} total</div>
          </div>
          <BarChart dados={showsPorMes} altura={100} cor="var(--blue)" />
        </div>

        {/* POR STATUS */}
        <div className="dash-card">
          <div className="dash-card-header">
            <div className="dash-card-title">📊 Por Status</div>
          </div>
          <div className="status-chart">
            {porStatus.map((s,i) => {
              const pct = showsAno.length ? Math.round((s.valor/showsAno.length)*100) : 0;
              return (
                <div key={i} className="status-row">
                  <div className="status-row-label" style={{color:s.cor}}>{s.label}</div>
                  <div className="status-row-bar">
                    <div className="status-row-fill" style={{width:`${pct}%`, background:s.cor}} />
                  </div>
                  <div className="status-row-val">{s.valor} <span>({pct}%)</span></div>
                </div>
              );
            })}
          </div>

          <div className="dash-card-header" style={{marginTop:24}}>
            <div className="dash-card-title">🏆 Top Contratantes</div>
          </div>
          <div className="top-lista">
            {topContratantes.map(([nome,qtd],i) => (
              <div key={i} className="top-item">
                <span className="top-pos">#{i+1}</span>
                <span className="top-nome">{nome}</span>
                <span className="top-qtd">{qtd} show{qtd!==1?'s':''}</span>
              </div>
            ))}
            {topContratantes.length === 0 && <div className="muted" style={{fontSize:13}}>Nenhum dado ainda</div>}
          </div>
        </div>

      </div>

      {/* POR TIPO */}
        <div className="dash-card dash-card-full">
          <div className="dash-card-header">
          </div>
        </div>
      )}

      {/* DISTRIBUIÇÃO FINANCEIRA */}
      <div className="dash-card dash-card-full">
        <div className="dash-card-header">
          <div className="dash-card-title">💸 Distribuição Financeira — {anoSel}</div>
        </div>
        <div className="dist-grid">
          {[
            { label:'Total Bruto',   valor: totalBruto,   pct: 100, cor:'var(--blue)' },
            { label:'Pago a Daniel', valor: totalDaniel,  pct: totalBruto?Math.round(totalDaniel/totalBruto*100):0, cor:'var(--yellow)' },
            { label:'Pago a Yuri',   valor: totalYuri,    pct: totalBruto?Math.round(totalYuri/totalBruto*100):0,   cor:'var(--accent)' },
            { label:'Lucro Líquido', valor: lucroLiquido, pct: totalBruto?Math.round(lucroLiquido/totalBruto*100):0, cor: lucroLiquido>=0?'var(--green)':'var(--red)' },
          ].map((d,i) => (
            <div key={i} className="dist-item">
              <div className="dist-label">{d.label}</div>
              <div className="dist-valor" style={{color:d.cor}}>{moeda(d.valor)}</div>
              <div className="dist-bar-track">
                <div className="dist-bar-fill" style={{width:`${Math.abs(d.pct)}%`, background:d.cor}} />
              </div>
              <div className="dist-pct" style={{color:d.cor}}>{d.pct}%</div>
            </div>
          ))}
        </div>
      </div>

      {/* PROJEÇÃO DE FATURAMENTO */}
      {projecao.length > 0 && (
        <div className="dash-card dash-card-full">
          <div className="dash-card-header">
            <div className="dash-card-title">🔮 Projeção de Faturamento</div>
            <div className="dash-card-sub">Baseado nos shows agendados (excl. cancelados)</div>
          </div>
          <div className="projecao-grid">
            {projecao.map((p, i) => (
              <div key={i} className={'projecao-item' + (p.passado ? ' projecao-passado' : ' projecao-futuro')}>
                <div className="projecao-mes">{p.nomeMes}</div>
                <div className="projecao-valor">{moeda(p.totalAgendado)}</div>
                <div className="projecao-shows">{p.quantidadeShows} show{p.quantidadeShows!==1?'s':''}</div>
                {!p.passado && p.totalAgendado > 0 && (
                  <div className="projecao-badge">Agendado</div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}

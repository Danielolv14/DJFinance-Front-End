import { useMemo, useState, useEffect } from 'react';
import { getProjecao } from '../services/api';
import '../dashboard.css';

const MESES_LABEL = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
const MESES_FULL  = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];

function moeda(v) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0);
}

function pct(a, b) {
  if (!b) return null;
  return Math.round(((a - b) / b) * 100);
}

// ── Glow Line Chart ─────────────────────────────────────────────────────────
function GlowLineChart({ dados, altura = 180, cor = '#a855f7', corSecundaria = '#22d3ee' }) {
  const max = Math.max(...dados.map(d => d.valor), 1);
  const pts = dados.map((d, i) => {
    const x = (i / (dados.length - 1)) * 100;
    const y = 100 - (d.valor / max) * 88;
    return { x, y, ...d };
  });
  const polyline = pts.map(p => `${p.x},${p.y}`).join(' ');
  const [hovered, setHovered] = useState(null);

  return (
    <div className="dj-chart-wrap" style={{ height: altura }}>
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
        <defs>
          <linearGradient id="glowGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={cor} stopOpacity="0.35" />
            <stop offset="100%" stopColor={cor} stopOpacity="0" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="1.5" result="coloredBlur" />
            <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>
        <polygon points={`0,100 ${polyline} 100,100`} fill="url(#glowGrad)" />
        <polyline points={polyline} fill="none" stroke={cor} strokeWidth="1.8"
          vectorEffect="non-scaling-stroke" filter="url(#glow)" />
        {pts.map((p, i) => (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r="3" fill="transparent" vectorEffect="non-scaling-stroke"
              style={{ cursor: 'pointer' }}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)} />
            {p.valor > 0 && (
              <circle cx={p.x} cy={p.y} r={hovered === i ? "2.2" : "1.4"}
                fill={hovered === i ? corSecundaria : cor}
                vectorEffect="non-scaling-stroke"
                style={{ transition: 'r 0.15s' }} />
            )}
            {hovered === i && p.valor > 0 && (
              <g>
                <rect x={p.x - 14} y={p.y - 10} width="28" height="8" rx="2"
                  fill="#1a0533" stroke={cor} strokeWidth="0.5" vectorEffect="non-scaling-stroke" />
                <text x={p.x} y={p.y - 4} textAnchor="middle" fontSize="4"
                  fill={cor} fontFamily="DM Mono, monospace">
                  {moeda(p.valor).replace('R$\u00a0', '')}
                </text>
              </g>
            )}
          </g>
        ))}
      </svg>
      <div className="dj-chart-labels">
        {dados.map((d, i) => <span key={i} className={d.valor > 0 ? 'dj-chart-label-active' : ''}>{d.label}</span>)}
      </div>
    </div>
  );
}

// ── Bar Chart ────────────────────────────────────────────────────────────────
function NeonBarChart({ dados, altura = 100 }) {
  const max = Math.max(...dados.map(d => d.valor), 1);
  return (
    <div className="dj-barchart">
      {dados.map((d, i) => {
        const h = max > 0 ? Math.max((d.valor / max) * 100, d.valor > 0 ? 8 : 0) : 0;
        return (
          <div key={i} className="dj-bar-col" style={{ height: altura }}>
            <div className="dj-bar-track">
              <div className="dj-bar-fill" style={{ height: `${h}%`, opacity: d.valor > 0 ? 1 : 0.15 }} />
            </div>
            <span className="dj-bar-label">{d.label}</span>
          </div>
        );
      })}
    </div>
  );
}

// ── Heatmap mensal ───────────────────────────────────────────────────────────
function HeatMap({ showsPorMes, max }) {
  return (
    <div className="dj-heatmap">
      {MESES_LABEL.map((label, i) => {
        const val = showsPorMes[i] || 0;
        const intensity = max > 0 ? val / max : 0;
        return (
          <div key={i} className="dj-heat-cell" title={`${MESES_FULL[i]}: ${val} show${val !== 1 ? 's' : ''}`}
            style={{ '--heat': intensity }}>
            <span className="dj-heat-val">{val > 0 ? val : ''}</span>
            <span className="dj-heat-label">{label}</span>
          </div>
        );
      })}
    </div>
  );
}

// ── Insight Card ─────────────────────────────────────────────────────────────
function InsightCard({ emoji, titulo, texto, tipo = 'neutro' }) {
  return (
    <div className={`dj-insight dj-insight-${tipo}`}>
      <span className="dj-insight-emoji">{emoji}</span>
      <div>
        <div className="dj-insight-titulo">{titulo}</div>
        <div className="dj-insight-texto">{texto}</div>
      </div>
    </div>
  );
}

// ── Badge de variação ────────────────────────────────────────────────────────
function DeltaBadge({ delta }) {
  if (delta === null || delta === undefined) return null;
  const up = delta >= 0;
  return (
    <span className={`dj-delta ${up ? 'dj-delta-up' : 'dj-delta-down'}`}>
      {up ? '↑' : '↓'} {Math.abs(delta)}%
    </span>
  );
}

// ── Dashboard principal ──────────────────────────────────────────────────────
export default function DashboardPage({ shows }) {
  const hoje = new Date();
  const mesAtual = hoje.getMonth() + 1;
  const anoAtual = hoje.getFullYear();

  const anos = useMemo(() => [...new Set(shows.map(s => s.ano).filter(Boolean))].sort((a, b) => b - a), [shows]);
  const [anoSel, setAnoSel] = useState(() => anoAtual);
  const [projecao, setProjecao] = useState([]);

  useEffect(() => { getProjecao().then(setProjecao).catch(console.error); }, [shows]);

  const INICIO_EQUIPE            = new Date('2025-03-01');
  const INICIO_PERCENTUAL_DANIEL = new Date('2026-01-01');
  const INICIO_PERCENTUAL_20     = new Date('2026-04-01');

  const showsAno     = useMemo(() => shows.filter(s => s.ano === Number(anoSel)), [shows, anoSel]);
  const confirmados  = useMemo(() => showsAno.filter(s => s.status === 'CONFIRMADO'), [showsAno]);
  const pendentes    = useMemo(() => showsAno.filter(s => s.status === 'PENDENTE'), [showsAno]);

  // KPIs financeiros
  const totalBruto = confirmados.reduce((a, s) => a + (s.cache || 0), 0);

  const totalDaniel = confirmados.reduce((a, s) => {
    const d = new Date(s.data + 'T00:00:00');
    if (d < INICIO_EQUIPE) return a;
    if (d < INICIO_PERCENTUAL_DANIEL) return a + 90;
    const pct = d < INICIO_PERCENTUAL_20 ? 0.15 : 0.20;
    return a + (s.cache || 0) * pct + 40;
  }, 0);

  const totalYuri = confirmados.reduce((a, s) => {
    const d = new Date(s.data + 'T00:00:00');
    if (d < INICIO_EQUIPE) return a;
    return a + 300;
  }, 0);

  const lucroLiquido = totalBruto - totalDaniel - totalYuri;
  const mediaCache   = confirmados.length ? totalBruto / confirmados.length : 0;
  const granaAReceber = pendentes.reduce((a, s) => a + (s.cache || 0), 0);

  // Por mês
  const cachePorMes = useMemo(() => {
    const map = Array(12).fill(0);
    confirmados.forEach(s => { if (s.mes) map[s.mes - 1] += (s.cache || 0); });
    return MESES_LABEL.map((label, i) => ({ label, valor: Math.round(map[i]) }));
  }, [confirmados]);

  const showsPorMesArr = useMemo(() => {
    const map = Array(12).fill(0);
    showsAno.forEach(s => { if (s.mes) map[s.mes - 1]++; });
    return map;
  }, [showsAno]);

  const showsPorMesChart = MESES_LABEL.map((label, i) => ({ label, valor: showsPorMesArr[i] }));
  const maxShowsMes = Math.max(...showsPorMesArr, 1);

  // Melhor mês
  const melhorMes = cachePorMes.reduce((a, b) => b.valor > a.valor ? b : a, { label: '—', valor: 0 });

  // Variação mês atual vs mês anterior
  const cachesMesAtual  = cachePorMes[mesAtual - 1]?.valor || 0;
  const cachesMesAnterior = cachePorMes[mesAtual - 2]?.valor || 0;
  const deltaMes = pct(cachesMesAtual, cachesMesAnterior);

  // Top contratantes
  const topContratantes = useMemo(() => {
    const map = {};
    showsAno.forEach(s => {
      if (!s.contratante) return;
      if (!map[s.contratante]) map[s.contratante] = { shows: 0, cache: 0 };
      map[s.contratante].shows++;
      map[s.contratante].cache += (s.cache || 0);
    });
    return Object.entries(map).sort((a, b) => b[1].shows - a[1].shows).slice(0, 5);
  }, [showsAno]);

  // Últimos shows confirmados
  const ultimosShows = useMemo(() =>
    [...confirmados]
      .sort((a, b) => new Date(b.data) - new Date(a.data))
      .slice(0, 5),
    [confirmados]);

  // Insights calculados
  const insights = useMemo(() => {
    const lista = [];

    if (deltaMes !== null && deltaMes > 0) {
      lista.push({ emoji: '📈', tipo: 'positivo', titulo: `Faturamento subiu ${deltaMes}%`, texto: `Você faturou mais este mês do que no mês anterior. Bom ritmo!` });
    } else if (deltaMes !== null && deltaMes < 0) {
      lista.push({ emoji: '📉', tipo: 'negativo', titulo: `Faturamento caiu ${Math.abs(deltaMes)}%`, texto: `Este mês ficou abaixo do anterior. Hora de fechar mais gigs.` });
    }

    if (topContratantes.length > 0) {
      const [nome, dados] = topContratantes[0];
      lista.push({ emoji: '🏆', tipo: 'positivo', titulo: `Seu contratante mais fiel: ${nome}`, texto: `${dados.shows} shows fechados — ${moeda(dados.cache)} gerados` });
    }

    if (melhorMes.valor > 0) {
      lista.push({ emoji: '🔥', tipo: 'destaque', titulo: `${melhorMes.label} foi o mês mais insano`, texto: `${moeda(melhorMes.valor)} em cache — seu pico em ${anoSel}` });
    }

    if (granaAReceber > 0) {
      lista.push({ emoji: '💸', tipo: 'alerta', titulo: `${moeda(granaAReceber)} ainda a receber`, texto: `${pendentes.length} show${pendentes.length !== 1 ? 's' : ''} confirmado${pendentes.length !== 1 ? 's' : ''} aguardando pagamento` });
    }

    if (mediaCache > 0) {
      lista.push({ emoji: '🎯', tipo: 'neutro', titulo: `Cache médio de ${moeda(mediaCache)} por set`, texto: `Baseado nos ${confirmados.length} sets realizados em ${anoSel}` });
    }

    return lista.slice(0, 3);
  }, [deltaMes, topContratantes, melhorMes, granaAReceber, pendentes, confirmados, anoSel, mediaCache]);

  return (
    <div className="dj-dash">

      {/* ── HEADER ── */}
      <div className="dj-dash-header">
        <div>
          <h1 className="dj-dash-title">Dashboard</h1>
          <p className="dj-dash-sub">Visão completa da sua carreira em {anoSel}</p>
        </div>
        <select className="dj-ano-select" value={anoSel} onChange={e => setAnoSel(Number(e.target.value))}>
          {anos.map(a => <option key={a} value={a}>{a}</option>)}
        </select>
      </div>

      {/* ── HERO CARD ── */}
      <div className="dj-hero">
        <div className="dj-hero-left">
          <div className="dj-hero-eyebrow">💰 Faturamento dos Gigs</div>
          <div className="dj-hero-valor">{moeda(totalBruto)}</div>
          <div className="dj-hero-meta">
            <DeltaBadge delta={deltaMes} />
            <span className="dj-hero-meta-txt">vs mês anterior</span>
          </div>
        </div>
        <div className="dj-hero-right">
          <div className="dj-hero-stat">
            <span className="dj-hero-stat-val">{confirmados.length}</span>
            <span className="dj-hero-stat-lbl">Sets Tocadas</span>
          </div>
          <div className="dj-hero-divider" />
          <div className="dj-hero-stat">
            <span className="dj-hero-stat-val" style={{ color: 'var(--dj-cyan)' }}>{moeda(lucroLiquido)}</span>
            <span className="dj-hero-stat-lbl">Lucro Líquido</span>
          </div>
          <div className="dj-hero-divider" />
          <div className="dj-hero-stat">
            <span className="dj-hero-stat-val" style={{ color: 'var(--dj-yellow)' }}>{moeda(granaAReceber)}</span>
            <span className="dj-hero-stat-lbl">Grana a Receber</span>
          </div>
        </div>
      </div>

      {/* ── KPI GRID ── */}
      <div className="dj-kpi-grid">
        {[
          { icon: '🎵', label: 'Sets Tocadas',    valor: confirmados.length,      cor: 'var(--dj-purple)', num: true },
          { icon: '📊', label: 'Cache Médio',     valor: moeda(mediaCache),       cor: 'var(--dj-cyan)'   },
          { icon: '🔥', label: 'Mês Mais Insano', valor: melhorMes.label,         cor: 'var(--dj-yellow)' },
          { icon: '⏳', label: 'Pendentes',        valor: pendentes.length,        cor: 'var(--dj-pink)',  num: true },
          { icon: '👤', label: 'Pago a Daniel',   valor: moeda(totalDaniel),      cor: 'var(--dj-muted)'  },
          { icon: '👤', label: 'Pago a Yuri',     valor: moeda(totalYuri),        cor: 'var(--dj-muted)'  },
          { icon: '💸', label: 'Grana a Receber', valor: moeda(granaAReceber),    cor: 'var(--dj-yellow)' },
          { icon: '📅', label: 'Total de Shows',  valor: showsAno.length,         cor: 'var(--dj-text)',  num: true },
        ].map((k, i) => (
          <div key={i} className="dj-kpi">
            <span className="dj-kpi-icon">{k.icon}</span>
            <span className="dj-kpi-val" style={{ color: k.cor }}>{k.valor}</span>
            <span className="dj-kpi-lbl">{k.label}</span>
          </div>
        ))}
      </div>

      {/* ── INSIGHTS ── */}
      {insights.length > 0 && (
        <div className="dj-insights-wrap">
          <div className="dj-section-title">⚡ Insights</div>
          <div className="dj-insights-grid">
            {insights.map((ins, i) => <InsightCard key={i} {...ins} />)}
          </div>
        </div>
      )}

      {/* ── CHARTS ROW ── */}
      <div className="dj-charts-row">
        <div className="dj-chart-card dj-chart-wide">
          <div className="dj-chart-head">
            <span className="dj-section-title">📈 Cache por Mês</span>
            <span className="dj-chart-total">{moeda(totalBruto)}</span>
          </div>
          <GlowLineChart dados={cachePorMes} altura={180} />
        </div>
        <div className="dj-chart-card">
          <div className="dj-chart-head">
            <span className="dj-section-title">🎧 Sets por Mês</span>
            <span className="dj-chart-total">{showsAno.length} total</span>
          </div>
          <NeonBarChart dados={showsPorMesChart} altura={140} />
        </div>
      </div>

      {/* ── HEATMAP ── */}
      <div className="dj-card">
        <div className="dj-chart-head" style={{ marginBottom: 16 }}>
          <span className="dj-section-title">🗓 Frequência de Shows — {anoSel}</span>
          <span className="dj-chart-total">{showsAno.length} shows</span>
        </div>
        <HeatMap showsPorMes={showsPorMesArr} max={maxShowsMes} />
      </div>

      {/* ── CONTRATANTES + TIMELINE ── */}
      <div className="dj-bottom-row">

        {/* Ranking */}
        <div className="dj-card">
          <div className="dj-section-title" style={{ marginBottom: 16 }}>🏆 Ranking de Contratantes</div>
          {topContratantes.length === 0 && <p className="dj-empty">Nenhum dado ainda</p>}
          {topContratantes.map(([nome, d], i) => {
            const maxShows = topContratantes[0]?.[1]?.shows || 1;
            const barra = Math.round((d.shows / maxShows) * 100);
            const cores = ['var(--dj-yellow)', 'var(--dj-cyan)', 'var(--dj-purple)', 'var(--dj-pink)', 'var(--dj-text)'];
            return (
              <div key={i} className="dj-rank-item">
                <span className="dj-rank-pos" style={{ color: cores[i] }}>#{i + 1}</span>
                <div className="dj-rank-info">
                  <div className="dj-rank-nome">{nome}</div>
                  <div className="dj-rank-bar-track">
                    <div className="dj-rank-bar-fill" style={{ width: `${barra}%`, background: cores[i] }} />
                  </div>
                </div>
                <div className="dj-rank-nums">
                  <span className="dj-rank-shows">{d.shows} set{d.shows !== 1 ? 's' : ''}</span>
                  <span className="dj-rank-cache">{moeda(d.cache)}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Timeline */}
        <div className="dj-card">
          <div className="dj-section-title" style={{ marginBottom: 16 }}>⏱ Últimos Sets</div>
          {ultimosShows.length === 0 && <p className="dj-empty">Nenhum show confirmado ainda</p>}
          {ultimosShows.map((s, i) => (
            <div key={s.id} className="dj-timeline-item">
              <div className="dj-timeline-dot" />
              <div className="dj-timeline-body">
                <div className="dj-timeline-evento">{s.evento || '—'}</div>
                <div className="dj-timeline-meta">
                  <span>{new Date(s.data + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}</span>
                  {s.contratante && <span>· {s.contratante}</span>}
                </div>
              </div>
              <div className="dj-timeline-cache">
                {s.cache ? moeda(s.cache) : <span style={{ opacity: 0.3 }}>—</span>}
              </div>
            </div>
          ))}
        </div>

      </div>

      {/* ── DISTRIBUIÇÃO ── */}
      <div className="dj-card">
        <div className="dj-section-title" style={{ marginBottom: 20 }}>💸 Distribuição Financeira</div>
        <div className="dj-dist-grid">
          {[
            { label: 'Faturamento Bruto', valor: totalBruto,   cor: 'var(--dj-cyan)',   pct: 100 },
            { label: 'Pago a Daniel',     valor: totalDaniel,  cor: 'var(--dj-yellow)', pct: totalBruto ? Math.round(totalDaniel / totalBruto * 100) : 0 },
            { label: 'Pago a Yuri',       valor: totalYuri,    cor: 'var(--dj-purple)', pct: totalBruto ? Math.round(totalYuri / totalBruto * 100) : 0 },
            { label: 'Lucro Líquido',     valor: lucroLiquido, cor: lucroLiquido >= 0 ? 'var(--dj-green)' : 'var(--red)', pct: totalBruto ? Math.round(lucroLiquido / totalBruto * 100) : 0 },
          ].map((d, i) => (
            <div key={i} className="dj-dist-item">
              <div className="dj-dist-head">
                <span className="dj-dist-label">{d.label}</span>
                <span className="dj-dist-pct" style={{ color: d.cor }}>{d.pct}%</span>
              </div>
              <div className="dj-dist-valor" style={{ color: d.cor }}>{moeda(d.valor)}</div>
              <div className="dj-dist-track">
                <div className="dj-dist-fill" style={{ width: `${Math.abs(d.pct)}%`, background: d.cor }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── PROJEÇÃO ── */}
      {projecao.length > 0 && (
        <div className="dj-card">
          <div className="dj-section-title" style={{ marginBottom: 16 }}>🔮 Projeção de Faturamento</div>
          <div className="dj-projecao-grid">
            {projecao.map((p, i) => (
              <div key={i} className={`dj-proj-item ${p.passado ? 'dj-proj-passado' : 'dj-proj-futuro'}`}>
                <div className="dj-proj-mes">{p.nomeMes}</div>
                <div className="dj-proj-valor">{moeda(p.totalAgendado)}</div>
                <div className="dj-proj-shows">{p.quantidadeShows} set{p.quantidadeShows !== 1 ? 's' : ''}</div>
                {!p.passado && p.totalAgendado > 0 && (
                  <div className="dj-proj-badge">Agendado</div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}

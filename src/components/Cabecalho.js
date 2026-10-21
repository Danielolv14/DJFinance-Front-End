/* Barra do topo: logo com o nome do DJ, abas de navegação e indicadores de status. */

import useIsMobile from '../hooks/useIsMobile';
import { useDJ } from '../context/DJContext';
import { IS_DEMO } from '../utils/demo';
import { COR_ABA } from '../utils/tema';

const ABAS = [
  { id:'dashboard',  label:'Dashboard',  color: COR_ABA.dashboard,  shortcut:'F1' },
  { id:'calendario', label:'Calendário', color: COR_ABA.calendario, shortcut:'F2' },
  { id:'shows',      label:'Shows',      color: COR_ABA.shows,      shortcut:'F3' },
  { id:'crm',        label:'CRM',        color: COR_ABA.crm,        shortcut:'F4' },
  { id:'cadastro',   label:'Cadastrar',  color: COR_ABA.cadastro,   shortcut:'F5' },
  { id:'fechamento', label:'Fechamento', color: COR_ABA.fechamento, shortcut:'F6' },
  { id:'presskit',   label:'Press Kit',  color: COR_ABA.presskit,   shortcut:'F7' },
];

export default function Cabecalho({ aba, onTrocarAba, totalShows, carregando }) {
  const isMobile = useIsMobile();
  const { djConfig, logout } = useDJ();
  const nomeDisplay = IS_DEMO ? 'DJ DRUDS' : (djConfig?.nome?.toUpperCase() || 'DJ DRUDS');
  const [nomeDJ, ...restoNome] = nomeDisplay.split(' ');

  return (
    <header className="header">
      <div className="header-inner">

        {/* ── Logo ── */}
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
              <div className="logo-product">
                {nomeDJ} <span className="logo-accent">{restoNome.join(' ')}</span>
              </div>
            </div>
          )}
        </div>

        {/* ── Abas ── */}
        <nav className="nav">
          {ABAS.map(a => (
            <button
              key={a.id}
              className={'nav-btn' + (aba === a.id ? ' active' : '')}
              style={{ '--btn-color': a.color }}
              onClick={() => onTrocarAba(a.id)}
            >
              <span className="nav-led" />
              <span className="nav-label">{a.label}</span>
              {!isMobile && <span className="nav-shortcut">{a.shortcut}</span>}
              {a.id === 'shows' && totalShows > 0 && (
                <span className="nav-badge">{totalShows}</span>
              )}
            </button>
          ))}
        </nav>

        {/* ── Status ── */}
        {!isMobile && (
          <div className="header-status-cluster">
            {IS_DEMO && (
              <div className="status-item" style={{ background: 'rgba(255,214,10,0.12)', border: '1px solid rgba(255,214,10,0.35)', borderRadius: 4, padding: '4px 10px' }}>
                <span className="status-led status-led--orange status-led--blink" />
                <span style={{ color: '#ffd60a', fontWeight: 700, letterSpacing: '0.12em' }}>DEMO</span>
              </div>
            )}
            {!IS_DEMO && (
              <>
                <div className="status-item status-online">
                  <span className="status-led status-led--green" />
                  <span>ONLINE</span>
                </div>
                <div className="status-item">
                  <span className="status-led status-led--blue" />
                  <span>SYNC</span>
                </div>
              </>
            )}
            {carregando && (
              <div className="status-item">
                <span className="status-led status-led--orange status-led--blink" />
                <span>LOAD</span>
              </div>
            )}
            {!IS_DEMO && (
              <button
                onClick={logout}
                title="Trocar de painel"
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 4, padding: '4px 10px',
                  color: 'rgba(255,255,255,0.4)',
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 9, letterSpacing: '0.15em',
                  cursor: 'pointer',
                }}
              >
                TROCAR DJ
              </button>
            )}
          </div>
        )}

      </div>
    </header>
  );
}

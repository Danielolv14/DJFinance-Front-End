import { useState } from 'react';
import useIsMobile from '../hooks/useIsMobile';

const DRIVE_URL = 'https://drive.google.com/drive/folders/1cy9qnDv1gPpuf8_9qlKAW4AlHaxAOrmD';
const EMBED_URL = 'https://drive.google.com/embeddedfolderview?id=1cy9qnDv1gPpuf8_9qlKAW4AlHaxAOrmD#list';

const ACCENT  = '#22d3ee';
const surface = {
  background: '#13141a',
  border: '1px solid rgba(255,255,255,0.06)',
  borderRadius: 8,
  boxShadow: '0 4px 24px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.04)',
};

export default function PressKitPage() {
  const isMobile       = useIsMobile();
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  return (
    <div style={{
      padding: isMobile ? '0' : '24px 28px',
      maxWidth: 1100,
      margin: '0 auto',
      fontFamily: "'JetBrains Mono', monospace",
    }}>

      {/* ── Page header ── */}
      <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:20, flexWrap:'wrap' }}>
        <span style={{
          width:8, height:8, borderRadius:'50%',
          background:ACCENT, boxShadow:`0 0 8px ${ACCENT}`,
          flexShrink:0,
        }} />
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{
            fontSize:11, color:`${ACCENT}99`,
            letterSpacing:'0.2em', textTransform:'uppercase',
          }}>
            DECK 7 · MÍDIA
          </div>
          <div style={{
            fontSize: isMobile ? 18 : 22,
            fontWeight:700, color:'rgba(255,255,255,0.9)', lineHeight:1.2,
          }}>
            Press Kit
          </div>
        </div>

        {/* Open in Drive button */}
        <a
          href={DRIVE_URL}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            padding:'10px 20px',
            background:`linear-gradient(135deg, ${ACCENT}22, ${ACCENT}0d)`,
            border:`1px solid ${ACCENT}60`,
            borderRadius:5,
            color:ACCENT,
            fontFamily:"'JetBrains Mono', monospace",
            fontSize:11, fontWeight:700, letterSpacing:'0.12em',
            textDecoration:'none',
            boxShadow:`0 0 20px ${ACCENT}25`,
            display:'flex', alignItems:'center', gap:8,
            flexShrink:0,
            transition:'all 0.2s',
          }}
          onMouseEnter={e => e.currentTarget.style.boxShadow = `0 0 30px ${ACCENT}45`}
          onMouseLeave={e => e.currentTarget.style.boxShadow = `0 0 20px ${ACCENT}25`}
        >
          <span style={{ fontSize:14 }}>↗</span>
          {isMobile ? 'DRIVE' : 'ABRIR NO DRIVE'}
        </a>
      </div>

      {/* ── Drive iframe card ── */}
      <div style={{
        ...surface,
        borderTop:`2px solid ${ACCENT}`,
        overflow:'hidden',
      }}>
        {/* Window chrome bar */}
        <div style={{
          padding:'10px 16px',
          background:`${ACCENT}09`,
          borderBottom:'1px solid rgba(255,255,255,0.05)',
          display:'flex', alignItems:'center', justifyContent:'space-between',
        }}>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <span style={{ fontSize:16 }}>📁</span>
            <span style={{ fontSize:9, color:`${ACCENT}99`, letterSpacing:'0.2em', textTransform:'uppercase' }}>
              GOOGLE DRIVE · PRESS KIT DRUDS
            </span>
          </div>
          {/* macOS-style traffic lights */}
          <div style={{ display:'flex', gap:5 }}>
            {['#ff5f57','#ffbd2e','#28c840'].map((c,i) => (
              <span key={i} style={{ width:10, height:10, borderRadius:'50%', background:c, display:'block' }} />
            ))}
          </div>
        </div>

        {/* Loading state */}
        {!loaded && !failed && (
          <div style={{
            height: isMobile ? 300 : 500,
            display:'flex', flexDirection:'column',
            alignItems:'center', justifyContent:'center', gap:12,
            background:'#0d0e16',
          }}>
            <div style={{
              width:32, height:32, borderRadius:'50%',
              border:`2px solid ${ACCENT}30`,
              borderTop:`2px solid ${ACCENT}`,
              animation:'spin 1s linear infinite',
            }} />
            <span style={{ fontSize:10, color:'rgba(255,255,255,0.25)', letterSpacing:'0.15em' }}>
              CARREGANDO DRIVE…
            </span>
          </div>
        )}

        {/* Failed state */}
        {failed && (
          <div style={{
            height: isMobile ? 260 : 400,
            display:'flex', flexDirection:'column',
            alignItems:'center', justifyContent:'center', gap:16,
            background:'#0d0e16', padding:24,
          }}>
            <div style={{ fontSize:36 }}>📂</div>
            <div style={{
              fontFamily:"'JetBrains Mono', monospace",
              fontSize:12, color:'rgba(255,255,255,0.5)',
              textAlign:'center', lineHeight:1.6,
            }}>
              O Google Drive não pôde ser incorporado aqui.<br/>
              <span style={{ color:'rgba(255,255,255,0.25)', fontSize:10 }}>
                Pode ser necessário estar logado no Google.
              </span>
            </div>
            <a
              href={DRIVE_URL}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                padding:'12px 28px',
                background:`linear-gradient(135deg, ${ACCENT}22, ${ACCENT}0d)`,
                border:`1px solid ${ACCENT}60`,
                borderRadius:5, textDecoration:'none',
                color:ACCENT, fontWeight:700, fontSize:12, letterSpacing:'0.12em',
              }}
            >
              ↗ ABRIR NO GOOGLE DRIVE
            </a>
          </div>
        )}

        {/* Iframe */}
        <iframe
          src={EMBED_URL}
          title="Press Kit — Google Drive"
          width="100%"
          height={isMobile ? 480 : 640}
          style={{
            display: loaded ? 'block' : 'none',
            border:'none',
            background:'#ffffff',
          }}
          onLoad={() => { setLoaded(true); setFailed(false); }}
          onError={() => { setFailed(true); setLoaded(false); }}
          sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
          allow="autoplay"
        />
      </div>

      {/* ── Footer note ── */}
      <div style={{
        marginTop:10,
        fontSize:9, color:'rgba(255,255,255,0.18)',
        letterSpacing:'0.1em', textAlign:'right',
      }}>
        Arquivos hospedados no Google Drive · use "ABRIR NO DRIVE" para gerenciar
      </div>

      {/* CSS for spinner */}
      <style>{`@keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }`}</style>
    </div>
  );
}

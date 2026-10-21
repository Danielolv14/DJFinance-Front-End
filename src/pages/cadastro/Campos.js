/* Campos do formulário de cadastro no estilo de equipamento. ACCENT é a cor da aba Cadastrar. */
import { superficie, COR_ABA } from '../../utils/tema';

/* ─── design tokens ─── */
export const ACCENT = COR_ABA.cadastro;

/* ─── sub-components ─── */
export function SectionPanel({ color, label, icon, children }) {
  return (
    <div style={{ ...superficie, padding: '20px 24px', borderTop: `2px solid ${color}` }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
        <span style={{
          width: 7, height: 7, borderRadius: '50%', background: color,
          boxShadow: `0 0 6px ${color}`, flexShrink: 0,
        }} />
        <div>
          <div style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 9, color: `${color}cc`, letterSpacing: '0.2em', textTransform: 'uppercase',
          }}>
            {icon} {label}
          </div>
        </div>
      </div>
      {children}
    </div>
  );
}

export function Field({ label, required, error, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      <label style={{
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 9, color: error ? '#ff453a' : 'rgba(255,255,255,0.3)',
        letterSpacing: '0.15em', textTransform: 'uppercase',
      }}>
        {label}{required && <span style={{ color: '#ff453a', marginLeft: 3 }}>*</span>}
      </label>
      {children}
      {error && (
        <span style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 9, color: '#ff453a', letterSpacing: '0.08em',
        }}>
          {error}
        </span>
      )}
    </div>
  );
}

export const inputStyle = (error) => ({
  background: '#0d0e14',
  border: `1px solid ${error ? '#ff453a60' : 'rgba(255,255,255,0.08)'}`,
  borderRadius: 4,
  color: 'rgba(255,255,255,0.88)',
  fontFamily: "'JetBrains Mono', monospace",
  fontSize: 12,
  padding: '10px 12px',
  outline: 'none',
  width: '100%',
  boxSizing: 'border-box',
  transition: 'border-color 0.15s',
});

export function HwInput({ name, value, onChange, type = 'text', placeholder, error, readOnly, min, step }) {
  return (
    <input
      name={name} value={value} onChange={onChange}
      type={type} placeholder={placeholder} readOnly={readOnly}
      min={min} step={step}
      style={inputStyle(error)}
      onFocus={e => { if (!error) e.target.style.borderColor = `${ACCENT}50`; }}
      onBlur={e => { if (!error) e.target.style.borderColor = 'rgba(255,255,255,0.08)'; }}
    />
  );
}

export function HwSelect({ name, value, onChange, children, error }) {
  return (
    <select
      name={name} value={value} onChange={onChange}
      style={{
        ...inputStyle(error),
        cursor: 'pointer',
        appearance: 'none',
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='rgba(255,255,255,0.2)'/%3E%3C/svg%3E")`,
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'right 10px center',
        paddingRight: 28,
      }}
    >
      {children}
    </select>
  );
}

export function HwTextarea({ name, value, onChange, placeholder, rows = 3 }) {
  return (
    <textarea
      name={name} value={value} onChange={onChange}
      placeholder={placeholder} rows={rows}
      style={{
        ...inputStyle(false),
        resize: 'vertical',
        lineHeight: 1.5,
      }}
      onFocus={e => e.target.style.borderColor = `${ACCENT}50`}
      onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
    />
  );
}

export function ToggleCard({ name, checked, onChange, label, sub, color = ACCENT }) {
  return (
    <label style={{
      display: 'flex', alignItems: 'center', gap: 14,
      padding: '14px 16px',
      background: checked ? `${color}0d` : 'rgba(255,255,255,0.02)',
      border: `1px solid ${checked ? color + '35' : 'rgba(255,255,255,0.06)'}`,
      borderRadius: 6, cursor: 'pointer', transition: 'all 0.15s',
    }}>
      <input type="checkbox" name={name} checked={checked} onChange={onChange} style={{ display: 'none' }} />

      {/* Toggle track */}
      <div style={{
        width: 36, height: 20, borderRadius: 10, flexShrink: 0,
        background: checked ? color : 'rgba(255,255,255,0.08)',
        border: `1px solid ${checked ? color : 'rgba(255,255,255,0.1)'}`,
        position: 'relative', transition: 'all 0.2s',
        boxShadow: checked ? `0 0 10px ${color}50` : 'none',
      }}>
        <div style={{
          position: 'absolute', top: 2,
          left: checked ? 18 : 2,
          width: 14, height: 14, borderRadius: '50%',
          background: checked ? '#fff' : 'rgba(255,255,255,0.3)',
          transition: 'left 0.2s',
        }} />
      </div>

      <div>
        <div style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 11, fontWeight: 700, color: checked ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.5)',
          letterSpacing: '0.06em',
        }}>
          {label}
        </div>
        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>
          {sub}
        </div>
      </div>
    </label>
  );
}

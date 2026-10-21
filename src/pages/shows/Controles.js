/* Botão, campo e seletor no estilo de equipamento usados na tela de Shows. */
export function HwButton({ active, color, onClick, children, small }) {
  return (
    <button
      onClick={onClick}
      style={{
        position: 'relative',
        padding: small ? '6px 12px' : '8px 16px',
        background: active
          ? `linear-gradient(180deg, ${color}22, ${color}0d)`
          : 'linear-gradient(180deg, #1e1f28, #17181f)',
        border: `1px solid ${active ? color + '40' : 'rgba(255,255,255,0.07)'}`,
        borderRadius: 4,
        color: active ? color : 'rgba(255,255,255,0.45)',
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        cursor: 'pointer',
        transition: 'all 0.15s',
        boxShadow: active ? `0 0 12px ${color}25, inset 0 0 8px ${color}10` : '0 2px 6px rgba(0,0,0,0.4)',
        overflow: 'hidden',
      }}
    >
      {/* LED strip */}
      <span style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 2,
        background: active ? color : 'transparent',
        boxShadow: active ? `0 0 6px ${color}` : 'none',
        borderRadius: '4px 4px 0 0',
        transition: 'all 0.15s',
      }} />
      {children}
    </button>
  );
}

export function HwInput({ value, onChange, placeholder, style }) {
  return (
    <input
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      style={{
        background: '#0d0e14',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 4,
        color: 'rgba(255,255,255,0.85)',
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 12,
        padding: '8px 12px',
        outline: 'none',
        transition: 'border-color 0.15s',
        ...style,
      }}
      onFocus={e => e.target.style.borderColor = 'rgba(154,126,248,0.5)'}
      onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
    />
  );
}

export function HwSelect({ value, onChange, children, style }) {
  return (
    <select
      value={value}
      onChange={onChange}
      style={{
        background: '#0d0e14',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 4,
        color: 'rgba(255,255,255,0.75)',
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 11,
        padding: '8px 10px',
        outline: 'none',
        cursor: 'pointer',
        ...style,
      }}
    >
      {children}
    </select>
  );
}

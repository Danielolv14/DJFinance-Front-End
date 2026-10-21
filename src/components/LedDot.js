/** Bolinha luminosa de status (estilo LED de equipamento). */
export default function LedDot({ color = '#3dd457', pulse = false, size = 8, brilho = 10 }) {
  return (
    <span style={{
      display: 'inline-block', width: size, height: size,
      borderRadius: '50%', background: color, flexShrink: 0,
      boxShadow: `0 0 6px ${color}, 0 0 ${brilho}px ${color}60`,
      animation: pulse ? 'ledPulse 1.2s ease-in-out infinite' : 'none',
    }} />
  );
}

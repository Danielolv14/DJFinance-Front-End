// components/SectionHeader.js
// Cabeçalho visual de cada seção do formulário

export default function SectionHeader({ icon, title, subtitle }) {
  return (
    <div className="section-header">
      <div className="section-icon">{icon}</div>
      <div>
        <div className="section-title">{title}</div>
        {subtitle && <div className="section-subtitle">{subtitle}</div>}
      </div>
    </div>
  );
}

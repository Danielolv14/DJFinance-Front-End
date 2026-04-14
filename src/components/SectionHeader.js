export default function SectionHeader({ icon, title, subtitle }) {
  return (
    <div className="section-header">
      <div className="section-header-icon">{icon}</div>
      <div className="section-header-text">
        <div className="section-title">{title}</div>
        {subtitle && <div className="section-subtitle">{subtitle}</div>}
      </div>
    </div>
  );
}

// components/FormField.js
// Componente reutilizável para qualquer campo do formulário.
// Recebe label, o input como children, e mostra erro se houver.

export default function FormField({ label, required, error, children }) {
  return (
    <div className="form-group">
      <label>
        {label}
        {required && <span className="required">*</span>}
      </label>
      {children}
      {error && <span className="field-error">{error}</span>}
    </div>
  );
}

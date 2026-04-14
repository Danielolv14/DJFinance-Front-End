export default function FormField({ label, required, error, children }) {
  return (
    <div className="form-field">
      <label className="form-field-label">
        {label}
        {required && <span className="required-star">*</span>}
      </label>
      {children}
      {error && <span className="form-field-error">{error}</span>}
    </div>
  );
}

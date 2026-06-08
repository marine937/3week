export default function FormInput({
  label,
  name,
  type = 'text',
  value,
  onChange,
  error,
  placeholder,
  required,
  as: Component = 'input',
  children,
  ...props
}) {
  return (
    <div className="mb-4">
      {label && (
        <label htmlFor={name} className="label">
          {label}
          {required && <span className="text-red-500"> *</span>}
        </label>
      )}
      <Component
        id={name}
        name={name}
        type={Component === 'input' ? type : undefined}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`input ${error ? 'input-error' : ''}`}
        {...props}
      >
        {children}
      </Component>
      {error && <p className="error-text">{error}</p>}
    </div>
  );
}

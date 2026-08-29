interface FormFieldProps {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  autoComplete?: string;
  placeholder?: string;
}

export function FormField({
  label,
  name,
  type = "text",
  required = true,
  autoComplete,
  placeholder,
}: FormFieldProps) {
  return (
    <div className="flex flex-col gap-1">
      <label
        htmlFor={name}
        className="text-xs font-medium text-ink/70"
      >
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        required={required}
        autoComplete={autoComplete}
        placeholder={placeholder}
        className="rounded-md border border-border px-3 py-2 text-sm text-ink placeholder:text-ink/30 focus:border-maroon focus:outline-none focus:ring-1 focus:ring-gold"
      />
    </div>
  );
}

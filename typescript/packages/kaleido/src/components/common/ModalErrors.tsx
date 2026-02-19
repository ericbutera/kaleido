interface ModalErrorsProps {
  errors: string[];
  className?: string;
}

export default function ModalErrors({
  errors,
  className = "",
}: ModalErrorsProps) {
  if (!Array.isArray(errors) || errors.length === 0) return null;

  return (
    <div className={`alert alert-error mb-4 ${className}`.trim()}>
      <ul className="list-disc list-inside">
        {errors.map((err, i) => (
          <li key={i}>{err}</li>
        ))}
      </ul>
    </div>
  );
}

interface StatusMessageProps {
  error?: string | null;
  success?: string | null;
}

export function StatusMessage({ error, success }: StatusMessageProps) {
  if (error) {
    return (
      <p className="notice notice--error" role="alert">
        {error}
      </p>
    );
  }
  if (success) {
    return (
      <p className="notice notice--success" role="status">
        {success}
      </p>
    );
  }
  return null;
}

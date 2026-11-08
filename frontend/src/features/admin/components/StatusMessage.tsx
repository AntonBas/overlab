interface StatusMessageProps {
  error?: string | null;
}

export function StatusMessage({ error }: StatusMessageProps) {
  if (!error) {
    return null;
  }
  return (
    <p className="notice notice--error" role="alert">
      {error}
    </p>
  );
}

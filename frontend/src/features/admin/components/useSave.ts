import { useCallback, useState } from "react";
import { toFailure } from "../../../services/api";

export interface SaveState {
  saving: boolean;
  error: string | null;
  fieldErrors: Record<string, string>;
  success: string | null;
  run: (
    action: () => Promise<unknown>,
    successMessage: string,
  ) => Promise<boolean>;
  reset: () => void;
}

export function useSave(): SaveState {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState<string | null>(null);

  const reset = useCallback(() => {
    setError(null);
    setFieldErrors({});
    setSuccess(null);
  }, []);

  const run = useCallback(
    async (action: () => Promise<unknown>, successMessage: string) => {
      setSaving(true);
      setError(null);
      setFieldErrors({});
      setSuccess(null);
      try {
        await action();
        setSuccess(successMessage);
        return true;
      } catch (failure) {
        const result = toFailure(failure);
        setFieldErrors(result.fieldErrors);
        setError(
          Object.keys(result.fieldErrors).length > 0
            ? "Fix the highlighted fields and try again."
            : result.message,
        );
        return false;
      } finally {
        setSaving(false);
      }
    },
    [],
  );

  return { saving, error, fieldErrors, success, run, reset };
}

import { FormError } from "../../../components/ui/FormError";
import { useState, type FormEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { FormField } from "../../../components/ui/FormField";
import { usePageTitle } from "../../../hooks/usePageTitle";
import { useNoIndex } from "../../../hooks/useNoIndex";
import { toFailure } from "../../../services/api";
import { resetPassword } from "../api/authApi";
import { AuthLayout } from "./AuthLayout";

export function ResetPasswordPage() {
  usePageTitle("Set a new password");
  useNoIndex();
  const [params] = useSearchParams();
  const token = params.get("token") ?? "";
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await resetPassword(token, password);
      setDone(true);
    } catch (failure) {
      const result = toFailure(failure);
      setError(
        result.status === 400 && !result.fieldErrors.password
          ? "This link is invalid or has expired. Request a new one."
          : (result.fieldErrors.password ?? result.message),
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <AuthLayout title="Password changed">
        <p>
          Your password was changed.{" "}
          <Link className="auth-link" to="/login">
            Sign in
          </Link>{" "}
          with the new one.
        </p>
      </AuthLayout>
    );
  }

  if (!token) {
    return (
      <AuthLayout title="Link is incomplete">
        <p>
          This page needs the link from your email.{" "}
          <Link className="auth-link" to="/forgot-password">
            Request a new link
          </Link>
        </p>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Set a new password">
      <form onSubmit={submit} className="form">
        <FormField
          label="New password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          maxLength={72}
          hint="At least 8 characters, at most 72 bytes (letters outside A-Z take 2 bytes)"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
        {error && (
          <FormError>
            {error}{" "}
            <Link className="auth-link" to="/forgot-password">
              Request a new link
            </Link>
          </FormError>
        )}
        <button type="submit" className="button" disabled={submitting}>
          Change password
        </button>
      </form>
    </AuthLayout>
  );
}

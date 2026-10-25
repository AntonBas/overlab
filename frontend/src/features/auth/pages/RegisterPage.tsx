import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { FormField } from "../../../components/ui/FormField";
import { usePageTitle } from "../../../hooks/usePageTitle";
import { toFailure } from "../../../services/api";
import { register } from "../api/authApi";
import { AuthLayout } from "./AuthLayout";

export function RegisterPage() {
  usePageTitle("Create account");
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    setFieldErrors({});
    try {
      await register({ displayName, email, password });
      setDone(true);
    } catch (failure) {
      const result = toFailure(failure);
      setFieldErrors(result.fieldErrors);
      setError(
        Object.keys(result.fieldErrors).length > 0 ? null : result.message,
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <AuthLayout title="Check your email">
        <p>
          We sent a confirmation link to <strong>{email}</strong>. Open it to
          activate your account, then <Link to="/login">sign in</Link>.
        </p>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Create account">
      <form onSubmit={submit} className="form">
        <FormField
          label="Display name"
          name="displayName"
          autoComplete="nickname"
          required
          minLength={2}
          maxLength={64}
          value={displayName}
          error={fieldErrors.displayName}
          onChange={(event) => setDisplayName(event.target.value)}
        />
        <FormField
          label="Email"
          name="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          error={fieldErrors.email}
          onChange={(event) => setEmail(event.target.value)}
        />
        <FormField
          label="Password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          maxLength={72}
          hint="At least 8 characters"
          value={password}
          error={fieldErrors.password}
          onChange={(event) => setPassword(event.target.value)}
        />
        {error && (
          <p className="form__error" role="alert">
            {error}
          </p>
        )}
        <button type="submit" className="button" disabled={submitting}>
          {submitting ? "Creating..." : "Create account"}
        </button>
      </form>
      <p className="muted">
        Already registered? <Link to="/login">Sign in</Link>
      </p>
    </AuthLayout>
  );
}

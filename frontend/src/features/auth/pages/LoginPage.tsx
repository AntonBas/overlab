import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FormField } from "../../../components/ui/FormField";
import { usePageTitle } from "../../../hooks/usePageTitle";
import { toFailure } from "../../../services/api";
import { resendVerification } from "../api/authApi";
import { useAuth } from "../context/useAuth";
import { AuthLayout } from "./AuthLayout";

export function LoginPage() {
  usePageTitle("Sign in");
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [unverified, setUnverified] = useState(false);
  const [info, setInfo] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    setUnverified(false);
    try {
      await signIn(email, password);
      navigate("/");
    } catch (failure) {
      const result = toFailure(failure);
      if (result.status === 403) {
        setUnverified(true);
      }
      setError(
        result.status === 429
          ? "Too many attempts. Wait a minute and try again."
          : result.message,
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function resend() {
    try {
      await resendVerification(email);
      setInfo("If the account exists, a new confirmation email is on its way.");
    } catch {
      setInfo("Could not send the email right now. Try again later.");
    }
  }

  return (
    <AuthLayout title="Sign in">
      <form onSubmit={submit} className="form">
        <FormField
          label="Email"
          name="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
        <FormField
          label="Password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
        {error && (
          <p className="form__error" role="alert">
            {error}
          </p>
        )}
        {unverified && (
          <button
            type="button"
            className="button button--ghost"
            onClick={resend}
          >
            Send the confirmation email again
          </button>
        )}
        {info && <p className="notice">{info}</p>}
        <button type="submit" className="button" disabled={submitting}>
          {submitting ? "Signing in..." : "Sign in"}
        </button>
      </form>
      <a className="button button--ghost" href="/oauth2/authorization/google">
        Continue with Google
      </a>
      <p className="muted">
        <Link to="/forgot-password">Forgot your password?</Link>
      </p>
      <p className="muted">
        No account yet? <Link to="/register">Create one</Link>
      </p>
    </AuthLayout>
  );
}

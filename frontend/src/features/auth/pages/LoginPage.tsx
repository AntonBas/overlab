import { useState, type FormEvent } from "react";
import {
  Link,
  useLocation,
  useNavigate,
  useSearchParams,
} from "react-router-dom";
import { FormField } from "../../../components/ui/FormField";
import { usePageTitle } from "../../../hooks/usePageTitle";
import { useNoIndex } from "../../../hooks/useNoIndex";
import { toFailure } from "../../../services/api";
import { resendVerification } from "../api/authApi";
import { useAuth } from "../context/useAuth";
import { AuthLayout } from "./AuthLayout";

const OAUTH_ERRORS: Record<string, string> = {
  email_in_use:
    "This email is already registered with a password. Sign in with your email and password.",
  oauth: "Google sign-in failed. Try again.",
};

export function LoginPage() {
  usePageTitle("Sign in");
  useNoIndex();
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const returnTo = (location.state as { from?: string } | null)?.from ?? "/";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [searchParams] = useSearchParams();
  const [error, setError] = useState<string | null>(
    OAUTH_ERRORS[searchParams.get("error") ?? ""] ?? null,
  );
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
      navigate(returnTo, { replace: true });
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
        <Link className="auth-link auth-link--aside" to="/forgot-password">
          Forgot your password?
        </Link>
        {error && !unverified && (
          <p className="form__error" role="alert">
            {error}
          </p>
        )}
        {unverified && (
          <div className="auth-alert" role="alert">
            <p>
              Your email is not verified yet. Check your inbox for the
              confirmation link.
            </p>
            <button
              type="button"
              className="link-button auth-alert__action"
              onClick={resend}
            >
              Send the confirmation email again
            </button>
          </div>
        )}
        {info && <p className="notice">{info}</p>}
        <button type="submit" className="button" disabled={submitting}>
          {submitting ? "Signing in..." : "Sign in"}
        </button>
      </form>
      <div className="auth-card__divider">or</div>
      <a className="button button--ghost" href="/oauth2/authorization/google">
        Continue with Google
      </a>
      <p className="auth-card__switch">
        No account yet?{" "}
        <Link className="auth-link" to="/register">
          Create one
        </Link>
      </p>
    </AuthLayout>
  );
}

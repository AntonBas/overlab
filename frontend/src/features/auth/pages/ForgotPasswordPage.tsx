import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { FormField } from "../../../components/ui/FormField";
import { usePageTitle } from "../../../hooks/usePageTitle";
import { forgotPassword } from "../api/authApi";
import { AuthLayout } from "./AuthLayout";
import "../auth.css";

export function ForgotPasswordPage() {
  usePageTitle("Reset password");
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    try {
      await forgotPassword(email);
    } finally {
      setSent(true);
      setSubmitting(false);
    }
  }

  if (sent) {
    return (
      <AuthLayout title="Check your email">
        <p>
          If an account exists for <strong>{email}</strong>, an email with
          instructions is on its way: a link to set a new password, or a
          reminder to use Google sign-in.
        </p>
        <p className="muted">Nothing in your inbox? Check the spam folder.</p>
        <p className="auth-card__switch">
          <Link className="auth-link" to="/login">
            Back to sign in
          </Link>
        </p>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Reset password">
      <p className="muted">
        Enter your email and we will send a link to set a new password.
      </p>
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
        <button type="submit" className="button" disabled={submitting}>
          Send the link
        </button>
      </form>
      <p className="auth-card__switch">
        <Link className="auth-link" to="/login">
          Back to sign in
        </Link>
      </p>
    </AuthLayout>
  );
}

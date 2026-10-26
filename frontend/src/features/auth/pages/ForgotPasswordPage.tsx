import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { FormField } from "../../../components/ui/FormField";
import { usePageTitle } from "../../../hooks/usePageTitle";
import { forgotPassword } from "../api/authApi";
import { AuthLayout } from "./AuthLayout";

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
        <Link to="/login">Back to sign in</Link>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Reset password">
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
    </AuthLayout>
  );
}

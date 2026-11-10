import { Link, useSearchParams } from "react-router-dom";
import { Spinner } from "../../../components/ui/Spinner";
import { useFetch } from "../../../hooks/useFetch";
import { usePageTitle } from "../../../hooks/usePageTitle";
import { useNoIndex } from "../../../hooks/useNoIndex";
import { verifyEmail } from "../api/authApi";
import { AuthLayout } from "./AuthLayout";

export function VerifyEmailPage() {
  usePageTitle("Confirm email");
  useNoIndex();
  const [params] = useSearchParams();
  const token = params.get("token") ?? "";
  const result = useFetch(async () => {
    if (!token) {
      throw new Error("The confirmation link is incomplete.");
    }
    await verifyEmail(token);
    return true;
  }, [token]);

  return (
    <AuthLayout title="Confirm email">
      {result.loading && <Spinner label="Confirming" />}
      {result.data && (
        <p>
          Your email is confirmed. You can now <Link to="/login">sign in</Link>.
        </p>
      )}
      {result.error && (
        <p className="form__error" role="alert">
          This confirmation link is invalid or has expired.{" "}
          <Link to="/login">Sign in</Link> to request a new one.
        </p>
      )}
    </AuthLayout>
  );
}

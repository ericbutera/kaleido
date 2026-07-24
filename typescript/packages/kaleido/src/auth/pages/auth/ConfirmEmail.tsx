import { faEnvelope } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Link, useLocation } from "react-router-dom";
import Layout from "../../components/auth/Layout";
import SsoOnlyNotice from "../../components/SsoOnlyNotice";
import { useAuthConfig } from "../../lib/AuthContext";

export default function ConfirmEmail() {
  const { passwordAuthEnabled, registrationEnabled } = useAuthConfig();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const forwardedEmail = ((location.state as { email?: string } | null)
    ?.email ??
    searchParams.get("email") ??
    "") as string;

  if (!passwordAuthEnabled || !registrationEnabled) {
    return (
      <SsoOnlyNotice
        title="Check Your Account"
        message="Email verification is managed by SSO."
      />
    );
  }

  return (
    <Layout>
      <h2 className="card-title text-2xl mb-4">
        <FontAwesomeIcon icon={faEnvelope} className="text-primary mr-2" />
        Check Your Email
      </h2>
      <p className="mb-4">
        We sent a verification link
        {forwardedEmail ? ` to ${forwardedEmail}` : ""}. Open it to finish
        creating your account.
      </p>
      <div className="join w-full justify-center">
        <Link className="btn join-item" to="/login">
          Sign In
        </Link>
        <Link
          className="btn join-item"
          to={
            forwardedEmail
              ? `/resend-confirmation?email=${encodeURIComponent(forwardedEmail)}`
              : "/resend-confirmation"
          }
        >
          Resend
        </Link>
      </div>
    </Layout>
  );
}

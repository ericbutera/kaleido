import { faEnvelope } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Link, useLocation } from "react-router-dom";
import Layout from "../../components/auth/Layout";

export default function ConfirmEmail() {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const forwardedEmail = ((location.state as { email?: string } | null)
    ?.email ??
    searchParams.get("email") ??
    "") as string;

  return (
    <Layout>
      <h2 className="card-title text-2xl mb-4">
        <FontAwesomeIcon icon={faEnvelope} />
        Check Your Email
      </h2>

      <div className="mt-4 text-sm text-center">
        {forwardedEmail ? (
          <p>
            We&apos;ve sent a confirmation link to{" "}
            <strong>{forwardedEmail}</strong>.
          </p>
        ) : (
          <p>
            If your registration succeeded, we&apos;ve sent a confirmation link
            to your email address.
          </p>
        )}
        <p className="mt-2">
          Click the link in the email to activate your account.
        </p>
      </div>

      <div className="divider" />

      <div className="join w-full justify-center">
        <Link
          to={
            forwardedEmail
              ? `/resend-confirmation?email=${encodeURIComponent(forwardedEmail)}`
              : "/resend-confirmation"
          }
          state={forwardedEmail ? { email: forwardedEmail } : null}
          className="btn join-item"
          title="Didn't receive the email?"
        >
          Resend Confirmation
        </Link>

        <Link to="/" className="btn join-item">
          Home
        </Link>
      </div>
    </Layout>
  );
}

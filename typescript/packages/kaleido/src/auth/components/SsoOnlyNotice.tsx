import { Link } from "react-router-dom";
import Layout from "./auth/Layout";
import OAuthProviderControls from "./OAuthProviderControls";

export default function SsoOnlyNotice({
  title = "Sign in",
  message = "Account access is managed by SSO.",
  buttonText = "Continue with SSO",
}: {
  title?: string;
  message?: string;
  buttonText?: string;
}) {
  return (
    <Layout>
      <div className="text-center">
        <h2 className="text-3xl font-bold mb-2">{title}</h2>
        <p className="text-base-content/70 mb-6">{message}</p>
      </div>

      <OAuthProviderControls
        text={buttonText}
        unavailable={
          <div role="alert" className="alert alert-warning alert-soft">
            <span>SSO is not configured for this app.</span>
          </div>
        }
      />

      <div className="divider" />

      <div className="join w-full justify-center">
        <Link className="btn join-item" to="/">
          Home
        </Link>
        <Link className="btn join-item" to="/login">
          Sign in
        </Link>
      </div>
    </Layout>
  );
}

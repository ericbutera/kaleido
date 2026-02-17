import Layout from "@/components/auth/Layout";
import { faSpinner } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTokenRefresh } from "../../lib/queries";

export default function OAuthCallback() {
  // TODO: signup-layout (small card centered on page)
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const refresh = useTokenRefresh();

  useEffect(() => {
    // After backend redirects here, the refresh token is stored as an HttpOnly cookie.
    // Call the refresh endpoint (no body) to obtain a fresh access token and then populate app state.
    const handleCallback = async () => {
      try {
        // TODO: i believe this is broken after the react query refactor, needs retesting
        await refresh.mutateAsync();
      } catch (err) {
        console.error("OAuth callback error (refresh):", err);
        setError(
          err instanceof Error
            ? err.message
            : "Failed to complete authentication"
        );
        setLoading(false);
        setTimeout(() => navigate("/login"), 3000);
      }
    };

    handleCallback();
  }, [navigate, refresh]);

  return (
    <Layout>
      {error && (
        <>
          <div className="text-error mb-4">
            <FontAwesomeIcon icon={faSpinner} className="text-4xl" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Authentication Failed</h2>
          <p className="text-neutral-content-600 mb-4">{error}</p>
          <p className="text-sm text-neutral-content-500">
            Redirecting to login
          </p>
        </>
      )}

      {loading && (
        <>
          <div className="text-primary mb-4">
            <FontAwesomeIcon
              icon={faSpinner}
              className="text-4xl animate-spin"
            />
          </div>
          <h2 className="text-2xl font-bold mb-2">Completing Sign In</h2>
          <p className="text-neutral-content-600">
            Please wait while we authenticate with Google...
          </p>
        </>
      )}
    </Layout>
  );
}

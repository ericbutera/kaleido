import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useNavigate, useSearchParams } from "react-router-dom";
import Layout from "../../components/auth/Layout";
import SsoOnlyNotice from "../../components/SsoOnlyNotice";
import { useAuthApi, useAuthConfig } from "../../lib/AuthContext";

export default function Verify() {
  const { passwordAuthEnabled } = useAuthConfig();

  if (!passwordAuthEnabled) {
    return (
      <SsoOnlyNotice
        title="Verify Email"
        message="Email verification is managed by SSO."
      />
    );
  }

  return <VerifyToken />;
}

function VerifyToken() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const { useVerifyEmail } = useAuthApi();
  const verify = useVerifyEmail();
  const token = searchParams.get("token");

  const onVerify = async () => {
    if (!token) {
      setError("Missing verification token");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await verify.mutateAsync(token);
      setDone(true);
      toast.success("Email verified");
    } catch (err) {
      setError("Verification failed");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) onVerify();
  }, [token]);

  return (
    <Layout>
      <h2 className="text-2xl font-bold mb-4">Verify Email</h2>
      {error && <div className="alert alert-error mb-4">{error}</div>}
      {done ? (
        <button className="btn btn-primary" onClick={() => navigate("/login")}>
          Sign In
        </button>
      ) : (
        <button
          className="btn btn-primary"
          disabled={loading}
          onClick={onVerify}
        >
          {loading ? "Verifying..." : "Verify"}
        </button>
      )}
      {!token && (
        <button
          className="btn btn-ghost mt-2"
          onClick={() => navigate("/resend-confirmation")}
        >
          Resend confirmation
        </button>
      )}
    </Layout>
  );
}

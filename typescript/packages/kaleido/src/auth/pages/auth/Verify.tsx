import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useNavigate, useSearchParams } from "react-router-dom";
import Layout from "../../components/auth/Layout";
import { useAuthApi } from "../../lib/AuthContext";

export default function Verify() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showResend, setShowResend] = useState(false);
  const { useVerifyEmail } = useAuthApi();
  const verify = useVerifyEmail();

  const token = searchParams.get("token");

  const onVerify = async () => {
    if (!token) {
      setErrorMsg("No token provided.");
      return;
    }
    setLoading(true);
    try {
      await verify.mutateAsync(token);
      toast.success("Email verified! You can now log in.");
      navigate("/login");
    } catch (e) {
      const data = (e as any)?.response?.data;
      const msg =
        data?.error ||
        data?.message ||
        (e as any)?.message ||
        "Verification failed.";
      const normalized = String(msg).toLowerCase();
      // If token is invalid/expired, offer a resend flow
      if (normalized.includes("invalid") || normalized.includes("expired")) {
        setShowResend(true);
      }
      setErrorMsg(String(msg));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) onVerify();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  return (
    <Layout>
      <h2 className="text-2xl font-bold mb-4">Verify Email</h2>
      <div className="flex flex-col items-center gap-4">
        <button
          className="btn btn-primary"
          onClick={onVerify}
          disabled={loading || showResend}
        >
          {loading ? "Verifying…" : "Verify"}
        </button>

        {errorMsg && (
          <div className="text-sm text-center text-error mt-2">{errorMsg}</div>
        )}

        {showResend && (
          <div className="mt-2 flex flex-col items-center gap-2">
            <p className="text-sm mb-2">
              Token is invalid or expired. Request a new confirmation email.
            </p>
            <button
              className="btn btn-secondary"
              onClick={() => navigate("/resend-confirmation")}
            >
              Resend Confirmation
            </button>
          </div>
        )}
      </div>
    </Layout>
  );
}

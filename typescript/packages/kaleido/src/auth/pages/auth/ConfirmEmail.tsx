import { useNavigate, useSearchParams } from "react-router-dom";
import Layout from "../../components/auth/Layout";
import { useAuthApi } from "../../lib/AuthContext";

export default function ConfirmEmail() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { useVerifyEmail } = useAuthApi();
  const verify = useVerifyEmail();

  const token = searchParams.get("token");

  const onVerify = async () => {
    try {
      if (token) await verify.mutateAsync(token);
      navigate("/");
    } catch (e) {
      // ignore for now
    }
  };

  return (
    <Layout>
      <h2 className="text-2xl font-bold mb-4">Confirm Email</h2>
      <p className="mb-4">Click the button to confirm your email address.</p>
      <div className="join">
        <button className="btn btn-primary" onClick={onVerify}>
          Confirm
        </button>
      </div>
    </Layout>
  );
}

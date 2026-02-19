import { useNavigate, useSearchParams } from "react-router-dom";
import Layout from "../../components/auth/Layout";
import { useAuthApi } from "../../lib/AuthContext";

export default function Verify() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { useVerifyEmail } = useAuthApi();
  const verify = useVerifyEmail();

  const token = searchParams.get("token");

  const onVerify = async () => {
    try {
      if (token) await verify.mutateAsync(token);
      navigate("/");
    } catch (e) {}
  };

  return (
    <Layout>
      <h2 className="text-2xl font-bold mb-4">Verify Email</h2>
      <button className="btn btn-primary" onClick={onVerify}>
        Verify
      </button>
    </Layout>
  );
}

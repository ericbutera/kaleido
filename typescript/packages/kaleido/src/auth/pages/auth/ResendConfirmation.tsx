import { useForm } from "react-hook-form";
import { useLocation, useNavigate } from "react-router-dom";
import Layout from "../../components/auth/Layout";
import SsoOnlyNotice from "../../components/SsoOnlyNotice";
import { useAuthApi, useAuthConfig } from "../../lib/AuthContext";

export default function ResendConfirmation() {
  const { passwordAuthEnabled } = useAuthConfig();

  if (!passwordAuthEnabled) {
    return (
      <SsoOnlyNotice
        title="Verify Email"
        message="Email verification is managed by SSO."
      />
    );
  }

  return <ResendConfirmationForm />;
}

function ResendConfirmationForm() {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const forwardedEmail = ((location.state as { email?: string } | null)
    ?.email ??
    searchParams.get("email") ??
    "") as string;
  const { register, handleSubmit, setError } = useForm<{ email: string }>({
    defaultValues: { email: forwardedEmail },
  });
  const navigate = useNavigate();
  const { useResendConfirmationEmail } = useAuthApi();
  const resend = useResendConfirmationEmail();

  const onSubmit = async (data: { email: string }) => {
    try {
      await resend.mutateAsync(data, setError);
      navigate(`/confirm-email?email=${encodeURIComponent(data.email)}`);
    } catch (e) {}
  };

  return (
    <Layout>
      <h2 className="text-2xl font-bold mb-4">Resend Confirmation</h2>
      <form onSubmit={handleSubmit(onSubmit)}>
        <label className="label">Email</label>
        <input
          className="input input-bordered w-full"
          {...register("email", {
            required: "Email is required",
          })}
        />
        <button className="btn btn-primary mt-4">Resend</button>
      </form>
    </Layout>
  );
}

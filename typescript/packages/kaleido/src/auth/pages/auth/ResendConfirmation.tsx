import { useForm } from "react-hook-form";
import { useLocation, useNavigate } from "react-router-dom";
import Layout from "../../components/auth/Layout";
import { useAuthApi } from "../../lib/AuthContext";

export default function ResendConfirmation() {
  const location = useLocation();
  const forwardedEmail = (location.state as any)?.email as string | undefined;

  const { register, handleSubmit } = useForm<{ email: string }>({
    defaultValues: { email: forwardedEmail ?? "" },
  });
  const { useResendConfirmationEmail } = useAuthApi();
  const resend = useResendConfirmationEmail();
  const navigate = useNavigate();

  const onSubmit = async (data: { email: string }) => {
    try {
      await resend.mutateAsync(data);
      navigate("/confirm-email", { state: { email: data.email } });
    } catch (e) {
      // ignore
    }
  };

  return (
    <Layout>
      <h2 className="text-2xl font-bold mb-4">Resend Confirmation</h2>
      <form onSubmit={handleSubmit(onSubmit)}>
        <label className="label">Email</label>
        <input
          type="email"
          className="input input-bordered w-full"
          {...register("email", { required: true })}
        />
        <button className="btn btn-primary mt-4">Resend</button>
      </form>
    </Layout>
  );
}

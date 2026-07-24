import { useForm } from "react-hook-form";
import Layout from "../../components/auth/Layout";
import SsoOnlyNotice from "../../components/SsoOnlyNotice";
import { useAuthApi, useAuthConfig } from "../../lib/AuthContext";

export default function ForgotPassword() {
  const { passwordAuthEnabled } = useAuthConfig();

  if (!passwordAuthEnabled) {
    return (
      <SsoOnlyNotice
        title="Account Recovery"
        message="Password recovery is managed by SSO."
      />
    );
  }

  return <ForgotPasswordForm />;
}

function ForgotPasswordForm() {
  const { register, handleSubmit } = useForm<{ email: string }>({
    defaultValues: { email: "" },
  });
  const { useForgotPassword } = useAuthApi();
  const forgot = useForgotPassword();

  const onSubmit = async (data: { email: string }) => {
    try {
      await forgot.mutateAsync(data.email);
    } catch (e) {
      // Preserve the previous no-enumeration UX.
    }
  };

  return (
    <Layout>
      <h2 className="text-2xl font-bold mb-4">Forgot Password</h2>
      <form onSubmit={handleSubmit(onSubmit)}>
        <label className="label">Email</label>
        <input
          className="input input-bordered w-full"
          {...register("email", { required: true })}
        />
        <button className="btn btn-primary mt-4">Send Reset</button>
      </form>
    </Layout>
  );
}

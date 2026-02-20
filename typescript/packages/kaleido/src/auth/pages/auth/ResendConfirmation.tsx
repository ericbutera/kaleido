import Layout from "@/auth/components/auth/Layout";
import { useAuthApi } from "@/auth/lib/AuthContext";
import { useForm } from "react-hook-form";

export default function ResendConfirmation() {
  const { register, handleSubmit } = useForm<{ email: string }>({
    defaultValues: { email: "" },
  });
  const { useResendConfirmationEmail } = useAuthApi();
  const resend = useResendConfirmationEmail();

  const onSubmit = async (data: { email: string }) => {
    try {
      await resend.mutateAsync(data);
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
          className="input input-bordered w-full"
          {...register("email", { required: true })}
        />
        <button className="btn btn-primary mt-4">Resend</button>
      </form>
    </Layout>
  );
}

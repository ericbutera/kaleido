import Layout from "@/auth/components/auth/Layout";
import { useAuthApi } from "@/auth/lib/AuthContext";
import { useForm } from "react-hook-form";

export default function ForgotPassword() {
  const { register, handleSubmit } = useForm<{ email: string }>({
    defaultValues: { email: "" },
  });
  const { useForgotPassword } = useAuthApi();
  const forgot = useForgotPassword();

  const onSubmit = async (data: { email: string }) => {
    try {
      await forgot.mutateAsync(data.email);
      // maybe show toast
    } catch (e) {
      // ignore
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

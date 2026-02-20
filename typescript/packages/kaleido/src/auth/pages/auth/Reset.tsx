import { useForm } from "react-hook-form";
import { useNavigate, useSearchParams } from "react-router-dom";
import Layout from "../../components/auth/Layout";
import { useAuthApi } from "../../lib/AuthContext";

export default function Reset() {
  const { register, handleSubmit } = useForm<{
    token: string;
    password: string;
  }>({ defaultValues: { token: "", password: "" } });
  const { useResetPassword } = useAuthApi();
  const reset = useResetPassword();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const tokenFromQuery = searchParams.get("token") || undefined;

  const onSubmit = async (data: { token: string; password: string }) => {
    try {
      await reset.mutateAsync(data);
      navigate("/");
    } catch (e) {}
  };

  return (
    <Layout>
      <h2 className="text-2xl font-bold mb-4">Reset Password</h2>
      <form onSubmit={handleSubmit(onSubmit)}>
        <input
          type="hidden"
          {...register("token")}
          defaultValue={tokenFromQuery}
        />
        <label className="label">New password</label>
        <input
          className="input input-bordered w-full"
          {...register("password", { required: true })}
        />
        <button className="btn btn-primary mt-4">Reset</button>
      </form>
    </Layout>
  );
}

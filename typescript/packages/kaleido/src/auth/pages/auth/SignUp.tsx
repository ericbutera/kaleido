import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import Layout from "../../components/auth/Layout";
import { useAuthApi } from "../../lib/AuthContext";
import { handleFormError } from "../../lib/form";

export default function SignUp() {
  const { register, handleSubmit, setError } = useForm<{
    email: string;
    password: string;
    name?: string;
  }>({ defaultValues: { email: "", password: "", name: "" } });
  const { useRegisterUser } = useAuthApi();
  const registerHook = useRegisterUser();
  const navigate = useNavigate();

  const onSubmit = async (data: {
    email: string;
    password: string;
    name?: string;
  }) => {
    try {
      await registerHook.mutateAsync(data, setError);
      navigate("/");
    } catch (err: any) {
      handleFormError(
        err?.response?.data ?? err,
        setError,
        "Failed to register",
      );
    }
  };

  return (
    <Layout>
      <h2 className="text-2xl font-bold mb-4">Create account</h2>
      <form onSubmit={handleSubmit(onSubmit)}>
        <label className="label">Name</label>
        <input className="input input-bordered w-full" {...register("name")} />
        <label className="label">Email</label>
        <input
          className="input input-bordered w-full"
          {...register("email", { required: true })}
        />
        <label className="label">Password</label>
        <input
          className="input input-bordered w-full"
          {...register("password", { required: true })}
        />
        <button className="btn btn-primary mt-4">Sign up</button>
      </form>
    </Layout>
  );
}

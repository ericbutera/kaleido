import { useEffect } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { useNavigate, useSearchParams } from "react-router-dom";
import Layout from "../../components/auth/Layout";
import { useAuthApi } from "../../lib/AuthContext";

export default function Verify() {
  // TODO: signup-layout (small card centered on page)
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { useVerifyEmail } = useAuthApi();
  const verify = useVerifyEmail();

  const tokenParam = searchParams.get("token") || "";

  type FormValues = { token: string };

  const {
    register,
    handleSubmit,
    setError,
    clearErrors,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ defaultValues: { token: tokenParam } });

  useEffect(() => {
    const token = searchParams.get("token");
    if (token) {
      // If token provided via query param, attempt auto-verify and map errors into form
      void (async () => {
        clearErrors();
        try {
          await verify.mutateAsync(token, setError);
          toast.success("Verification complete");
          navigate("/login");
        } catch (err) {
          // errors mapped into form by mutation
        }
      })();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onSubmit = async (data: FormValues) => {
    clearErrors();
    try {
      await verify.mutateAsync(data.token, setError);
      toast.success("Verification complete");
      navigate("/login");
    } catch (err) {
      // errors already mapped into form by mutation
    }
  };

  return (
    <Layout>
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold mb-2">Verify Your Account</h2>
        <p className="text-neutral-content-600">Enter your verification code</p>
      </div>

      {errors.root && (
        <div className="alert alert-error shadow-sm mb-4">
          <span>{errors.root.message}</span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="form-control">
          <label className="label">
            <span className="label-text font-medium">Code</span>
          </label>
          <input
            type="text"
            placeholder="Enter verification code"
            className="input input-bordered w-full focus:outline-primary focus:border-primary transition-all"
            {...register("token", {
              required: "Verification code is required",
            })}
          />
          {errors.token && (
            <label className="label-text-alt text-error">
              {errors.token.message}
            </label>
          )}
        </div>

        <div className="form-control mt-6">
          <button
            type="submit"
            className="btn btn-primary w-full shadow-medium hover:shadow-strong transition-all"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Verifying" : "Verify"}
          </button>
        </div>
      </form>

      <div className="divider" />
      <p className="text-center text-sm">
        Got stuck?{" "}
        <a href="/login" className="link link-primary">
          Sign in
        </a>
      </p>
    </Layout>
  );
}

import { useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import Layout from "../../components/auth/Layout";
import { useAuthApi } from "../../lib/AuthContext";

export default function Reset() {
  // TODO: signup-layout (small card centered on page)
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { useResetPassword } = useAuthApi();
  const reset = useResetPassword();
  const [complete, setComplete] = useState(false);

  const tokenParam = searchParams.get("token") || "";

  type FormValues = { token: string; password: string; confirm: string };

  const {
    register,
    handleSubmit,
    setError,
    clearErrors,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    defaultValues: { token: tokenParam, password: "", confirm: "" },
  });

  const onSubmit = async (data: FormValues) => {
    clearErrors();

    try {
      await reset.mutateAsync(
        { token: data.token, password: data.password },
        setError,
      );
      setComplete(true);
    } catch (err: any) {
      if (err?.message?.includes("expired")) {
        toast.error(
          "Reset token has expired. Please request a new password reset.",
        );
        navigate("/forgot-password");
        return;
      }
    }
  };

  return (
    <Layout>
      {complete && (
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Password Reset Successful</h2>
          <p className="text-neutral-content-600 mb-4">
            You can now{" "}
            <Link to="/login" className="text-primary underline">
              sign in
            </Link>{" "}
            with your new password.
          </p>
        </div>
      )}

      {!complete && (
        <>
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold mb-2">Reset Password</h2>
            <p className="text-neutral-content-600">
              Set a new password for your account
            </p>
          </div>

          {errors.root && (
            <div className="alert alert-error shadow-sm mb-4">
              <span>{errors.root.message}</span>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {tokenParam ? (
              <input type="hidden" {...register("token")} />
            ) : (
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">Reset Token</span>
                </label>
                <input
                  type="text"
                  placeholder="Paste reset token from email"
                  className="input input-bordered w-full focus:outline-primary focus:border-primary transition-all"
                  {...register("token", { required: "Missing token" })}
                />
                {errors.token && (
                  <label className="label-text-alt text-error">
                    {errors.token.message}
                  </label>
                )}
              </div>
            )}

            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">New Password</span>
              </label>
              <input
                type="password"
                placeholder="New password"
                className="input input-bordered w-full focus:outline-primary focus:border-primary transition-all"
                {...register("password", { required: "Password is required" })}
              />
              {errors.password && (
                <label className="label-text-alt text-error">
                  {errors.password.message}
                </label>
              )}
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Confirm Password</span>
              </label>
              <input
                type="password"
                placeholder="Confirm password"
                className="input input-bordered w-full focus:outline-primary focus:border-primary transition-all"
                {...register("confirm", {
                  required: "Please confirm your password",
                  validate: (v) =>
                    v === getValues("password") || "Passwords do not match",
                })}
              />
              {errors.confirm && (
                <label className="label-text-alt text-error">
                  {errors.confirm.message}
                </label>
              )}
            </div>

            <div className="form-control mt-6">
              <button
                type="submit"
                className="btn btn-primary w-full shadow-medium hover:shadow-strong transition-all"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Resetting..." : "Reset Password"}
              </button>
            </div>
          </form>
        </>
      )}

      <div className="divider" />

      <div className="join w-full justify-center">
        <Link className="btn join-item" to="/">
          Home
        </Link>
        <Link to="/login" className="btn join-item">
          Sign in
        </Link>
      </div>
    </Layout>
  );
}

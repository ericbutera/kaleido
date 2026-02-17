import { faEnvelope } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link } from "react-router-dom";
import Layout from "../../components/auth/Layout";
import { handleFormError } from "../../lib/form";
import { useAuthApi } from "../../lib/AuthContext";

export default function ForgotPassword() {
  const [success, setSuccess] = useState<string | null>(null);
  const forgot = useForgotPassword();

  const {
    register,
    handleSubmit,
    setError,
    clearErrors,
    formState: { errors, isSubmitting },
  } = useForm<{ email: string }>({ defaultValues: { email: "" } });

  const onSubmit = async (data: { email: string }) => {
    clearErrors("root");
    setSuccess(null);
    try {
      await forgot.mutateAsync(data.email);
      setSuccess("If that email exists, a reset link was sent.");
    } catch (err: unknown) {
      handleFormError(err, setError, "Request failed");
    }
  };

  return (
    <Layout>
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold mb-2">Forgot Password</h2>
        <p className="text-neutral-content-600">
          Enter your email to receive a reset link
        </p>
      </div>

      {errors.root && (
        <div className="alert alert-error alert-soft">
          <span>{errors.root.message}</span>
        </div>
      )}

      {success && (
        <div className="alert alert-success shadow-sm mb-4">
          <span>{success}</span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <label className="input input-bordered w-full">
          <span className="label">
            <FontAwesomeIcon icon={faEnvelope} />
            Email
          </span>
          <input
            type="email"
            placeholder="email@example.com"
            {...register("email", { required: "Email is required" })}
          />
        </label>
        {errors.email && (
          <div className="text-error w-full">{errors.email.message}</div>
        )}

        <button
          type="submit"
          className="btn btn-primary w-full"
          disabled={isSubmitting || forgot.isPending}
        >
          Reset
        </button>
      </form>

      <div className="divider" />

      <div className="join w-full justify-center">
        <Link to="/" className="btn join-item">
          Home
        </Link>
        <Link to="/login" className="btn join-item">
          Sign in
        </Link>
      </div>
    </Layout>
  );
}

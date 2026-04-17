import { useForm } from "react-hook-form";
import { useLocation, useNavigate } from "react-router-dom";
import Layout from "../../components/auth/Layout";
import { useAuthApi } from "../../lib/AuthContext";

export default function ResendConfirmation() {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const forwardedEmail = ((location.state as { email?: string } | null)
    ?.email ??
    searchParams.get("email") ??
    undefined) as string | undefined;

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<{ email: string }>({
    defaultValues: { email: forwardedEmail ?? "" },
  });
  const { useResendConfirmationEmail } = useAuthApi();
  const resend = useResendConfirmationEmail();
  const navigate = useNavigate();

  const onSubmit = async (data: { email: string }) => {
    try {
      await resend.mutateAsync(data, setError);
      navigate(`/confirm-email?email=${encodeURIComponent(data.email)}`);
    } catch (e) {
      const message = (
        e as { response?: { data?: { error?: string; message?: string } } }
      )?.response?.data;

      setError("root", {
        type: "server",
        message:
          message?.error ??
          message?.message ??
          "Failed to resend confirmation email",
      });
    }
  };

  return (
    <Layout>
      <h2 className="text-2xl font-bold mb-4">Resend Confirmation</h2>
      <form onSubmit={handleSubmit(onSubmit)}>
        {errors.root && (
          <div role="alert" className="alert alert-warning alert-soft mb-4">
            <span>{errors.root.message}</span>
          </div>
        )}
        <label className="label">Email</label>
        <input
          type="email"
          className={`input input-bordered w-full ${errors.email ? "input-error" : ""}`}
          {...register("email", {
            required: "Email is required",
            pattern: {
              value: /^[^@\s]+@[^@\s]+\.[^@\s]+$/,
              message: "Invalid email address",
            },
          })}
        />
        {errors.email && (
          <span className="text-error text-sm">{errors.email.message}</span>
        )}
        <button
          className="btn btn-primary mt-4"
          disabled={isSubmitting || resend.isPending}
        >
          {isSubmitting || resend.isPending ? "Sending..." : "Resend"}
        </button>
      </form>
    </Layout>
  );
}

import { faEnvelope } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { useLocation, useNavigate } from "react-router-dom";
import Layout from "../../components/auth/Layout";
import { useResendConfirmationEmail } from "../../lib/queries";

export default function ResendConfirmation() {
  const location = useLocation();
  const emailFromState = (location.state as { email?: string })?.email || "";
  const navigate = useNavigate();
  const { useResendConfirmationEmail } = useAuthApi();
  const resend = useResendConfirmationEmail();

  type FormValues = { email: string };

  const {
    register,
    handleSubmit,
    setError,
    clearErrors,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ defaultValues: { email: emailFromState } });

  const onSubmit = async (data: FormValues) => {
    clearErrors();
    try {
      await resend.mutateAsync({ email: data.email.trim() }, setError);
      toast.success(
        "Confirmation email sent! Please check your inbox shortly."
      );
    } catch (err) {
      // Errors are mapped into the form by the mutation; nothing else to do here.
    }
  };

  return (
    <Layout>
      <h2 className="card-title text-2xl mb-4">
        <FontAwesomeIcon icon={faEnvelope} />
        Resend Confirmation Email
      </h2>

      <div className="mt-4 text-sm text-center">
        <p>
          Enter the email address you used to register, and we'll resend the
          confirmation link.
        </p>
      </div>

      {errors.root && (
        <div className="alert alert-error mt-4">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="stroke-current shrink-0 h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span>{errors.root.message}</span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="mt-6">
        <div className="form-control">
          <label className="label">
            <span className="label-text">Email Address</span>
          </label>
          <input
            type="email"
            placeholder="Enter your email"
            className="input input-bordered"
            {...register("email", { required: "Email address is required" })}
          />
          {errors.email && (
            <label className="label-text-alt text-error">
              {errors.email.message}
            </label>
          )}
        </div>

        <div className="modal-action mt-4 gap-2">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="btn btn-ghost"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <span className="loading loading-spinner"></span>
            ) : (
              "Resend"
            )}
          </button>
        </div>
      </form>
    </Layout>
  );
}

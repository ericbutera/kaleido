import { faEnvelope, faLock } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import Layout from "../../components/auth/Layout";
import { handleFormError } from "../../lib/form";
import { useAuthApi } from "../../lib/AuthContext";

export default function Login() {
  // TODO: signup-layout (small card centered on page)
  // Using react-hook-form for validation
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<{ email: string; password: string }>({
    defaultValues: { email: "", password: "" },
  });
  const navigate = useNavigate();
  const { useLoginUser, useCurrentUser } = useAuthApi();
  const login = useLoginUser();
  const { user } = useCurrentUser();
  // If already signed in, redirect back to the page that initiated login (if any)
  useEffect(() => {
    if (user) {
      redirectToOrigin(navigate, location);
    }
  }, [user, navigate, location]);

  const onSubmit = async (data: { email: string; password: string }) => {
    try {
      await login.mutateAsync(data, setError);
      navigate("/");
    } catch (err: any) {
      if (err?.response?.status == 401) {
        setError("root", {
          type: "server",
          message: "Invalid email or password",
        });
      } else {
        const apiErr = err?.response?.data ?? err;
        handleFormError(apiErr, setError, "Failed to sign in");
      }
    }
  };

  return (
    <Layout>
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
          <FontAwesomeIcon icon={faStore} className="text-3xl text-primary" />
        </div>
        <h2 className="text-3xl font-bold mb-2">Welcome Back</h2>
        <p className="text-neutral-content-600">
          Sign in to manage your corner store
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {errors.root && (
          <div className="alert alert-error alert-soft">
            <span>{errors.root.message}</span>
          </div>
        )}

        <label className="floating-label w-full">
          <span>
            <FontAwesomeIcon icon={faEnvelope} />
            Email
          </span>
          <input
            type="email"
            className="input w-full"
            placeholder="email@example.com"
            {...register("email", { required: "Email is required" })}
          />
        </label>
        {errors.email && (
          <span className="text-error text-sm">{errors.email.message}</span>
        )}

        <label className="floating-label w-full">
          <span>
            <FontAwesomeIcon icon={faLock} />
            Password
          </span>
          <input
            type="password"
            placeholder="••••••••"
            className="input w-full"
            minLength={6}
            {...register("password", { required: "Password is required" })}
          />
        </label>
        {errors.password && (
          <span className="text-error text-sm">{errors.password.message}</span>
        )}

        <button
          type="submit"
          className="btn btn-primary w-full "
          disabled={isSubmitting}
        >
          {isSubmitting ? "Signing in" : "Sign In"}
        </button>
      </form>

      {oauthEnabled && <GoogleOAuthButton text="Sign in with Google" />}

      <div className="divider" />

      <div className="join w-full justify-center">
        <Link className="btn join-item" to="/">
          Home
        </Link>
        <Link
          className="btn join-item"
          to="/signup"
          hidden={!registrationEnabled}
        >
          Create Account
        </Link>
        <Link className="btn join-item" to="/forgot-password">
          Forgot password
        </Link>
      </div>
    </Layout>
  );
}

import { faRightToBracket } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { Link, useLocation, useNavigate } from "react-router-dom";
import Layout from "../../components/auth/Layout";
import { useAuthApi, useAuthConfig } from "../../lib/AuthContext";
import { handleFormError } from "../../lib/form";
import { redirectToOrigin } from "../../lib/utils";

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
  const location = useLocation();
  const { useLoginUser, useCurrentUser } = useAuthApi();
  const { oauthEnabled, registrationEnabled, OAuthButton } = useAuthConfig();
  const login = useLoginUser();
  const { user } = useCurrentUser();

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
          <FontAwesomeIcon
            icon={faRightToBracket}
            className="text-3xl text-primary"
          />
        </div>
        <h2 className="text-3xl font-bold mb-2">Welcome Back</h2>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        {errors.root && (
          <div className="alert alert-error alert-soft mb-4">
            <span>{errors.root.message}</span>
          </div>
        )}

        <fieldset className="fieldset">
          <label className="label" htmlFor="login-email">
            <span className="label-text">Email</span>
          </label>
          <input
            id="login-email"
            type="email"
            placeholder="email@example.com"
            className={`input input-bordered w-full ${errors.email ? "input-error" : ""}`}
            {...register("email", { required: "Email is required" })}
          />
          {errors.email && (
            <span className="text-error text-sm">{errors.email.message}</span>
          )}

          <label className="label mt-4" htmlFor="login-password">
            <span className="label-text">Password</span>
          </label>
          <input
            id="login-password"
            type="password"
            placeholder="••••••••"
            className={`input input-bordered w-full ${errors.password ? "input-error" : ""}`}
            minLength={6}
            {...register("password", { required: "Password is required" })}
          />
          {errors.password && (
            <span className="text-error text-sm">
              {errors.password.message}
            </span>
          )}

          <button
            type="submit"
            className="btn btn-primary w-full mt-4"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Signing in" : "Sign In"}
          </button>
        </fieldset>
      </form>

      {oauthEnabled && OAuthButton && (
        <OAuthButton text="Sign in with Google" />
      )}

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

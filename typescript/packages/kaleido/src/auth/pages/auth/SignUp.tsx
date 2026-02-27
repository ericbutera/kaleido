import { faStore } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import Layout from "../../components/auth/Layout";
import GoogleOAuthButton from "../../components/GoogleOAuthButton";
import { useAuthApi } from "../../lib/AuthContext";
import { handleFormError } from "../../lib/form";

import {
  FLAG_OAUTH,
  FLAG_REGISTRATION,
  useFeatureFlag,
} from "../../../featureFlags";

type SignUp = {
  email: string;
  name: string;
  password: string;
  confirmPassword: string;
};

export default function SignUp({ redirectUrl = "" }: { redirectUrl?: string }) {
  // Use react-hook-form with client + server validation
  const {
    register,
    handleSubmit,
    setError,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<SignUp>({
    defaultValues: { name: "", email: "", password: "", confirmPassword: "" },
  });

  const navigate = useNavigate();
  // const registrationEnabled = true;
  const registrationEnabled = useFeatureFlag(FLAG_REGISTRATION);
  // const oauthEnabled = false;
  const oauthEnabled = useFeatureFlag(FLAG_OAUTH);
  const { useRegisterUser } = useAuthApi();
  const registerHook = useRegisterUser();

  // Non-field errors should show in a polished alert on the page
  const [pageError, setPageError] = useState<string | null>(null);

  const onSubmit = async (data: SignUp) => {
    setPageError(null);
    if (!registrationEnabled) {
      setPageError("Registrations are temporarily disabled");
      return;
    }

    if (data.password !== data.confirmPassword) {
      // This is also handled client-side via `validate`, but keep a guard
      setError("confirmPassword", {
        type: "manual",
        message: "Passwords do not match",
      });
      return;
    }

    try {
      await registerHook.mutateAsync(data, setError);
      navigate("/confirm-email", { state: { email: data.email } });
    } catch (err) {
      handleFormError(err, setError, "Failed to register account", false);
    }
  };

  return (
    <Layout>
      <h2 className="card-title text-2xl mb-4">
        <FontAwesomeIcon icon={faStore} className="text-primary mr-2" />
        Sign Up
      </h2>
      {pageError && (
        <div role="alert" className="alert alert-warning alert-soft mb-4">
          <span>{pageError}</span>
        </div>
      )}
      <form onSubmit={handleSubmit(onSubmit)}>
        <fieldset className="fieldset">
          <legend className="fieldset-legend">Account Details</legend>

          <label className="label" htmlFor="signup-name">
            <span className="label-text">Name</span>
          </label>
          <input
            id="signup-name"
            type="text"
            placeholder="Your Name"
            className={`input input-bordered w-full ${errors.name ? "input-error" : ""}`}
            {...register("name", {
              required: "Name is required",
              minLength: {
                value: 2,
                message: "Name must be at least 2 characters",
              },
            })}
          />
          {errors.name && (
            <span className="text-error text-sm">{errors.name.message}</span>
          )}

          <label className="label" htmlFor="signup-email">
            <span className="label-text">Email</span>
          </label>
          <input
            id="signup-email"
            type="email"
            placeholder="email@example.com"
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

          <label className="label" htmlFor="signup-password">
            <span className="label-text">Password</span>
          </label>
          <input
            id="signup-password"
            type="password"
            placeholder="••••••••"
            className={`input input-bordered w-full ${errors.password ? "input-error" : ""}`}
            {...register("password", {
              required: "Password is required",
              minLength: {
                value: 6,
                message: "Password must be at least 6 characters",
              },
            })}
          />
          {errors.password && (
            <span className="text-error text-sm">
              {errors.password.message}
            </span>
          )}

          <label className="label" htmlFor="signup-confirm">
            <span className="label-text">Confirm Password</span>
          </label>
          <input
            id="signup-confirm"
            type="password"
            placeholder="Confirm password"
            className={`input input-bordered w-full ${errors.confirmPassword ? "input-error" : ""}`}
            {...register("confirmPassword", {
              required: "Please confirm password",
              validate: (val) =>
                val === watch("password") || "Passwords do not match",
            })}
          />
          {errors.confirmPassword && (
            <span className="text-error text-sm">
              {errors.confirmPassword.message}
            </span>
          )}

          <button
            type="submit"
            className="btn btn-primary w-full mt-4"
            disabled={isSubmitting || !registrationEnabled}
          >
            {isSubmitting ? "Creating Account…" : "Sign Up"}
          </button>
        </fieldset>
      </form>

      {oauthEnabled && (
        <>
          <div className="divider">OR</div>
          <GoogleOAuthButton
            redirectUrl={redirectUrl}
            text="Sign up with Google"
          />
        </>
      )}

      {!registrationEnabled && (
        <div className="mt-4 text-center text-sm text-neutral-content-500">
          Registrations are currently disabled. If you need an account, please
          contact an administrator.
        </div>
      )}

      <div className="divider"></div>

      <div className="join w-full justify-center">
        <Link className="btn join-item" to="/">
          Home
        </Link>
        <Link to="/login" className="btn join-item">
          Login
        </Link>
        <Link to="/forgot-password" className="btn join-item">
          Forgot Password
        </Link>
      </div>
    </Layout>
  );
}

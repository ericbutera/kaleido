import { faGoogle } from "@fortawesome/free-brands-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

interface GoogleOAuthButtonProps {
  redirectUrl?: string; // Optional redirect URL after successful login
  text?: string;
  className?: string;
  disabled?: boolean;
}

export default function GoogleOAuthButton({
  redirectUrl = "",
  text = "Continue with Google",
  className = "",
  disabled = false,
}: GoogleOAuthButtonProps) {
  const handleGoogleLogin = () => {
    if (disabled) return;
    // Redirect to backend OAuth endpoint
    window.location.href = `${redirectUrl}/oauth/google`;
  };

  return (
    <button
      onClick={handleGoogleLogin}
      className={`btn btn-outline w-full gap-2 ${disabled ? "opacity-50 cursor-not-allowed" : ""} ${className}`}
      type="button"
      disabled={disabled}
    >
      <FontAwesomeIcon icon={faGoogle} className="text-lg" />
      {text}
    </button>
  );
}

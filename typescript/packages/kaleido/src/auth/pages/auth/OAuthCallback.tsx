import { useAuthApi } from "@/auth/lib/AuthContext";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function OAuthCallback() {
  const navigate = useNavigate();
  const { useTokenRefresh } = useAuthApi();
  const refresh = useTokenRefresh?.();

  useEffect(() => {
    // After OAuth provider redirects back, you might exchange code for token here.
    // This is a placeholder.
    refresh?.mutateAsync?.().finally(() => navigate("/"));
  }, [navigate, refresh]);

  return <div>Processing OAuth callback...</div>;
}

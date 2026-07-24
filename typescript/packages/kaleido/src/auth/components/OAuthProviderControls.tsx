import type { ReactNode } from "react";
import { useAuthConfig } from "../lib/AuthContext";

export default function OAuthProviderControls({
  text = "Continue with SSO",
  prefix = null,
  unavailable = null,
}: {
  text?: string;
  prefix?: ReactNode;
  unavailable?: ReactNode;
}) {
  const { OAuthProviderButtons } = useAuthConfig();

  if (OAuthProviderButtons) {
    return (
      <OAuthProviderButtons
        text={text}
        prefix={prefix}
        unavailable={unavailable}
      />
    );
  }

  return <>{unavailable}</>;
}

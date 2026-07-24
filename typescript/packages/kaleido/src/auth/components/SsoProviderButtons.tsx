import {
  useEffect,
  useMemo,
  useState,
  type ComponentType,
  type ReactNode,
} from "react";
import type { OAuthProviderOption } from "../lib/types";

function buttonClassName(provider: string): string {
  switch (provider) {
    case "dev":
      return "btn btn-secondary w-full";
    default:
      return "btn btn-outline w-full";
  }
}

type ProvidersResponse = {
  providers?: OAuthProviderOption[];
};

export default function SsoProviderButtons({
  apiUrl,
  providersUrl,
  text,
  prefix = null,
  unavailable = null,
}: {
  apiUrl: string;
  providersUrl?: string;
  text?: string;
  prefix?: ReactNode;
  unavailable?: ReactNode;
}) {
  const baseUrl = apiUrl.replace(/\/$/, "");
  const [discoveredProviders, setDiscoveredProviders] = useState<
    OAuthProviderOption[] | null
  >(null);

  useEffect(() => {
    if (!providersUrl) {
      return;
    }

    let active = true;

    fetch(providersUrl, {
      credentials: "include",
      headers: { Accept: "application/json" },
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`OAuth provider discovery failed: ${response.status}`);
        }
        return response.json() as Promise<ProvidersResponse>;
      })
      .then((body) => {
        if (active) {
          setDiscoveredProviders(normalizeProviders(body.providers ?? []));
        }
      })
      .catch(() => {
        if (active) {
          setDiscoveredProviders([]);
        }
      });

    return () => {
      active = false;
    };
  }, [providersUrl]);

  const visibleProviders = useMemo(
    () => discoveredProviders,
    [discoveredProviders],
  );

  if (!visibleProviders) {
    return null;
  }

  if (visibleProviders.length === 0) {
    return <>{unavailable}</>;
  }

  return (
    <>
      {prefix}
      <div className="flex w-full flex-col gap-3">
        {visibleProviders.map((provider) => (
          <button
            key={provider.id}
            type="button"
            className={buttonClassName(provider.id)}
            onClick={() => {
              window.location.assign(`${baseUrl}/oauth/${provider.id}`);
            }}
          >
            {visibleProviders.length === 1 && text ? text : provider.label}
          </button>
        ))}
      </div>
    </>
  );
}

export function createOAuthProviderButtons(
  apiUrl: string,
): ComponentType<{
  text?: string;
  prefix?: ReactNode;
  unavailable?: ReactNode;
}> {
  const baseUrl = apiUrl.replace(/\/$/, "");

  return function OAuthProviderButtons({ text, prefix, unavailable }) {
    return (
      <SsoProviderButtons
        apiUrl={apiUrl}
        providersUrl={`${baseUrl}/oauth/providers`}
        text={text}
        prefix={prefix}
        unavailable={unavailable}
      />
    );
  };
}

function normalizeProviders(
  providers: OAuthProviderOption[],
): OAuthProviderOption[] {
  const seen = new Set<string>();

  return providers
    .map((provider) => ({
      id: provider.id.trim().toLowerCase(),
      label: provider.label?.trim() || `Continue with ${provider.id}`,
    }))
    .filter((provider) => provider.id.length > 0)
    .filter((provider) => {
      if (seen.has(provider.id)) {
        return false;
      }
      seen.add(provider.id);
      return true;
    });
}

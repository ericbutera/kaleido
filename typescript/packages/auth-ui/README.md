# @kaleido/auth-ui

Reusable authentication UI components for React applications. Built to be shared across multiple SaaS projects with a clean, dependency-injected API.

## Features

- 🔐 Complete auth flow (login, signup, password reset, email verification)
- ⚛️ Built with React, TypeScript, and react-hook-form
- 🎨 Styled with Tailwind CSS and DaisyUI
- 🔌 Backend-agnostic through dependency injection
- 📦 Tree-shakeable ESM bundle
- ♿ Accessible form components
- 🎛️ Configurable features (OAuth, registration toggles)

## Installation

```bash
npm install @kaleido/auth-ui
```

### Peer Dependencies

```bash
npm install react react-dom react-router-dom react-hook-form react-hot-toast @tanstack/react-query
```

## Quick Start

### 1. Implement the API Client Interface

Create an implementation of the `AuthApiClient` interface that connects to your backend:

```tsx
// src/lib/authApiClient.ts
import type { AuthApiClient } from '@kaleido/auth-ui';
import { useQueryClient, useMutation, useQuery } from '@tanstack/react-query';
import { $api } from './openapi-client'; // Your generated API client

export function createAuthApiClient(): AuthApiClient {
  return {
    useLoginUser() {
      const mutation = $api.useMutation("post", "/auth/login");
      const queryClient = useQueryClient();

      return {
        mutateAsync: async (data, setError) => {
          try {
            await mutation.mutateAsync({ body: data });
            await queryClient.invalidateQueries({ queryKey: ["auth", "current"] });
          } catch (err: any) {
            if (setError) {
              const apiErr = err.response?.data;
              if (apiErr?.errors) {
                Object.entries(apiErr.errors).forEach(([field, messages]) => {
                  setError(field as any, { type: "server", message: messages[0] });
                });
              } else {
                setError("root", { message: apiErr?.message || "Login failed" });
              }
            }
            throw err;
          }
        },
        isPending: mutation.isPending,
      };
    },

    useRegisterUser() {
      const mutation = $api.useMutation("post", "/auth/register");
      return {
        mutateAsync: async (data, setError) => {
          try {
            await mutation.mutateAsync({ body: data });
          } catch (err: any) {
            // Handle errors similar to login
            throw err;
          }
        },
        isPending: mutation.isPending,
      };
    },

    useCurrentUser() {
      const query = $api.useQuery("get", "/auth/current");
      return {
        user: query.data,
        isLoading: query.isLoading,
        isError: query.isError,
      };
    },

    // ... implement other required methods
    // - useForgotPassword()
    // - useResetPassword()
    // - useVerifyEmail()
    // - useResendConfirmationEmail()
    // - useLogout()

    // Optional for OAuth:
    // - useTokenRefresh()
  };
}
```

### 2. Wrap Your App with AuthProvider

```tsx
// src/main.tsx
import { AuthProvider } from '@kaleido/auth-ui';
import { createAuthApiClient } from './lib/authApiClient';

function App() {
  const authClient = createAuthApiClient();

  // Optional: Configure features
  const authConfig = {
    registrationEnabled: true,
    oauthEnabled: false,
    // OAuthButton: MyGoogleButton, // Optional custom OAuth button component
  };

  return (
    <AuthProvider client={authClient} config={authConfig}>
      <RouterProvider router={router} />
    </AuthProvider>
  );
}
```

### 3. Use Auth Pages in Your Routes

```tsx
// src/routes.tsx
import {
  Login,
  SignUp,
  ForgotPassword,
  Reset,
  Verify,
  ResendConfirmation
} from '@kaleido/auth-ui';

export const router = createBrowserRouter([
  { path: '/login', element: <Login /> },
  { path: '/signup', element: <SignUp /> },
  { path: '/forgot-password', element: <ForgotPassword /> },
  { path: '/reset', element: <Reset /> },
  { path: '/verify', element: <Verify /> },
  { path: '/resend-confirmation', element: <ResendConfirmation /> },
]);
```

## Configuration

### AuthConfig Options

Pass a `config` object to `AuthProvider` to customize behavior:

```tsx
interface AuthConfig {
  /** Enable/disable OAuth authentication @default false */
  oauthEnabled?: boolean;

  /** Enable/disable new user registration @default true */
  registrationEnabled?: boolean;

  /** Custom OAuth button component */
  OAuthButton?: React.ComponentType<{ text: string }>;
}
```

### Example with OAuth

```tsx
import { AuthProvider } from '@kaleido/auth-ui';
import GoogleOAuthButton from './components/GoogleOAuthButton';

<AuthProvider
  client={authClient}
  config={{
    oauthEnabled: true,
    OAuthButton: GoogleOAuthButton,
  }}
>
  <App />
</AuthProvider>
```

## Utility Functions

The package exports helpful utilities:

### `handleFormError`

Maps API errors to react-hook-form fields:

```tsx
import { handleFormError } from '@kaleido/auth-ui';

try {
  await mutation.mutateAsync(data);
} catch (err) {
  handleFormError(err, setError, "Request failed");
}
```

### `redirectToOrigin`

Redirects to the original page that initiated auth:

```tsx
import { redirectToOrigin } from '@kaleido/auth-ui';
import { useNavigate, useLocation } from 'react-router-dom';

const navigate = useNavigate();
const location = useLocation();

redirectToOrigin(navigate, location, "/dashboard");
```

export const router = createBrowserRouter([
  { path: '/login', element: <Login /> },
redirectToOrigin(navigate, location, "/dashboard");
```

## Styling

The components use Tailwind CSS and DaisyUI. Make sure your `tailwind.config.js` includes the package:

```js
export default {
  content: [
    './src/**/*.{js,ts,jsx,tsx}',
    './node_modules/@kaleido/auth-ui/dist/**/*.js',
  ],
  plugins: [require('daisyui')],
};
```

## API Reference

### AuthApiClient Interface

Your implementation must provide these methods:

```typescript
interface AuthApiClient {
  useLoginUser(): MutationHook<LoginRequest>;
  useRegisterUser(): MutationHook<RegisterRequest>;
  useForgotPassword(): MutationHook<string>;
  useResetPassword(): MutationHook<ResetRequest>;
  useVerifyEmail(): MutationHook<string>;
  useResendConfirmationEmail(): MutationHook<ResendConfirmationRequest>;
  useCurrentUser(): QueryHook<User>;
  useLogout(): MutationHook<void>;

  // Optional - only needed for OAuth
  useTokenRefresh?(): MutationHook<void>;
}
```

See the full [type definitions](./src/lib/types.ts) for details.

### Error Handling

All mutation hooks should:
- Accept optional `setError` from react-hook-form for validation errors
- Map API errors to form fields using `setError(field, { type: "server", message })`
- Use `setError("root", ...)` for non-field errors
- Return `isPending` state for loading indicators

### Error Format

The package expects API errors in this format:

```typescript
interface ApiError {
  status: "error";
  message: string;
  errors?: Record<string, string[]>;  // Field-level errors
}
```

## Development

### Building the Package

```bash
npm run build        # Build for production
npm run dev         # Build and watch for changes
npm run typecheck   # Run TypeScript type checking
npm run clean       # Remove build output
```

### Publishing

This package is designed to be published to npm or used in a monorepo workspace.

For npm:
```bash
npm run build
npm publish
```

For local development/testing:
```bash
npm link
# In your consumer project:
npm link @kaleido/auth-ui
```

## Architecture

This package follows a dependency injection pattern:

1. **UI Components** - Reusable React components and pages
2. **API Client Interface** - Abstract interface for auth operations
3. **Consumer Implementation** - Your project implements the interface

This allows the package to work with any backend while providing consistent UI.

## License

MIT

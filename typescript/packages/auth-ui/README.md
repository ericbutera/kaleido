# @kaleido/auth-ui

Reusable authentication UI components for React applications.

## Features

- 🔐 Complete auth flow (login, signup, password reset, email verification)
- ⚛️ Built with React, TypeScript, and react-hook-form
- 🎨 Styled with Tailwind CSS and DaisyUI
- 🔌 Backend-agnostic through dependency injection
- 📦 Tree-shakeable ESM bundle
- ♿ Accessible form components

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

```tsx
// src/lib/authApiClient.ts
import type { AuthApiClient } from '@kaleido/auth-ui';
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
            await queryClient.invalidateQueries(["get", "/auth/current"]);
          } catch (err: any) {
            if (setError) {
              const apiErr = err.response?.data;
              if (apiErr?.errors) {
                Object.entries(apiErr.errors).forEach(([field, messages]) => {
                  setError(field, { type: "server", message: messages[0] });
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

    // ... implement other methods
  };
}
```

### 2. Wrap Your App with AuthProvider

```tsx
// src/main.tsx
import { AuthProvider } from '@kaleido/auth-ui';
import { createAuthApiClient } from './lib/authApiClient';

function App() {
  return (
    <AuthProvider client={createAuthApiClient()}>
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

## Styling

The components use Tailwind CSS and DaisyUI. Make sure your `tailwind.config.js` includes:

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

See the full [AuthApiClient interface](./src/lib/types.ts) for implementation details.

### Error Handling

All mutation hooks should:
- Accept optional `setError` from react-hook-form for validation errors
- Map API errors to form fields using `setError(field, { type: "server", message })`
- Use `setError("root", ...)` for non-field errors
- Return `isPending` state

## License

MIT

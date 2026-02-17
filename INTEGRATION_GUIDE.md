# Integrating Kaleido Components into Your Project

This guide shows how to use the shared auth and background_jobs crates from the Kaleido monorepo in your SaaS applications.

## For Rust Projects (like mycorner-axum)

### Option 1: Git Dependency (Recommended for Development)

Add to your `Cargo.toml`:

```toml
[dependencies]
auth = { git = "https://github.com/yourusername/kaleido", branch = "main" }
background_jobs = { git = "https://github.com/yourusername/kaleido", branch = "main" }

# Or use a specific commit
auth = { git = "https://github.com/yourusername/kaleido", rev = "abc123" }
```

### Option 2: Published Crates (Recommended for Production)

After publishing to crates.io:

```toml
[dependencies]
auth = "0.1"
background_jobs = { version = "0.1", features = ["durable"] }
```

### Option 3: Local Path (for Development)

```toml
[dependencies]
auth = { path = "../kaleido/rust/auth" }
background_jobs = { path = "../kaleido/rust/background_jobs" }
```

### Using the Auth Crate

```rust
use auth::{
    controllers::auth::create_auth_router,
    services::AuthService,
    tokens::TokenService,
    cookies::CookieService,
};

// In your main.rs or router setup
let auth_service = AuthService::new(db.clone());
let token_service = TokenService::new(secret);
let cookie_service = CookieService::new(is_secure);

let auth_router = create_auth_router(
    auth_service,
    token_service,
    cookie_service,
);

// Mount auth routes
let app = Router::new()
    .nest("/auth", auth_router)
    // ... your other routes
```

### Using Background Jobs

```rust
use background_jobs::{
    JobQueue,
    memory::MemoryStorage,  // or durable::DurableStorage
    Task,
};

// Define a task
#[derive(Serialize, Deserialize)]
struct SendEmailTask {
    to: String,
    subject: String,
    body: String,
}

#[async_trait]
impl Task for SendEmailTask {
    async fn execute(&self) -> Result<(), Box<dyn Error>> {
        // Send email logic
        Ok(())
    }
}

// Create queue
let storage = MemoryStorage::new();
let queue = JobQueue::new(storage);

// Enqueue job
queue.enqueue(SendEmailTask {
    to: "user@example.com".to_string(),
    subject: "Welcome".to_string(),
    body: "...".to_string(),
}).await?;

// Process jobs
queue.start_worker().await;
```

## For TypeScript Projects (React)

### Install from npm (after publishing)

```bash
npm install @kaleido/auth-ui
```

### Or use from Git

```json
{
  "dependencies": {
    "@kaleido/auth-ui": "github:yourusername/kaleido#main"
  }
}
```

### Usage in React App

```tsx
// 1. Create API client adapter (src/lib/authApiClient.ts)
import type { AuthApiClient } from '@kaleido/auth-ui';
import { $api } from './openapi/react-query/api';

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

    // ... implement other methods (see full example in kaleido/typescript/packages/auth-ui/README.md)
  };
}

// 2. Wrap your app (src/main.tsx)
import { AuthProvider } from '@kaleido/auth-ui';
import { createAuthApiClient } from './lib/authApiClient';

function App() {
  return (
    <AuthProvider client={createAuthApiClient()}>
      <RouterProvider router={router} />
    </AuthProvider>
  );
}

// 3. Use auth pages in routes (src/routes.tsx)
import { Login, SignUp, ForgotPassword } from '@kaleido/auth-ui';

export const router = createBrowserRouter([
  { path: '/login', element: <Login /> },
  { path: '/signup', element: <SignUp /> },
  { path: '/forgot-password', element: <ForgotPassword /> },
  // ... other routes
]);
```

### Tailwind Configuration

Add to your `tailwind.config.js`:

```js
export default {
  content: [
    './src/**/*.{js,ts,jsx,tsx}',
    './node_modules/@kaleido/auth-ui/dist/**/*.js',
  ],
  plugins: [require('daisyui')],
};
```

## Publishing Updates

### Rust Crates

```bash
cd /Users/eric/code/kaleido/rust/auth
cargo publish

cd /Users/eric/code/kaleido/rust/background_jobs
cargo publish
```

### TypeScript Packages

```bash
cd /Users/eric/code/kaleido/typescript/packages/auth-ui
npm version patch  # or minor, major
npm publish --access public
```

## Updating Your Projects

### Rust

```bash
cargo update auth
cargo update background_jobs
```

### TypeScript

```bash
npm update @kaleido/auth-ui
```

## Development Workflow

1. Make changes in the kaleido monorepo
2. Test locally using path dependencies
3. Commit and push to GitHub
4. Publish new version to crates.io / npm
5. Update version in your SaaS projects

## Example: Migrating mycorner-axum

### Before
```toml
# mycorner-axum/api/Cargo.toml
[dependencies]
auth = { path = "../auth" }
background_jobs = { path = "../background_jobs" }
```

### After
```toml
# mycorner-axum/api/Cargo.toml
[dependencies]
auth = { git = "https://github.com/yourusername/kaleido", branch = "main" }
background_jobs = { git = "https://github.com/yourusername/kaleido", branch = "main", features = ["durable"] }
```

Then remove the local `auth/` and `background_jobs/` directories from mycorner-axum.

## Troubleshooting

### Rust: "cannot find crate"
- Ensure you've pushed the latest changes to GitHub
- Try `cargo clean` and rebuild
- Check that the git URL and branch are correct

### TypeScript: Module not found
- Run `npm install` after updating package
- Check that Tailwind content paths include the package
- Verify you've wrapped your app with `<AuthProvider>`

### Version Conflicts
- Use exact same version across all projects
- Pin to specific git commits for stability
- Consider using workspace for local multi-project development

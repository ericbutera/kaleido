import { admin, auth, QueryClientProvider } from "@ericbutera/kaleido";
import { Toaster } from "react-hot-toast";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import AdminNav from "./components/admin/Nav";
import SiteNavigation from "./components/Navigation";
import { authApiClient, queryClient } from "./lib/kaleido";

admin.configureAdminLayout({
  SiteNavigation,
  AdminNav,
});

function Home() {
  return (
    <div>
      <SiteNavigation />
      <div style={{ padding: "1.5rem" }}>
        <h1>[[ project_slug ]]</h1>
        <p>Scaffold is ready.</p>
      </div>
    </div>
  );
}

function AccountPage() {
  return (
    <div>
      <SiteNavigation />
      <div style={{ padding: "1.5rem" }}>
        <h1>Account</h1>
        <p>Signed-in account page.</p>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <auth.AuthProvider client={authApiClient}>
          <Toaster position="top-right" />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route
              path="/account"
              element={
                <auth.ProtectedRoute>
                  <AccountPage />
                </auth.ProtectedRoute>
              }
            />
            <Route path="/login" element={<auth.Login />} />
            <Route path="/signup" element={<auth.SignUp />} />
            <Route path="/confirm-email" element={<auth.ConfirmEmail />} />
            <Route
              path="/resend-confirmation"
              element={<auth.ResendConfirmation />}
            />
            <Route path="/auth/callback" element={<auth.OAuthCallback />} />
            <Route path="/verify" element={<auth.Verify />} />
            <Route path="/forgot-password" element={<auth.ForgotPassword />} />
            <Route path="/reset" element={<auth.Reset />} />

            <Route path="/admin" element={<admin.Route />}>
              <Route element={<admin.LayoutRoute />}>
                <Route index element={<admin.Dashboard />} />
                <Route path="tasks" element={<admin.Tasks />} />
                <Route path="feature-flag" element={<admin.FeatureFlags />} />
                <Route path="feature-flags" element={<admin.FeatureFlags />} />
                <Route path="users" element={<admin.Users />} />
              </Route>
            </Route>

            <Route path="*" element={<Home />} />
          </Routes>
        </auth.AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

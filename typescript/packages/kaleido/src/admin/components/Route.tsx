import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuthApi } from "../../auth/lib/AuthContext";

export default function Route() {
  const authApi = useAuthApi();
  const { user, isLoading } = authApi.useCurrentUser();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} />;
  }

  if (!user.is_admin) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}

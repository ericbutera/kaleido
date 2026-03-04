import { auth } from "@ericbutera/kaleido";
import { Link } from "react-router-dom";

export default function SiteNavigation() {
  const authApi = auth.useAuthApi();
  const { user, isLoading } = authApi.useCurrentUser();
  const logout = authApi.useLogout();

  return (
    <div className="navbar bg-base-100 shadow-sm">
      <div className="flex-1">
        <Link to="/" className="btn btn-ghost normal-case text-lg">
          [[ project_name ]]
        </Link>
        <Link to="/account" className="ml-4 hidden sm:inline">
          Account
        </Link>
      </div>
      <div className="flex-none">
        {isLoading ? null : user ? (
          <button
            className="btn btn-ghost"
            onClick={() => logout.mutateAsync()}
            disabled={logout.isPending}
          >
            {logout.isPending ? "Signing out..." : "Sign out"}
          </button>
        ) : (
          <div className="space-x-2">
            <Link to="/login" className="btn btn-ghost">
              Login
            </Link>
            <Link to="/signup" className="btn btn-primary">
              Sign up
            </Link>
          </div>
        )}
        {user?.is_admin && (
          <Link to="/admin" className="btn btn-ghost ml-2 hidden sm:inline">
            Admin
          </Link>
        )}
      </div>
    </div>
  );
}

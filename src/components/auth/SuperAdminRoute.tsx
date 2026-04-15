import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

function Spinner() {
  return (
    <div className="h-screen flex items-center justify-center bg-slate-50 dark:bg-gray-950">
      <div className="w-8 h-8 rounded-full border-4 border-purple-600 border-t-transparent animate-spin" />
    </div>
  );
}

/**
 * Wraps a route so only the superadmin can access it.
 * Non-authenticated users → /login
 * Authenticated non-superadmins → / (home)
 */
export default function SuperAdminRoute({ children }: { children: React.ReactNode }) {
  const { user, isSuperAdmin, loading } = useAuth();

  if (loading) return <Spinner />;
  if (!user) return <Navigate to="/login" replace />;
  if (!isSuperAdmin) return <Navigate to="/" replace />;

  return <>{children}</>;
}

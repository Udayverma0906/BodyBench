import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

function Spinner() {
  return (
    <div className="h-screen flex items-center justify-center bg-slate-50 dark:bg-gray-950">
      <div className="w-8 h-8 rounded-full border-4 border-blue-600 border-t-transparent animate-spin" />
    </div>
  );
}

/**
 * Wraps a route so only authenticated users can access it.
 * Unauthenticated users are redirected to /login with the attempted
 * location saved in state — Login uses it to redirect back after sign-in.
 */
export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth();
  const location = useLocation();

  if (loading) return <Spinner />;

  if (!session) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}

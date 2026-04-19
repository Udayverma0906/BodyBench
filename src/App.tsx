import { useCallback, useEffect, useRef } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Assessment from "./pages/Assessment";
import Result from "./pages/Result";
import History from "./pages/History";
import Dashboard from "./pages/Dashboard";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import AdminRoute from "./components/auth/AdminRoute";
import SuperAdminRoute from "./components/auth/SuperAdminRoute";
import FieldConfigPage from "./pages/admin/FieldConfigPage";
import TrainerRequestsPage from "./pages/admin/TrainerRequestsPage";
import SettingsPage from "./pages/admin/SettingsPage";
import MyGym from "./pages/MyGym";
import AllGymsPage from "./pages/admin/AllGymsPage";
import AllUsersPage from "./pages/admin/AllUsersPage";
import IdleWarningModal from "./components/shared/IdleWarningModal";
import { useIdleTimeout } from "./hooks/useIdleTimeout";
import { useConfig } from "./hooks/useConfig";
import { useTheme } from "./context/ThemeContext";
import { calculateScore } from "./utils/calculateScore";
import { supabase } from "./lib/supabase";
import { useAuth } from "./context/AuthContext";
import type { AssessmentForm } from "./types/assessment";
import type { FieldConfig } from "./types/database";

// ── AuthenticatedApp — idle timeout + post-login config only runs while logged in
function AuthenticatedApp({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const { getNumber, get, configFor } = useConfig();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();

  // Both keys stored as whole seconds in DB
  const idleMs    = (getNumber('idle_timeout_secs') ?? 600) * 1000;
  const warningMs = (getNumber('idle_warning_secs') ?? 60)  * 1000;

  const handleSignOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  const { showWarning, countdown, resetTimer, signOutNow } = useIdleTimeout(
    idleMs,
    warningMs,
    handleSignOut,
  );

  // Apply default theme + landing redirect once per login after config loads for this user.
  // Gate on configFor === user.id (set only after fetch completes) to avoid the race where
  // configLoading is stale-false when user first becomes defined.
  const configAppliedForRef = useRef<string | null>(null);
  useEffect(() => {
    if (!user || configFor !== user.id) return;
    if (configAppliedForRef.current === user.id) return;
    configAppliedForRef.current = user.id;

    const configTheme = get('default_theme') as 'light' | 'dark' | '';
    if ((configTheme === 'dark' || configTheme === 'light') && configTheme !== theme) {
      setTheme(configTheme);
    }

    const landing = get('default_landing');
    if (landing && landing !== '/' && window.location.pathname === '/') {
      navigate(landing, { replace: true });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [configFor, user]);

  if (!user) return <>{children}</>;

  return (
    <>
      {children}
      <IdleWarningModal
        isOpen={showWarning}
        countdown={countdown}
        warningSeconds={Math.floor(warningMs / 1000)}
        onContinue={resetTimer}
        onSignOut={signOutNow}
      />
    </>
  );
}

// ── App ───────────────────────────────────────────────────────────────────────
function App() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleSubmit = async (data: AssessmentForm, configs: FieldConfig[]) => {
    const res = calculateScore(data, configs);

    let saveFailed = false;
    if (user) {
      const { error } = await supabase
        .from("assessments")
        .insert({
          user_id: user.id,
          score: res.total,
          category: res.category,
          breakdown: res.breakdown,
          form_data: data,
          is_active: true,
        });
      if (error) {
        console.error("Failed to save assessment:", error.message);
        saveFailed = true;
      }
    }

    navigate("/result", {
      state: {
        score: res.total,
        category: res.category,
        breakdown: res.breakdown,
        formData: data,
        saveFailed,
      },
    });
  };

  return (
    <AuthenticatedApp>
      <Routes>
        <Route path="/" element={<Landing onStart={() => navigate("/assessment")} />} />
        <Route path="/login" element={<Login />} />
        <Route
          path="/assessment"
          element={
            <ProtectedRoute>
              <Assessment onSubmit={handleSubmit} onBack={() => navigate("/")} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/result"
          element={
            <ProtectedRoute>
              <Result onRestart={() => navigate("/")} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/history"
          element={
            <ProtectedRoute>
              <History />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/gym"
          element={
            <ProtectedRoute>
              <MyGym />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/fields"
          element={
            <AdminRoute>
              <FieldConfigPage />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/settings"
          element={
            <AdminRoute>
              <SettingsPage />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/requests"
          element={
            <SuperAdminRoute>
              <TrainerRequestsPage />
            </SuperAdminRoute>
          }
        />
        <Route
          path="/admin/gyms"
          element={
            <SuperAdminRoute>
              <AllGymsPage />
            </SuperAdminRoute>
          }
        />
        <Route
          path="/admin/gyms/:trainerId"
          element={
            <SuperAdminRoute>
              <MyGym />
            </SuperAdminRoute>
          }
        />
        <Route
          path="/admin/users"
          element={
            <SuperAdminRoute>
              <AllUsersPage />
            </SuperAdminRoute>
          }
        />
      </Routes>
    </AuthenticatedApp>
  );
}

export default App;

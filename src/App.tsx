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
import MyGym from "./pages/MyGym";
import AllGymsPage from "./pages/admin/AllGymsPage";
import AllUsersPage from "./pages/admin/AllUsersPage";
import { calculateScore } from "./utils/calculateScore";
import { supabase } from "./lib/supabase";
import { useAuth } from "./context/AuthContext";
import type { AssessmentForm } from "./types/assessment";
import type { FieldConfig } from "./types/database";

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
  );
}

export default App;

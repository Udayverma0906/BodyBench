import { Routes, Route, useNavigate } from "react-router-dom";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Assessment from "./pages/Assessment";
import Result from "./pages/Result";
import History from "./pages/History";
import Dashboard from "./pages/Dashboard";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import AdminRoute from "./components/auth/AdminRoute";
import FieldConfigPage from "./pages/admin/FieldConfigPage";
import { calculateScore } from "./utils/calculateScore";
import { supabase } from "./lib/supabase";
import { useAuth } from "./context/AuthContext";
import type { AssessmentForm } from "./types/assessment";

function App() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleSubmit = (data: AssessmentForm) => {
    const res = calculateScore(data);

    // Fire-and-forget: save to DB if logged in
    if (user) {
      supabase
        .from("assessments")
        .insert({
          user_id: user.id,
          score: res.total,
          category: res.category,
          breakdown: res.breakdown,
          form_data: data,
        })
        .then(({ error }) => {
          if (error) console.error("Failed to save assessment:", error.message);
        });
    }

    navigate("/result", {
      state: {
        score: res.total,
        category: res.category,
        breakdown: res.breakdown,
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
        path="/admin/fields"
        element={
          <AdminRoute>
            <FieldConfigPage />
          </AdminRoute>
        }
      />
    </Routes>
  );
}

export default App;

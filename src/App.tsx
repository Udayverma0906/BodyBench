import { Routes, Route, useNavigate } from "react-router-dom";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Assessment from "./pages/Assessment";
import Result from "./pages/Result";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import { calculateScore } from "./utils/calculateScore";
import type { AssessmentForm } from "./types/assessment";

function App() {
  const navigate = useNavigate();

  const handleSubmit = (data: AssessmentForm) => {
    const res = calculateScore(data);
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
    </Routes>
  );
}

export default App;

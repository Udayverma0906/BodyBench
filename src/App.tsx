import { Routes, Route, useNavigate } from "react-router-dom";
import Landing from "./pages/Landing";
import Assessment from "./pages/Assessment";
import Result from "./pages/Result";
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
      <Route
        path="/"
        element={<Landing onStart={() => navigate("/assessment")} />}
      />
      <Route
        path="/assessment"
        element={
          <Assessment
            onSubmit={handleSubmit}
            onBack={() => navigate("/")}
          />
        }
      />
      <Route
        path="/result"
        element={<Result onRestart={() => navigate("/")} />}
      />
    </Routes>
  );
}

export default App;

import { useState } from "react";
import Landing from "./pages/Landing";
import Assessment from "./pages/Assessment";
import Result from "./pages/Result";
import { calculateScore } from "./utils/calculateScore";
import type { AssessmentForm } from "./types/assessment";
import type { ScoreBreakdown } from "./utils/calculateScore";

type Page = "landing" | "assessment" | "result";

interface ResultState {
  score: number;
  category: string;
  breakdown: ScoreBreakdown[];
}

function App() {
  const [page, setPage] = useState<Page>("landing");
  const [result, setResult] = useState<ResultState | null>(null);

  const handleSubmit = (data: AssessmentForm) => {
    const res = calculateScore(data);
    setResult({ score: res.total, category: res.category, breakdown: res.breakdown });
    setPage("result");
  };

  return (
    <>
      {page === "landing" && (
        <Landing onStart={() => setPage("assessment")} />
      )}
      {page === "assessment" && (
        <Assessment
          onSubmit={handleSubmit}
          onBack={() => setPage("landing")}
        />
      )}
      {page === "result" && result && (
        <Result
          score={result.score}
          category={result.category}
          breakdown={result.breakdown}
          onRestart={() => setPage("landing")}
        />
      )}
    </>
  );
}

export default App;

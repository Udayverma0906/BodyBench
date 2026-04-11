import { useState } from "react";
import Landing from "./pages/Landing";
import Assessment from "./pages/Assessment";

function App() {
  const [page, setPage] = useState<"landing" | "assessment">("landing");

  return (
    <>
      {page === "landing" && (
        <Landing onStart={() => setPage("assessment")} />
      )}

      {page === "assessment" && <Assessment />}
    </>
  );
}

export default App;
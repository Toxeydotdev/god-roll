import { Route, Routes } from "react-router-dom";
import { DiceRoller } from "../components/DiceRoller";
import { PrivacyPolicy } from "../pages";

export function App() {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <div className="h-dvh w-screen overflow-hidden">
            <DiceRoller />
          </div>
        }
      />
      <Route path="/privacy" element={<PrivacyPolicy />} />
    </Routes>
  );
}

export default App;

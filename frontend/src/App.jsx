import { useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import useAuthStore from "./store/authStore";

import Home              from "./pages/Home";
import Login             from "./pages/Login";
import Register          from "./pages/Register";
import Lobby             from "./pages/Lobby";
import Game              from "./pages/Game";
import Results           from "./pages/Results";
import GlobalLeaderboard from "./pages/GlobalLeaderboard";

function ProtectedRoute({ children }) {
  const token = useAuthStore((s) => s.token);
  return token ? children : <Navigate to="/login" replace />;
}

export default function App() {
  const init = useAuthStore((s) => s.init);

  useEffect(() => { init(); }, [init]);

  return (
    <div className="dark min-h-screen">
      <Routes>
        <Route path="/"               element={<Home />} />
        <Route path="/login"          element={<Login />} />
        <Route path="/register"       element={<Register />} />
        <Route path="/leaderboard"    element={<GlobalLeaderboard />} />
        <Route path="/lobby/:code"    element={<ProtectedRoute><Lobby /></ProtectedRoute>} />
        <Route path="/game/:code"     element={<ProtectedRoute><Game /></ProtectedRoute>} />
        <Route path="/results/:code"  element={<ProtectedRoute><Results /></ProtectedRoute>} />
        <Route path="*"               element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

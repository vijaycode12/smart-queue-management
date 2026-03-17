import { useState, useEffect } from "react";
import AuthPage from "./pages/AuthPage";
import UserDashboard from "./pages/UserDashboard";
import AdminDashboard from "./pages/AdminDashboard";

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("sqms_user");
      if (stored) setUser(JSON.parse(stored));
    } catch {
      localStorage.removeItem("sqms_user");
    }
    setLoading(false);
  }, []);

  const handleLogin = (userData) => {
    localStorage.setItem("sqms_user", JSON.stringify(userData));
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem("sqms_user");
    setUser(null);
  };

  if (loading) {
    return (
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "center",
        minHeight: "100vh", fontSize: 16, color: "#9ca3af",
        fontFamily: "'DM Sans', sans-serif", background: "#f1f5f9",
      }}>
        Loading…
      </div>
    );
  }

  if (!user) return <AuthPage onLogin={handleLogin} />;
  if (user.role === "ADMIN") return <AdminDashboard user={user} onLogout={handleLogout} />;
  return <UserDashboard user={user} onLogout={handleLogout} />;
}
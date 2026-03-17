import { useState } from "react";
import { loginUser, registerUser } from "../services/api";

export default function AuthPage({ onLogin }) {
  const [isLogin, setIsLogin] = useState(true);
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "USER" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async () => {
    setError("");
    setLoading(true);
    try {
      if (isLogin) {
        const res = await loginUser({ email: form.email, password: form.password });
        localStorage.setItem("sqms_user", JSON.stringify(res.data));
        onLogin(res.data);
      } else {
        await registerUser(form);
        setIsLogin(true);
        setError("success:Account created! Please sign in.");
      }
    } catch (e) {
      setError(e.response?.data || "Something went wrong. Please try again.");
    }
    setLoading(false);
  };

  const isSuccess = error.startsWith("success:");
  const errorMsg  = isSuccess ? error.replace("success:", "") : error;

  return (
    <div style={{
      display: "flex",
      width: "100vw",
      minHeight: "100vh",
      fontFamily: "'DM Sans', sans-serif",
    }}>

      {/* ════ LEFT PANEL ════ */}
      <div style={{
        width: "42%",
        minHeight: "100vh",
        background: "linear-gradient(160deg, #0d0b22 0%, #1a1640 50%, #2d2870 100%)",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: "60px 64px",
        flexShrink: 0,
      }}>
        {/* Brand */}
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 60 }}>
          <div style={{
            width: 52, height: 52, borderRadius: 16, flexShrink: 0,
            background: "linear-gradient(135deg, #f7971e, #ffd200)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 26, fontWeight: 900, color: "#000",
            boxShadow: "0 8px 24px rgba(247,151,30,0.4)",
          }}>Q</div>
          <div>
            <div style={{ fontSize: 26, fontWeight: 900, color: "#fff", letterSpacing: "-0.6px" }}>SmartQueue</div>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", marginTop: 2 }}>Intelligent Queue Management</div>
          </div>
        </div>

        {/* Hero */}
        <h2 style={{
          fontSize: 46, fontWeight: 900, color: "#fff",
          lineHeight: 1.1, letterSpacing: "-2px", marginBottom: 20,
        }}>
          Manage queues<br />with precision.
        </h2>
        <p style={{ fontSize: 16, color: "rgba(255,255,255,0.5)", lineHeight: 1.75, marginBottom: 52 }}>
          Real-time token tracking, intelligent wait-time estimation, and seamless service management.
        </p>

        {/* Features */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 52 }}>
          {[
            "Real-time token tracking",
            "Zero wait time waste",
            "Admin-controlled flow",
            "Instant status updates",
          ].map(f => (
            <div key={f} style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#ffd200", flexShrink: 0 }} />
              <span style={{ fontSize: 15, color: "rgba(255,255,255,0.65)", fontWeight: 500 }}>{f}</span>
            </div>
          ))}
        </div>

        {/* Live Card */}
        <div style={{
          background: "rgba(255,255,255,0.06)",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: 20, padding: "24px 28px",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#10b981", boxShadow: "0 0 0 3px rgba(16,185,129,0.25)" }} />
            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", letterSpacing: 2.5, fontWeight: 700 }}>NOW SERVING</span>
          </div>
          <div style={{ fontSize: 44, fontWeight: 900, color: "#ffd200", letterSpacing: "-2px", marginBottom: 6 }}>A042</div>
          <div style={{ fontSize: 13, color: "rgba(255,255,255,0.35)" }}>Counter A · 3 people waiting</div>
        </div>
      </div>

      {/* ════ RIGHT PANEL ════ */}
      <div style={{
        flex: 1,
        minHeight: "100vh",
        background: "#f8f9fb",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "60px 80px",
      }}>
        <div style={{ width: "100%", maxWidth: 460 }}>

          {/* Tabs */}
          <div style={{ display: "flex", background: "#eef0f3", borderRadius: 14, padding: 4, marginBottom: 36 }}>
            {["Login", "Register"].map((t, i) => (
              <button key={t}
                onClick={() => { setIsLogin(i === 0); setError(""); }}
                style={{
                  flex: 1, padding: "12px", border: "none", borderRadius: 11,
                  fontSize: 15, fontWeight: isLogin === (i === 0) ? 800 : 500,
                  cursor: "pointer", transition: "all 0.15s",
                  background: isLogin === (i === 0) ? "#fff" : "transparent",
                  color: isLogin === (i === 0) ? "#111" : "#999",
                  boxShadow: isLogin === (i === 0) ? "0 2px 12px rgba(0,0,0,0.1)" : "none",
                }}>
                {t}
              </button>
            ))}
          </div>

          <h2 style={{ fontSize: 34, fontWeight: 900, color: "#111", margin: "0 0 8px", letterSpacing: "-1px" }}>
            {isLogin ? "Welcome back 👋" : "Create account"}
          </h2>
          <p style={{ fontSize: 15, color: "#9ca3af", margin: "0 0 36px" }}>
            {isLogin ? "Sign in to manage your queue" : "Register to get started"}
          </p>

          {/* Fields */}
          <div style={{ display: "flex", flexDirection: "column", gap: 22, marginBottom: 24 }}>
            {!isLogin && (
              <div>
                <label style={lbl}>Full Name</label>
                <input name="name" value={form.name} onChange={handle}
                  onKeyDown={e => e.key === "Enter" && submit()}
                  placeholder="John Smith" style={inp} />
              </div>
            )}
            <div>
              <label style={lbl}>Email Address</label>
              <input name="email" type="email" value={form.email} onChange={handle}
                onKeyDown={e => e.key === "Enter" && submit()}
                placeholder="you@example.com" style={inp} />
            </div>
            <div>
              <label style={lbl}>Password</label>
              <input name="password" type="password" value={form.password} onChange={handle}
                onKeyDown={e => e.key === "Enter" && submit()}
                placeholder="••••••••••" style={inp} />
            </div>
            {!isLogin && (
              <div>
                <label style={lbl}>Account Role</label>
                <select name="role" value={form.role} onChange={handle} style={inp}>
                  <option value="USER">👤 User — Customer / Visitor</option>
                  <option value="ADMIN">⚡ Admin — Staff / Operator</option>
                </select>
              </div>
            )}
          </div>

          {/* Error / Success */}
          {error && (
            <div style={{
              padding: "13px 16px", borderRadius: 12, marginBottom: 20,
              border: `1.5px solid ${isSuccess ? "#bbf7d0" : "#fecaca"}`,
              background: isSuccess ? "#f0fdf4" : "#fef2f2",
              color: isSuccess ? "#15803d" : "#dc2626",
              fontSize: 14, fontWeight: 500,
            }}>
              {isSuccess ? "✓" : "⚠"} {errorMsg}
            </div>
          )}

          {/* Submit */}
          <button onClick={submit} disabled={loading} style={{
            width: "100%", padding: "16px", borderRadius: 14, border: "none",
            background: "linear-gradient(135deg, #302b63, #0f0c29)",
            color: "#fff", fontSize: 16, fontWeight: 800, cursor: "pointer",
            boxShadow: "0 8px 24px rgba(48,43,99,0.3)", marginBottom: 22,
            opacity: loading ? 0.75 : 1,
          }}>
            {loading ? "Please wait…" : isLogin ? "Sign In →" : "Create Account →"}
          </button>

          <p style={{ textAlign: "center", fontSize: 14, color: "#9ca3af" }}>
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <span
              onClick={() => { setIsLogin(!isLogin); setError(""); }}
              style={{ color: "#302b63", fontWeight: 800, cursor: "pointer" }}>
              {isLogin ? "Register here" : "Sign in"}
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}

const lbl = { display: "block", fontSize: 14, fontWeight: 700, color: "#374151", marginBottom: 8 };
const inp = {
  width: "100%", padding: "14px 16px", borderRadius: 12,
  border: "1.5px solid #e5e7eb", fontSize: 15, color: "#111",
  background: "#fff", boxSizing: "border-box",
};
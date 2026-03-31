import { useState, useEffect } from "react";
import { loginUser, registerUser, getAllQueues } from "../services/api";

/* ─── tiny style helpers ─── */
const lbl = { display: "block", fontSize: 13, fontWeight: 700, color: "#374151", marginBottom: 7, letterSpacing: "0.3px" };
const inp = {
  width: "100%", padding: "13px 15px", borderRadius: 10,
  border: "1.5px solid #e5e7eb", fontSize: 14, color: "#111",
  background: "#fff", boxSizing: "border-box", outline: "none",
  fontFamily: "inherit", transition: "border-color 0.2s",
};

/* ─── CSS injected once ─── */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&display=swap');
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: 'DM Sans', sans-serif; }

/* animations */
@keyframes fadeUp   { from { opacity:0; transform:translateY(28px); } to { opacity:1; transform:translateY(0); } }
@keyframes fadeIn   { from { opacity:0; } to { opacity:1; } }
@keyframes pulse    { 0%,100%{ transform:scale(1); } 50%{ transform:scale(1.18); } }
@keyframes float    { 0%,100%{ transform:translateY(0px); } 50%{ transform:translateY(-12px); } }
@keyframes shimmer  { 0%{ background-position:200% center; } 100%{ background-position:-200% center; } }
@keyframes slideIn  { from{ opacity:0; transform:translateX(20px); } to{ opacity:1; transform:translateX(0); } }
@keyframes ticker   { 0%,100%{ opacity:1; } 50%{ opacity:.35; } }
@keyframes orb1     { 0%,100%{ transform:translate(0,0) scale(1); } 50%{ transform:translate(40px,-30px) scale(1.15); } }
@keyframes orb2     { 0%,100%{ transform:translate(0,0) scale(1); } 50%{ transform:translate(-30px,40px) scale(0.9); } }
@keyframes countUp  { from{ transform:translateY(8px); opacity:0; } to{ transform:translateY(0); opacity:1; } }

.hero-word { animation: fadeUp .7s ease both; }
.hero-word:nth-child(1){ animation-delay:.1s }
.hero-word:nth-child(2){ animation-delay:.2s }
.hero-word:nth-child(3){ animation-delay:.3s }

.sq-nav-btn { transition: background .2s, color .2s, transform .15s; }
.sq-nav-btn:hover { background: rgba(255,255,255,0.12) !important; transform: translateY(-1px); }

.sq-stat { animation: countUp .5s ease both; }
.sq-stat:nth-child(1){ animation-delay:.4s }
.sq-stat:nth-child(2){ animation-delay:.55s }
.sq-stat:nth-child(3){ animation-delay:.7s }

.sq-feat { animation: fadeUp .6s ease both; cursor:default; transition: transform .25s, background .25s; }
.sq-feat:hover { transform: translateY(-4px); background: rgba(255,255,255,.09) !important; }
.sq-feat:nth-child(1){ animation-delay:.5s }
.sq-feat:nth-child(2){ animation-delay:.6s }
.sq-feat:nth-child(3){ animation-delay:.7s }
.sq-feat:nth-child(4){ animation-delay:.8s }

.sq-step { animation: fadeUp .6s ease both; }
.sq-step:nth-child(1){ animation-delay:.3s }
.sq-step:nth-child(2){ animation-delay:.45s }
.sq-step:nth-child(3){ animation-delay:.6s }

.sq-inp:focus { border-color: #6c5ce7 !important; box-shadow: 0 0 0 3px rgba(108,92,231,.12); }

.sq-btn-primary { transition: transform .15s, box-shadow .15s, opacity .15s; }
.sq-btn-primary:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 12px 30px rgba(108,92,231,.45) !important; }
.sq-btn-primary:active:not(:disabled) { transform: translateY(0); }

.sq-link { transition: color .15s; }
.sq-link:hover { color: #6c5ce7 !important; text-decoration: underline; }

.sq-form-wrap { animation: slideIn .4s ease both; }

.live-dot { animation: ticker 1.8s ease infinite; }

.scroll-indicator { animation: float 2.5s ease infinite; }
`;

/* ──────────────────────────────────────────────── */
export default function AuthPage({ onLogin }) {
  const [view, setView] = useState("home"); // "home" | "login" | "register"
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "USER" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeCount, setActiveCount] = useState(0);

  useEffect(() => {
    const style = document.createElement("style");
    style.textContent = CSS;
    document.head.appendChild(style);
    fetchActiveQueues();
    return () => document.head.removeChild(style);
  }, []);

  const fetchActiveQueues = async () => {
    try {
      const res = await getAllQueues();
      setActiveCount((res.data || []).filter(q => q.status === "ACTIVE").length);
    } catch { setActiveCount(0); }
  };

  const handle = e => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async () => {
    setError(""); setLoading(true);
    try {
      if (view === "login") {
        const res = await loginUser({ email: form.email, password: form.password });
        localStorage.setItem("sqms_user", JSON.stringify(res.data));
        onLogin(res.data);
      } else {
        await registerUser(form);
        setView("login");
        setError("success:Account created! Please sign in.");
      }
    } catch (e) {
      setError(e.response?.data || "Something went wrong. Please try again.");
    }
    setLoading(false);
  };

  const isSuccess = typeof error === "string" && error.startsWith("success:");
  const errorMsg = isSuccess ? error.replace("success:", "") : error;

  /* ── HOME PAGE ── */
  if (view === "home") return <HomePage onLogin={() => setView("login")} onRegister={() => setView("register")} activeCount={activeCount} />;

  /* ── AUTH FORM ── */
  const isLogin = view === "login";

  return (
    <div style={{ minHeight: "100vh", background: "#0d0b1e", display: "flex", flexDirection: "column", fontFamily: "'DM Sans', sans-serif" }}>
      {/* Background orbs */}
      <div style={{ position: "fixed", inset: 0, overflow: "hidden", pointerEvents: "none", zIndex: 0 }}>
        <div style={{ position: "absolute", width: 600, height: 600, borderRadius: "50%", background: "radial-gradient(circle, rgba(108,92,231,.18) 0%, transparent 70%)", top: "-200px", left: "-100px", animation: "orb1 12s ease infinite" }} />
        <div style={{ position: "absolute", width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle, rgba(253,203,110,.1) 0%, transparent 70%)", bottom: "-150px", right: "-100px", animation: "orb2 16s ease infinite" }} />
      </div>

      {/* Navbar */}
      <nav style={{ position: "relative", zIndex: 10, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "22px 48px", borderBottom: "1px solid rgba(255,255,255,.07)" }}>
        <div onClick={() => setView("home")} style={{ display: "flex", alignItems: "center", gap: 11, cursor: "pointer" }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: "linear-gradient(135deg, #f7971e, #ffd200)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, fontWeight: 900, color: "#000", boxShadow: "0 6px 16px rgba(247,151,30,.35)" }}>Q</div>
          <span style={{ fontSize: 20, fontWeight: 800, color: "#fff", letterSpacing: "-0.5px", fontFamily: "'DM Sans', sans-serif" }}>SmartQueue</span>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={() => { setView("login"); setError(""); }} className="sq-nav-btn" style={{ padding: "9px 20px", borderRadius: 10, border: "1.5px solid rgba(255,255,255,.2)", background: isLogin ? "rgba(255,255,255,.12)" : "transparent", color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>Sign In</button>
          <button onClick={() => { setView("register"); setError(""); }} className="sq-nav-btn" style={{ padding: "9px 20px", borderRadius: 10, border: "none", background: "linear-gradient(135deg, #6c5ce7, #a855f7)", color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>Register</button>
        </div>
      </nav>

      {/* Auth Card */}
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 20px", position: "relative", zIndex: 5 }}>
        <div className="sq-form-wrap" style={{ width: "100%", maxWidth: 440, background: "rgba(255,255,255,.04)", backdropFilter: "blur(20px)", border: "1px solid rgba(255,255,255,.1)", borderRadius: 24, padding: "44px 44px 36px" }}>

          {/* Header */}
          <div style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 28, fontWeight: 800, color: "#fff", letterSpacing: "-0.5px", marginBottom: 8, fontFamily: "'DM Sans', sans-serif" }}>
              {isLogin ? "Welcome back 👋" : "Create account ✨"}
            </h2>
            <p style={{ fontSize: 14, color: "rgba(255,255,255,.45)", lineHeight: 1.5 }}>
              {isLogin ? "Sign in to manage your queue" : "Join SmartQueue and get started today"}
            </p>
          </div>

          {/* Fields */}
          <div style={{ display: "flex", flexDirection: "column", gap: 18, marginBottom: 20 }}>
            {!isLogin && (
              <div>
                <label style={{ ...lbl, color: "rgba(255,255,255,.6)" }}>Full Name</label>
                <input name="name" value={form.name} onChange={handle} onKeyDown={e => e.key === "Enter" && submit()} placeholder="John Smith" className="sq-inp" style={{ ...inp, background: "rgba(255,255,255,.07)", border: "1.5px solid rgba(255,255,255,.12)", color: "#fff" }} />
              </div>
            )}
            <div>
              <label style={{ ...lbl, color: "rgba(255,255,255,.6)" }}>Email Address</label>
              <input name="email" type="email" value={form.email} onChange={handle} onKeyDown={e => e.key === "Enter" && submit()} placeholder="you@example.com" className="sq-inp" style={{ ...inp, background: "rgba(255,255,255,.07)", border: "1.5px solid rgba(255,255,255,.12)", color: "#fff" }} />
            </div>
            <div>
              <label style={{ ...lbl, color: "rgba(255,255,255,.6)" }}>Password</label>
              <input name="password" type="password" value={form.password} onChange={handle} onKeyDown={e => e.key === "Enter" && submit()} placeholder="••••••••••" className="sq-inp" style={{ ...inp, background: "rgba(255,255,255,.07)", border: "1.5px solid rgba(255,255,255,.12)", color: "#fff" }} />
            </div>
            {!isLogin && (
              <div>
                <label style={{ ...lbl, color: "rgba(255,255,255,.6)" }}>Account Role</label>
                <select name="role" value={form.role} onChange={handle} className="sq-inp" style={{ ...inp, background: "rgba(255,255,255,.07)", border: "1.5px solid rgba(255,255,255,.12)", color: "#fff" }}>
                  <option value="USER" style={{ background: "#1a1640" }}>👤 User — Customer / Visitor</option>
                  <option value="ADMIN" style={{ background: "#1a1640" }}>⚡ Admin — Staff / Operator</option>
                </select>
              </div>
            )}
          </div>

          {/* Alert */}
          {error && (
            <div style={{ padding: "12px 15px", borderRadius: 10, marginBottom: 18, background: isSuccess ? "rgba(16,185,129,.15)" : "rgba(239,68,68,.15)", border: `1px solid ${isSuccess ? "rgba(16,185,129,.35)" : "rgba(239,68,68,.35)"}`, color: isSuccess ? "#34d399" : "#f87171", fontSize: 13, fontWeight: 500 }}>
              {isSuccess ? "✓" : "⚠"} {errorMsg}
            </div>
          )}

          {/* Submit */}
          <button onClick={submit} disabled={loading} className="sq-btn-primary" style={{ width: "100%", padding: "15px", borderRadius: 12, border: "none", background: "linear-gradient(135deg, #6c5ce7, #a855f7)", color: "#fff", fontSize: 15, fontWeight: 700, cursor: "pointer", boxShadow: "0 8px 24px rgba(108,92,231,.35)", opacity: loading ? 0.7 : 1 }}>
            {loading ? "Please wait…" : isLogin ? "Sign In →" : "Create Account →"}
          </button>

          {/* Footer link */}
          <p style={{ textAlign: "center", fontSize: 13, color: "rgba(255,255,255,.4)", marginTop: 20 }}>
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <span onClick={() => { setView(isLogin ? "register" : "login"); setError(""); }} className="sq-link" style={{ color: "#a78bfa", fontWeight: 700, cursor: "pointer" }}>
              {isLogin ? "Register here" : "Sign in"}
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════
   HOME / LANDING PAGE
══════════════════════════════════════════ */
function HomePage({ onLogin, onRegister, activeCount }) {
  const features = [
    { icon: "⚡", title: "Real-time Tracking", desc: "Live token updates with sub-second latency across all service windows." },
    { icon: "🧠", title: "Smart Estimation", desc: "AI-powered wait time predictions that actually learn from your patterns." },
    { icon: "🎛️", title: "Admin Control", desc: "Full dashboard control — pause, redirect, or accelerate any queue instantly." },
    { icon: "📱", title: "Instant Alerts", desc: "SMS & in-app notifications when your turn is approaching." },
  ];
  const steps = [
    { n: "01", title: "Register & Configure", desc: "Set up your service queues and windows in under 5 minutes." },
    { n: "02", title: "Customers Join Live", desc: "Visitors scan a QR or visit the portal to grab their token." },
    { n: "03", title: "Serve with Precision", desc: "Admin calls tokens, system updates everyone in real time." },
  ];
  const stats = [
    { value: "10x", label: "Faster Service" },
    { value: "98%", label: "Satisfaction Rate" },
    { value: "0", label: "Wait Time Waste" },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "#0a0818", fontFamily: "'DM Sans', sans-serif", overflowX: "hidden" }}>
      {/* Background orbs */}
      <div style={{ position: "fixed", inset: 0, overflow: "hidden", pointerEvents: "none", zIndex: 0 }}>
        <div style={{ position: "absolute", width: 700, height: 700, borderRadius: "50%", background: "radial-gradient(circle, rgba(108,92,231,.15) 0%, transparent 65%)", top: "-200px", right: "-200px", animation: "orb1 15s ease infinite" }} />
        <div style={{ position: "absolute", width: 600, height: 600, borderRadius: "50%", background: "radial-gradient(circle, rgba(253,203,110,.08) 0%, transparent 65%)", bottom: "100px", left: "-150px", animation: "orb2 20s ease infinite" }} />
        <div style={{ position: "absolute", width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle, rgba(168,85,247,.1) 0%, transparent 65%)", top: "40%", left: "45%", animation: "orb1 18s ease infinite reverse" }} />
      </div>

      {/* ─── NAVBAR ─── */}
      <nav style={{ position: "sticky", top: 0, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 60px", background: "rgba(10,8,24,.85)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(255,255,255,.06)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 42, height: 42, borderRadius: 13, background: "linear-gradient(135deg, #f7971e, #ffd200)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, fontWeight: 900, color: "#000", boxShadow: "0 6px 18px rgba(247,151,30,.35)" }}>Q</div>
          <span style={{ fontSize: 20, fontWeight: 800, color: "#fff", letterSpacing: "-0.5px", fontFamily: "'DM Sans', sans-serif" }}>SmartQueue</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button onClick={onLogin} className="sq-nav-btn" style={{ padding: "9px 22px", borderRadius: 10, border: "1.5px solid rgba(255,255,255,.18)", background: "transparent", color: "rgba(255,255,255,.8)", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>Sign In</button>
          <button onClick={onRegister} className="sq-nav-btn" style={{ padding: "9px 22px", borderRadius: 10, border: "none", background: "linear-gradient(135deg, #6c5ce7, #a855f7)", color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer", boxShadow: "0 4px 14px rgba(108,92,231,.4)" }}>Get Started Free</button>
        </div>
      </nav>

      {/* ─── HERO ─── */}
      <section style={{ position: "relative", zIndex: 5, minHeight: "92vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "80px 24px 60px", textAlign: "center" }}>

        {/* Live badge */}
        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "8px 18px", borderRadius: 30, background: "rgba(16,185,129,.12)", border: "1px solid rgba(16,185,129,.3)", marginBottom: 36, animation: "fadeUp .6s ease both" }}>
          <div className="live-dot" style={{ width: 8, height: 8, borderRadius: "50%", background: "#10b981" }} />
          <span style={{ fontSize: 13, fontWeight: 600, color: "#34d399", letterSpacing: "0.5px" }}>{activeCount > 0 ? `${activeCount} queues active right now` : "Intelligent Queue Management"}</span>
        </div>

        {/* Headline */}
        <h1 style={{ fontSize: "clamp(38px, 5.5vw, 68px)", fontWeight: 900, color: "#fff", letterSpacing: "-2px", lineHeight: 1.08, marginBottom: 28, fontFamily: "'DM Sans', sans-serif", maxWidth: 820 }}>
          <span className="hero-word" style={{ display: "inline-block" }}>Queue&nbsp;</span>
          <span className="hero-word" style={{ display: "inline-block", background: "linear-gradient(90deg, #6c5ce7, #ffd200, #a855f7)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundSize: "200% auto", animation: "fadeUp .7s ease both, shimmer 4s linear infinite" }}>Smarter.</span>
          <br />
          <span className="hero-word" style={{ display: "inline-block" }}>Serve&nbsp;</span>
          <span className="hero-word" style={{ display: "inline-block", color: "#ffd200" }}>Faster.</span>
        </h1>

        <p style={{ fontSize: "clamp(16px, 2.5vw, 20px)", color: "rgba(255,255,255,.5)", maxWidth: 580, lineHeight: 1.7, marginBottom: 48, animation: "fadeUp .7s ease .35s both" }}>
          The intelligent queue management platform that eliminates wait time waste, delights customers, and gives operators complete real-time control.
        </p>

        {/* CTAs */}
        <div style={{ display: "flex", gap: 14, flexWrap: "wrap", justifyContent: "center", animation: "fadeUp .7s ease .5s both" }}>
          <button onClick={onRegister} className="sq-btn-primary" style={{ padding: "16px 36px", borderRadius: 14, border: "none", background: "linear-gradient(135deg, #6c5ce7, #a855f7)", color: "#fff", fontSize: 16, fontWeight: 700, cursor: "pointer", boxShadow: "0 8px 28px rgba(108,92,231,.45)" }}>
            Start for Free →
          </button>
          <button onClick={onLogin} className="sq-nav-btn" style={{ padding: "16px 36px", borderRadius: 14, border: "1.5px solid rgba(255,255,255,.2)", background: "transparent", color: "#fff", fontSize: 16, fontWeight: 600, cursor: "pointer" }}>
            Sign In
          </button>
        </div>

        {/* Stats */}
        <div style={{ display: "flex", gap: "clamp(24px, 6vw, 72px)", marginTop: 72, flexWrap: "wrap", justifyContent: "center", animation: "fadeUp .7s ease .65s both" }}>
          {stats.map(s => (
            <div key={s.value} className="sq-stat" style={{ textAlign: "center" }}>
              <div style={{ fontSize: "clamp(28px, 4vw, 42px)", fontWeight: 900, color: "#fff", letterSpacing: "-1.5px", fontFamily: "'DM Sans', sans-serif", lineHeight: 1 }}>{s.value}</div>
              <div style={{ fontSize: 13, color: "rgba(255,255,255,.4)", marginTop: 6, fontWeight: 500, letterSpacing: "0.5px", textTransform: "uppercase" }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Scroll indicator */}
        <div className="scroll-indicator" style={{ position: "absolute", bottom: 32, left: "50%", transform: "translateX(-50%)", display: "flex", flexDirection: "column", alignItems: "center", gap: 6, color: "rgba(255,255,255,.25)", fontSize: 12, fontWeight: 600, letterSpacing: "1px" }}>
          <span>SCROLL</span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12l7 7 7-7"/></svg>
        </div>
      </section>

      {/* ─── FEATURES ─── */}
      <section style={{ position: "relative", zIndex: 5, padding: "100px 24px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          {/* Section header */}
          <div style={{ textAlign: "center", marginBottom: 60 }}>
            <div style={{ display: "inline-block", padding: "5px 16px", borderRadius: 20, background: "rgba(108,92,231,.2)", border: "1px solid rgba(108,92,231,.3)", color: "#a78bfa", fontSize: 12, fontWeight: 700, letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: 20 }}>Features</div>
            <h2 style={{ fontSize: "clamp(24px, 3.5vw, 38px)", fontWeight: 800, color: "#fff", letterSpacing: "-1px", fontFamily: "'DM Sans', sans-serif" }}>Everything you need to run<br /><span style={{ color: "#6c5ce7" }}>flawless queues</span></h2>
          </div>

          {/* Feature grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 24 }}>
            {features.map(f => (
              <div key={f.title} className="sq-feat" style={{ padding: "32px 28px", borderRadius: 20, background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.08)" }}>
                <div style={{ width: 52, height: 52, borderRadius: 16, background: "rgba(108,92,231,.2)", border: "1px solid rgba(108,92,231,.25)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, marginBottom: 20 }}>{f.icon}</div>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: "#fff", marginBottom: 10, letterSpacing: "-0.3px" }}>{f.title}</h3>
                <p style={{ fontSize: 14, color: "rgba(255,255,255,.45)", lineHeight: 1.65 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── HOW IT WORKS ─── */}
      <section style={{ position: "relative", zIndex: 5, padding: "80px 24px", background: "rgba(108,92,231,.04)", borderTop: "1px solid rgba(255,255,255,.05)", borderBottom: "1px solid rgba(255,255,255,.05)" }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 60 }}>
            <div style={{ display: "inline-block", padding: "5px 16px", borderRadius: 20, background: "rgba(253,203,110,.12)", border: "1px solid rgba(253,203,110,.25)", color: "#fcd34d", fontSize: 12, fontWeight: 700, letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: 20 }}>How It Works</div>
            <h2 style={{ fontSize: "clamp(24px, 3.5vw, 36px)", fontWeight: 800, color: "#fff", letterSpacing: "-1px", fontFamily: "'DM Sans', sans-serif" }}>Up and running<br /><span style={{ color: "#fcd34d" }}>in three steps</span></h2>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            {steps.map((s, i) => (
              <div key={s.n} className="sq-step" style={{ display: "flex", alignItems: "flex-start", gap: 28, padding: "28px 32px", borderRadius: 18, background: "rgba(255,255,255,.03)", border: "1px solid rgba(255,255,255,.07)" }}>
                <div style={{ fontSize: "clamp(26px, 3.5vw, 36px)", fontWeight: 900, color: i === 0 ? "#6c5ce7" : i === 1 ? "#fcd34d" : "#10b981", fontFamily: "'DM Sans', sans-serif", opacity: 0.9, flexShrink: 0, lineHeight: 1 }}>{s.n}</div>
                <div>
                  <h3 style={{ fontSize: 18, fontWeight: 700, color: "#fff", marginBottom: 8, letterSpacing: "-0.3px" }}>{s.title}</h3>
                  <p style={{ fontSize: 14, color: "rgba(255,255,255,.45)", lineHeight: 1.65 }}>{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA BANNER ─── */}
      <section style={{ position: "relative", zIndex: 5, padding: "100px 24px", textAlign: "center" }}>
        <div style={{ maxWidth: 700, margin: "0 auto", padding: "60px 48px", borderRadius: 28, background: "linear-gradient(135deg, rgba(108,92,231,.25) 0%, rgba(168,85,247,.15) 100%)", border: "1px solid rgba(108,92,231,.35)", backdropFilter: "blur(20px)" }}>
          <h2 style={{ fontSize: "clamp(24px, 3.5vw, 38px)", fontWeight: 800, color: "#fff", letterSpacing: "-1px", marginBottom: 18, fontFamily: "'DM Sans', sans-serif" }}>
            Ready to eliminate<br />the waiting game?
          </h2>
          <p style={{ fontSize: 16, color: "rgba(255,255,255,.5)", marginBottom: 36, lineHeight: 1.6 }}>
            Join thousands of businesses that trust SmartQueue to deliver exceptional service experiences.
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <button onClick={onRegister} className="sq-btn-primary" style={{ padding: "15px 32px", borderRadius: 12, border: "none", background: "linear-gradient(135deg, #6c5ce7, #a855f7)", color: "#fff", fontSize: 15, fontWeight: 700, cursor: "pointer", boxShadow: "0 8px 24px rgba(108,92,231,.4)" }}>
              Create Free Account
            </button>
            <button onClick={onLogin} className="sq-nav-btn" style={{ padding: "15px 32px", borderRadius: 12, border: "1.5px solid rgba(255,255,255,.2)", background: "transparent", color: "#fff", fontSize: 15, fontWeight: 600, cursor: "pointer" }}>
              Already have account?
            </button>
          </div>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer style={{ position: "relative", zIndex: 5, borderTop: "1px solid rgba(255,255,255,.06)", padding: "40px 60px 32px", fontFamily: "'DM Sans', sans-serif" }}>
        {/* Top row */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 32, marginBottom: 36 }}>
          {/* Brand */}
          <div style={{ maxWidth: 260 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
              <div style={{ width: 32, height: 32, borderRadius: 9, background: "linear-gradient(135deg, #f7971e, #ffd200)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 900, color: "#000" }}>Q</div>
              <span style={{ fontSize: 16, fontWeight: 700, color: "rgba(255,255,255,.7)", fontFamily: "'DM Sans', sans-serif" }}>SmartQueue</span>
            </div>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,.3)", lineHeight: 1.65 }}>Intelligent queue management for modern service businesses. Real-time token tracking, zero wait waste.</p>
          </div>

          {/* Link columns */}
          <div style={{ display: "flex", gap: 48, flexWrap: "wrap" }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,.25)", letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: 14 }}>Product</div>
              {[
                { label: "Features", action: null },
                { label: "How It Works", action: null },
                { label: "Sign In", action: onLogin },
                { label: "Register", action: onRegister },
              ].map(l => (
                <div key={l.label} onClick={l.action || undefined} className={l.action ? "sq-link" : ""} style={{ fontSize: 13, color: "rgba(255,255,255,.4)", marginBottom: 10, cursor: l.action ? "pointer" : "default", fontWeight: 500 }}>{l.label}</div>
              ))}
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,.25)", letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: 14 }}>Support</div>
              {["Documentation", "Contact Us", "System Status", "Report a Bug"].map(l => (
                <div key={l} style={{ fontSize: 13, color: "rgba(255,255,255,.4)", marginBottom: 10, cursor: "default", fontWeight: 500 }}>{l}</div>
              ))}
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,.25)", letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: 14 }}>Legal</div>
              {["Privacy Policy", "Terms of Service", "Cookie Policy", "GDPR"].map(l => (
                <div key={l} style={{ fontSize: 13, color: "rgba(255,255,255,.4)", marginBottom: 10, cursor: "default", fontWeight: 500 }}>{l}</div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom row */}
        <div style={{ borderTop: "1px solid rgba(255,255,255,.06)", paddingTop: 24, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <p style={{ fontSize: 12, color: "rgba(255,255,255,.2)" }}>© 2025 SmartQueue. All rights reserved. Intelligent Queue Management Platform.</p>
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#10b981" }} />
            <span style={{ fontSize: 12, color: "rgba(255,255,255,.25)", fontWeight: 500 }}>All systems operational</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
import { useState, useEffect } from "react";
import { getAllQueues, generateToken, getQueuePosition, getWaitTime } from "../services/api";

export default function UserDashboard({ user, onLogout }) {
  const [queues, setQueues]       = useState([]);
  const [myTokens, setMyTokens]   = useState([]);
  const [activeTab, setActiveTab] = useState("queues");
  const [loading, setLoading]     = useState(false);
  const [toast, setToast]         = useState(null);
  const [waitInfo, setWaitInfo]   = useState({});
  const [posInfo, setPosInfo]     = useState({});

  useEffect(() => { fetchQueues(); }, []);

  const fetchQueues = async () => {
    try { const r = await getAllQueues(); setQueues(r.data || []); } catch {}
  };

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const handleGenerateToken = async (queueId, queueName) => {
    setLoading(true);
    try {
      const res = await generateToken(queueId, user.id, user.role);
      const t = res.data;
      setMyTokens(prev => [t, ...prev]);
      showToast(`Token #${t.tokenNumber} generated for ${queueName}!`);
      setActiveTab("mytokens");
      fetchWaitInfo(t.id);
      fetchPosInfo(t.id);
    } catch (e) {
      showToast(e.response?.data || "Failed to generate token", "error");
    }
    setLoading(false);
  };

  const fetchWaitInfo = async (id) => {
    try { const r = await getWaitTime(id); setWaitInfo(p => ({ ...p, [id]: r.data })); } 
    catch(e) {
        showToast("Failed to fetch wait info",e);
    }
  };
  const fetchPosInfo = async (id) => {
    try { const r = await getQueuePosition(id, user.id); setPosInfo(p => ({ ...p, [id]: r.data })); } 
    catch(e) {
        showToast("Failed to fetch position info",e);
    }
  };
  const refreshToken = (id) => { fetchWaitInfo(id); fetchPosInfo(id); showToast("Refreshed!"); };

  const sc = (status) => ({
    WAITING:   { bg: "#fffbeb", color: "#d97706", dot: "#f59e0b", border: "#fde68a" },
    SERVING:   { bg: "#f0fdf4", color: "#16a34a", dot: "#10b981", border: "#bbf7d0" },
    COMPLETED: { bg: "#eff6ff", color: "#2563eb", dot: "#6366f1", border: "#bfdbfe" },
    NO_SHOW:   { bg: "#fef2f2", color: "#dc2626", dot: "#ef4444", border: "#fecaca" },
  }[status] || { bg: "#f3f4f6", color: "#6b7280", dot: "#9ca3af", border: "#e5e7eb" });

  return (
    <div style={{
      display: "flex",
      width: "100vw",
      minHeight: "100vh",
      fontFamily: "'DM Sans', sans-serif",
      background: "#f1f5f9",
    }}>

      {/* ════ SIDEBAR ════ */}
      <aside style={{
        width: 260,
        minHeight: "100vh",
        background: "linear-gradient(180deg, #0f0c29 0%, #1e1b4b 60%, #302b63 100%)",
        display: "flex",
        flexDirection: "column",
        flexShrink: 0,
        position: "sticky",
        top: 0,
        height: "100vh",
        overflowY: "auto",
      }}>
        {/* Logo */}
        <div style={{
          display: "flex", alignItems: "center", gap: 12,
          padding: "28px 24px 24px",
          borderBottom: "1px solid rgba(255,255,255,0.07)",
        }}>
          <div style={{
            width: 40, height: 40, borderRadius: 12, flexShrink: 0,
            background: "linear-gradient(135deg, #f7971e, #ffd200)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 20, fontWeight: 900, color: "#000",
          }}>Q</div>
          <span style={{ fontSize: 18, fontWeight: 800, color: "#fff", letterSpacing: "-0.4px" }}>SmartQueue</span>
        </div>

        {/* Nav */}
        <div style={{ padding: "24px 14px", flex: 1 }}>
          <p style={{ fontSize: 11, color: "rgba(255,255,255,0.25)", letterSpacing: 1.8, fontWeight: 700, margin: "0 0 12px 8px" }}>NAVIGATION</p>
          {[
            { id: "queues",   icon: "🏢", label: "Available Queues", count: queues.length },
            { id: "mytokens", icon: "🎫", label: "My Tokens",        count: myTokens.length },
          ].map(item => (
            <button key={item.id}
              onClick={() => setActiveTab(item.id)}
              style={{
                display: "flex", alignItems: "center", gap: 12, width: "100%",
                padding: "12px 14px", borderRadius: 12, border: "none",
                cursor: "pointer", textAlign: "left", marginBottom: 4,
                background: activeTab === item.id ? "rgba(255,255,255,0.12)" : "transparent",
                color: activeTab === item.id ? "#fff" : "rgba(255,255,255,0.5)",
                fontSize: 14, fontWeight: activeTab === item.id ? 700 : 500,
              }}>
              <span style={{ fontSize: 18 }}>{item.icon}</span>
              <span style={{ flex: 1 }}>{item.label}</span>
              {item.count > 0 && (
                <span style={{
                  fontSize: 11, fontWeight: 800, padding: "2px 8px", borderRadius: 20,
                  background: activeTab === item.id ? "rgba(255,210,0,0.2)" : "rgba(255,255,255,0.1)",
                  color: activeTab === item.id ? "#ffd200" : "rgba(255,255,255,0.4)",
                }}>{item.count}</span>
              )}
            </button>
          ))}
        </div>

        {/* User + Logout */}
        <div style={{ padding: "16px 14px", borderTop: "1px solid rgba(255,255,255,0.07)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px", marginBottom: 8 }}>
            <div style={{
              width: 38, height: 38, borderRadius: "50%", flexShrink: 0,
              background: "linear-gradient(135deg, #f7971e, #ffd200)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 16, fontWeight: 800, color: "#000",
            }}>{user?.name?.[0]?.toUpperCase()}</div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>{user?.name}</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginTop: 2 }}>{user?.email}</div>
            </div>
          </div>
          <button onClick={onLogout} style={{
            width: "100%", padding: "10px", borderRadius: 10,
            border: "1px solid rgba(255,255,255,0.12)", background: "transparent",
            color: "rgba(255,255,255,0.45)", cursor: "pointer", fontSize: 13, fontWeight: 500,
          }}>↩ Sign Out</button>
        </div>
      </aside>

      {/* ════ MAIN CONTENT ════ */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>

        {/* Topbar */}
        <header style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          padding: "24px 40px", background: "#fff",
          borderBottom: "1px solid #e5e7eb",
          position: "sticky", top: 0, zIndex: 10,
        }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 900, color: "#111", margin: "0 0 4px", letterSpacing: "-0.5px" }}>
              {activeTab === "queues" ? "Available Queues" : "My Tokens"}
            </h1>
            <p style={{ fontSize: 14, color: "#9ca3af", margin: 0 }}>
              {activeTab === "queues"
                ? "Select a queue and get your token instantly"
                : "Track your position and estimated wait time"}
            </p>
          </div>
          <div style={{
            padding: "10px 18px", borderRadius: 50, background: "#f3f4f6",
            fontSize: 14, color: "#374151",
          }}>
            👋 Hello, <strong>{user?.name}</strong>
          </div>
        </header>

        {/* Page Content */}
        <div style={{ flex: 1, padding: "36px 40px", overflowY: "auto" }}>

          {/* ── QUEUES TAB ── */}
          {activeTab === "queues" && (
            queues.length === 0 ? (
              <EmptyState icon="🏢" title="No Queues Available" sub="Ask admin to create queues" action="Retry" onAction={fetchQueues} />
            ) : (
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                gap: 20,
              }}>
                {queues.map(q => (
                  <div key={q.id} style={{
                    background: "#fff", borderRadius: 20,
                    border: "1px solid #e5e7eb",
                    boxShadow: "0 2px 12px rgba(0,0,0,0.05)",
                    display: "flex", flexDirection: "column",
                    overflow: "hidden",
                  }}>
                    <div style={{ padding: "24px 24px 18px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                        <span style={{ fontSize: 40 }}>🏢</span>
                        <span style={{
                          fontSize: 12, fontWeight: 700, padding: "4px 12px", borderRadius: 20,
                          background: q.status === "INACTIVE" ? "#fef2f2" : "#f0fdf4",
                          color: q.status === "INACTIVE" ? "#dc2626" : "#16a34a",
                        }}>
                          {q.status || "ACTIVE"}
                        </span>
                      </div>
                      <h3 style={{ fontSize: 18, fontWeight: 800, color: "#111", margin: "0 0 6px" }}>{q.queueName}</h3>
                      <p style={{ fontSize: 13, color: "#9ca3af", margin: 0 }}>Queue ID · #{q.id}</p>
                    </div>
                    <div style={{ padding: "0 16px 16px" }}>
                      <button
                        onClick={() => handleGenerateToken(q.id, q.queueName)}
                        disabled={loading}
                        style={{
                          width: "100%", padding: "13px", borderRadius: 12, border: "none",
                          background: "linear-gradient(135deg, #302b63, #0f0c29)",
                          color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer",
                          opacity: loading ? 0.7 : 1,
                        }}>
                        🎫 {loading ? "Generating…" : "Get My Token"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )
          )}

          {/* ── MY TOKENS TAB ── */}
          {activeTab === "mytokens" && (
            myTokens.length === 0 ? (
              <EmptyState icon="🎫" title="No Tokens Yet" sub="Go to Available Queues to get your first token" action="Browse Queues" onAction={() => setActiveTab("queues")} />
            ) : (
              <div style={{
                background: "#fff", borderRadius: 20,
                border: "1px solid #e5e7eb",
                boxShadow: "0 2px 12px rgba(0,0,0,0.05)",
                overflow: "hidden",
              }}>
                {/* Table Head */}
                <div style={{
                  display: "flex", padding: "14px 28px",
                  background: "#f8fafc", borderBottom: "2px solid #e5e7eb",
                  fontSize: 11, fontWeight: 800, color: "#9ca3af",
                  letterSpacing: 1, textTransform: "uppercase",
                }}>
                  <span style={{ width: 110 }}>Token #</span>
                  <span style={{ flex: 1 }}>Queue</span>
                  <span style={{ width: 140 }}>Status</span>
                  <span style={{ width: 100 }}>Position</span>
                  <span style={{ width: 180 }}>Wait Time</span>
                  <span style={{ width: 170 }}>Issued At</span>
                  <span style={{ width: 100 }}>Action</span>
                </div>

                {myTokens.map((t, i) => {
                  const c = sc(t.status);
                  return (
                    <div key={t.id} style={{
                      display: "flex", alignItems: "center",
                      padding: "16px 28px", borderBottom: "1px solid #f1f5f9",
                      background: i % 2 === 0 ? "#fff" : "#fafafa",
                    }}>
                      <span style={{ width: 110 }}>
                        <span style={{
                          background: "#1e1b4b", color: "#c4b5fd",
                          padding: "5px 12px", borderRadius: 8,
                          fontSize: 13, fontWeight: 900,
                        }}>
                          #{String(t.tokenNumber).padStart(3, "0")}
                        </span>
                      </span>
                      <span style={{ flex: 1, fontSize: 14, color: "#374151", fontWeight: 600 }}>
                        {t.queue?.queueName || "—"}
                      </span>
                      <span style={{ width: 140 }}>
                        <span style={{
                          display: "inline-flex", alignItems: "center", gap: 6,
                          padding: "5px 12px", borderRadius: 20,
                          background: c.bg, color: c.color,
                          fontSize: 12, fontWeight: 700,
                        }}>
                          <span style={{ width: 6, height: 6, borderRadius: "50%", background: c.dot }} />
                          {t.status}
                        </span>
                      </span>
                      <span style={{ width: 100, fontSize: 14, color: "#6b7280" }}>
                        {t.status === "WAITING" ? (posInfo[t.id] || "—") : "—"}
                      </span>
                      <span style={{ width: 180, fontSize: 14, color: "#6b7280" }}>
                        {t.status === "WAITING"
                          ? (waitInfo[t.id] || "Click refresh")
                          : t.status === "SERVING"
                            ? <span style={{ color: "#16a34a", fontWeight: 700 }}>🔔 Your turn!</span>
                            : "—"}
                      </span>
                      <span style={{ width: 170, fontSize: 12, color: "#9ca3af" }}>
                        {t.createdAt ? new Date(t.createdAt).toLocaleString() : "—"}
                      </span>
                      <span style={{ width: 100 }}>
                        {t.status === "WAITING" && (
                          <button onClick={() => refreshToken(t.id)} style={{
                            padding: "7px 14px", borderRadius: 8,
                            border: "1.5px solid #e5e7eb", background: "#fff",
                            fontSize: 12, fontWeight: 600, cursor: "pointer", color: "#6b7280",
                          }}>↻ Refresh</button>
                        )}
                      </span>
                    </div>
                  );
                })}
              </div>
            )
          )}
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div style={{
          position: "fixed", bottom: 32, right: 32,
          padding: "14px 24px", borderRadius: 14,
          color: "#fff", fontSize: 14, fontWeight: 600,
          boxShadow: "0 8px 32px rgba(0,0,0,0.2)", zIndex: 9999,
          background: toast.type === "error" ? "#ef4444" : toast.type === "info" ? "#3b82f6" : "#10b981",
        }}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}

function EmptyState({ icon, title, sub, action, onAction }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "100px 40px", textAlign: "center" }}>
      <div style={{ fontSize: 64, marginBottom: 20 }}>{icon}</div>
      <h3 style={{ fontSize: 22, fontWeight: 800, color: "#111", margin: "0 0 8px" }}>{title}</h3>
      <p style={{ fontSize: 15, color: "#9ca3af", margin: "0 0 28px" }}>{sub}</p>
      <button onClick={onAction} style={{
        padding: "12px 28px", borderRadius: 12, border: "none",
        background: "linear-gradient(135deg, #302b63, #0f0c29)",
        color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer",
      }}>{action}</button>
    </div>
  );
}
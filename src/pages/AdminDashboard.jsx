import { useState, useEffect } from "react";
import {
  getAllQueues, createQueue, getAllTokens, getTokensByQueue,
  callNextToken, completeToken, markNoShow,
  updateQueueStatus, 
  //deleteQueue, 
  triggerCleanup,
} from "../services/api";

export default function AdminDashboard({ user, onLogout }) {
  const [activeTab, setActiveTab]         = useState("overview");
  const [queues, setQueues]               = useState([]);
  const [allTokens, setAllTokens]         = useState([]);
  const [queueTokens, setQueueTokens]     = useState({});
  const [newQueue, setNewQueue]           = useState({ queueName: "", status: "ACTIVE" });
  const [toast, setToast]                 = useState(null);
  const [loading, setLoading]             = useState(false);
  // const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [actionLoading, setActionLoading] = useState({});
  const [currentTime, setCurrentTime]     = useState(new Date());
  const [cleanupRunning, setCleanupRunning] = useState(false);

  useEffect(() => { fetchAll(); }, []);
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // ─── DATA ───────────────────────────────────
  const fetchAll = async () => {
    try {
      const [qR, tR] = await Promise.all([getAllQueues(), getAllTokens(user?.role)]);
      setQueues(qR.data || []);
      setAllTokens(tR.data || []);
    } catch { showToast("Failed to load data", "error"); }
  };

  const fetchQueueTokens = async (queueId) => {
    try {
      const r = await getTokensByQueue(queueId);
      setQueueTokens(p => ({ ...p, [queueId]: r.data || [] }));
    } catch { showToast("Failed to fetch tokens", "error"); }
  };

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const setQL = (id, val) => setActionLoading(p => ({ ...p, [id]: val }));

  // ─── CLEANUP ────────────────────────────────
  // Trigger manual cleanup immediately (deletes completed tokens > 24h + resequences)
  const handleManualCleanup = async () => {
    setCleanupRunning(true);
    try {
      const res = await triggerCleanup(user?.role);
      showToast("🧹 " + res.data);
      await fetchAll();
    } catch (e) {
      showToast(e.response?.data || "Cleanup failed", "error");
    }
    setCleanupRunning(false);
  };

  // ─── QUEUE ACTIONS ──────────────────────────
  const handleCreateQueue = async () => {
    if (!newQueue.queueName.trim()) return showToast("Queue name is required", "error");
    setLoading(true);
    try {
      await createQueue(newQueue, user?.role);
      showToast(`Queue "${newQueue.queueName}" created!`);
      setNewQueue({ queueName: "", status: "ACTIVE" });
      await fetchAll();
    } catch (e) { showToast(e.response?.data || "Failed to create", "error"); }
    setLoading(false);
  };

  const handleToggleStatus = async (queue) => {
    const next = queue.status === "ACTIVE" ? "PAUSED" : "ACTIVE";
    setQL(queue.id, "toggle");
    try {
      await updateQueueStatus(queue.id, next, user?.role);
      showToast(`"${queue.queueName}" is now ${next}`);
      await fetchAll();
    } catch (e) { showToast(e.response?.data || "Failed", "error"); }
    setQL(queue.id, null);
  };

  const handleSetInactive = async (queue) => {
    setQL(queue.id, "inactive");
    try {
      await updateQueueStatus(queue.id, "INACTIVE", user?.role);
      showToast(`"${queue.queueName}" is now INACTIVE`);
      await fetchAll();
    } catch (e) { showToast(e.response?.data || "Failed", "error"); }
    setQL(queue.id, null);
  };

  // const handleDeleteQueue = async () => {
  //   if (!deleteConfirm) return;
  //   try {
  //     await deleteQueue(deleteConfirm.id, user?.role);
  //     showToast(`Queue "${deleteConfirm.name}" deleted`);
  //     setDeleteConfirm(null);
  //     await fetchAll();
  //   } catch (e) {
  //     showToast(e.response?.data || "Failed to delete", "error");
  //     setDeleteConfirm(null);
  //   }
  // };

  // ─── TOKEN ACTIONS ──────────────────────────
  const handleCallNext = async (queueId) => {
    if (!queueId) return;
    try {
      const r = await callNextToken(queueId, user?.role);
      showToast(`🔔 Now serving #${r.data.tokenNumber}!`);
      await fetchAll(); fetchQueueTokens(queueId);
    } catch (e) { showToast(e.response?.data || "No waiting tokens", "error"); }
  };

  const handleComplete = async (tokenId, queueId) => {
    try {
      await completeToken(tokenId, user?.role);
      showToast("✅ Token completed!");
      await fetchAll(); if (queueId) fetchQueueTokens(queueId);
    } catch (e) { showToast(e.response?.data || "Failed", "error"); }
  };

  const handleNoShow = async (tokenId, queueId) => {
    try {
      await markNoShow(tokenId, user?.role);
      showToast("⚠️ Marked as no-show");
      await fetchAll(); if (queueId) fetchQueueTokens(queueId);
    } catch (e) { showToast(e.response?.data || "Failed", "error"); }
  };

  // ─── HELPERS ────────────────────────────────
  const tsc = (status) => ({
    WAITING:   { bg: "#fffbeb", color: "#d97706", dot: "#f59e0b" },
    SERVING:   { bg: "#f0fdf4", color: "#16a34a", dot: "#10b981" },
    COMPLETED: { bg: "#eff6ff", color: "#2563eb", dot: "#6366f1" },
    NO_SHOW:   { bg: "#fef2f2", color: "#dc2626", dot: "#ef4444" },
  }[status] || { bg: "#f3f4f6", color: "#6b7280", dot: "#9ca3af" });

  const qsc = (status) => ({
    ACTIVE:   { bg: "#f0fdf4", color: "#16a34a", dot: "#10b981", label: "ACTIVE"   },
    PAUSED:   { bg: "#fffbeb", color: "#d97706", dot: "#f59e0b", label: "PAUSED"   },
    INACTIVE: { bg: "#fef2f2", color: "#dc2626", dot: "#ef4444", label: "INACTIVE" },
  }[status] || { bg: "#f3f4f6", color: "#6b7280", dot: "#9ca3af", label: status || "ACTIVE" });

  const formatDateTime = (raw) => {
    if (!raw) return "—";
    try {
      let dt;
      if (Array.isArray(raw)) {
        const [y, mo, d, h = 0, m = 0, s = 0] = raw;
        dt = new Date(y, mo - 1, d, h, m, s);
      } else { dt = new Date(raw); }
      return dt.toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: true });
    } catch { return String(raw).slice(0, 16).replace("T", " "); }
  };

  // Calculate how many hours left before a completed token gets auto-deleted
  const timeUntilDeletion = (completedAt) => {
    if (!completedAt) return null;
    try {
      let ct;
      if (Array.isArray(completedAt)) {
        const [y, mo, d, h = 0, m = 0, s = 0] = completedAt;
        ct = new Date(y, mo - 1, d, h, m, s);
      } else { ct = new Date(completedAt); }
      const deleteAt = new Date(ct.getTime() + 24 * 60 * 60 * 1000);
      const diff = deleteAt - currentTime;
      if (diff <= 0) return "Deleting soon…";
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      return `${h}h ${m}m`;
    } catch { return null; }
  };

  // Count completed tokens
  const completedCount   = allTokens.filter(t => t.status === "COMPLETED").length;
  const expiredCount     = allTokens.filter(t => {
    if (t.status !== "COMPLETED" || !t.completedAt) return false;
    try {
      let ct;
      if (Array.isArray(t.completedAt)) {
        const [y, mo, d, h = 0, m = 0, s = 0] = t.completedAt;
        ct = new Date(y, mo - 1, d, h, m, s);
      } else { ct = new Date(t.completedAt); }
      return (currentTime - ct) >= 24 * 60 * 60 * 1000;
    } catch { return false; }
  }).length;

  const hoursUntil10PM = () => {
    const now = new Date(), ten = new Date();
    ten.setHours(22, 0, 0, 0);
    if (now >= ten) return null;
    const diff = ten - now;
    return `${Math.floor(diff / 3600000)}h ${Math.floor((diff % 3600000) / 60000)}m`;
  };
  const timeLeft  = hoursUntil10PM();
  const isPast10PM = !timeLeft;

  const stats = [
    { label: "Total Queues", value: queues.length,                                          icon: "🏢", color: "#6366f1", bg: "#eef2ff" },
    { label: "Waiting",      value: allTokens.filter(t => t.status === "WAITING").length,   icon: "⏳", color: "#d97706", bg: "#fffbeb" },
    { label: "Now Serving",  value: allTokens.filter(t => t.status === "SERVING").length,   icon: "📢", color: "#16a34a", bg: "#f0fdf4" },
    { label: "Completed",    value: completedCount,                                          icon: "✅", color: "#2563eb", bg: "#eff6ff" },
    { label: "No Shows",     value: allTokens.filter(t => t.status === "NO_SHOW").length,   icon: "❌", color: "#dc2626", bg: "#fef2f2" },
    { label: "Total Tokens", value: allTokens.length,                                       icon: "🎫", color: "#7c3aed", bg: "#f5f3ff" },
  ];

  return (
    <div style={{ display: "flex", width: "100vw", minHeight: "100vh", fontFamily: "'DM Sans', sans-serif", background: "#f1f5f9" }}>

      {/* ══ SIDEBAR ══ */}
      <aside style={{ width: 260, minHeight: "100vh", flexShrink: 0, background: "linear-gradient(180deg, #0f0c29 0%, #1e1b4b 60%, #302b63 100%)", display: "flex", flexDirection: "column", position: "sticky", top: 0, height: "100vh", overflowY: "auto" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "28px 24px 20px", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, flexShrink: 0, background: "linear-gradient(135deg, #f7971e, #ffd200)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, fontWeight: 900, color: "#000" }}>Q</div>
          <span style={{ fontSize: 18, fontWeight: 800, color: "#fff", letterSpacing: "-0.4px" }}>SmartQueue</span>
        </div>
        <div style={{ margin: "14px 14px 0", padding: "8px 14px", borderRadius: 10, textAlign: "center", background: "rgba(255,210,0,0.12)", color: "#ffd200", fontSize: 12, fontWeight: 800, letterSpacing: 0.5 }}>⚡ Admin Panel</div>

        {/* Live Clock */}
        <div style={{ margin: "12px 14px 0", padding: "10px 14px", borderRadius: 10, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", textAlign: "center" }}>
          <div style={{ fontSize: 20, fontWeight: 900, color: "#fff", letterSpacing: "-0.5px" }}>
            {currentTime.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true })}
          </div>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", marginTop: 3 }}>
            {currentTime.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
          </div>
        </div>

        {/* 10PM Warning */}
        {timeLeft && (
          <div style={{ margin: "10px 14px 0", padding: "8px 12px", borderRadius: 10, background: "rgba(220,38,38,0.12)", border: "1px solid rgba(220,38,38,0.2)", textAlign: "center" }}>
            <div style={{ fontSize: 11, color: "#fca5a5", fontWeight: 700 }}>🕕 Auto-inactive in</div>
            <div style={{ fontSize: 15, color: "#f87171", fontWeight: 900 }}>{timeLeft}</div>
          </div>
        )}

        {/* Expired Tokens Warning */}
        {expiredCount > 0 && (
          <div style={{ margin: "10px 14px 0", padding: "8px 12px", borderRadius: 10, background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.3)", textAlign: "center" }}>
            <div style={{ fontSize: 11, color: "#a5b4fc", fontWeight: 700 }}>🧹 {expiredCount} token(s) ready to delete</div>
            <button onClick={handleManualCleanup} disabled={cleanupRunning} style={{ marginTop: 6, padding: "5px 12px", borderRadius: 8, border: "none", background: "#6366f1", color: "#fff", fontSize: 11, fontWeight: 700, cursor: "pointer", opacity: cleanupRunning ? 0.6 : 1 }}>
              {cleanupRunning ? "Cleaning…" : "Clean Now"}
            </button>
          </div>
        )}

        <div style={{ padding: "20px 14px", flex: 1 }}>
          <p style={{ fontSize: 11, color: "rgba(255,255,255,0.25)", letterSpacing: 1.8, fontWeight: 700, margin: "0 0 12px 8px" }}>MENU</p>
          {[
            { id: "overview", icon: "📊", label: "Overview"      },
            { id: "queues",   icon: "🏢", label: "Manage Queues" },
            { id: "tokens",   icon: "🎫", label: "All Tokens"    },
          ].map(item => (
            <button key={item.id}
              onClick={() => { setActiveTab(item.id); if (item.id === "tokens") fetchAll(); }}
              style={{ display: "flex", alignItems: "center", gap: 12, width: "100%", padding: "12px 14px", borderRadius: 12, border: "none", cursor: "pointer", textAlign: "left", marginBottom: 4, background: activeTab === item.id ? "rgba(255,255,255,0.12)" : "transparent", color: activeTab === item.id ? "#fff" : "rgba(255,255,255,0.5)", fontSize: 14, fontWeight: activeTab === item.id ? 700 : 500 }}>
              <span style={{ fontSize: 18 }}>{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </div>

        <div style={{ padding: "16px 14px", borderTop: "1px solid rgba(255,255,255,0.07)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px", marginBottom: 8 }}>
            <div style={{ width: 38, height: 38, borderRadius: "50%", flexShrink: 0, background: "linear-gradient(135deg, #f7971e, #ffd200)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 800, color: "#000" }}>{user?.name?.[0]?.toUpperCase()}</div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>{user?.name}</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginTop: 2 }}>Administrator</div>
            </div>
          </div>
          <button onClick={onLogout} style={{ width: "100%", padding: "10px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.12)", background: "transparent", color: "rgba(255,255,255,0.45)", cursor: "pointer", fontSize: 13, fontWeight: 500 }}>↩ Sign Out</button>
        </div>
      </aside>

      {/* ══ MAIN ══ */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "24px 40px", background: "#fff", borderBottom: "1px solid #e5e7eb", position: "sticky", top: 0, zIndex: 10 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 900, color: "#111", margin: "0 0 4px", letterSpacing: "-0.5px" }}>
              {activeTab === "overview" ? "Dashboard Overview" : activeTab === "queues" ? "Manage Queues" : "All Tokens"}
            </h1>
            <p style={{ fontSize: 14, color: "#9ca3af", margin: 0 }}>
              {activeTab === "overview" ? "Real-time queue monitoring and control"
               : activeTab === "queues"  ? "Create, pause, deactivate and delete queues — auto-inactive at 10:00 PM"
               : "Completed tokens auto-delete after 24 hours and token numbers resequence"}
            </p>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            {activeTab === "tokens" && (
              <button onClick={handleManualCleanup} disabled={cleanupRunning} style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 18px", borderRadius: 10, border: "1.5px solid #e0e7ff", background: "#eef2ff", cursor: "pointer", fontSize: 14, fontWeight: 700, color: "#6366f1", opacity: cleanupRunning ? 0.6 : 1 }}>
                🧹 {cleanupRunning ? "Cleaning…" : "Clean Completed (24h+)"}
              </button>
            )}
            <button onClick={fetchAll} style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 20px", borderRadius: 10, border: "1.5px solid #e5e7eb", background: "#fff", cursor: "pointer", fontSize: 14, fontWeight: 700, color: "#374151" }}>↻ Refresh</button>
          </div>
        </header>

        <div style={{ flex: 1, padding: "36px 40px", overflowY: "auto" }}>

          {/* ══ OVERVIEW ══ */}
          {activeTab === "overview" && (
            <>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 16, marginBottom: 36 }}>
                {stats.map(st => (
                  <div key={st.label} style={{ background: "#fff", borderRadius: 18, padding: "22px 16px", border: "1px solid #e5e7eb", boxShadow: "0 2px 8px rgba(0,0,0,0.04)", textAlign: "center" }}>
                    <div style={{ width: 48, height: 48, borderRadius: 14, background: st.bg, fontSize: 24, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}>{st.icon}</div>
                    <div style={{ fontSize: 32, fontWeight: 900, color: st.color, letterSpacing: "-1.5px", marginBottom: 4 }}>{st.value}</div>
                    <div style={{ fontSize: 11, color: "#9ca3af", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>{st.label}</div>
                  </div>
                ))}
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
                <h2 style={{ fontSize: 18, fontWeight: 800, color: "#111", margin: 0 }}>Queue Control Panel</h2>
                <span style={{ fontSize: 12, fontWeight: 700, padding: "3px 10px", background: "#f3f4f6", color: "#6b7280", borderRadius: 20 }}>{queues.length} queues</span>
              </div>

              {queues.length === 0 ? (
                <div style={{ padding: "60px", textAlign: "center", color: "#9ca3af", background: "#fff", borderRadius: 20, border: "1px solid #e5e7eb" }}>No queues yet. Go to Manage Queues to create one.</div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 20 }}>
                  {queues.map(q => {
                    const tokens = queueTokens[q.id] || [];
                    const waiting = tokens.filter(t => t.status === "WAITING");
                    const serving = tokens.find(t => t.status === "SERVING");
                    const qs = qsc(q.status);
                    const isPaused = q.status === "PAUSED", isInactive = q.status === "INACTIVE";
                    return (
                      <div key={q.id} style={{ background: "#fff", borderRadius: 20, padding: "24px", border: `1px solid ${isPaused ? "#fde68a" : isInactive ? "#fecaca" : "#e5e7eb"}`, boxShadow: "0 2px 8px rgba(0,0,0,0.04)", opacity: isInactive ? 0.7 : 1 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
                          <div>
                            <div style={{ fontSize: 11, color: "#9ca3af", fontWeight: 700, marginBottom: 4 }}>Queue #{q.displayId ?? q.id}</div>
                            <h3 style={{ fontSize: 16, fontWeight: 800, color: "#111", margin: "0 0 6px" }}>{q.queueName}</h3>
                            <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20, background: qs.bg, color: qs.color }}>
                              <span style={{ width: 6, height: 6, borderRadius: "50%", background: qs.dot }} />{qs.label}
                            </span>
                          </div>
                          <div style={{ display: "flex", gap: 6 }}>
                            <button onClick={() => fetchQueueTokens(q.id)} style={{ padding: "6px 12px", borderRadius: 8, border: "1.5px solid #e5e7eb", background: "#fff", cursor: "pointer", fontSize: 11, fontWeight: 600, color: "#6b7280" }}>Load</button>
                            {!isInactive && <button onClick={() => handleCallNext(q.id)} style={{ padding: "6px 12px", borderRadius: 8, border: "none", background: "linear-gradient(135deg, #302b63, #0f0c29)", color: "#fff", cursor: "pointer", fontSize: 11, fontWeight: 700 }}>📢 Next</button>}
                          </div>
                        </div>
                        {isPaused && <div style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 10, padding: "10px 14px", marginBottom: 12, fontSize: 13, color: "#d97706", fontWeight: 600, textAlign: "center" }}>⏸ Paused — no new tokens</div>}
                        {isInactive && <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10, padding: "10px 14px", marginBottom: 12, fontSize: 13, color: "#dc2626", fontWeight: 600, textAlign: "center" }}>🚫 Inactive</div>}
                        {serving && !isInactive ? (
                          <div style={{ background: "linear-gradient(135deg, #1e1b4b, #302b63)", borderRadius: 16, padding: "16px 20px", marginBottom: 12 }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                              <span style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", letterSpacing: 2.5, fontWeight: 700 }}>NOW SERVING</span>
                              <span style={{ fontSize: 26, fontWeight: 900, color: "#ffd200" }}>#{String(serving.tokenNumber).padStart(3, "0")}</span>
                            </div>
                            <div style={{ display: "flex", gap: 8 }}>
                              <button onClick={() => handleComplete(serving.id, q.id)} style={{ flex: 1, padding: "8px", borderRadius: 10, border: "none", background: "#16a34a", color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>✓ Complete</button>
                              <button onClick={() => handleNoShow(serving.id, q.id)} style={{ flex: 1, padding: "8px", borderRadius: 10, border: "none", background: "#dc2626", color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>✗ No Show</button>
                            </div>
                          </div>
                        ) : !isInactive && !isPaused ? (
                          <div style={{ background: "#f8fafc", borderRadius: 10, padding: "12px 14px", fontSize: 13, color: "#9ca3af", textAlign: "center", marginBottom: 12 }}>No token currently serving</div>
                        ) : null}
                        {tokens.length > 0 && (
                          <div style={{ display: "flex", gap: 20, padding: "10px 0", borderTop: "1px solid #f1f5f9", borderBottom: "1px solid #f1f5f9", marginBottom: 12 }}>
                            <span style={{ fontSize: 13, color: "#d97706" }}><strong>{waiting.length}</strong> waiting</span>
                            <span style={{ fontSize: 13, color: "#6b7280" }}><strong>{tokens.filter(t => t.status === "COMPLETED").length}</strong> completed</span>
                          </div>
                        )}
                        {tokens.slice(0, 4).map(t => {
                          const c = tsc(t.status);
                          return (
                            <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "7px 10px", background: "#f8fafc", borderRadius: 8, marginBottom: 4 }}>
                              <span style={{ fontSize: 12, fontWeight: 800, color: "#111", minWidth: 36 }}>#{t.tokenNumber}</span>
                              <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 20, background: c.bg, color: c.color, flex: 1 }}>
                                <span style={{ width: 4, height: 4, borderRadius: "50%", background: c.dot }} />{t.status}
                              </span>
                              {t.status === "SERVING" && (
                                <div style={{ display: "flex", gap: 4 }}>
                                  <button onClick={() => handleComplete(t.id, q.id)} style={{ width: 26, height: 26, borderRadius: 7, border: "none", background: "#dcfce7", color: "#16a34a", fontWeight: 800, cursor: "pointer", fontSize: 12 }}>✓</button>
                                  <button onClick={() => handleNoShow(t.id, q.id)} style={{ width: 26, height: 26, borderRadius: 7, border: "none", background: "#fee2e2", color: "#dc2626", fontWeight: 800, cursor: "pointer", fontSize: 12 }}>✗</button>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}

          {/* ══ MANAGE QUEUES ══ */}
          {activeTab === "queues" && (
            <>
              <div style={{ background: "#fff", borderRadius: 20, padding: "28px 32px", border: "1px solid #e5e7eb", boxShadow: "0 2px 8px rgba(0,0,0,0.04)", marginBottom: 20 }}>
                <h3 style={{ fontSize: 17, fontWeight: 800, color: "#111", margin: "0 0 22px" }}>➕ Create New Queue</h3>
                <div style={{ display: "flex", gap: 16, alignItems: "flex-end", flexWrap: "wrap" }}>
                  <div style={{ flex: 1, minWidth: 200 }}>
                    <label style={lbl}>Queue Name</label>
                    <input value={newQueue.queueName} onChange={e => setNewQueue({ ...newQueue, queueName: e.target.value })} onKeyDown={e => e.key === "Enter" && handleCreateQueue()} placeholder="e.g. Counter A, Billing…" style={inp} />
                  </div>
                  <div style={{ width: 190 }}>
                    <label style={lbl}>Initial Status</label>
                    <select value={newQueue.status} onChange={e => setNewQueue({ ...newQueue, status: e.target.value })} style={inp}>
                      <option value="ACTIVE">Active</option>
                      <option value="PAUSED">Paused</option>
                      <option value="INACTIVE">Inactive</option>
                    </select>
                  </div>
                  <button onClick={handleCreateQueue} disabled={loading} style={{ padding: "13px 28px", borderRadius: 12, border: "none", background: "linear-gradient(135deg, #302b63, #0f0c29)", color: "#fff", fontSize: 14, fontWeight: 800, cursor: "pointer", whiteSpace: "nowrap", opacity: loading ? 0.7 : 1 }}>
                    {loading ? "Creating…" : "+ Create Queue"}
                  </button>
                </div>
              </div>

              {/* 10PM notice */}
              <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 20px", background: isPast10PM ? "#fef2f2" : "#fffbeb", border: `1px solid ${isPast10PM ? "#fecaca" : "#fde68a"}`, borderRadius: 14, marginBottom: 20 }}>
                <span style={{ fontSize: 20 }}>{isPast10PM ? "🚫" : "🕕"}</span>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: isPast10PM ? "#dc2626" : "#d97706" }}>
                    {isPast10PM ? "Past 10:00 PM — all queues were automatically set to INACTIVE" : `Auto-inactive at 10:00 PM — ${timeLeft} remaining`}
                  </div>
                  <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 2 }}>Every day at 10:00 PM, all active and paused queues are automatically deactivated.</div>
                </div>
              </div>

              {/* Legend */}
              <div style={{ display: "flex", alignItems: "center", gap: 24, marginBottom: 20, padding: "14px 20px", background: "#fff", borderRadius: 14, border: "1px solid #e5e7eb", flexWrap: "wrap" }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: "#6b7280" }}>Status:</span>
                {[{ label: "Active", bg: "#f0fdf4", color: "#16a34a", dot: "#10b981" }, { label: "Paused", bg: "#fffbeb", color: "#d97706", dot: "#f59e0b" }, { label: "Inactive", bg: "#fef2f2", color: "#dc2626", dot: "#ef4444" }].map(s => (
                  <span key={s.label} style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12, fontWeight: 700, padding: "3px 10px", borderRadius: 20, background: s.bg, color: s.color }}>
                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: s.dot }} />{s.label}
                  </span>
                ))}
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                <h2 style={{ fontSize: 18, fontWeight: 800, color: "#111", margin: 0 }}>All Queues</h2>
                <span style={{ fontSize: 12, fontWeight: 700, padding: "3px 10px", background: "#f3f4f6", color: "#6b7280", borderRadius: 20 }}>{queues.length} total</span>
              </div>

              <div style={{ background: "#fff", borderRadius: 20, border: "1px solid #e5e7eb", overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
                <div style={{ display: "flex", alignItems: "center", padding: "14px 28px", background: "#f8fafc", borderBottom: "2px solid #e5e7eb", fontSize: 11, fontWeight: 800, color: "#9ca3af", letterSpacing: 1, textTransform: "uppercase" }}>
                  <span style={{ width: 60 }}>ID</span>
                  <span style={{ flex: 1 }}>Queue Name</span>
                  <span style={{ width: 130 }}>Status</span>
                  <span style={{ width: 200 }}>Created At</span>
                  <span style={{ width: 380 }}>Actions</span>
                </div>
                {queues.length === 0 ? (
                  <div style={{ padding: "48px", textAlign: "center", color: "#9ca3af" }}>No queues yet.</div>
                ) : queues.map((q, i) => {
                  const qs = qsc(q.status), isL = actionLoading[q.id];
                  return (
                    <div key={q.id} style={{ display: "flex", alignItems: "center", padding: "16px 28px", borderBottom: "1px solid #f1f5f9", background: i % 2 === 0 ? "#fff" : "#fafafa" }}>
                      <span style={{ width: 60, fontSize: 13, color: "#9ca3af", fontWeight: 700 }}>#{q.displayId ?? q.id}</span>
                      <span style={{ flex: 1, fontSize: 15, fontWeight: 700, color: "#111" }}>{q.queueName}</span>
                      <span style={{ width: 130 }}>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "5px 12px", borderRadius: 20, fontSize: 12, fontWeight: 700, background: qs.bg, color: qs.color }}>
                          <span style={{ width: 6, height: 6, borderRadius: "50%", background: qs.dot }} />{qs.label}
                        </span>
                      </span>
                      <span style={{ width: 200, fontSize: 13, color: "#6b7280" }}>{formatDateTime(q.createdAt)}</span>
                      <span style={{ width: 380, display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                        {q.status === "ACTIVE" && <button disabled={!!isL} onClick={() => handleToggleStatus(q)} style={{ padding: "7px 14px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 12, fontWeight: 700, background: "#fffbeb", color: "#d97706", opacity: isL === "toggle" ? 0.6 : 1 }}>{isL === "toggle" ? "…" : "⏸ Pause"}</button>}
                        {q.status === "PAUSED" && <button disabled={!!isL} onClick={() => handleToggleStatus(q)} style={{ padding: "7px 14px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 12, fontWeight: 700, background: "#f0fdf4", color: "#16a34a", opacity: isL === "toggle" ? 0.6 : 1 }}>{isL === "toggle" ? "…" : "▶ Resume"}</button>}
                        {q.status === "INACTIVE" && <button disabled={!!isL} onClick={() => handleToggleStatus(q)} style={{ padding: "7px 14px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 12, fontWeight: 700, background: "#f0fdf4", color: "#16a34a", opacity: isL === "toggle" ? 0.6 : 1 }}>{isL === "toggle" ? "…" : "▶ Activate"}</button>}
                        {q.status !== "INACTIVE" && <button disabled={!!isL} onClick={() => handleSetInactive(q)} style={{ padding: "7px 14px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 12, fontWeight: 700, background: "#fef2f2", color: "#dc2626", opacity: isL === "inactive" ? 0.6 : 1 }}>{isL === "inactive" ? "…" : "🚫 Deactivate"}</button>}
                        {q.status === "ACTIVE" && <button onClick={() => handleCallNext(q.id)} style={{ padding: "7px 14px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 12, fontWeight: 700, background: "#eef2ff", color: "#6366f1" }}>📢 Call Next</button>}
                        {/* <button onClick={() => setDeleteConfirm({ id: q.id, name: q.queueName })} style={{ padding: "7px 14px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 12, fontWeight: 700, background: "#fff1f2", color: "#be123c" }}>🗑 Delete</button> */}
                      </span>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {/* ══ ALL TOKENS ══ */}
          {activeTab === "tokens" && (
            <>
              {/* Info Banner */}
              <div style={{ display: "flex", alignItems: "center", gap: 16, padding: "16px 22px", background: "#fff", border: "1px solid #e5e7eb", borderRadius: 16, marginBottom: 24, flexWrap: "wrap" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 24 }}>🧹</span>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: "#111" }}>Auto-cleanup: every hour on the hour</div>
                    <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 2 }}>
                      Completed tokens older than 24h are automatically deleted. Remaining token numbers resequence from #1.
                    </div>
                  </div>
                </div>
                <div style={{ marginLeft: "auto", display: "flex", gap: 16, alignItems: "center" }}>
                  {expiredCount > 0 && (
                    <span style={{ fontSize: 13, fontWeight: 700, color: "#6366f1", background: "#eef2ff", padding: "6px 14px", borderRadius: 20 }}>
                      {expiredCount} token(s) eligible for deletion
                    </span>
                  )}
                  <button onClick={handleManualCleanup} disabled={cleanupRunning} style={{ padding: "10px 20px", borderRadius: 10, border: "none", background: "linear-gradient(135deg, #6366f1, #8b5cf6)", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", opacity: cleanupRunning ? 0.6 : 1 }}>
                    {cleanupRunning ? "⏳ Running…" : "🧹 Run Cleanup Now"}
                  </button>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                <h2 style={{ fontSize: 18, fontWeight: 800, color: "#111", margin: 0 }}>All Tokens</h2>
                <span style={{ fontSize: 12, fontWeight: 700, padding: "3px 10px", background: "#f3f4f6", color: "#6b7280", borderRadius: 20 }}>{allTokens.length} total</span>
                {completedCount > 0 && <span style={{ fontSize: 12, fontWeight: 700, padding: "3px 10px", background: "#eff6ff", color: "#2563eb", borderRadius: 20 }}>{completedCount} completed</span>}
              </div>

              <div style={{ background: "#fff", borderRadius: 20, border: "1px solid #e5e7eb", overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
                <div style={{ display: "flex", alignItems: "center", padding: "14px 28px", background: "#f8fafc", borderBottom: "2px solid #e5e7eb", fontSize: 11, fontWeight: 800, color: "#9ca3af", letterSpacing: 1, textTransform: "uppercase" }}>
                  <span style={{ width: 50 }}>#</span>
                  <span style={{ width: 110 }}>Token</span>
                  <span style={{ flex: 1 }}>Queue</span>
                  <span style={{ flex: 1 }}>User</span>
                  <span style={{ width: 130 }}>Status</span>
                  <span style={{ width: 180 }}>Completed At</span>
                  <span style={{ width: 150 }}>Deletes In</span>
                  <span style={{ width: 170 }}>Actions</span>
                </div>

                {allTokens.length === 0 ? (
                  <div style={{ padding: "48px", textAlign: "center", color: "#9ca3af" }}>No tokens found.</div>
                ) : allTokens.map((t, i) => {
                  const c         = tsc(t.status);
                  const countdown = t.status === "COMPLETED" ? timeUntilDeletion(t.completedAt) : null;
                  const isExpired = countdown === "Deleting soon…";

                  return (
                    <div key={t.id} style={{
                      display: "flex", alignItems: "center",
                      padding: "15px 28px", borderBottom: "1px solid #f1f5f9",
                      background: isExpired ? "#fefce8" : i % 2 === 0 ? "#fff" : "#fafafa",
                    }}>
                      <span style={{ width: 50, fontSize: 12, color: "#d1d5db" }}>{i + 1}</span>
                      <span style={{ width: 110 }}>
                        <span style={{ background: "#1e1b4b", color: "#c4b5fd", padding: "5px 12px", borderRadius: 8, fontSize: 13, fontWeight: 900 }}>
                          #{String(t.tokenNumber).padStart(3, "0")}
                        </span>
                      </span>
                      <span style={{ flex: 1, fontSize: 14, color: "#374151", fontWeight: 500 }}>{t.queue?.queueName || "—"}</span>
                      <span style={{ flex: 1, fontSize: 14, color: "#374151" }}>{t.user?.name || "—"}</span>
                      <span style={{ width: 130 }}>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 12px", borderRadius: 20, background: c.bg, color: c.color, fontSize: 12, fontWeight: 700 }}>
                          <span style={{ width: 6, height: 6, borderRadius: "50%", background: c.dot }} />{t.status}
                        </span>
                      </span>
                      {/* Completed At */}
                      <span style={{ width: 180, fontSize: 12, color: "#6b7280" }}>
                        {t.status === "COMPLETED" ? formatDateTime(t.completedAt) : "—"}
                      </span>
                      {/* Countdown until auto-delete */}
                      <span style={{ width: 150 }}>
                        {countdown ? (
                          <span style={{
                            fontSize: 12, fontWeight: 700, padding: "4px 10px", borderRadius: 20,
                            background: isExpired ? "#fef9c3" : "#f5f3ff",
                            color: isExpired ? "#a16207" : "#7c3aed",
                          }}>
                            {isExpired ? "⚠ " : "🕐 "}{countdown}
                          </span>
                        ) : "—"}
                      </span>
                      <span style={{ width: 170, display: "flex", gap: 8, alignItems: "center" }}>
                        {t.status === "WAITING" && (
                          <button onClick={() => handleCallNext(t.queue?.id)} style={{ padding: "6px 14px", borderRadius: 8, border: "none", background: "#eff6ff", color: "#2563eb", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>Call Next</button>
                        )}
                        {t.status === "SERVING" && (
                          <>
                            <button onClick={() => handleComplete(t.id, t.queue?.id)} style={{ padding: "6px 14px", borderRadius: 8, border: "none", background: "#f0fdf4", color: "#16a34a", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>Complete</button>
                            <button onClick={() => handleNoShow(t.id, t.queue?.id)} style={{ padding: "6px 14px", borderRadius: 8, border: "none", background: "#fef2f2", color: "#dc2626", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>No Show</button>
                          </>
                        )}
                      </span>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ══ DELETE MODAL ══ */}
      {/* {deleteConfirm && (
        <div style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: "#fff", borderRadius: 24, padding: "40px", width: 440, boxShadow: "0 24px 64px rgba(0,0,0,0.25)" }}>
            <div style={{ fontSize: 48, textAlign: "center", marginBottom: 20 }}>🗑</div>
            <h3 style={{ fontSize: 22, fontWeight: 900, color: "#111", margin: "0 0 10px", textAlign: "center" }}>Delete Queue?</h3>
            <p style={{ fontSize: 15, color: "#6b7280", textAlign: "center", margin: "0 0 8px" }}>Permanently deleting:</p>
            <p style={{ fontSize: 16, fontWeight: 800, color: "#111", textAlign: "center", margin: "0 0 20px", padding: "12px 20px", background: "#f8fafc", borderRadius: 12 }}>"{deleteConfirm.name}"</p>
            <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 12, padding: "12px 16px", marginBottom: 16, fontSize: 13, color: "#dc2626", fontWeight: 500 }}>⚠️ This cannot be undone.</div>
            <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 12, padding: "12px 16px", marginBottom: 28, fontSize: 13, color: "#2563eb", fontWeight: 500 }}>ℹ️ Queue IDs will be resequenced automatically.</div>
            <div style={{ display: "flex", gap: 12 }}>
              <button onClick={() => setDeleteConfirm(null)} style={{ flex: 1, padding: "14px", borderRadius: 12, border: "1.5px solid #e5e7eb", background: "#fff", fontSize: 15, fontWeight: 700, cursor: "pointer", color: "#374151" }}>Cancel</button>
              <button onClick={handleDeleteQueue} style={{ flex: 1, padding: "14px", borderRadius: 12, border: "none", background: "linear-gradient(135deg, #dc2626, #b91c1c)", color: "#fff", fontSize: 15, fontWeight: 800, cursor: "pointer" }}>Yes, Delete</button>
            </div>
          </div>
        </div>
      )} */}

      {/* ══ TOAST ══ */}
      {toast && (
        <div style={{ position: "fixed", bottom: 32, right: 32, padding: "14px 24px", borderRadius: 14, color: "#fff", fontSize: 14, fontWeight: 600, boxShadow: "0 8px 32px rgba(0,0,0,0.2)", zIndex: 9999, background: toast.type === "error" ? "#ef4444" : "#10b981" }}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}

const lbl = { display: "block", fontSize: 13, fontWeight: 700, color: "#374151", marginBottom: 8 };
const inp = { width: "100%", padding: "13px 16px", borderRadius: 12, border: "1.5px solid #e5e7eb", fontSize: 14, color: "#111", background: "#fafafa", boxSizing: "border-box", fontFamily: "'DM Sans', sans-serif" };
import { useState, useEffect } from "react";
import {
  getAllQueues, createQueue, getAllTokens, getTokensByQueue,
  callNextToken, completeToken, markNoShow
} from "../services/api";

export default function AdminDashboard({ user, onLogout }) {
  const [activeTab, setActiveTab]     = useState("overview");
  const [queues, setQueues]           = useState([]);
  const [allTokens, setAllTokens]     = useState([]);
  const [queueTokens, setQueueTokens] = useState({});
  const [newQueue, setNewQueue]       = useState({ queueName: "", status: "ACTIVE" });
  const [toast, setToast]             = useState(null);
  const [loading, setLoading]         = useState(false);

  useEffect(() => { fetchAll(); }, []);

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
    } catch(e) {
        showToast("Failed to fetch token",e);
    }
  };

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const handleCreateQueue = async () => {
    if (!newQueue.queueName.trim()) return showToast("Queue name is required", "error");
    setLoading(true);
    try {
      await createQueue(newQueue, user?.role);
      showToast(`Queue "${newQueue.queueName}" created!`);
      setNewQueue({ queueName: "", status: "ACTIVE" });
      fetchAll();
    } catch (e) { showToast(e.response?.data || "Failed to create", "error"); }
    setLoading(false);
  };

  const handleCallNext = async (queueId) => {
    if (!queueId) return;
    try {
      const r = await callNextToken(queueId, user?.role);
      showToast(`🔔 Now serving token #${r.data.tokenNumber}!`);
      fetchAll(); fetchQueueTokens(queueId);
    } catch (e) { showToast(e.response?.data || "No waiting tokens", "error"); }
  };

  const handleComplete = async (tokenId, queueId) => {
    try {
      await completeToken(tokenId, user?.role);
      showToast("✅ Token completed!");
      fetchAll(); if (queueId) fetchQueueTokens(queueId);
    } catch (e) { showToast(e.response?.data || "Failed", "error"); }
  };

  const handleNoShow = async (tokenId, queueId) => {
    try {
      await markNoShow(tokenId, user?.role);
      showToast("⚠️ Marked as no-show");
      fetchAll(); if (queueId) fetchQueueTokens(queueId);
    } catch (e) { showToast(e.response?.data || "Failed", "error"); }
  };

  // Add these handlers inside AdminDashboard component
const handleToggleStatus = async (queue) => {
  const newStatus = queue.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
  try {
    await updateQueueStatus(queue.id, newStatus, user?.role);
    showToast(`Queue "${queue.queueName}" set to ${newStatus}`);
    fetchAll();
  } catch (e) {
    showToast(e.response?.data || "Failed to update status", "error");
  }
};

const handleDeleteQueue = async (queueId, queueName) => {
  if (!window.confirm(`Delete queue "${queueName}"? This cannot be undone.`)) return;
  try {
    await deleteQueue(queueId, user?.role);
    showToast(`Queue "${queueName}" deleted`);
    fetchAll();
  } catch (e) {
    showToast(e.response?.data || "Failed to delete queue", "error");
  }
};


  const sc = (status) => ({
    WAITING:   { bg: "#fffbeb", color: "#d97706", dot: "#f59e0b" },
    SERVING:   { bg: "#f0fdf4", color: "#16a34a", dot: "#10b981" },
    COMPLETED: { bg: "#eff6ff", color: "#2563eb", dot: "#6366f1" },
    NO_SHOW:   { bg: "#fef2f2", color: "#dc2626", dot: "#ef4444" },
  }[status] || { bg: "#f3f4f6", color: "#6b7280", dot: "#9ca3af" });

  const stats = [
    { label: "Total Queues",  value: queues.length,                                           icon: "🏢", color: "#6366f1", bg: "#eef2ff" },
    { label: "Waiting",       value: allTokens.filter(t => t.status === "WAITING").length,    icon: "⏳", color: "#d97706", bg: "#fffbeb" },
    { label: "Now Serving",   value: allTokens.filter(t => t.status === "SERVING").length,    icon: "📢", color: "#16a34a", bg: "#f0fdf4" },
    { label: "Completed",     value: allTokens.filter(t => t.status === "COMPLETED").length,  icon: "✅", color: "#2563eb", bg: "#eff6ff" },
    { label: "No Shows",      value: allTokens.filter(t => t.status === "NO_SHOW").length,    icon: "❌", color: "#dc2626", bg: "#fef2f2" },
    { label: "Total Tokens",  value: allTokens.length,                                        icon: "🎫", color: "#7c3aed", bg: "#f5f3ff" },
  ];

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
          padding: "28px 24px 20px",
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

        {/* Admin Badge */}
        <div style={{
          margin: "14px 14px 0", padding: "8px 14px", borderRadius: 10, textAlign: "center",
          background: "rgba(255,210,0,0.12)", color: "#ffd200",
          fontSize: 12, fontWeight: 800, letterSpacing: 0.5,
        }}>⚡ Admin Panel</div>

        {/* Nav */}
        <div style={{ padding: "20px 14px", flex: 1 }}>
          <p style={{ fontSize: 11, color: "rgba(255,255,255,0.25)", letterSpacing: 1.8, fontWeight: 700, margin: "0 0 12px 8px" }}>MENU</p>
          {[
            { id: "overview", icon: "📊", label: "Overview" },
            { id: "queues",   icon: "🏢", label: "Manage Queues" },
            { id: "tokens",   icon: "🎫", label: "All Tokens" },
          ].map(item => (
            <button key={item.id}
              onClick={() => { setActiveTab(item.id); if (item.id === "tokens") fetchAll(); }}
              style={{
                display: "flex", alignItems: "center", gap: 12, width: "100%",
                padding: "12px 14px", borderRadius: 12, border: "none",
                cursor: "pointer", textAlign: "left", marginBottom: 4,
                background: activeTab === item.id ? "rgba(255,255,255,0.12)" : "transparent",
                color: activeTab === item.id ? "#fff" : "rgba(255,255,255,0.5)",
                fontSize: 14, fontWeight: activeTab === item.id ? 700 : 500,
              }}>
              <span style={{ fontSize: 18 }}>{item.icon}</span>
              <span>{item.label}</span>
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
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginTop: 2 }}>Administrator</div>
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
              {activeTab === "overview" ? "Dashboard Overview"
               : activeTab === "queues" ? "Manage Queues"
               : "All Tokens"}
            </h1>
            <p style={{ fontSize: 14, color: "#9ca3af", margin: 0 }}>
              {activeTab === "overview" ? "Real-time queue monitoring and control"
               : activeTab === "queues" ? "Create and configure service queues"
               : "View and manage all token statuses"}
            </p>
          </div>
          <button onClick={fetchAll} style={{
            display: "flex", alignItems: "center", gap: 8,
            padding: "10px 20px", borderRadius: 10,
            border: "1.5px solid #e5e7eb", background: "#fff",
            cursor: "pointer", fontSize: 14, fontWeight: 700, color: "#374151",
          }}>↻ Refresh</button>
        </header>

        {/* Content */}
        <div style={{ flex: 1, padding: "36px 40px", overflowY: "auto" }}>

          {/* ════ OVERVIEW ════ */}
          {activeTab === "overview" && (
            <>
              {/* Stat Cards */}
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(6, 1fr)",
                gap: 16, marginBottom: 36,
              }}>
                {stats.map(st => (
                  <div key={st.label} style={{
                    background: "#fff", borderRadius: 18, padding: "22px 16px",
                    border: "1px solid #e5e7eb",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                    textAlign: "center",
                  }}>
                    <div style={{
                      width: 48, height: 48, borderRadius: 14, marginBottom: 12,
                      background: st.bg, fontSize: 24,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      margin: "0 auto 12px",
                    }}>{st.icon}</div>
                    <div style={{ fontSize: 32, fontWeight: 900, color: st.color, letterSpacing: "-1.5px", marginBottom: 4 }}>{st.value}</div>
                    <div style={{ fontSize: 11, color: "#9ca3af", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>{st.label}</div>
                  </div>
                ))}
              </div>

              {/* Queue Control Panel */}
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
                <h2 style={{ fontSize: 18, fontWeight: 800, color: "#111", margin: 0 }}>Queue Control Panel</h2>
                <span style={{ fontSize: 12, fontWeight: 700, padding: "3px 10px", background: "#f3f4f6", color: "#6b7280", borderRadius: 20 }}>
                  {queues.length} queues
                </span>
              </div>

              {queues.length === 0 ? (
                <div style={{ padding: "60px", textAlign: "center", color: "#9ca3af", background: "#fff", borderRadius: 20, border: "1px solid #e5e7eb" }}>
                  No queues yet. Go to Manage Queues to create one.
                </div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 20 }}>
                  {queues.map(q => {
                    const tokens  = queueTokens[q.id] || [];
                    const waiting = tokens.filter(t => t.status === "WAITING");
                    const serving = tokens.find(t => t.status === "SERVING");
                    return (
                      <div key={q.id} style={{
                        background: "#fff", borderRadius: 20, padding: "24px",
                        border: "1px solid #e5e7eb", boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                      }}>
                        {/* Card Top */}
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18 }}>
                          <div>
                            <h3 style={{ fontSize: 16, fontWeight: 800, color: "#111", margin: "0 0 4px" }}>{q.queueName}</h3>
                            <span style={{ fontSize: 12, color: "#9ca3af" }}>Queue #{q.id}</span>
                          </div>
                          <div style={{ display: "flex", gap: 8 }}>
                            <button onClick={() => fetchQueueTokens(q.id)} style={{
                              padding: "7px 14px", borderRadius: 8, border: "1.5px solid #e5e7eb",
                              background: "#fff", cursor: "pointer", fontSize: 12, fontWeight: 600, color: "#6b7280",
                            }}>Load</button>
                            <button onClick={() => handleCallNext(q.id)} style={{
                              padding: "7px 14px", borderRadius: 8, border: "none",
                              background: "linear-gradient(135deg, #302b63, #0f0c29)",
                              color: "#fff", cursor: "pointer", fontSize: 12, fontWeight: 700,
                            }}>📢 Call Next</button>
                          </div>
                        </div>

                        {/* Now Serving */}
                        {serving ? (
                          <div style={{
                            background: "linear-gradient(135deg, #1e1b4b, #302b63)",
                            borderRadius: 16, padding: "18px 20px", marginBottom: 14,
                          }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                              <span style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", letterSpacing: 2.5, fontWeight: 700 }}>NOW SERVING</span>
                              <span style={{ fontSize: 28, fontWeight: 900, color: "#ffd200", letterSpacing: "-1px" }}>
                                #{String(serving.tokenNumber).padStart(3, "0")}
                              </span>
                            </div>
                            <div style={{ display: "flex", gap: 8 }}>
                              <button onClick={() => handleComplete(serving.id, q.id)} style={{
                                flex: 1, padding: "9px", borderRadius: 10, border: "none",
                                background: "#16a34a", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer",
                              }}>✓ Complete</button>
                              <button onClick={() => handleNoShow(serving.id, q.id)} style={{
                                flex: 1, padding: "9px", borderRadius: 10, border: "none",
                                background: "#dc2626", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer",
                              }}>✗ No Show</button>
                            </div>
                          </div>
                        ) : (
                          <div style={{
                            background: "#f8fafc", borderRadius: 12, padding: "14px 16px",
                            fontSize: 13, color: "#9ca3af", textAlign: "center", marginBottom: 14,
                          }}>No token currently serving</div>
                        )}

                        {/* Stats Row */}
                        <div style={{
                          display: "flex", gap: 20, padding: "12px 0",
                          borderTop: "1px solid #f1f5f9", borderBottom: "1px solid #f1f5f9",
                          marginBottom: 14,
                        }}>
                          <span style={{ fontSize: 13, color: "#d97706" }}><strong>{waiting.length}</strong> waiting</span>
                          <span style={{ fontSize: 13, color: "#6b7280" }}><strong>{tokens.filter(t => t.status === "COMPLETED").length}</strong> completed</span>
                        </div>

                        {/* Mini Token List */}
                        {tokens.length > 0 && (
                          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                            {tokens.slice(0, 5).map(t => {
                              const c = sc(t.status);
                              return (
                                <div key={t.id} style={{
                                  display: "flex", alignItems: "center", gap: 10,
                                  padding: "8px 12px", background: "#f8fafc", borderRadius: 10,
                                }}>
                                  <span style={{ fontSize: 13, fontWeight: 800, color: "#111", minWidth: 40 }}>#{t.tokenNumber}</span>
                                  <span style={{
                                    display: "inline-flex", alignItems: "center", gap: 5,
                                    fontSize: 11, fontWeight: 700, padding: "3px 8px", borderRadius: 20,
                                    background: c.bg, color: c.color, flex: 1,
                                  }}>
                                    <span style={{ width: 5, height: 5, borderRadius: "50%", background: c.dot }} />
                                    {t.status}
                                  </span>
                                  {t.status === "SERVING" && (
                                    <div style={{ display: "flex", gap: 4 }}>
                                      <button onClick={() => handleComplete(t.id, q.id)} style={{ width: 28, height: 28, borderRadius: 8, border: "none", background: "#dcfce7", color: "#16a34a", fontWeight: 800, cursor: "pointer" }}>✓</button>
                                      <button onClick={() => handleNoShow(t.id, q.id)} style={{ width: 28, height: 28, borderRadius: 8, border: "none", background: "#fee2e2", color: "#dc2626", fontWeight: 800, cursor: "pointer" }}>✗</button>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}

          {/* ════ MANAGE QUEUES ════ */}
          {activeTab === "queues" && (
            <>
              {/* Create Form */}
              <div style={{
                background: "#fff", borderRadius: 20, padding: "28px 32px",
                border: "1px solid #e5e7eb", boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                marginBottom: 32,
              }}>
                <h3 style={{ fontSize: 17, fontWeight: 800, color: "#111", margin: "0 0 22px" }}>➕ Create New Queue</h3>
                <div style={{ display: "flex", gap: 16, alignItems: "flex-end" }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#374151", marginBottom: 8 }}>Queue Name</label>
                    <input
                      value={newQueue.queueName}
                      onChange={e => setNewQueue({ ...newQueue, queueName: e.target.value })}
                      onKeyDown={e => e.key === "Enter" && handleCreateQueue()}
                      placeholder="e.g. Counter A, Billing, Support…"
                      style={{ width: "100%", padding: "13px 16px", borderRadius: 12, border: "1.5px solid #e5e7eb", fontSize: 14, color: "#111", background: "#fafafa", boxSizing: "border-box" }}
                    />
                  </div>
                  <div style={{ width: 180 }}>
                    <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#374151", marginBottom: 8 }}>Status</label>
                    <select
                      value={newQueue.status}
                      onChange={e => setNewQueue({ ...newQueue, status: e.target.value })}
                      style={{ width: "100%", padding: "13px 16px", borderRadius: 12, border: "1.5px solid #e5e7eb", fontSize: 14, color: "#111", background: "#fafafa", boxSizing: "border-box" }}>
                      <option value="ACTIVE">Active</option>
                      <option value="INACTIVE">Inactive</option>
                    </select>
                  </div>
                  <button onClick={handleCreateQueue} disabled={loading} style={{
                    padding: "13px 28px", borderRadius: 12, border: "none",
                    background: "linear-gradient(135deg, #302b63, #0f0c29)",
                    color: "#fff", fontSize: 14, fontWeight: 800, cursor: "pointer",
                    whiteSpace: "nowrap",
                  }}>
                    {loading ? "Creating…" : "+ Create Queue"}
                  </button>
                </div>
              </div>

              {/* Queues Table */}
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
                <h2 style={{ fontSize: 18, fontWeight: 800, color: "#111", margin: 0 }}>All Queues</h2>
                <span style={{ fontSize: 12, fontWeight: 700, padding: "3px 10px", background: "#f3f4f6", color: "#6b7280", borderRadius: 20 }}>{queues.length} total</span>
              </div>

              <div style={{ background: "#fff", borderRadius: 20, border: "1px solid #e5e7eb", overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
                <div style={{ display: "flex", padding: "14px 28px", background: "#f8fafc", borderBottom: "2px solid #e5e7eb", fontSize: 11, fontWeight: 800, color: "#9ca3af", letterSpacing: 1, textTransform: "uppercase" }}>
                  <span style={{ width: 70 }}>ID</span>
                  <span style={{ flex: 1 }}>Queue Name</span>
                  <span style={{ width: 130 }}>Status</span>
                  <span style={{ width: 200 }}>Created At</span>
                  <span style={{ width: 160 }}>Action</span>
                </div>
                {queues.length === 0 ? (
                  <div style={{ padding: "48px", textAlign: "center", color: "#9ca3af" }}>No queues created yet.</div>
                ) : queues.map((q, i) => (
                  <div key={q.id} style={{
                    display: "flex", alignItems: "center",
                    padding: "16px 28px", borderBottom: "1px solid #f1f5f9",
                    background: i % 2 === 0 ? "#fff" : "#fafafa",
                  }}>
                    <span style={{ width: 70, fontSize: 13, color: "#9ca3af", fontWeight: 700 }}>#{q.id}</span>
                    <span style={{ flex: 1, fontSize: 15, fontWeight: 700, color: "#111" }}>{q.queueName}</span>
                    <span style={{ width: 130 }}>
                      <span style={{
                        display: "inline-flex", alignItems: "center", gap: 6,
                        padding: "5px 12px", borderRadius: 20, fontSize: 12, fontWeight: 700,
                        background: q.status === "INACTIVE" ? "#fef2f2" : "#f0fdf4",
                        color: q.status === "INACTIVE" ? "#dc2626" : "#16a34a",
                      }}>
                        <span style={{ width: 6, height: 6, borderRadius: "50%", background: q.status === "INACTIVE" ? "#ef4444" : "#10b981" }} />
                        {q.status || "ACTIVE"}
                      </span>
                    </span>
                    <span style={{ width: 200, fontSize: 13, color: "#9ca3af" }}>
                      {q.createdAt ? q.createdAt.slice(0, 16).replace("T", " ") : "—"}
                    </span>
                    <span style={{ width: 160 }}>
                      <button onClick={() => handleCallNext(q.id)} style={{
                        padding: "7px 16px", borderRadius: 8, border: "none",
                        background: "#eef2ff", color: "#6366f1", fontSize: 12, fontWeight: 700, cursor: "pointer",
                      }}>📢 Call Next</button>
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* ════ ALL TOKENS ════ */}
          {activeTab === "tokens" && (
            <>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
                <h2 style={{ fontSize: 18, fontWeight: 800, color: "#111", margin: 0 }}>All Tokens</h2>
                <span style={{ fontSize: 12, fontWeight: 700, padding: "3px 10px", background: "#f3f4f6", color: "#6b7280", borderRadius: 20 }}>{allTokens.length} total</span>
              </div>

              <div style={{ background: "#fff", borderRadius: 20, border: "1px solid #e5e7eb", overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
                <div style={{ display: "flex", padding: "14px 28px", background: "#f8fafc", borderBottom: "2px solid #e5e7eb", fontSize: 11, fontWeight: 800, color: "#9ca3af", letterSpacing: 1, textTransform: "uppercase", alignItems: "center" }}>
                  <span style={{ width: 50 }}>#</span>
                  <span style={{ width: 110 }}>Token</span>
                  <span style={{ flex: 1 }}>Queue</span>
                  <span style={{ flex: 1 }}>User</span>
                  <span style={{ width: 140 }}>Status</span>
                  <span style={{ width: 190 }}>Issued At</span>
                  <span style={{ width: 210 }}>Actions</span>
                </div>

                {allTokens.length === 0 ? (
                  <div style={{ padding: "48px", textAlign: "center", color: "#9ca3af" }}>No tokens found.</div>
                ) : allTokens.map((t, i) => {
                  const c = sc(t.status);
                  return (
                    <div key={t.id} style={{
                      display: "flex", alignItems: "center",
                      padding: "15px 28px", borderBottom: "1px solid #f1f5f9",
                      background: i % 2 === 0 ? "#fff" : "#fafafa",
                    }}>
                      <span style={{ width: 50, fontSize: 12, color: "#d1d5db" }}>{i + 1}</span>
                      <span style={{ width: 110 }}>
                        <span style={{ background: "#1e1b4b", color: "#c4b5fd", padding: "5px 12px", borderRadius: 8, fontSize: 13, fontWeight: 900 }}>
                          #{String(t.tokenNumber).padStart(3, "0")}
                        </span>
                      </span>
                      <span style={{ flex: 1, fontSize: 14, color: "#374151", fontWeight: 500 }}>{t.queue?.queueName || "—"}</span>
                      <span style={{ flex: 1, fontSize: 14, color: "#374151" }}>{t.user?.name || "—"}</span>
                      <span style={{ width: 140 }}>
                        <span style={{
                          display: "inline-flex", alignItems: "center", gap: 6,
                          padding: "5px 12px", borderRadius: 20,
                          background: c.bg, color: c.color, fontSize: 12, fontWeight: 700,
                        }}>
                          <span style={{ width: 6, height: 6, borderRadius: "50%", background: c.dot }} />
                          {t.status}
                        </span>
                      </span>
                      <span style={{ width: 190, fontSize: 13, color: "#9ca3af" }}>
                        {t.createdAt ? new Date(t.createdAt).toLocaleString() : "—"}
                      </span>
                      <span style={{ width: 210, display: "flex", gap: 8, alignItems: "center" }}>
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

      {/* Toast */}
      {toast && (
        <div style={{
          position: "fixed", bottom: 32, right: 32,
          padding: "14px 24px", borderRadius: 14,
          color: "#fff", fontSize: 14, fontWeight: 600,
          boxShadow: "0 8px 32px rgba(0,0,0,0.2)", zIndex: 9999,
          background: toast.type === "error" ? "#ef4444" : "#10b981",
        }}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}
import { useState, useEffect } from "react";
import { groupAPI } from "../services/api";
import "./StudyGroups.css";

export default function StudyGroups({ user }) {
  const [groups, setGroups] = useState([]);
  const [activeGroup, setActiveGroup] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [newGroup, setNewGroup] = useState({ name: "", subject: "All Subjects" });
  const [joinCode, setJoinCode] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user?.id) { setLoading(false); return; }
    groupAPI.getUserGroups(user.id)
      .then(data => {
        setGroups(Array.isArray(data) ? data : []);
        if (data?.length > 0) setActiveGroup(data[0]);
      })
      .catch(() => setGroups([]))
      .finally(() => setLoading(false));
  }, [user?.id]);

  useEffect(() => {
    if (!activeGroup?.id) return;
    groupAPI.getLeaderboard(activeGroup.id)
      .then(data => setLeaderboard(Array.isArray(data) ? data : []))
      .catch(() => setLeaderboard([]));
  }, [activeGroup?.id]);

  const handleCreate = async () => {
    if (!newGroup.name.trim()) return;
    try {
      const created = await groupAPI.create({ ...newGroup, creatorId: user.id });
      setGroups(prev => [...prev, created]);
      setActiveGroup(created);
      setShowCreate(false);
      setNewGroup({ name: "", subject: "All Subjects" });
    } catch (e) {
      setError("Failed to create group: " + e.message);
    }
  };

  const handleJoin = async () => {
    if (!joinCode.trim()) return;
    try {
      const joined = await groupAPI.join({ code: joinCode, userId: user.id });
      setGroups(prev => [...prev, joined]);
      setActiveGroup(joined);
      setJoinCode("");
    } catch (e) {
      setError("Failed to join group: " + e.message);
    }
  };

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 300, color: "var(--text-secondary)" }}>
      Loading groups...
    </div>
  );

  return (
    <div className="study-groups">
      <div className="page-header">
        <h1>👥 Study Groups</h1>
        <p>Compete with friends and climb the leaderboard</p>
      </div>

      {error && <div className="error-banner" style={{ marginBottom: 16 }}>{error}</div>}

      <div className="groups-layout">
        <div className="groups-sidebar">
          <button className="btn btn-primary create-group-btn" onClick={() => setShowCreate(true)}>
            + Create Group
          </button>

          {groups.length === 0 && !showCreate && (
            <div className="card" style={{ textAlign: "center", padding: 24, marginTop: 16 }}>
              <p style={{ color: "var(--text-secondary)", fontSize: 13, marginBottom: 12 }}>You're not in any groups yet.</p>
              <div className="form-group" style={{ marginBottom: 8 }}>
                <input
                  placeholder="Enter invite code..."
                  value={joinCode}
                  onChange={e => setJoinCode(e.target.value)}
                  style={{ fontSize: 13 }}
                />
              </div>
              <button className="btn btn-secondary" style={{ width: "100%", justifyContent: "center", fontSize: 13 }} onClick={handleJoin}>
                Join Group
              </button>
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 16 }}>
            {groups.map(g => (
              <button
                key={g.id}
                className={`group-item ${activeGroup?.id === g.id ? "active" : ""}`}
                onClick={() => setActiveGroup(g)}
              >
                <div className="group-item-icon">{(g.name || g.subject || "G")[0]}</div>
                <div style={{ flex: 1, textAlign: "left" }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{g.name}</div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{g.memberCount || 1} member{(g.memberCount || 1) !== 1 ? "s" : ""}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="groups-main">
          {showCreate && (
            <div className="card" style={{ marginBottom: 20 }}>
              <h3 style={{ marginBottom: 16 }}>Create New Group</h3>
              <div className="form-group" style={{ marginBottom: 12 }}>
                <label>Group Name</label>
                <input placeholder="JEE Mains 2025" value={newGroup.name} onChange={e => setNewGroup({...newGroup, name: e.target.value})} />
              </div>
              <div className="form-group" style={{ marginBottom: 16 }}>
                <label>Subject Focus</label>
                <select value={newGroup.subject} onChange={e => setNewGroup({...newGroup, subject: e.target.value})}>
                  {["All Subjects", "Mathematics", "Physics", "Chemistry", "Biology", "Computer Science"].map(s => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div style={{ display: "flex", gap: 12 }}>
                <button className="btn btn-primary" onClick={handleCreate}>Create</button>
                <button className="btn btn-ghost" onClick={() => setShowCreate(false)}>Cancel</button>
              </div>
            </div>
          )}

          {!activeGroup ? (
            <div className="card" style={{ textAlign: "center", padding: "60px 40px" }}>
              <div style={{ fontSize: 64, marginBottom: 20 }}>👥</div>
              <h2 style={{ marginBottom: 12 }}>No group selected</h2>
              <p style={{ color: "var(--text-secondary)" }}>Create or join a group to start competing!</p>
            </div>
          ) : (
            <>
              <div className="card" style={{ marginBottom: 20 }}>
                <h2 style={{ marginBottom: 4 }}>{activeGroup.name}</h2>
                <p style={{ color: "var(--text-secondary)", fontSize: 13 }}>{activeGroup.subject} · {activeGroup.memberCount || 1} members</p>
                {activeGroup.inviteCode && (
                  <div style={{ marginTop: 12, padding: "8px 12px", background: "var(--bg-tertiary)", borderRadius: 8, fontSize: 13 }}>
                    Invite code: <strong>{activeGroup.inviteCode}</strong>
                  </div>
                )}
              </div>

              <div className="card">
                <h3 style={{ marginBottom: 16 }}>🏆 Leaderboard</h3>
                {leaderboard.length === 0 ? (
                  <p style={{ color: "var(--text-secondary)", fontSize: 13, textAlign: "center", padding: "20px 0" }}>
                    No activity yet. Take some quizzes to appear on the leaderboard!
                  </p>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {leaderboard.map((entry, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: "1px solid var(--border)" }}>
                        <div style={{ width: 32, textAlign: "center", fontWeight: 700, fontSize: 16 }}>
                          {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i+1}`}
                        </div>
                        <div className="group-item-icon" style={{ width: 36, height: 36, fontSize: 14 }}>{(entry.name || "?")[0]}</div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 14, fontWeight: entry.userId === user?.id ? 700 : 500 }}>
                            {entry.userId === user?.id ? "You" : entry.name}
                          </div>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <div style={{ fontSize: 14, fontWeight: 700 }}>{entry.xp || entry.score || 0} XP</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

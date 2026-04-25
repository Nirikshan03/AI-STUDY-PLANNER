import { useState } from "react";
import { notificationAPI } from "../services/api";
import "./Navbar.css";

const navItems = [
  { id: "dashboard", icon: "⚡", label: "Dashboard" },
  { id: "upload",    icon: "📁", label: "Materials" },
  { id: "studyplan", icon: "📅", label: "Study Plan" },
  { id: "quiz",      icon: "🧠", label: "Quiz" },
  { id: "flashcards",icon: "🃏", label: "Flashcards" },
  { id: "analytics", icon: "📊", label: "Analytics" },
  { id: "groups",    icon: "👥", label: "Study Groups" },
];

const getDaysUntilExam = (examDate) => {
  if (!examDate) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const exam = new Date(examDate);
  exam.setHours(0, 0, 0, 0);
  const diff = exam - today;
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
};

export default function Navbar({ currentPage, setCurrentPage, user, onLogout }) {
  const daysLeft = getDaysUntilExam(user?.examDate);
  const [notifState, setNotifState] = useState("idle"); // idle | sending | sent | error

  const handleSendReminder = async () => {
    if (notifState === "sending") return;
    setNotifState("sending");
    try {
      await notificationAPI.sendReminder({
        email:       user?.email,
        studentName: user?.name || "Student",
        topic:       "your daily study session",
      });
      setNotifState("sent");
      setTimeout(() => setNotifState("idle"), 3000);
    } catch (err) {
      setNotifState("error");
      setTimeout(() => setNotifState("idle"), 3000);
    }
  };

  const bellLabel = {
    idle:    "🔔",
    sending: "⏳",
    sent:    "✅",
    error:   "❌",
  }[notifState];

  const bellTitle = {
    idle:    "Send me a study reminder email",
    sending: "Sending...",
    sent:    "Reminder sent to " + user?.email,
    error:   "Failed to send — check email settings",
  }[notifState];

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <div className="brand-icon">🎓</div>
        <div>
          <div className="brand-name">StudyAI</div>
          <div className="brand-sub">Smart Learning</div>
        </div>
      </div>

      <div className="navbar-user">
        <div className="user-avatar">{user?.name?.[0]?.toUpperCase() || "S"}</div>
        <div style={{ flex: 1 }}>
          <div className="user-name">{user?.name || "Student"}</div>
          <div className="user-streak">🔥 {user?.streak || 1} day streak</div>
        </div>

        {/* 🔔 Notification Bell */}
        <button
          onClick={handleSendReminder}
          title={bellTitle}
          style={{
            background: notifState === "sent"
              ? "rgba(74,222,128,0.15)"
              : notifState === "error"
              ? "rgba(244,114,182,0.15)"
              : "rgba(124,106,247,0.15)",
            border: "1px solid var(--border)",
            borderRadius: 8,
            padding: "6px 10px",
            cursor: notifState === "sending" ? "not-allowed" : "pointer",
            fontSize: 16,
            marginRight: 4,
            transition: "all 0.2s",
          }}
        >
          {bellLabel}
        </button>

        <button className="logout-btn" onClick={onLogout} title="Logout">⏻</button>
      </div>

      <ul className="navbar-menu">
        {navItems.map((item) => (
          <li key={item.id}>
            <button
              className={`nav-item ${currentPage === item.id ? "active" : ""}`}
              onClick={() => setCurrentPage(item.id)}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
              {currentPage === item.id && <span className="nav-indicator" />}
            </button>
          </li>
        ))}
      </ul>

      <div className="navbar-footer">
        {daysLeft !== null ? (
          <div className="exam-countdown">
            <div className="countdown-label">EXAM IN</div>
            <div className="countdown-days">{daysLeft} day{daysLeft !== 1 ? "s" : ""}</div>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${Math.min(100, Math.max(5, 100 - (daysLeft / 30) * 100))}%` }} />
            </div>
            <div className="countdown-sub">
              {daysLeft === 0 ? "Today is exam day!" : daysLeft <= 3 ? "Almost there!" : "Keep studying!"}
            </div>
          </div>
        ) : (
          <div className="exam-countdown">
            <div className="countdown-label">No exam date set</div>
            <div className="countdown-sub" style={{ fontSize: "11px", marginTop: 4 }}>Set one in Study Plan</div>
          </div>
        )}

        {notifState === "sent" && (
          <div style={{ marginTop: 10, fontSize: 11, color: "#4ade80", textAlign: "center", padding: "6px 8px", background: "rgba(74,222,128,0.1)", borderRadius: 6 }}>
            ✅ Reminder sent to your email!
          </div>
        )}
        {notifState === "error" && (
          <div style={{ marginTop: 10, fontSize: 11, color: "#f472b6", textAlign: "center", padding: "6px 8px", background: "rgba(244,114,182,0.1)", borderRadius: 6 }}>
            ❌ Failed to send. Check email config.
          </div>
        )}
      </div>
    </nav>
  );
}

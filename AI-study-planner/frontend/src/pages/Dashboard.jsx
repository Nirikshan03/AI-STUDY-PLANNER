import { useState, useEffect, useCallback } from "react";
import { analyticsAPI, quizAPI, notificationAPI } from "../services/api";
import "./Dashboard.css";

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
};

const getDaysUntilExam = (examDate) => {
  if (!examDate) return null;
  const diff = new Date(examDate) - new Date();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
};

export default function Dashboard({ user, setPage }) {
  const [stats, setStats]         = useState(null);
  const [quizStats, setQuizStats] = useState(null);
  const [trend, setTrend]         = useState([]);
  const [recommendation, setRecommendation] = useState(null);
  const [loading, setLoading]     = useState(true);
  const [lastRefresh, setLastRefresh] = useState(null);
  const [notifState, setNotifState] = useState("idle"); // idle | sending | sent | error
  const daysLeft = getDaysUntilExam(user?.examDate);

  const loadData = useCallback(() => {
    if (!user?.id || isNaN(Number(user.id))) { setLoading(false); return; }
    setLoading(true);
    Promise.all([
      analyticsAPI.getDashboard(user.id).catch(() => null),
      quizAPI.getStats(user.id).catch(() => null),
      analyticsAPI.getWeeklyTrend(user.id).catch(() => []),
      analyticsAPI.getRecommendation(user.id).catch(() => null),
    ]).then(([s, q, t, r]) => {
      setStats(s);
      setQuizStats(q);
      setTrend(Array.isArray(t) ? t : []);
      setRecommendation(r);
      setLastRefresh(new Date());
    }).finally(() => setLoading(false));
  }, [user?.id]);

  useEffect(() => { loadData(); }, [loadData]);

  // Auto-refresh every 60 seconds
  useEffect(() => {
    const iv = setInterval(loadData, 60000);
    return () => clearInterval(iv);
  }, [loadData]);

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

  const isNewUser = !stats || (
    (stats.totalStudyMinutes || 0) === 0 &&
    (!quizStats || (quizStats.totalAttempts || 0) === 0)
  );

  if (loading) return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:300, color:"var(--text-secondary)" }}>
      <div style={{ textAlign:"center" }}>
        <div style={{ fontSize:32, marginBottom:8 }}>⏳</div>
        Loading your dashboard...
      </div>
    </div>
  );

  if (isNewUser) return (
    <div className="dashboard">
      <div className="page-header">
        <h1>{getGreeting()}, {user?.name?.split(" ")[0] || "there"} 👋</h1>
        <p>Welcome to your AI Study Planner! Let's get started.</p>
      </div>
      <div className="card" style={{ textAlign:"center", padding:"60px 40px" }}>
        <div style={{ fontSize:64, marginBottom:20 }}>🎓</div>
        <h2 style={{ marginBottom:12 }}>Your dashboard is empty — let's fix that!</h2>
        <p style={{ color:"var(--text-secondary)", marginBottom:32, maxWidth:480, margin:"0 auto 32px" }}>
          Take a quiz or log a study session to start seeing your progress here.
        </p>
        <div style={{ display:"flex", gap:16, justifyContent:"center", flexWrap:"wrap" }}>
          <button className="btn btn-primary" onClick={() => setPage("upload")}>📁 Upload Materials</button>
          <button className="btn btn-secondary" onClick={() => setPage("quiz")}>🧠 Take a Quiz</button>
          <button className="btn btn-secondary" onClick={() => setPage("studyplan")}>📅 Create Study Plan</button>
        </div>
      </div>
    </div>
  );

  const readiness    = stats?.readinessScore || 0;
  const totalMins    = stats?.totalStudyMinutes || 0;
  const avgScore     = stats?.averageScore || quizStats?.averageScore || 0;
  const studyDays    = stats?.studyDaysThisWeek || 0;
  const totalAttempts = quizStats?.totalAttempts || 0;
  const subjectScores = stats?.subjectScores || {};
  const subjectList = Object.entries(subjectScores).map(([name, score], i) => ({
    subject: name,
    score: Math.round(score),
    color: ["#7c6af7","#4ade80","#fb923c","#f472b6","#60a5fa"][i % 5]
  }));
  const weakTopics = stats?.weakTopics || [];
  const getReadinessColor = s => s >= 80 ? "#4ade80" : s >= 60 ? "#fb923c" : "#f472b6";
  const getReadinessLabel = s => s >= 80 ? "Well Prepared" : s >= 60 ? "On Track" : "Needs Focus";
  const maxMins = Math.max(...trend.map(d => d.minutes || 0), 1);

  return (
    <div className="dashboard">
      <div className="page-header">
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", flexWrap:"wrap", gap:8 }}>
          <div>
            <h1>{getGreeting()}, {user?.name?.split(" ")[0] || "there"} 👋</h1>
            <p>
              {daysLeft !== null
                ? `You have ${daysLeft} day${daysLeft !== 1 ? "s" : ""} until your exam. Keep the momentum going!`
                : "Let's make today count!"}
            </p>
          </div>
          <button
            style={{ background:"rgba(124,106,247,0.1)", border:"1px solid var(--border)", borderRadius:8,
              padding:"6px 14px", color:"var(--text-secondary)", fontSize:12, cursor:"pointer" }}
            onClick={loadData}>
            🔄 Refresh{lastRefresh ? ` · ${lastRefresh.toLocaleTimeString([], { hour:"2-digit", minute:"2-digit" })}` : ""}
          </button>
        </div>
      </div>

      <div className="grid-4" style={{ marginBottom:24 }}>
        {[
          { icon:"📚", label:"Subjects Tracked", value:subjectList.length, change:`Study days this week: ${studyDays}`, bg:"rgba(124,106,247,0.15)" },
          { icon:"✅", label:"Avg Quiz Score",   value:avgScore ? `${avgScore}%` : "—",          change:`${totalAttempts} quizzes taken`, bg:"rgba(74,222,128,0.15)" },
          { icon:"⏱️", label:"Study Time",       value:`${Math.round(totalMins/60)}h`,            change:"Total logged",                   bg:"rgba(251,146,60,0.15)" },
          { icon:"🔥", label:"Active Days",      value:studyDays,                                 change:studyDays >= 5 ? "Great streak! 🔥" : "Keep going!", bg:"rgba(244,114,182,0.15)" },
        ].map(s => (
          <div key={s.label} className="stat-card">
            <div className="stat-icon" style={{ background:s.bg }}>{s.icon}</div>
            <div className="stat-value">{s.value}</div>
            <div className="stat-label">{s.label}</div>
            <div className="stat-change">{s.change}</div>
          </div>
        ))}
      </div>

      <div className="dashboard-main">
        <div className="dashboard-left">
          {/* Readiness */}
          <div className="card readiness-card">
            <div className="readiness-header">
              <div>
                <h3>🤖 Exam Readiness</h3>
                <p style={{ color:"var(--text-secondary)", fontSize:13 }}>Based on quiz scores & study consistency</p>
              </div>
            </div>
            <div className="readiness-score-container">
              <div className="readiness-circle-wrap">
                <svg viewBox="0 0 120 120" className="readiness-circle">
                  <circle cx="60" cy="60" r="50" fill="none" stroke="var(--border)" strokeWidth="10" />
                  <circle cx="60" cy="60" r="50" fill="none" stroke={getReadinessColor(readiness)} strokeWidth="10"
                    strokeDasharray={`${2 * Math.PI * 50}`}
                    strokeDashoffset={`${2 * Math.PI * 50 * (1 - readiness / 100)}`}
                    strokeLinecap="round" transform="rotate(-90 60 60)"
                    style={{ transition:"stroke-dashoffset 1s ease" }} />
                  <text x="60" y="55" textAnchor="middle" fill={getReadinessColor(readiness)} fontSize="22" fontWeight="800">{readiness}%</text>
                  <text x="60" y="72" textAnchor="middle" fill="var(--text-secondary)" fontSize="10">Readiness</text>
                </svg>
              </div>
              <div className="readiness-details">
                <div className="readiness-status" style={{ color:getReadinessColor(readiness) }}>{getReadinessLabel(readiness)}</div>
                {weakTopics.length > 0 && (
                  <div style={{ marginTop:8 }}>
                    <div style={{ fontSize:12, color:"var(--text-secondary)", marginBottom:4 }}>Focus on:</div>
                    {weakTopics.map(t => (
                      <div key={t} style={{ fontSize:12, color:"#f472b6", marginBottom:2 }}>• {t}</div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* AI Recommendation */}
          {recommendation && (
            <div className="card" style={{ borderLeft:"3px solid var(--accent-primary)" }}>
              <div style={{ fontSize:12, fontWeight:700, color:"var(--accent-primary)", marginBottom:10 }}>
                🤖 AI Study Recommendations
              </div>
              <div style={{ fontSize:13, color:"var(--text-secondary)", lineHeight:1.8, whiteSpace:"pre-line" }}>
                {recommendation}
              </div>
            </div>
          )}

          {/* Subject Progress */}
          {subjectList.length > 0 && (
            <div className="card">
              <h3 style={{ marginBottom:20 }}>Subject Progress</h3>
              <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
                {subjectList.map(sub => (
                  <div key={sub.subject} className="subject-row">
                    <div className="subject-info">
                      <span className="subject-dot" style={{ background:sub.color }} />
                      <div style={{ fontSize:14, fontWeight:600 }}>{sub.subject}</div>
                    </div>
                    <div className="subject-progress-wrap">
                      <div className="progress-bar">
                        <div className="progress-fill" style={{ width:`${sub.score}%`, background:sub.color }} />
                      </div>
                      <span style={{ fontSize:13, fontWeight:700, minWidth:36 }}>{sub.score}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="dashboard-right">
          {trend.length > 0 && (
            <div className="card">
              <h3 style={{ marginBottom:20 }}>Weekly Study Activity</h3>
              <div className="activity-chart">
                {trend.map(d => (
                  <div key={d.day} className="activity-bar-wrap">
                    <div className="activity-bar-container">
                      <div className="activity-bar"
                        style={{ height:`${((d.minutes || 0) / maxMins) * 100}%` }}
                        title={`${Math.round((d.minutes||0)/60*10)/10}h`} />
                    </div>
                    <div className="activity-label">{d.day}</div>
                  </div>
                ))}
              </div>
              <div style={{ textAlign:"center", fontSize:12, color:"var(--text-muted)", marginTop:8 }}>
                Total this week: {Math.round(trend.reduce((a,d) => a + (d.minutes||0), 0) / 60 * 10) / 10}h
              </div>
            </div>
          )}

          <div className="card" style={{ borderLeft: "3px solid #7c6af7", marginBottom: 16 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", marginBottom: 2 }}>🔔 Study Reminder</div>
                <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>Get an instant reminder email</div>
              </div>
              <button
                onClick={handleSendReminder}
                disabled={notifState === "sending"}
                style={{
                  background: notifState === "sent" ? "rgba(74,222,128,0.2)" : notifState === "error" ? "rgba(244,114,182,0.2)" : "rgba(124,106,247,0.2)",
                  border: "1px solid var(--border)",
                  borderRadius: 8,
                  padding: "8px 16px",
                  color: notifState === "sent" ? "#4ade80" : notifState === "error" ? "#f472b6" : "#a78bfa",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: notifState === "sending" ? "not-allowed" : "pointer",
                  transition: "all 0.2s",
                  whiteSpace: "nowrap",
                }}
              >
                {{ idle: "📧 Send Reminder", sending: "⏳ Sending...", sent: "✅ Sent!", error: "❌ Failed" }[notifState]}
              </button>
            </div>
            <div style={{ fontSize: 12, color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 6 }}>
              <span>📬</span>
              <span>{user?.email}</span>
            </div>
          </div>

          <div className="card today-plan">
            <h3 style={{ marginBottom:16 }}>🚀 Quick Actions</h3>
            {[
              { label:"Generate a Quiz",        icon:"🧠", page:"quiz" },
              { label:"Upload Study Material",   icon:"📁", page:"upload" },
              { label:"Create Study Plan",       icon:"📅", page:"studyplan" },
              { label:"View Analytics",          icon:"📊", page:"analytics" },
              { label:"AI Flashcards",           icon:"🃏", page:"flashcards" },
              { label:"Study Groups",            icon:"👥", page:"groups" },
            ].map(item => (
              <div key={item.page} className="plan-item" onClick={() => setPage(item.page)} style={{ cursor:"pointer" }}>
                <div className="plan-check">{item.icon}</div>
                <div style={{ fontSize:13, fontWeight:600 }}>{item.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

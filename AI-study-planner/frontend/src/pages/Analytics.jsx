import { useState, useEffect } from "react";
import { analyticsAPI, quizAPI } from "../services/api";
import "./Analytics.css";

export default function Analytics({ user }) {
  const [data, setData]       = useState(null);
  const [quizStats, setQuizStats] = useState(null);
  const [trend, setTrend]     = useState([]);
  const [recommendation, setRecommendation] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) { setLoading(false); return; }
    Promise.all([
      analyticsAPI.getDashboard(user.id).catch(() => null),
      quizAPI.getStats(user.id).catch(() => null),
      analyticsAPI.getWeeklyTrend(user.id).catch(() => []),
      analyticsAPI.getRecommendation(user.id).catch(() => null),
    ]).then(([d, q, t, r]) => {
      setData(d);
      setQuizStats(q);
      setTrend(Array.isArray(t) ? t : []);
      setRecommendation(r);
    }).finally(() => setLoading(false));
  }, [user?.id]);

  if (loading) return (
    <div className="analytics" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 300 }}>
      <div style={{ textAlign: "center", color: "var(--text-muted)" }}>
        <div style={{ fontSize: 32, marginBottom: 8 }}>⏳</div>
        <p>Loading analytics...</p>
      </div>
    </div>
  );

  // Map backend response fields (backend returns totalStudyMinutes, subjectScores as object, etc.)
  const totalMins    = data?.totalStudyMinutes || 0;
  const avgScore     = data?.averageScore || quizStats?.averageScore || 0;
  const readiness    = data?.readinessScore || 0;
  const studyDays    = data?.studyDaysThisWeek || 0;
  const weakTopics   = data?.weakTopics || [];
  const totalAttempts = quizStats?.totalAttempts || 0;

  // subjectScores from backend is an object like { "Math": 75.5, "Physics": 60 }
  const subjectScoresObj = data?.subjectScores || {};
  const subjectList = Object.entries(subjectScoresObj).map(([name, score], i) => ({
    subject: name,
    averageScore: Math.round(score),
    color: ["#7c6af7","#4ade80","#fb923c","#f472b6","#60a5fa"][i % 5],
  }));

  const bestSubject    = subjectList.length > 0
    ? subjectList.reduce((a, b) => a.averageScore > b.averageScore ? a : b).subject
    : null;
  const weakestSubject = subjectList.length > 0
    ? subjectList.reduce((a, b) => a.averageScore < b.averageScore ? a : b).subject
    : null;

  const hasData = totalMins > 0 || totalAttempts > 0 || subjectList.length > 0;

  const maxMins = Math.max(...trend.map(d => d.minutes || 0), 1);

  const getReadinessColor = (s) => s >= 80 ? "#4ade80" : s >= 60 ? "#fb923c" : "#f472b6";

  return (
    <div className="analytics">
      <div className="page-header">
        <h1>📊 Performance Analytics</h1>
        <p>Track your progress and identify areas to improve</p>
      </div>

      {!hasData ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div className="card" style={{ textAlign: "center", padding: 64 }}>
            <div style={{ fontSize: 64, marginBottom: 16 }}>📊</div>
            <h3 style={{ marginBottom: 8 }}>No analytics data yet</h3>
            <p style={{ color: "var(--text-secondary)", fontSize: 14, maxWidth: 400, margin: "0 auto 24px" }}>
              Your analytics will appear here as you take quizzes and log study sessions.
              Start by taking a quiz!
            </p>
          </div>

          <div className="grid-4">
            {[
              { icon: "🎯", label: "Overall Score",    value: "—",  note: "Take quizzes" },
              { icon: "📈", label: "Best Subject",     value: "—",  note: "No data yet" },
              { icon: "⚠️", label: "Needs Attention",  value: "—",  note: "No data yet" },
              { icon: "⏱️", label: "Study Hours",      value: "0h", note: "Log sessions" },
            ].map(s => (
              <div key={s.label} className="stat-card">
                <div className="stat-icon" style={{ fontSize: 24 }}>{s.icon}</div>
                <div className="stat-value">{s.value}</div>
                <div className="stat-label">{s.label}</div>
                <div className="stat-change">{s.note}</div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          {/* Summary Stats */}
          <div className="grid-4">
            {[
              { icon: "🎯", label: "Overall Score",   value: avgScore ? `${Math.round(avgScore)}%` : "—",        change: `${totalAttempts} quizzes taken`, color: "#7c6af7" },
              { icon: "📈", label: "Best Subject",    value: bestSubject || "—",                                   change: "Highest avg score",               color: "#4ade80" },
              { icon: "⚠️", label: "Needs Attention", value: weakestSubject || (weakTopics[0] || "—"),             change: "Focus area",                        color: "#f472b6" },
              { icon: "⏱️", label: "Study Hours",     value: `${Math.floor(totalMins/60)}h ${totalMins%60}m`,     change: `${studyDays} active days this week`, color: "#4fc3f7" },
            ].map(s => (
              <div key={s.label} className="stat-card">
                <div className="stat-icon" style={{ background: `${s.color}22`, fontSize: 24 }}>{s.icon}</div>
                <div className="stat-value">{s.value}</div>
                <div className="stat-label">{s.label}</div>
                <div className="stat-change">{s.change}</div>
              </div>
            ))}
          </div>

          {/* Exam Readiness */}
          <div className="card" style={{ display: "flex", alignItems: "center", gap: 24, flexWrap: "wrap" }}>
            <svg viewBox="0 0 120 120" style={{ width: 100, height: 100, flexShrink: 0 }}>
              <circle cx="60" cy="60" r="50" fill="none" stroke="var(--border)" strokeWidth="10" />
              <circle cx="60" cy="60" r="50" fill="none" stroke={getReadinessColor(readiness)} strokeWidth="10"
                strokeDasharray={`${2 * Math.PI * 50}`}
                strokeDashoffset={`${2 * Math.PI * 50 * (1 - readiness / 100)}`}
                strokeLinecap="round" transform="rotate(-90 60 60)"
                style={{ transition: "stroke-dashoffset 1s ease" }}
              />
              <text x="60" y="55" textAnchor="middle" fill={getReadinessColor(readiness)} fontSize="22" fontWeight="800">{readiness}%</text>
              <text x="60" y="72" textAnchor="middle" fill="var(--text-secondary)" fontSize="10">Readiness</text>
            </svg>
            <div>
              <h3 style={{ marginBottom: 4 }}>🤖 Exam Readiness</h3>
              <p style={{ color: "var(--text-secondary)", fontSize: 13, marginBottom: 8 }}>
                Based on quiz scores & study consistency
              </p>
              {weakTopics.length > 0 && (
                <div>
                  <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 4 }}>Weak topics to focus on:</div>
                  {weakTopics.map(t => (
                    <span key={t} className="badge badge-purple" style={{ marginRight: 6, marginBottom: 4 }}>{t}</span>
                  ))}
                </div>
              )}
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

          {/* Subject Performance */}
          {subjectList.length > 0 && (
            <div className="card">
              <h3 style={{ marginBottom: 20 }}>Subject Performance</h3>
              {subjectList.map(s => (
                <div key={s.subject} className="subject-row" style={{ marginBottom: 16 }}>
                  <div className="subject-info">
                    <span className="subject-dot" style={{ background: s.color }} />
                    <div style={{ fontSize: 14, fontWeight: 600 }}>{s.subject}</div>
                  </div>
                  <div className="subject-progress-wrap">
                    <div className="progress-bar">
                      <div className="progress-fill" style={{
                        width: `${s.averageScore}%`,
                        background: s.averageScore >= 80 ? "#4ade80" : s.averageScore >= 60 ? "#fb923c" : "#f472b6"
                      }} />
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 700, minWidth: 36 }}>{s.averageScore}%</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Weekly Trend Chart */}
          {trend.length > 0 && (
            <div className="card">
              <h3 style={{ marginBottom: 20 }}>Weekly Study Activity</h3>
              <div className="activity-chart">
                {trend.map(d => (
                  <div key={d.day} className="activity-bar-wrap">
                    <div className="activity-bar-container">
                      <div
                        className="activity-bar"
                        style={{ height: `${((d.minutes || 0) / maxMins) * 100}%` }}
                        title={`${Math.round((d.minutes||0)/60*10)/10}h`}
                      />
                    </div>
                    <div className="activity-label">{d.day}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

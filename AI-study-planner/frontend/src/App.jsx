import { useState, useEffect } from "react";
import Dashboard   from "./pages/Dashboard";
import Quiz        from "./pages/Quiz";
import Flashcards  from "./pages/Flashcards";
import Analytics   from "./pages/Analytics";
import StudyPlan   from "./pages/StudyPlan";
import StudyGroups from "./pages/StudyGroups";
import Upload      from "./pages/Upload/Upload";
import Login       from "./pages/Login";
import Navbar      from "./components/Navbar";
import ChatBot     from "./components/ChatBot";

const restoreUser = () => {
  try { const s = localStorage.getItem("user"); return s ? JSON.parse(s) : null; }
  catch { return null; }
};

const parseOAuthCallback = () => {
  const path = window.location.pathname;
  const params = new URLSearchParams(window.location.search);
  if (path.includes("oauth2/callback") && params.get("token") && params.get("userId")) {
    return {
      token:      params.get("token"),
      id:         Number(params.get("userId")),
      name:       decodeURIComponent(params.get("name") || ""),
      email:      decodeURIComponent(params.get("email") || ""),
      provider:   params.get("provider") || "GOOGLE",
      streak:     1,
      dailyHours: 4,
      examDate:   null,
    };
  }
  return null;
};

export default function App() {
  const [user, setUser]         = useState(null);
  const [page, setPage]         = useState("dashboard");
  const [chatOpen, setChatOpen] = useState(false);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    const oauthUser = parseOAuthCallback();
    if (oauthUser) {
      localStorage.setItem("token", oauthUser.token);
      localStorage.setItem("user",  JSON.stringify(oauthUser));
      setUser(oauthUser);
      window.history.replaceState({}, "", "/");
    } else {
      const savedUser = restoreUser();
      if (savedUser) {
        if (savedUser.token) localStorage.setItem("token", savedUser.token);
        setUser(savedUser);
      }
    }
    setLoading(false);
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
    localStorage.setItem("token", userData.token || "");
    localStorage.setItem("user", JSON.stringify(userData));
    setPage("dashboard");
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setPage("dashboard");
  };

  const updateUser = (patch) => {
    setUser(prev => {
      const updated = { ...prev, ...patch };
      localStorage.setItem("user", JSON.stringify(updated));
      if (updated.token) localStorage.setItem("token", updated.token);
      return updated;
    });
  };

  if (loading) return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"center",
      height:"100vh", background:"#0f0f1a", color:"#a78bfa", fontSize:24 }}>
      Loading...
    </div>
  );

  if (!user) return <Login onLogin={handleLogin} />;

  const renderPage = () => {
    switch (page) {
      case "quiz":        return <Quiz        user={user} />;
      case "flashcards":  return <Flashcards  user={user} />;
      case "analytics":   return <Analytics   user={user} />;
      case "studyplan":   return <StudyPlan   user={user} updateUser={updateUser} />;
      case "groups":      return <StudyGroups user={user} />;
      case "upload":      return <Upload      user={user} />;
      default:            return <Dashboard   user={user} setPage={setPage} />;
    }
  };

  return (
    <div className="app-container">
      <Navbar currentPage={page} setCurrentPage={setPage} user={user} onLogout={handleLogout} />
      <main className="main-content">{renderPage()}</main>
      <button className="chat-fab" onClick={() => setChatOpen(!chatOpen)}>
        {chatOpen ? "✕" : "🤖"}
        {!chatOpen && <span className="chat-fab-label">AI Tutor</span>}
      </button>
      {chatOpen && <ChatBot user={user} onClose={() => setChatOpen(false)} />}
    </div>
  );
}

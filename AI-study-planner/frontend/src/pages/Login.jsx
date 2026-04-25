import { useState } from "react";
import { authAPI } from "../services/api";
import "./Login.css";

export default function Login({ onLogin }) {
  const [isSignup, setIsSignup] = useState(false);
  const [form, setForm]         = useState({ name:"", email:"", password:"", examDate:"", dailyHours:"4" });
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      let data;
      if (isSignup) {
        data = await authAPI.register({
          name: form.name, email: form.email, password: form.password,
          examDate: form.examDate || null, dailyStudyHours: Number(form.dailyHours),
        });
      } else {
        data = await authAPI.login({ email: form.email, password: form.password });
      }
      if (data.token) localStorage.setItem("token", data.token);
      onLogin({
        id: data.userId, name: data.name || form.name,
        email: data.email || form.email, token: data.token,
        examDate: data.examDate || form.examDate || null,
        dailyHours: data.dailyStudyHours || Number(form.dailyHours),
        streak: data.streak || 0, provider: data.provider || "LOCAL",
      });
    } catch (err) {
      setError(err.message || "Something went wrong.");
    }
    setLoading(false);
  };

  // Real Google OAuth2 — redirects to Spring Boot
  const handleGoogleLogin = () => {
    window.location.href = "/oauth2/authorization/google";
  };

  return (
    <div className="login-page">
      <div className="login-bg">
        <div className="bg-orb orb1" />
        <div className="bg-orb orb2" />
        <div className="bg-orb orb3" />
      </div>

      <div className="login-container">
        <div className="login-left">
          <div className="brand-mark">🎓</div>
          <h1 className="login-headline">Study Smarter<br />with <span>AI Power</span></h1>
          <p className="login-tagline">Your personal AI tutor that creates quizzes, tracks progress, and builds smart study plans.</p>
          <div className="feature-pills">
            <span className="pill">🧠 AI Quiz Generator</span>
            <span className="pill">📅 Smart Planner</span>
            <span className="pill">🤖 AI Tutor Chat</span>
            <span className="pill">📊 Analytics</span>
          </div>
        </div>

        <div className="login-card">
          <h2>{isSignup ? "Create Account" : "Welcome Back"}</h2>
          <p className="login-sub">{isSignup ? "Start your AI learning journey" : "Continue your learning streak"}</p>

          {error && <div className="error-banner">{error}</div>}

          <form onSubmit={handleSubmit} className="login-form">
            {isSignup && (
              <div className="form-group">
                <label>Full Name</label>
                <input placeholder="Your Name" value={form.name}
                  onChange={e => setForm({...form, name:e.target.value})} required />
              </div>
            )}
            <div className="form-group">
              <label>Email</label>
              <input type="email" placeholder="you@example.com" value={form.email}
                onChange={e => setForm({...form, email:e.target.value})} required />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input type="password" placeholder="••••••••" value={form.password}
                onChange={e => setForm({...form, password:e.target.value})} required />
            </div>
            {isSignup && (
              <>
                <div className="form-group">
                  <label>Exam Date (optional)</label>
                  <input type="date" value={form.examDate}
                    onChange={e => setForm({...form, examDate:e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Daily Study Hours</label>
                  <select value={form.dailyHours}
                    onChange={e => setForm({...form, dailyHours:e.target.value})}>
                    {[1,2,3,4,5,6,7,8].map(h => <option key={h}>{h}</option>)}
                  </select>
                </div>
              </>
            )}
            <button type="submit" className="btn btn-primary login-btn" disabled={loading}>
              {loading ? "Loading..." : (isSignup ? "Create Account" : "Sign In")}
            </button>
          </form>

          <div className="login-divider"><span>or</span></div>

          <button className="btn-google" onClick={handleGoogleLogin}>
            <img src="https://www.google.com/favicon.ico" width="16" alt="" />
            Continue with Google
          </button>

          <p className="login-switch">
            {isSignup ? "Already have an account?" : "New here?"}
            <button onClick={() => { setIsSignup(!isSignup); setError(null); }}>
              {isSignup ? " Sign In" : " Create Account"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

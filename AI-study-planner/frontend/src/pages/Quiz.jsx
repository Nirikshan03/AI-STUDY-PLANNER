import { useState, useEffect } from "react";
import { quizAPI, analyticsAPI, materialAPI } from "../services/api";
import "./Quiz.css";

const SUBJECTS = [
  "Mathematics","Physics","Chemistry","Biology",
  "Computer Science","History","English","Economics","Geography",
];

export default function Quiz({ user }) {
  const [step, setStep]       = useState("setup");
  const [config, setConfig]   = useState({ subject:"Mathematics", topic:"", difficulty:"Medium", count:5 });
  const [questions, setQuestions] = useState([]);
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [showExplanation, setShowExplanation] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);
  const [materials, setMaterials] = useState([]);
  const [quizHistory, setQuizHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [timer, setTimer]     = useState(0);
  const [timerInterval, setTimerInterval] = useState(null);

  useEffect(() => {
    if (!user?.id) return;
    materialAPI.getUserMaterials(user.id)
      .then(data => setMaterials(Array.isArray(data) ? data.filter(m => m.status === "DONE") : []))
      .catch(() => {});
    quizAPI.getUserAttempts(user.id)
      .then(data => setQuizHistory(Array.isArray(data) ? data.slice(0, 5) : []))
      .catch(() => {});
  }, [user?.id]);

  // Timer
  useEffect(() => {
    if (step === "quiz") {
      const iv = setInterval(() => setTimer(t => t + 1), 1000);
      setTimerInterval(iv);
      return () => clearInterval(iv);
    } else {
      if (timerInterval) clearInterval(timerInterval);
    }
  }, [step]);

  const formatTime = (s) => `${String(Math.floor(s/60)).padStart(2,"0")}:${String(s%60).padStart(2,"0")}`;

  const generateQuiz = async () => {
    setLoading(true);
    setError(null);
    setStep("loading");
    setTimer(0);
    try {
      const data = await quizAPI.generate({
        userId:     user?.id,
        subject:    config.subject,
        topic:      config.topic || null,
        difficulty: config.difficulty,
        count:      config.count,
      });

      if (data && data.error) throw new Error(data.error);

      const qs = (data.questions || []).map(q => ({
        question: q.questionText,
        options: ["A) " + q.optionA, "B) " + q.optionB, "C) " + q.optionC, "D) " + q.optionD],
        correct:
          q.correctAnswer === "A" ? "A) " + q.optionA :
          q.correctAnswer === "B" ? "B) " + q.optionB :
          q.correctAnswer === "C" ? "C) " + q.optionC : "D) " + q.optionD,
        explanation: q.explanation,
      }));

      if (!qs.length) throw new Error("No questions returned from AI. Check your GROQ_API_KEY in .env");

      setQuestions(qs);
      setAnswers([]);
      setCurrent(0);
      setSelected(null);
      setShowExplanation(false);
      setStep("quiz");
    } catch (err) {
      setError(err.message || "Failed to generate quiz. Please try again.");
      setStep("setup");
    }
    setLoading(false);
  };

  const handleAnswer = (opt) => {
    if (selected) return;
    setSelected(opt);
    setShowExplanation(true);
    setAnswers(prev => [...prev, {
      question: questions[current].question,
      selected: opt,
      correct:  questions[current].correct,
      isCorrect: opt === questions[current].correct,
    }]);
  };

  const nextQuestion = () => {
    if (current + 1 >= questions.length) finishQuiz();
    else {
      setCurrent(c => c + 1);
      setSelected(null);
      setShowExplanation(false);
    }
  };

  const finishQuiz = async () => {
    setStep("result");
    if (timerInterval) clearInterval(timerInterval);
    const lastCorrect = selected === questions[current]?.correct ? 1 : 0;
    const correctCount = answers.filter(a => a.isCorrect).length + lastCorrect;
    const scorePercent = Math.round((correctCount / questions.length) * 100);
    if (user?.id) {
      try {
        await analyticsAPI.logScore({
          userId: user.id,
          subject: config.subject,
          topic: config.topic || config.subject,
          scorePercent,
          questionsAttempted: questions.length,
        });
        const newAttempts = await quizAPI.getUserAttempts(user.id);
        setQuizHistory(Array.isArray(newAttempts) ? newAttempts.slice(0, 5) : []);
      } catch { /* non-critical */ }
    }
  };

  const score = answers.filter(a => a.isCorrect).length;

  // ── Loading ──────────────────────────────────────────────────────────────
  if (step === "loading") return (
    <div className="quiz-loading">
      <div className="loading-orb" />
      <h2>🤖 AI is crafting your quiz...</h2>
      <p>Generating {config.count} {config.difficulty} questions on {config.subject}
        {config.topic ? ` — ${config.topic}` : ""}</p>
    </div>
  );

  // ── Result ───────────────────────────────────────────────────────────────
  if (step === "result") {
    const finalScore = answers.filter(a => a.isCorrect).length;
    const pct = Math.round((finalScore / questions.length) * 100);
    return (
      <div className="quiz-result">
        <div className="result-card card">
          <div className="result-score-circle"
            style={{ borderColor: pct >= 70 ? "var(--accent-green)" : "var(--accent-orange)" }}>
            <div className="result-score">{pct}%</div>
            <div className="result-sub">{finalScore}/{questions.length} correct</div>
          </div>
          <h2>{pct >= 80 ? "🎉 Excellent!" : pct >= 60 ? "👍 Good Job!" : "💪 Keep Practicing!"}</h2>
          <p style={{ color:"var(--text-secondary)", marginBottom:8 }}>
            {config.subject}{config.topic ? ` — ${config.topic}` : ""} • {config.difficulty} • ⏱ {formatTime(timer)}
          </p>
          <div className="result-answers">
            {answers.map((a, i) => (
              <div key={i} className={`result-answer ${a.isCorrect ? "correct" : "wrong"}`}>
                <span className="result-q-num">Q{i + 1}</span>
                <div>
                  <div style={{ fontSize:13, marginBottom:2 }}>{a.question}</div>
                  <div style={{ fontSize:12, color: a.isCorrect ? "var(--accent-green)" : "var(--accent-orange)" }}>
                    {a.isCorrect ? "✓ Correct" : `✗ Wrong — Correct: ${a.correct}`}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div style={{ display:"flex", gap:12, justifyContent:"center", marginTop:24 }}>
            <button className="btn btn-primary"
              onClick={() => { setStep("setup"); setQuestions([]); setAnswers([]); }}>
              New Quiz
            </button>
            <button className="btn btn-secondary"
              onClick={() => { setCurrent(0); setSelected(null); setShowExplanation(false); setAnswers([]); setTimer(0); setStep("quiz"); }}>
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Active Quiz ──────────────────────────────────────────────────────────
  if (step === "quiz" && questions.length > 0) {
    const q = questions[current];
    return (
      <div className="quiz-active">
        <div className="quiz-progress-bar">
          <div className="quiz-progress-fill" style={{ width:`${(current / questions.length) * 100}%` }} />
        </div>
        <div className="quiz-meta">
          <span className="badge badge-purple">{config.subject}</span>
          <span style={{ color:"var(--text-muted)", fontSize:14 }}>
            Question {current + 1} of {questions.length}
          </span>
          <span style={{ fontFamily:"monospace", fontSize:14, color:"var(--accent-primary)", fontWeight:700 }}>
            ⏱ {formatTime(timer)}
          </span>
          <span className="badge badge-blue">{config.difficulty}</span>
        </div>
        <div className="question-card card">
          <h2 className="question-text">{q.question}</h2>
          <div className="options-grid">
            {q.options.map(opt => (
              <button key={opt}
                className={`option-btn ${
                  selected === opt
                    ? opt === q.correct ? "correct" : "wrong"
                    : selected && opt === q.correct ? "correct" : ""
                }`}
                onClick={() => handleAnswer(opt)}
                disabled={!!selected}
              >
                <span className="option-letter">{opt[0]}</span>
                <span>{opt.slice(3)}</span>
              </button>
            ))}
          </div>
          {showExplanation && (
            <div className="explanation-box">
              <div className="explanation-label">💡 Explanation</div>
              <p>{q.explanation}</p>
            </div>
          )}
          {selected && (
            <button className="btn btn-primary next-btn" onClick={nextQuestion}>
              {current + 1 >= questions.length ? "See Results" : "Next Question"} →
            </button>
          )}
        </div>
      </div>
    );
  }

  // ── Setup ────────────────────────────────────────────────────────────────
  return (
    <div className="quiz-setup">
      <div className="page-header">
        <h1>🧠 AI Quiz Generator</h1>
        <p>Let AI create a personalized quiz from any topic</p>
      </div>
      {error && <div className="error-banner">⚠️ {error}</div>}
      <div className="quiz-setup-grid">
        <div className="card setup-card">
          <h3 style={{ marginBottom: 20 }}>Configure Your Quiz</h3>
          <div className="setup-form">
            <div className="form-group">
              <label>Subject</label>
              <select value={config.subject}
                onChange={e => setConfig({ ...config, subject: e.target.value })}>
                {SUBJECTS.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Topic (optional)</label>
              <input placeholder="e.g. Integration by parts, Newton's Laws..."
                value={config.topic}
                onChange={e => setConfig({ ...config, topic: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Difficulty</label>
              <div className="difficulty-btns">
                {["Easy","Medium","Hard"].map(d => (
                  <button key={d} className={`diff-btn ${config.difficulty === d ? "active" : ""}`}
                    onClick={() => setConfig({ ...config, difficulty: d })}>{d}</button>
                ))}
              </div>
            </div>
            <div className="form-group">
              <label>Number of Questions: {config.count}</label>
              <input type="range" min="3" max="15" value={config.count}
                onChange={e => setConfig({ ...config, count: Number(e.target.value) })}
                style={{ padding:0 }} />
            </div>
            <button className="btn btn-primary"
              style={{ width:"100%", justifyContent:"center", padding:14 }}
              onClick={generateQuiz} disabled={loading}>
              {loading ? "Generating..." : "🤖 Generate Quiz with AI"}
            </button>
          </div>
        </div>

        <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
          {/* From uploaded material */}
          {materials.length > 0 && (
            <div className="card ai-tip-card">
              <div style={{ fontSize:12, color:"var(--accent-green)", fontWeight:700, marginBottom:8 }}>
                📁 Generate from your materials
              </div>
              <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                {materials.slice(0, 4).map(m => (
                  <button key={m.id}
                    style={{ background:"rgba(124,106,247,0.1)", border:"1px solid var(--border)",
                      borderRadius:8, padding:"8px 12px", cursor:"pointer", textAlign:"left",
                      color:"var(--text-primary)", fontSize:13 }}
                    onClick={() => setConfig({ ...config,
                      subject: m.subjectName,
                      topic: m.fileName.replace(/\.[^.]+$/, "") })}>
                    📕 {m.fileName.length > 35 ? m.fileName.slice(0,32) + "..." : m.fileName}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="card ai-tip-card">
            <div style={{ fontSize:12, color:"var(--accent-primary)", fontWeight:700, marginBottom:8 }}>
              🤖 Powered by Groq AI (Free)
            </div>
            <p style={{ fontSize:13, color:"var(--text-secondary)", lineHeight:1.6 }}>
              Select a subject, optionally enter a specific topic, choose difficulty,
              and let AI generate a fresh personalized quiz just for you.
            </p>
          </div>

          <div className="card ai-tip-card">
            <div style={{ fontSize:12, color:"var(--accent-green)", fontWeight:700, marginBottom:8 }}>
              💡 Tips for better quizzes
            </div>
            <ul style={{ fontSize:13, color:"var(--text-secondary)", lineHeight:2, paddingLeft:16, margin:0 }}>
              <li>Be specific with topics (e.g. "Integration by parts")</li>
              <li>Start with Easy to build confidence</li>
              <li>5–10 questions is ideal for focus</li>
            </ul>
          </div>

          {/* Recent attempts */}
          {quizHistory.length > 0 && (
            <div className="card">
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
                <h3 style={{ fontSize:14 }}>📋 Recent Attempts</h3>
                <button style={{ background:"none", border:"none", color:"var(--accent-primary)",
                  fontSize:12, cursor:"pointer" }}
                  onClick={() => setShowHistory(!showHistory)}>
                  {showHistory ? "Hide" : "Show"}
                </button>
              </div>
              {showHistory && quizHistory.map((a, i) => (
                <div key={i} style={{ display:"flex", justifyContent:"space-between",
                  padding:"8px 0", borderBottom:"1px solid var(--border)", fontSize:13 }}>
                  <span style={{ color:"var(--text-secondary)" }}>{a.subject}</span>
                  <span style={{ fontWeight:700,
                    color: Math.round(a.score/a.totalQuestions*100) >= 70
                      ? "var(--accent-green)" : "var(--accent-orange)" }}>
                    {Math.round(a.score/a.totalQuestions*100)}%
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

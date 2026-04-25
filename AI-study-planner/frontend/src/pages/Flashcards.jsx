import { useState } from "react";
import "./Flashcards.css";

const SUBJECTS = ["Mathematics","Physics","Chemistry","Biology","Computer Science","History","English","Economics","Geography"];

export default function Flashcards({ user }) {
  const [cards, setCards]           = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped]       = useState(false);
  const [mode, setMode]             = useState("generate");
  const [generating, setGenerating] = useState(false);
  const [genConfig, setGenConfig]   = useState({ subject:"Physics", topic:"", count:8 });
  const [ratings, setRatings]       = useState({});
  const [error, setError]           = useState(null);
  const [studyMode, setStudyMode]   = useState("all"); // all | hard | review

  const currentCard = cards.length > 0 ? cards[currentIndex] : null;

  const handleFlip = () => setFlipped(f => !f);

  const handleNext = () => {
    setFlipped(false);
    setTimeout(() => setCurrentIndex(i => (i + 1) % filteredCards.length), 150);
  };

  const handlePrev = () => {
    setFlipped(false);
    setTimeout(() => setCurrentIndex(i => (i - 1 + filteredCards.length) % filteredCards.length), 150);
  };

  const rateCard = (rating) => {
    setRatings(r => ({ ...r, [currentCard.id]: rating }));
    if (currentIndex + 1 >= filteredCards.length) setCurrentIndex(0);
    else handleNext();
  };

  const filteredCards = studyMode === "hard"
    ? cards.filter(c => ratings[c.id] === "hard" || !ratings[c.id])
    : studyMode === "review"
    ? cards.filter(c => ratings[c.id] === "ok")
    : cards;

  const generateFlashcards = async () => {
    setGenerating(true);
    setError(null);
    try {
      const token = localStorage.getItem("token") || "";
      const prompt = `Generate ${genConfig.count} flashcards about ${genConfig.subject}${genConfig.topic ? ` - ${genConfig.topic}` : ""}.
Return ONLY a JSON array, no markdown, no explanation:
[{"question":"...","answer":"...","subject":"${genConfig.subject}","difficulty":"Easy|Medium|Hard"}]`;

      const res = await fetch("/api/studyplan/generate", {
        method: "POST",
        headers: { "Content-Type":"application/json", "Authorization":`Bearer ${token}` },
        body: JSON.stringify({ userId: user?.id, prompt }),
      });

      if (!res.ok) throw new Error(`Server error: ${res.status}`);

      let text = await res.text();
      text = text.replace(/```json|```/g, "").trim();
      const match = text.match(/\[[\s\S]*\]/);
      if (!match) throw new Error("AI did not return valid flashcard data. Check GROQ_API_KEY in .env");

      const parsed = JSON.parse(match[0]);
      if (!parsed.length) throw new Error("No flashcards returned from AI.");

      setCards(parsed.map((c, i) => ({ ...c, id: Date.now() + i })));
      setCurrentIndex(0);
      setFlipped(false);
      setRatings({});
      setStudyMode("all");
      setMode("browse");
    } catch (e) {
      setError("Failed to generate: " + e.message);
    }
    setGenerating(false);
  };

  const getDifficultyColor = d => d === "Easy" ? "badge-green" : d === "Medium" ? "badge-orange" : "badge-purple";
  const masteredCount  = Object.values(ratings).filter(r => r === "easy").length;
  const hardCount      = Object.values(ratings).filter(r => r === "hard").length;
  const reviewCount    = Object.values(ratings).filter(r => r === "ok").length;
  const progress       = cards.length > 0 ? Math.round((Object.keys(ratings).length / cards.length) * 100) : 0;

  return (
    <div className="flashcards-page">
      <div className="page-header">
        <h1>🃏 AI Flashcards</h1>
        <p>Smart flashcards powered by AI • Spaced repetition built-in</p>
      </div>

      <div className="flashcards-layout">
        <div className="flashcards-main">
          {/* Mode Toggle */}
          <div className="mode-toggle">
            <button className={`mode-btn ${mode === "browse" ? "active" : ""}`}
              onClick={() => setMode("browse")} disabled={cards.length === 0}>
              📚 Browse Cards {cards.length > 0 ? `(${cards.length})` : ""}
            </button>
            <button className={`mode-btn ${mode === "generate" ? "active" : ""}`}
              onClick={() => setMode("generate")}>
              🤖 Generate with AI
            </button>
          </div>

          {mode === "generate" ? (
            <div className="card generate-form">
              <h3 style={{ marginBottom:20 }}>Generate AI Flashcards</h3>
              {error && <div className="error-banner" style={{ marginBottom:16 }}>{error}</div>}
              <div className="gen-grid">
                <div className="form-group">
                  <label>Subject</label>
                  <select value={genConfig.subject}
                    onChange={e => setGenConfig({ ...genConfig, subject: e.target.value })}>
                    {SUBJECTS.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Topic (optional)</label>
                  <input placeholder="e.g. Thermodynamics, Organic Chemistry..."
                    value={genConfig.topic}
                    onChange={e => setGenConfig({ ...genConfig, topic: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Number of Cards: {genConfig.count}</label>
                  <input type="range" min="3" max="20" value={genConfig.count}
                    onChange={e => setGenConfig({ ...genConfig, count: Number(e.target.value) })}
                    style={{ padding:0 }} />
                </div>
              </div>
              <button className="btn btn-primary"
                style={{ width:"100%", justifyContent:"center", padding:14, marginTop:8 }}
                onClick={generateFlashcards} disabled={generating}>
                {generating ? "🤖 AI is creating cards..." : "✨ Generate Flashcards"}
              </button>
            </div>
          ) : cards.length === 0 ? (
            <div className="card" style={{ textAlign:"center", padding:"60px 40px" }}>
              <div style={{ fontSize:64, marginBottom:20 }}>🃏</div>
              <h2 style={{ marginBottom:12 }}>No flashcards yet</h2>
              <p style={{ color:"var(--text-secondary)", marginBottom:24 }}>
                Switch to "Generate with AI" to create flashcards instantly.
              </p>
              <button className="btn btn-primary" onClick={() => setMode("generate")}>
                🤖 Generate Flashcards
              </button>
            </div>
          ) : (
            <>
              {/* Study mode filter */}
              {Object.keys(ratings).length > 0 && (
                <div style={{ display:"flex", gap:8, marginBottom:12 }}>
                  {[
                    { key:"all",    label:`All (${cards.length})` },
                    { key:"hard",   label:`Practice (${hardCount})` },
                    { key:"review", label:`Review (${reviewCount})` },
                  ].map(m => (
                    <button key={m.key}
                      style={{ padding:"6px 14px", borderRadius:20, fontSize:12, fontWeight:600, cursor:"pointer",
                        border:"1px solid var(--border)",
                        background: studyMode === m.key ? "var(--accent-primary)" : "transparent",
                        color: studyMode === m.key ? "#fff" : "var(--text-secondary)" }}
                      onClick={() => { setStudyMode(m.key); setCurrentIndex(0); setFlipped(false); }}>
                      {m.label}
                    </button>
                  ))}
                </div>
              )}

              {/* Progress */}
              <div className="flashcard-progress">
                <span style={{ fontSize:13, color:"var(--text-secondary)" }}>
                  Card {filteredCards.length > 0 ? currentIndex + 1 : 0} of {filteredCards.length}
                </span>
                <div style={{ flex:1, height:4, background:"var(--border)", borderRadius:2, margin:"0 12px" }}>
                  <div style={{ width:`${progress}%`, height:"100%", background:"var(--accent-primary)",
                    borderRadius:2, transition:"width 0.4s" }} />
                </div>
                <span style={{ fontSize:13, color:"var(--accent-green)" }}>✓ {masteredCount} mastered</span>
              </div>

              {filteredCards.length === 0 ? (
                <div className="card" style={{ textAlign:"center", padding:40 }}>
                  <p style={{ color:"var(--text-muted)" }}>No cards in this filter. 🎉 Switch to "All".</p>
                </div>
              ) : (
                <>
                  {/* Flip Card */}
                  <div className="flip-card-container" onClick={handleFlip}>
                    <div className={`flip-card ${flipped ? "flipped" : ""}`}>
                      <div className="flip-card-front">
                        <div className="card-meta">
                          <span className="badge badge-purple">{filteredCards[currentIndex]?.subject}</span>
                          <span className={`badge ${getDifficultyColor(filteredCards[currentIndex]?.difficulty)}`}>
                            {filteredCards[currentIndex]?.difficulty}
                          </span>
                        </div>
                        <div className="card-question">{filteredCards[currentIndex]?.question}</div>
                        <div className="card-tap-hint">👆 Tap to reveal answer</div>
                      </div>
                      <div className="flip-card-back">
                        <div className="card-meta">
                          <span style={{ fontSize:12, color:"var(--accent-secondary)", fontWeight:700 }}>ANSWER</span>
                        </div>
                        <div className="card-answer">
                          {filteredCards[currentIndex]?.answer.split("\n").map((line, i) => <p key={i}>{line}</p>)}
                        </div>
                      </div>
                    </div>
                  </div>

                  {flipped && (
                    <div className="rating-section">
                      <p style={{ fontSize:13, color:"var(--text-secondary)", textAlign:"center", marginBottom:12 }}>
                        How well did you know this?
                      </p>
                      <div className="rating-btns">
                        <button className="rate-btn rate-hard" onClick={() => rateCard("hard")}>
                          <span>😓</span> Hard
                        </button>
                        <button className="rate-btn rate-ok" onClick={() => rateCard("ok")}>
                          <span>🤔</span> OK
                        </button>
                        <button className="rate-btn rate-easy" onClick={() => rateCard("easy")}>
                          <span>😊</span> Easy
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="card-nav">
                    <button className="btn btn-secondary" onClick={handlePrev}>← Prev</button>
                    <button className="btn btn-ghost" onClick={handleFlip}>
                      {flipped ? "Hide Answer" : "Show Answer"}
                    </button>
                    <button className="btn btn-secondary" onClick={handleNext}>Next →</button>
                  </div>
                </>
              )}
            </>
          )}
        </div>

        {/* Sidebar */}
        <div className="flashcards-sidebar">
          <div className="card">
            <h3 style={{ marginBottom:16 }}>📊 Session Stats</h3>
            {[
              { label:"Total Cards",    val:cards.length,   color:"var(--text-primary)" },
              { label:"Mastered ✓",    val:masteredCount,   color:"var(--accent-green)" },
              { label:"Review Later",   val:reviewCount,     color:"var(--accent-orange)" },
              { label:"Need Practice",  val:hardCount,       color:"var(--accent-pink)" },
              { label:"Not Seen",       val:cards.length - Object.keys(ratings).length, color:"var(--text-muted)" },
            ].map(s => (
              <div key={s.label} style={{ display:"flex", justifyContent:"space-between",
                padding:"10px 0", borderBottom:"1px solid var(--border)" }}>
                <span style={{ fontSize:14, color:"var(--text-secondary)" }}>{s.label}</span>
                <span style={{ fontSize:16, fontWeight:800, color:s.color }}>{s.val}</span>
              </div>
            ))}
            {cards.length > 0 && masteredCount === cards.length && (
              <div style={{ textAlign:"center", marginTop:12, fontSize:20 }}>
                🎉 All mastered! Generate new cards.
              </div>
            )}
          </div>

          {cards.length > 0 && (
            <div className="card">
              <h3 style={{ marginBottom:14 }}>🃏 All Cards</h3>
              <div className="cards-mini-list">
                {cards.map((c, i) => (
                  <div key={c.id}
                    className={`card-mini ${i === currentIndex && mode === "browse" ? "active" : ""}`}
                    onClick={() => { setCurrentIndex(i); setFlipped(false); setMode("browse"); setStudyMode("all"); }}>
                    <div style={{ fontSize:12, fontWeight:600, marginBottom:2 }}>{c.subject}</div>
                    <div style={{ fontSize:11, color:"var(--text-muted)", overflow:"hidden",
                      textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{c.question}</div>
                    {ratings[c.id] && (
                      <span style={{ fontSize:10 }}>
                        {ratings[c.id] === "easy" ? "✓" : ratings[c.id] === "ok" ? "~" : "✗"}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

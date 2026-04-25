import { useState, useRef, useEffect, useCallback } from "react";
import { materialAPI } from "../../services/api";
import "./Upload.css";

const SUBJECTS = [
  "Mathematics","Physics","Chemistry","Biology",
  "Computer Science","History","English","Economics","Geography"
];

const StatusBadge = ({ status }) => {
  const map = {
    PROCESSING: { label: "⏳ Processing...", color: "#fb923c" },
    DONE:       { label: "✅ Ready",         color: "#4ade80" },
    FAILED:     { label: "❌ Failed",         color: "#f472b6" },
  };
  const s = map[status] || map.PROCESSING;
  return (
    <span style={{ fontSize: 12, fontWeight: 700, color: s.color, whiteSpace: "nowrap" }}>
      {s.label}
    </span>
  );
};

export default function Upload({ user }) {
  const [dragging, setDragging]   = useState(false);
  const [files, setFiles]         = useState([]);
  const [subject, setSubject]     = useState("Mathematics");
  const [uploading, setUploading] = useState(false);
  const [materials, setMaterials] = useState([]);
  const [loadingMats, setLoadingMats] = useState(true);
  const [error, setError]         = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const fileInputRef = useRef();
  const pollingRef   = useRef({});

  // Load existing materials on mount
  const loadMaterials = useCallback(() => {
    if (!user?.id) return;
    materialAPI.getUserMaterials(user.id)
      .then(data => setMaterials(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoadingMats(false));
  }, [user?.id]);

  useEffect(() => {
    loadMaterials();
  }, [loadMaterials]);

  // Poll a single material until DONE/FAILED
  const pollMaterial = (id) => {
    if (pollingRef.current[id]) return;
    pollingRef.current[id] = setInterval(async () => {
      try {
        const m = await materialAPI.getMaterial(id);
        if (m.status === "DONE" || m.status === "FAILED") {
          clearInterval(pollingRef.current[id]);
          delete pollingRef.current[id];
          setMaterials(prev => prev.map(mat => mat.id === id ? m : mat));
        }
      } catch {
        clearInterval(pollingRef.current[id]);
        delete pollingRef.current[id];
      }
    }, 3000);
  };

  // Clear all polling on unmount
  useEffect(() => {
    return () => Object.values(pollingRef.current).forEach(clearInterval);
  }, []);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const dropped = Array.from(e.dataTransfer.files).filter(
      f => f.type === "application/pdf" || f.type.startsWith("text/")
    );
    setFiles(prev => [...prev, ...dropped]);
  };

  const handleFileSelect = (e) => {
    setFiles(prev => [...prev, ...Array.from(e.target.files)]);
  };

  const removeFile = (i) => setFiles(f => f.filter((_, idx) => idx !== i));

  const handleUpload = async () => {
    if (!files.length) return;
    setUploading(true);
    setError(null);
    for (const file of files) {
      try {
        const result = await materialAPI.upload(file, user?.id, subject);
        setMaterials(prev => [result, ...prev]);
        if (result.status === "PROCESSING") pollMaterial(result.id);
      } catch (e) {
        setError(`Failed to upload ${file.name}: ${e.message}`);
      }
    }
    setFiles([]);
    setUploading(false);
  };

  const handleDelete = async (id) => {
    try {
      await materialAPI.deleteMaterial(id);
      clearInterval(pollingRef.current[id]);
      delete pollingRef.current[id];
      setMaterials(prev => prev.filter(m => m.id !== id));
    } catch (e) {
      setError("Delete failed: " + e.message);
    }
  };

  const processingCount = materials.filter(m => m.status === "PROCESSING").length;
  const doneCount       = materials.filter(m => m.status === "DONE").length;

  return (
    <div className="upload-page">
      <div className="page-header">
        <h1>📁 Study Materials</h1>
        <p>Upload PDFs and notes — AI will extract content, summarize, and enable quiz generation</p>
      </div>

      <div className="upload-layout">
        <div className="upload-main">

          {/* Subject selector */}
          <div className="card subject-selector">
            <h3 style={{ marginBottom: 14 }}>Select Subject</h3>
            <div className="subject-chips">
              {SUBJECTS.map(s => (
                <button key={s} className={`subject-chip ${subject === s ? "active" : ""}`}
                  onClick={() => setSubject(s)}>{s}</button>
              ))}
            </div>
          </div>

          {/* Drop zone */}
          <div
            className={`drop-zone ${dragging ? "dragging" : ""}`}
            onDragOver={e => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current.click()}
          >
            <input ref={fileInputRef} type="file" multiple accept=".pdf,.txt,.md"
              style={{ display: "none" }} onChange={handleFileSelect} />
            <div className="drop-icon">📄</div>
            <h3>Drop your files here</h3>
            <p>or click to browse • PDF, TXT, MD files supported</p>
            <span className="drop-limit">Max 25MB per file</span>
          </div>

          {/* File queue */}
          {files.length > 0 && (
            <div className="card file-queue">
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
                <h3>{files.length} file{files.length > 1 ? "s" : ""} ready to upload</h3>
                <button className="btn btn-primary" onClick={handleUpload} disabled={uploading}>
                  {uploading
                    ? <><span className="spinner" style={{ width:16, height:16, borderWidth:2 }} /> Uploading...</>
                    : "⬆️ Upload All"}
                </button>
              </div>
              {files.map((f, i) => (
                <div key={i} className="file-item">
                  <div className="file-icon">📄</div>
                  <div className="file-info">
                    <div className="file-name">{f.name}</div>
                    <div className="file-size">{(f.size / 1024).toFixed(1)} KB • {subject}</div>
                  </div>
                  <button className="file-remove" onClick={() => removeFile(i)}>✕</button>
                </div>
              ))}
            </div>
          )}

          {error && <div className="error-banner">{error}</div>}

          {/* Materials Library */}
          <div className="card">
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
              <h3>📚 Your Materials ({materials.length})</h3>
              <div style={{ display:"flex", gap:8, fontSize:12, color:"var(--text-secondary)" }}>
                {processingCount > 0 && <span style={{ color:"#fb923c" }}>⏳ {processingCount} processing</span>}
                {doneCount > 0 && <span style={{ color:"#4ade80" }}>✅ {doneCount} ready</span>}
              </div>
            </div>

            {loadingMats ? (
              <div style={{ textAlign:"center", padding:40, color:"var(--text-muted)" }}>Loading materials...</div>
            ) : materials.length === 0 ? (
              <div style={{ textAlign:"center", padding:40, color:"var(--text-muted)" }}>
                <div style={{ fontSize:40, marginBottom:12 }}>📂</div>
                <p>No materials uploaded yet. Upload a PDF to get started!</p>
              </div>
            ) : (
              <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                {materials.map(m => (
                  <div key={m.id} style={{ border:"1px solid var(--border)", borderRadius:10, overflow:"hidden" }}>
                    <div
                      style={{ display:"flex", alignItems:"center", gap:12, padding:"12px 16px", cursor:"pointer",
                        background: expandedId === m.id ? "rgba(124,106,247,0.05)" : "transparent" }}
                      onClick={() => setExpandedId(expandedId === m.id ? null : m.id)}
                    >
                      <div style={{ fontSize:24 }}>
                        {m.fileType === "application/pdf" ? "📕" : "📝"}
                      </div>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontSize:14, fontWeight:600, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                          {m.fileName}
                        </div>
                        <div style={{ fontSize:12, color:"var(--text-muted)", marginTop:2 }}>
                          {m.subjectName} • {m.fileSize ? `${(m.fileSize/1024).toFixed(0)} KB` : ""}
                          {" • "}{new Date(m.uploadedAt).toLocaleDateString()}
                        </div>
                      </div>
                      <StatusBadge status={m.status} />
                      <button
                        style={{ background:"none", border:"none", color:"var(--text-muted)", cursor:"pointer",
                          fontSize:16, padding:"4px 8px", marginLeft:4 }}
                        onClick={e => { e.stopPropagation(); handleDelete(m.id); }}
                        title="Delete"
                      >🗑️</button>
                      <span style={{ color:"var(--text-muted)", fontSize:12 }}>{expandedId === m.id ? "▲" : "▼"}</span>
                    </div>

                    {expandedId === m.id && (
                      <div style={{ padding:"12px 16px", borderTop:"1px solid var(--border)",
                        background:"rgba(0,0,0,0.15)" }}>
                        {m.status === "PROCESSING" && (
                          <div style={{ display:"flex", alignItems:"center", gap:8, color:"#fb923c", fontSize:13 }}>
                            <span className="spinner" style={{ width:14, height:14, borderWidth:2 }} />
                            AI is analyzing your document... This takes 10–30 seconds.
                          </div>
                        )}
                        {m.status === "FAILED" && (
                          <p style={{ color:"#f472b6", fontSize:13 }}>
                            Processing failed. Try re-uploading the file.
                          </p>
                        )}
                        {m.status === "DONE" && m.aiSummary && (
                          <div>
                            <div style={{ fontSize:12, fontWeight:700, color:"var(--accent-primary)", marginBottom:8 }}>
                              🤖 AI Summary
                            </div>
                            <div style={{ fontSize:13, color:"var(--text-secondary)", lineHeight:1.7,
                              whiteSpace:"pre-wrap" }}>
                              {m.aiSummary}
                            </div>
                          </div>
                        )}
                        {m.fileUrl && (
                          <a href={m.fileUrl} target="_blank" rel="noreferrer"
                            style={{ display:"inline-block", marginTop:10, fontSize:12,
                              color:"var(--accent-primary)", textDecoration:"underline" }}>
                            📥 View original file
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="upload-sidebar">
          <div className="card how-it-works">
            <h3 style={{ marginBottom: 16 }}>🤖 How It Works</h3>
            {[
              { step:"1", title:"Upload PDF",     desc:"Drop your notes, textbooks or study material" },
              { step:"2", title:"AI Extracts",    desc:"PDFBox extracts all text from your document" },
              { step:"3", title:"AI Summarizes",  desc:"Groq AI creates a concise summary" },
              { step:"4", title:"Generate Quiz",  desc:'Go to Quiz page and generate from your material' },
            ].map(s => (
              <div key={s.step} className="how-step">
                <div className="step-num">{s.step}</div>
                <div>
                  <div className="step-title">{s.title}</div>
                  <div className="step-desc">{s.desc}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="card tips-card">
            <h3 style={{ marginBottom: 12 }}>💡 Tips</h3>
            {[
              "Upload chapter-by-chapter for better quizzes",
              "Scanned PDFs may not extract well",
              "Text-based PDFs work best",
              "Max 25MB per file",
              "AI summary ready in ~30 seconds",
            ].map((t, i) => (
              <div key={i} className="tip-item">
                <span className="tip-dot" />
                <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>{t}</span>
              </div>
            ))}
          </div>

          {materials.length > 0 && (
            <div className="card">
              <h3 style={{ marginBottom: 12 }}>📊 Library Stats</h3>
              {[
                { label: "Total Files", value: materials.length },
                { label: "Ready",       value: doneCount, color: "#4ade80" },
                { label: "Processing",  value: processingCount, color: "#fb923c" },
                { label: "Subjects",    value: [...new Set(materials.map(m => m.subjectName))].length },
              ].map(s => (
                <div key={s.label} style={{ display:"flex", justifyContent:"space-between",
                  padding:"8px 0", borderBottom:"1px solid var(--border)" }}>
                  <span style={{ fontSize:13, color:"var(--text-secondary)" }}>{s.label}</span>
                  <span style={{ fontSize:14, fontWeight:700, color: s.color || "var(--text-primary)" }}>{s.value}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

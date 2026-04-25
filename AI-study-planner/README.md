# 🎓 AI Study Planner

A full-stack AI-powered study tool built with React + Spring Boot + PostgreSQL.

## ✨ Features
- 🧠 **AI Quiz Generator** — Gemini 2.0 Flash generates personalized quizzes
- 🤖 **AI Tutor Chatbot** — Ask any study question, get instant answers
- 📊 **Analytics Dashboard** — Track study sessions, scores, weekly trends
- 📅 **Smart Study Planner** — Plan sessions with exam countdown
- 📁 **Material Upload** — Upload PDFs, get AI-generated summaries
- 👥 **Study Groups** — Collaborate with XP leaderboards
- 🔐 **Auth** — JWT login/signup (Google OAuth optional)

---

## 🚀 Quick Start (Docker — recommended)

### 1. Prerequisites
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running

### 2. Get your Gemini API key (FREE)
1. Go to [https://aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)
2. Sign in with Google → Click **Create API Key**
3. Copy the key (starts with `AIza...`)

### 3. Configure environment
The `.env` file is already present with a default key. To use your own:
```bash
# Edit .env and replace GEMINI_API_KEY value
nano .env   # or open in any text editor
```

### 4. Start everything
```bash
docker-compose up --build
```
First build takes ~3-5 minutes. After that:
- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:8080

### 5. Stop
```bash
docker-compose down
```

---

## 🛠️ Local Development (without Docker)

### Backend
```bash
# Requires Java 17+ and PostgreSQL running locally
cd backend
export GEMINI_API_KEY=your-key-here
./mvnw spring-boot:run
```

### Frontend
```bash
cd frontend
npm install
npm run dev
# Opens at http://localhost:5173
```

---

## 🔑 Environment Variables

| Variable | Required | Description |
|---|---|---|
| `GEMINI_API_KEY` | **YES** | Gemini AI key from aistudio.google.com |
| `DB_PASSWORD` | Yes | PostgreSQL password (default: `postgres`) |
| `JWT_SECRET` | Yes | Long random string for JWT signing |
| `CLOUDINARY_*` | Optional | Cloud file storage (files still work without it) |
| `MAIL_USERNAME/PASSWORD` | Optional | Gmail app password for email reminders |
| `GOOGLE_CLIENT_ID/SECRET` | Optional | For "Sign in with Google" |

---

## ❗ Troubleshooting

**Quiz says "Gemini quota exhausted"**
→ Free tier limit: 15 requests/min, 1500/day. Wait 60 seconds and try again, or get a new key.

**"Invalid API key" error**
→ Check your `GEMINI_API_KEY` in `.env`. Make sure there are no spaces or quotes around it.

**Backend won't start**
→ Make sure Docker Desktop is running, then: `docker-compose down && docker-compose up --build`

**Chatbot shows "not configured"**
→ `GEMINI_API_KEY` is missing or blank in `.env`. Add it and restart with `docker-compose up --build`.

**Port 3000 or 8080 already in use**
→ Stop other services using those ports, or change the ports in `docker-compose.yml`.

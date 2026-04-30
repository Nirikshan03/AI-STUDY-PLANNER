 🎓 AI Study Planner

> An AI-powered full-stack study platform that generates personalized quizzes, study plans, and provides an intelligent AI tutor.

🌐 **Live Demo**: [http://nirikshan-study.duckdns.org](http://nirikshan-study.duckdns.org)


## ✨ Features

- 🔐 **Authentication** — JWT login + Google OAuth2 sign-in
- 🧠 **AI Quiz Generator** — Auto-generates MCQ quizzes using Groq AI (LLaMA 3.3)
- 📅 **Smart Study Planner** — AI creates personalized weekly study schedules
- 📁 **PDF Upload** — Upload PDFs and get AI-powered summaries
- 🃏 **Flashcards** — Create and review flashcards with spaced repetition
- 📊 **Analytics Dashboard** — Track study hours, quiz scores, and progress
- 👥 **Study Groups** — Collaborate with others in shared study groups
- 🔔 **Email Reminders** — Automated daily study reminders via Gmail SMTP
- 🤖 **AI Tutor Chat** — Ask any subject question and get instant AI answers

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| Backend | Java, Spring Boot 3, Spring Security, Spring Data JPA |
| Authentication | JWT, Google OAuth2 |
| Frontend | React.js, Vite, CSS3 |
| AI | Groq API (LLaMA 3.3-70b-versatile) |
| Database | PostgreSQL |
| File Storage | Cloudinary |
| Email | JavaMailSender, Gmail SMTP |
| DevOps | Docker, Docker Compose |
| CI/CD | Jenkins (Pipeline as Code) |
| Cloud | AWS EC2 (t3.micro) |
| Web Server | Nginx (reverse proxy) |

---

## 🏗 Architecture

```
GitHub → Jenkins CI/CD → Docker Build → AWS EC2
                                          │
                              ┌───────────┴───────────┐
                              │                       │
                         Nginx (port 80)         PostgreSQL
                              │
                    ┌─────────┴─────────┐
                    │                   │
               React Frontend    Spring Boot Backend
                                        │
                              ┌─────────┴─────────┐
                              │                   │
                          Groq AI API        Cloudinary
```

---

## 🚀 Run Locally

### Prerequisites
- Docker & Docker Compose
- Java 21
- Node.js 20

### Steps

1. **Clone the repo:**
```bash
git clone https://github.com/Nirikshan03/AI-STUDY-PLANNER.git
cd AI-STUDY-PLANNER/AI-study-planner
```

2. **Create `.env` file:**
```bash
cp .env.example .env
# Fill in your API keys
```

3. **Start the app:**
```bash
docker-compose up --build
```

4. **Open browser:** `http://localhost:3000`

---

## ⚙️ Environment Variables

```env
GROQ_API_KEY=your_groq_api_key
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
MAIL_USERNAME=your_gmail@gmail.com
MAIL_PASSWORD=your_gmail_app_password
DB_PASSWORD=postgres
JWT_SECRET=your_jwt_secret_key
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
FRONTEND_URL=http://localhost:3000
```

---

## 🔄 CI/CD Pipeline

```
git push → GitHub Webhook → Jenkins
                                │
                    ┌───────────┼───────────┐
                    │           │           │
               Checkout    Build JAR   Docker Build
                                            │
                                        Deploy to EC2
```

---

## 📁 Project Structure

```
AI-study-planner/
├── backend/                 # Spring Boot application
│   ├── src/main/java/com/studyplanner/
│   │   ├── controller/      # REST API controllers
│   │   ├── service/         # Business logic
│   │   ├── model/           # JPA entities
│   │   ├── repository/      # Spring Data repositories
│   │   └── security/        # JWT + OAuth2 config
│   └── Dockerfile
├── frontend/                # React.js application
│   ├── src/
│   │   ├── pages/           # Dashboard, Quiz, Flashcards etc.
│   │   ├── components/      # Navbar, shared components
│   │   └── services/        # API service layer
│   ├── nginx.conf
│   └── Dockerfile
├── Jenkinsfile              # CI/CD pipeline
├── docker-compose.yml       # Multi-container setup
└── .env.example             # Environment variables template
```

---

## 👨‍💻 Author

**Nirikshan K**
- 📧 nirikshan03@gmail.com
- 💼 [LinkedIn](https://linkedin.com/in/nirikshan-k-933107282)
- 🐙 [GitHub](https://github.com/Nirikshan03)

---

## 📄 License

This project is for educational purposes.

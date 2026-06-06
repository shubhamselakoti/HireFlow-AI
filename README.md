<div align="center">

<img src="https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js" />
<img src="https://img.shields.io/badge/Node.js-20-green?style=for-the-badge&logo=node.js" />
<img src="https://img.shields.io/badge/MongoDB-Atlas-47A248?style=for-the-badge&logo=mongodb" />
<img src="https://img.shields.io/badge/Groq-LLaMA_3.1-orange?style=for-the-badge" />
<img src="https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript" />

# 🚀 HireFlow HRMS

**AI-powered Human Resource Management System** — from hiring to payroll, in one beautiful claymorphic interface.

[![View Live Demo](https://img.shields.io/badge/🌐_View_Live_Demo-6D4AFF?style=for-the-badge)](https://hireflow-ai-g3k7.onrender.com)
[![API Health](https://img.shields.io/badge/⚡_API_Health-1D9E75?style=for-the-badge)](https://hireflow-ai-hqml.onrender.com/health)

</div>

---

## ✨ What is HireFlow?

HireFlow is a full-stack HRMS that handles the complete employee lifecycle — from the moment a candidate browses a job opening, through AI resume screening, interviews, hiring, onboarding, attendance, leave, payroll, and performance reviews.

Built with a claymorphism design system, Next.js 14 App Router, Node.js/Express REST API, and MongoDB Atlas.

---

## 🏗️ Architecture

```
┌─────────────────────────────┐        ┌─────────────────────────────┐
│         CLIENT              │        │          SERVER              │
│  Next.js 14 (App Router)    │◄──────►│  Node.js + Express REST API │
│  TypeScript + Tailwind CSS  │  HTTP  │  Mongoose ODM               │
│  NextAuth v5 (JWT + OAuth)  │        │  JWT Authentication          │
│  Zustand + React Hook Form  │        │  Multer + Cloudinary         │
│  Recharts + Sonner          │        │  Nodemailer + Brevo SMTP     │
│                             │        │                              │
│  Deploy: Render (Node SSR)  │        │  Deploy: Render              │
└─────────────────────────────┘        └──────────┬──────────────────┘
                                                   │
                              ┌────────────────────┼────────────────────┐
                              │                    │                    │
                    ┌─────────▼──────┐  ┌──────────▼──────┐  ┌────────▼────────┐
                    │  MongoDB Atlas │  │   Groq LLaMA    │  │   Cloudinary    │
                    │  (Database)    │  │   + HuggingFace │  │   (File Store)  │
                    └────────────────┘  └─────────────────┘  └─────────────────┘
```

---

## 🎯 Features

### 🤖 AI-Powered Recruitment
- **Bulk resume screening** — upload up to 20 PDFs at once; Groq + HuggingFace extract skills and score candidates 0–100 by job fit
- **AI job description generator** — streaming SSE, generates complete JDs from a job title
- **AI interviews** — browser-based voice interviews with Web Speech API transcription, per-answer Groq scoring, final skill scores
- **Hire flow automation** — marking a candidate as Hired auto-creates Employee record, Onboarding checklist, User account, and sends credential email

### 👥 Employee Management
- Complete employee directory with search, filter, department grouping
- Salary structure editor (Base + HRA + Allowances − Deductions)
- Document upload via Cloudinary, avatar management
- `firstname.lastname@hireflow.com` login identity generated on hire

### 📅 Attendance & Leave
- Clock in / clock out with daily records
- Configurable leave policies (Casual, Sick, Annual, Maternity, Paternity, Unpaid) seeded automatically on first server start
- Leave application with balance validation
- Manager approval workflow with email notifications

### 💰 Payroll
- One-click monthly payroll run
- Attendance-adjusted calculations
- Payslips emailed automatically via Brevo SMTP
- Historical payslip viewer for employees

### 📊 Analytics & Performance
- Recruitment funnel charts
- Attendance trend graphs
- Payroll cost summaries by department
- Performance rating distributions
- Goal tracking per employee

---

## 👤 User Roles

| Role | Portal | Key Permissions |
|------|--------|----------------|
| `management_admin` | `/dashboard` | Full access — all modules, user role management, payroll |
| `senior_manager` | `/manager` | Team attendance, leave approval, performance reviews (own team only) |
| `hr_recruiter` | `/recruiter` | Jobs, AI screening, pipeline, interviews, onboarding |
| `employee` | `/employee` | Own attendance, leave, payslips, performance, profile |
| `candidate` | `/candidate-portal` | Browse jobs, apply, track applications, take AI interview |

---

## 🔄 Hiring Flow

```
Candidate applies (resume upload)
        ↓
AI screens resume → score 0–100
        ↓
HR advances through pipeline:
Applied → Screened → Interview Scheduled → Interviewed → Offered → Hired
        ↓
On "Hired":
  ✅ Employee record created
  ✅ User account created (firstname.lastname@hireflow.com)
  ✅ Temp password generated & hashed
  ✅ Onboarding checklist created
  ✅ Credentials email sent to candidate
```

---

## 🛠️ Tech Stack

**Frontend**
- Next.js 14 App Router + TypeScript
- Tailwind CSS (claymorphism design system)
- NextAuth v5 (JWT sessions + Google OAuth)
- Zustand, React Hook Form + Zod, Recharts, Sonner

**Backend**
- Node.js + Express + express-async-errors
- Mongoose (MongoDB ODM)
- bcryptjs + jsonwebtoken
- Multer + pdf-parse, Nodemailer + Brevo SMTP

**AI & Cloud**
- Groq (LLaMA 3.1 8B) — JD generation, answer evaluation, HR chatbot
- HuggingFace NER — skill extraction from resumes
- Cloudinary — resume and document storage (streamed via backend proxy)
- MongoDB Atlas — database

---

## 🚀 Getting Started

### Prerequisites
Node.js 20+, MongoDB Atlas, Cloudinary, Groq API key, Brevo SMTP, Google Cloud OAuth

### Server
```bash
cd server
npm install
cp .env.example .env
npm run dev           # http://localhost:5000
```

### Client
```bash
cd client
npm install
cp .env.local.example .env.local
npm run dev           # http://localhost:3000
```

---

## ⚙️ Environment Variables

### Client — `client/.env.local`

```env
NEXT_PUBLIC_API_URL=http://localhost:5000
AUTH_SECRET=<openssl rand -base64 32>
AUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=<same as AUTH_SECRET>
NEXTAUTH_URL=http://localhost:3000
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
```

### Server — `server/.env`

```env
PORT=5000
MONGODB_URI=mongodb+srv://...
JWT_SECRET=
CLIENT_URL=http://localhost:3000
NODE_ENV=development
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
GROQ_API_KEY=
HUGGINGFACE_API_KEY=
BREVO_SMTP_USER=
BREVO_SMTP_PASS=
BREVO_FROM_EMAIL=noreply@yourdomain.com
HIREFLOW_DOMAIN=hireflow.com
```

---

## 🌐 Deployment on Render

**Server**

| Setting | Value |
|---------|-------|
| Root directory | `server` |
| Build command | `npm install` |
| Start command | `node index.js` |
| Node version | `20` |

**Client**

| Setting | Value |
|---------|-------|
| Root directory | `client` |
| Build command | `npm install && npm run build` |
| Start command | `npm start` |
| Node version | `20` |

> After deploying the client, update `CLIENT_URL` in the server's environment variables to the client Render URL and redeploy.

---

## 📁 Project Structure

```
hireflow/
├── client/                     # Next.js 14 frontend
│   ├── app/
│   │   ├── candidate-portal/   # Public job board + tracking
│   │   ├── interview/[id]/     # AI interview room (no auth)
│   │   ├── dashboard/          # Admin portal
│   │   ├── manager/            # Sr. Manager portal
│   │   ├── recruiter/          # HR Recruiter portal
│   │   └── employee/           # Employee self-service
│   ├── components/
│   ├── lib/                    # axios, auth, utils
│   └── store/
│
└── server/                     # Express REST API
    ├── controllers/            # 15 domain controllers
    ├── models/                 # 14 Mongoose models
    ├── routes/                 # 16 route files
    ├── services/               # AI, email, Cloudinary, payroll
    ├── middleware/             # Auth, roles, sanitize, error
    └── utils/                  # seed, employee helpers
```

---

<div align="center">

Built with ❤️ for modern HR teams · HireFlow HRMS © 2025 · MIT License

</div>
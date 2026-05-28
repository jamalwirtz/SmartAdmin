# SSTG — Complete Setup & Usage Guide
**Smart School Timetable Generator with Exam Scheduling**

---

## Folder Structure

```
SmartAdmin/               ← project root
├── main.py               ← ROOT entry point (run from here)
├── backend/              ← Python FastAPI backend modules
│   ├── main.py           ← FastAPI app definition
│   ├── models.py         ← Database models (classes, timetables, exams)
│   ├── exams.py          ← Exam scheduling endpoints
│   ├── requirements.txt
│   └── .env              ← create this
├── frontend/             ← React + Vite frontend
│   ├── src/
│   │   ├── pages/Exams.jsx    ← Exam timetable management
│   │   ├── App.jsx
│   │   └── ...
│   └── package.json
└── public/logo.png       ← Smart Admin logo
```

---

## Step 1 — Backend Setup (Root Level)

Now you can run from the **project root** — no need to `cd backend`:

```bash
# 1. From SmartAdmin/ root, create venv
python -m venv venv

# 2. Activate it
#    Windows:
venv\Scripts\activate
#    Mac/Linux:
source venv/bin/activate

# 3. Install dependencies
pip install -r backend/requirements.txt

# 4. Create .env file
#    Windows:
copy backend\env.example .env
#    Mac/Linux:
cp backend/env.example .env

# 5. Edit .env — set DATABASE_URL to SQLite for local dev:
#    DATABASE_URL=sqlite:///./sstg.db

# 6. START BACKEND (from project root with venv active):
uvicorn main:app --reload
```

Backend runs at **http://localhost:8000**  
API docs at **http://localhost:8000/docs**

---

## Step 2 — Frontend Setup

**Open a SECOND terminal** (keep backend running):

```bash
# 1. Go to frontend
cd SmartAdmin/frontend

# 2. Install dependencies
npm install

# 3. Start dev server
npm run dev
```

Frontend runs at **http://localhost:5173**

---

## Step 3 — Sign In & Explore

Go to **http://localhost:5173** → Sign In → `admin` / `admin123`

You now have access to:
- **Dashboard** — overview
- **Teachers** — manage staff
- **Subjects** — with 1-6 papers per subject
- **Classes** — school sections
- **Timetable** — regular class schedule
- **Exams** — exam timetable with paper filtering ⭐ NEW
- **Settings** — profile & theme

---

## Environment File

The `.env` file sits in the **project root** (not in backend/).

Minimum for local dev:

```dotenv
SECRET_KEY=local-dev-secret
DATABASE_URL=sqlite:///./sstg.db
SCHOOL_NAME=Greenfield Academy
ACADEMIC_YEAR=2024/2025
PERIODS_PER_DAY=8
SCHOOL_DAYS=Monday,Tuesday,Wednesday,Thursday,Friday
```

For Render production with PostgreSQL:

```dotenv
DATABASE_URL=postgresql+psycopg://user:password@host.oregon-postgres.render.com/dbname
```

---

## Exam Timetable Feature

### Workflow

1. **Create Exam Session** — e.g., "June 2024 Finals"
2. **Configure Papers** — Add papers 1-6 to subjects (e.g., Math has Paper 1, 2, 3)
3. **Select Classes** — Choose which classes take exams
4. **Generate Schedule** — Auto-distribute exams across days, balanced by class load
5. **Assign Invigilators** — Assign teachers to oversee exams
6. **Lock & Publish** — Prevent accidental changes, publish to students

### Key Features

- **Multi-paper support** — Each subject can have 1-6 papers
- **No conflicts** — A class never has 2 exams same day
- **Load balancing** — Exams spread evenly across exam period
- **Flexible filtering** — Choose specific classes and subjects per session
- **Teacher assignment** — Assign invigilators (teachers) to exam slots
- **Room allocation** — Assign exam venues (labs, halls, classrooms)
- **Lock/unlock** — Prevent changes to finalized slots

### Admin Controls

From the Exams page:
- 📋 **Papers** — Configure papers per subject
- 📅 **Schedule** — View timetable, move slots, assign invigilators
- ▶️ **Generate** — Auto-generate balanced exam schedule
- 🔒 **Lock** — Lock important slots (teacher will see read-only)
- 🗑️ **Delete** — Remove sessions or slots

---

## Rendering to Production

### Single Web Service (Recommended)

Run **both** frontend and backend from one Render web service:

| Setting | Value |
|---|---|
| Root Directory | `.` (project root) |
| Build Command | `cd frontend && npm install && npm run build && cd ../backend && pip install -r requirements.txt` |
| Start Command | `uvicorn main:app --host 0.0.0.0 --port $PORT` |

**Environment Variables:**

| Key | Value |
|---|---|
| `SECRET_KEY` | `openssl rand -hex 32` |
| `DATABASE_URL` | PostgreSQL **External** URL from Render database |
| `CORS_ORIGINS` | `https://your-service.onrender.com` |
| `PYTHON_VERSION` | `3.12` |

> **Critical:** Use the **External** PostgreSQL URL (with full hostname like `dpg-xxx.oregon-postgres.render.com`), not the Internal URL.

### Frontend Static File Serving

FastAPI automatically serves built React files at `/` route.
API routes stay at `/api/*` and `/schedule/*` etc.

---

## Troubleshooting

### "Cannot reach the server" on login

Backend is not running. Ensure:
1. You're in the **project root** (not `backend/`)
2. Venv is **activated** (you see `(venv)` in terminal)
3. You ran `pip install -r backend/requirements.txt`
4. You see `Application startup complete` in the backend terminal

### "DatabaseURL not found"

`.env` file is missing or in the wrong place. It should be in the **project root**:
```
SmartAdmin/.env  ✅
SmartAdmin/backend/.env  ❌
```

### Port 8000 already in use

```bash
# Windows:
netstat -ano | findstr :8000
taskkill /PID <pid> /F

# Mac/Linux:
lsof -ti:8000 | xargs kill -9
```

### Exam papers not saving

Check backend logs for errors. Ensure:
- Subject exists before adding papers
- Paper number is 1-6
- Database is connected (SQLite or PostgreSQL)

### Generated exams have conflicts

The auto-generate algorithm spreads exams across days. If you still see conflicts:
- Check that classes don't already have exams at those times
- Reduce the number of papers per subject
- Increase the exam period (more days = more flexibility)

---

## Database Reset (Local Dev)

```bash
# Delete SQLite database
del sstg.db          # Windows
rm sstg.db           # Mac/Linux

# Restart backend — database and demo data re-seed automatically
uvicorn main:app --reload
```

---

## API Endpoints Summary

### Exams (New)

```
POST   /api/exams/sessions                 — Create exam session
GET    /api/exams/sessions                 — List all sessions
GET    /api/exams/sessions/{id}            — Get session + slots
POST   /api/subjects/{id}/papers           — Add paper to subject
GET    /api/subjects/{id}/papers           — List papers
POST   /api/exams/sessions/{id}/slots      — Create exam slot
PUT    /api/exams/slots/{id}               — Update slot (move, lock)
DELETE /api/exams/slots/{id}               — Delete slot
POST   /api/exams/sessions/{id}/generate   — Auto-generate schedule
```

### Existing Endpoints

- Teachers: `/api/teachers`
- Subjects: `/api/subjects`
- Classes: `/api/classes`
- Timetable: `/api/schedule`

---

## Demo Data

Automatically seeded on first boot:

**Admin User:**
- Username: `admin`
- Password: `admin123`

**Demo Entities:**
- 6 Teachers
- 9 Subjects (Math, English, Science, etc.)
- 4 Classes (7A, 7B, 8A, 8B)
- Each subject configured with exam papers (1-3 papers per subject)

---

## Next Steps

1. ✅ Run backend from project root
2. ✅ Run frontend
3. ✅ Sign in as admin
4. 📝 Create an exam session
5. 📋 Configure papers per subject
6. 📅 Generate exam timetable
7. 🔒 Lock and publish schedule
8. 🚀 Deploy to Render

---

## Support

- Backend docs: http://localhost:8000/docs
- Check logs in terminal for detailed error messages
- Ensure PostgreSQL hostname is **full external URL** on Render

# AICTE Complaint Monitoring Platform - Full Hosting Guide

This guide walks you through hosting the **entire platform 100% free** on cloud infrastructure:
- **Database**: Cloud PostgreSQL via **Supabase** (Already configured and live!)
- **Backend API & Telegram Bot**: **Render** (Free Web Service) or **Railway**
- **Frontend Web Application**: **Vercel** (Free Hobby Tier)

---

## Architecture Overview

```
                      +-----------------------------+
                      |       Vercel (Frontend)     |
                      |  https://aicte-ui.vercel.app|
                      +--------------+--------------+
                                     |
               HTTPS API Calls       |
                                     v
                      +-----------------------------+
                      |      Render (Backend API)   |
                      | https://aicte-api.onrender.com
                      |  +-----------------------+  |
                      |  | Telegram Bot Poller   |  |
                      |  +-----------------------+  |
                      +--------------+--------------+
                                     |
                PostgreSQL + SSL     |
                                     v
                      +-----------------------------+
                      |      Supabase Cloud DB      |
                      |   db.pyqhlgxfkewhsqwgtjbs   |
                      +-----------------------------+
```

> **Why this setup?**
> 1. **Zero Cost**: Supabase, Render, and Vercel all have generous free tiers.
> 2. **Embedded Telegram Bot**: The Telegram Bot runs inside the backend server's background thread, so you do **not** need to pay for a separate worker instance.
> 3. **Instant Global CDN**: Vercel serves the frontend with low latency and SSR caching.

---

## Step 1: Push Your Code to GitHub

1. Open your terminal in the project root (`c:\Users\karti\OneDrive\Desktop\SIH`).
2. Stage and commit all changes:
   ```bash
   git add .
   git commit -m "feat: cloud deployment configuration for Render and Vercel"
   git push origin main
   ```
*(If you haven't connected a GitHub repository yet, create a new private or public repository on GitHub and run `git remote add origin <your-repo-url>` followed by `git push -u origin main`)*.

---

## Step 2: Deploy Backend on Render (5 Minutes)

1. Go to [render.com](https://render.com) and sign in with GitHub.
2. Click **New +** &rarr; **Web Service**.
3. Select your GitHub repository (`SIH-PROTOTYPE` or your repo name).
4. Configure the Web Service settings:
   - **Name**: `aicte-complaints-backend` (or your choice)
   - **Region**: `Singapore` (or Frankfurt / Oregon — Singapore has low latency to India)
   - **Branch**: `main`
   - **Root Directory**: *(Leave blank)*
   - **Runtime**: `Python 3`
   - **Build Command**:
     ```bash
     pip install -r requirements.txt
     ```
   - **Start Command**:
     ```bash
     uvicorn backend.app.main:app --host 0.0.0.0 --port $PORT
     ```
   - **Instance Type**: **Free** ($0/month)

5. Scroll down to **Environment Variables** and add the following keys:

| Key | Recommended Production Value | Description |
| :--- | :--- | :--- |
| `PYTHONPATH` | `.` | Ensures Python finds `backend` package root |
| `ENVIRONMENT` | `production` | Enables production mode |
| `DATABASE_URL` | `postgresql+psycopg2://postgres:YOUR_PASSWORD@db.pyqhlgxfkewhsqwgtjbs.supabase.co:5432/postgres?sslmode=require` | Your live Supabase PostgreSQL connection string |
| `SECRET_KEY` | *(Generate a random 32+ char string)* | Used to sign admin & grievance officer JWT tokens |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `1440` | Session lifetime (24 hours) |
| `TELEGRAM_BOT_TOKEN` | *(Your Telegram Bot Token from @BotFather)* | Enables the real-time student tracking bot |
| `ENABLE_TELEGRAM_POLLER` | `true` | Starts the bot poller automatically in the server |
| `RUN_STARTUP_MIGRATIONS` | `false` | Tables are already migrated and seeded in Supabase |

6. Click **Create Web Service**.
7. Wait 2-3 minutes for the build to finish. Once deployed, Render will provide your public URL:
   `https://aicte-complaints-backend.onrender.com`
8. Verify it works by opening in your browser:
   `https://aicte-complaints-backend.onrender.com/api/v1/health`
   You should see `{"success": true, "data": {"status": "operational", "database": "healthy"}}`.

---

## Step 3: Deploy Frontend on Vercel (3 Minutes)

1. Go to [vercel.com](https://vercel.com) and sign in with GitHub.
2. Click **Add New...** &rarr; **Project**.
3. Import your GitHub repository.
4. Configure the project:
   - **Framework Preset**: Select **Other**
   - **Root Directory**: Click **Edit** and select `frontend-new`
   - **Build and Output Settings**:
     - **Build Command**: `npm run build:vercel` (or toggle override and type `npm run build:vercel`)
     - **Output Directory**: `.vercel/output` *(auto-detected by Vercel)*
     - **Install Command**: `npm install`
5. Open the **Environment Variables** section and add:

| Key | Value | Notes |
| :--- | :--- | :--- |
| `VITE_API_BASE_URL` | `https://aicte-complaints-backend.onrender.com` | **Use your exact Render backend URL from Step 2** (no trailing slash) |
| `VITE_USE_MOCKS` | `false` | Connects directly to the live backend and Supabase database |

6. Click **Deploy**.
7. Vercel will build the frontend in ~60 seconds and give you your live URL:
   `https://your-project.vercel.app`

---

## Step 4: Verification & Smoke Test

1. **Dashboard & Workload by Bureau**:
   - Open your Vercel URL.
   - Login as Bureau Administrator or Officer.
   - Verify that the Workload by Bureau chart and tables populate in real time from Supabase.
2. **Magic AI Intake**:
   - Navigate to `/ingest` or **Magic Intake**.
   - Type a complaint in Hindi or English (e.g., `भारतीय प्रौद्योगिकी संस्थान मुंबई में रैगिंग`).
   - Verify that the AI matches IIT Bombay and routes with high confidence.
3. **Smart Triage**:
   - Open `/ai-triage`.
   - Inspect AI suggestions and click **Apply AI Recommendations**.
   - Verify the case is reassigned smoothly.
4. **Telegram Bot**:
   - Open Telegram and message your bot (`/start` or send a case ID like `AICTE-2026-STU-001`).
   - The bot will reply with the real-time status card.

---

## Frequently Asked Questions

### 1. Does Render Free Tier Sleep?
Yes, Render's free tier spins down after 15 minutes of inactivity. The first request after sleep takes ~30-40 seconds to wake up.
> **Fix**: You can use a free pinging service like [UptimeRobot](https://uptimerobot.com) to ping `https://aicte-complaints-backend.onrender.com/api/v1/health` every 10 minutes so it stays awake 24/7 at no cost.

### 2. Can I host the Backend on Railway instead?
Yes! Simply connect your GitHub repo on [railway.app](https://railway.app). The repository already includes a `Procfile` (`web: uvicorn backend.app.main:app --host 0.0.0.0 --port $PORT`). Railway builds Python natively and does not sleep.

### 3. Will CORS block requests between Vercel and Render?
No. The backend CORS configuration in [main.py](file:///c:/Users/karti/OneDrive/Desktop/SIH/backend/app/main.py) is already configured to automatically accept all `*.vercel.app` domains and custom production domains.

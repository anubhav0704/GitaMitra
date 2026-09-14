# GitaMitra Free Cloud Hosting Guide

This guide details the **100% Free, Scalable, Zero-Maintenance** cloud hosting setup for **GitaMitra** using **Render** (for Backend & PostgreSQL Vector DB) and **Vercel** or **Render** (for Frontend).

---

## 🌟 Hosting Architecture Summary

- **Backend API & AI Engine**: Render Free Web Service (`gitamitra-backend.onrender.com`)
- **Database**: Render Free PostgreSQL Database (`pgvector` enabled)
- **Frontend App**: Vercel Free Next.js Edge Hosting or Render Free Web Service (`gitamitra.vercel.app`)
- **SSL / HTTPS**: 100% Automated & Free out of the box.
- **Custom Domain**: Connect your own domain anytime with 1-click in the future.

---

## Option 1: 1-Click Render Blueprint (Backend + Frontend + Database)

Render reads the included [`render.yaml`](file:///c:/Users/Admin/Downloads/GitaMitra/render.yaml) file to automatically provision all 3 services in one click!

### Steps:
1. Push your GitaMitra code to GitHub.
2. Sign up / Log in to [Render.com](https://render.com) (100% Free).
3. Click **New +** → Select **Blueprint**.
4. Connect your GitHub repository.
5. Render will automatically detect `render.yaml` and provision:
   - `gitamitra-db` (PostgreSQL Database)
   - `gitamitra-backend` (FastAPI Web Service)
   - `gitamitra-frontend` (Next.js App)
6. Add your API Key in Render Environment Settings:
   - `GROQ_API_KEY`: Your Groq API key (for fast LLM & Whisper STT).
7. Click **Apply**. Your app will be live with free HTTPS URLs!

---

## Option 2: Render (Backend & DB) + Vercel (Frontend) [Recommended for Max Speed]

For ultra-fast global CDN performance, host the Next.js frontend on Vercel and the backend on Render.

### Step 1: Deploy Backend & Database on Render
1. Go to [Render.com](https://render.com) → **New +** → **PostgreSQL**.
   - Name: `gitamitra-db`
   - Select **Free Plan**.
2. Go to **New +** → **Web Service** (Backend).
   - Connect repository, set root directory to `backend`.
   - Build Command: `pip install --no-cache-dir torch --index-url https://download.pytorch.org/whl/cpu && pip install -r requirements.txt`
   - Start Command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   - Add Environment Variables:
     - `DATABASE_URL`: (Copy Internal DB URL from Render PostgreSQL)
     - `GROQ_API_KEY`: (Your key)
     - `LLM_PROVIDER`: `groq`
     - `EMBEDDING_PROVIDER`: `local`

### Step 2: Deploy Frontend on Vercel
1. Go to [Vercel.com](https://vercel.com) (100% Free).
2. Click **Add New Project** → Import your GitaMitra GitHub repository.
3. Set Framework Preset: **Next.js**, Root Directory: `frontend`.
4. Add Environment Variable:
   - `NEXT_PUBLIC_API_URL`: `https://gitamitra-backend.onrender.com` (Your Render Backend URL)
5. Click **Deploy**! Your site is live instantly at `https://gitamitra.vercel.app`.

---

## 🔒 Connecting a Custom Domain in the Future

When you purchase a custom domain (e.g. `gitamitra.org` or `gitamitra.com`):
1. In Vercel or Render, go to **Settings** → **Domains**.
2. Type your domain name (e.g., `gitamitra.org`).
3. Add the displayed `CNAME` or `A` record in your domain registrar (GoDaddy, Namecheap, Cloudflare).
4. SSL/TLS certificates will be issued automatically for free!

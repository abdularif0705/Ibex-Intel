# 🚂 Railway.app Deployment - START HERE

**Deploying your Python NLP scraper on Railway (easier & cheaper than Render!)**

---

## 🚨 DID YOU JUST SEE THIS ERROR?

```
↳ Detected Node
↳ Using bun package manager
↳ Deploying as vite static site
error: lockfile had changes
```

**❌ PROBLEM:** Railway is trying to deploy your **frontend** (React/Vite) instead of your **Python scraper**!

**✅ SOLUTION:** Open `RAILWAY_FIX_NOW.md` right now for the instant fix.

**TL;DR:** Set **Root Directory** to `python-scraper` before deploying.

---

## 🎯 QUICK START (If Starting Fresh)

### Step 1: Push Railway Config to GitHub

```bash
git add python-scraper/railway.json python-scraper/nixpacks.toml
git commit -m "Add Railway deployment config"
git push
```

### Step 2: Deploy to Railway

1. Go to: https://railway.app
2. Click **"New Project"**
3. Select **"Deploy from GitHub repo"**
4. Choose: `SignalStream`
5. **CRITICAL:** Click "Settings" → Set **Root Directory** to `python-scraper`
6. Click Deploy

### Step 3: Add Environment Variables

In Railway dashboard, click **"Variables"** and add:

```
PORT=8080
ALLOWED_ORIGINS=*
PYTHON_ENV=production
```

### Step 4: Get Your URL

1. Settings → Networking → **Generate Domain**
2. Copy URL: `https://your-app.up.railway.app`

### Step 5: Test

```bash
curl https://your-app.up.railway.app/health
```

Expected: `{"status": "healthy", "service": "curl_cffi-scraper"}`

### Step 6: Connect to Supabase

```bash
supabase secrets set PYTHON_SCRAPER_URL=https://your-app.up.railway.app
supabase functions deploy advanced-scrape
supabase functions deploy scrape-source
supabase functions deploy smart-search
```

---

## 📚 DETAILED GUIDES

### 🚨 **Got an Error?**

**File:** `RAILWAY_FIX_NOW.md`  
**Use when:** Railway deployed the wrong thing

### ⚡ **Quick Setup (5 min)**

**File:** `python-scraper/RAILWAY_QUICKSTART.md`  
**Use when:** You want step-by-step with copy/paste values

### 📖 **Complete Guide**

**File:** `python-scraper/RAILWAY_SETUP.md`  
**Use when:** You want detailed explanations, troubleshooting, cost info

---

## 💰 Cost Comparison

| Platform    | Free Tier       | Production            |
| ----------- | --------------- | --------------------- |
| **Railway** | $5 credit/month | $7-10/month           |
| **Render**  | Spins down      | $7/month base + usage |

**Railway is better! ✅**

---

## ✅ SUCCESS CHECKLIST

- [ ] Root Directory set to `python-scraper`
- [ ] Railway detects Python (not Node!)
- [ ] Deployment successful
- [ ] Domain generated
- [ ] Health check passes
- [ ] URL added to Supabase
- [ ] Edge functions redeployed
- [ ] Smart Search works from app

---

## 🐛 COMMON ISSUES

### "Detected Node" error

**Fix:** Set Root Directory to `python-scraper` in Settings

### "Lockfile had changes"

**Fix:** Same as above - Railway is in wrong directory

### "Module not found: curl_cffi"

**Fix:** Verify `python-scraper/requirements.txt` exists

### "Application failed to start"

**Fix:** Check logs, verify PORT env variable is set

**More help:** See `python-scraper/RAILWAY_SETUP.md` troubleshooting section

---

## 🎯 WHAT YOU'RE DEPLOYING

Your Python service provides **3 endpoints**:

1. **`/health`** - Service health check
2. **`/scrape`** - Advanced web scraping with anti-bot bypass
3. **`/api/v1/detect-signals`** - 🔥 **NLP Magic**
   - Detects 94 transformation signals
   - Vector similarity (sentence-transformers)
   - Stage classification (0-5)
   - Confidence scores (0-100)

---

## 🚀 NEXT STEPS AFTER DEPLOYMENT

1. **Test from your app:**

   - Navigate to `/smart-search`
   - Enter: "SAP S/4HANA implementation"
   - Verify signals detected

2. **Monitor usage:**

   - Railway Dashboard → Metrics
   - Set spending alerts

3. **Optimize costs:**
   - Start with free $5 credit
   - Monitor usage
   - Adjust workers if needed

---

## 📞 GET HELP

**Railway Discord:** https://discord.gg/railway (very responsive!)

**Deployment Logs:** Railway Dashboard → Deployments → View Logs

**Quick Fix:** `RAILWAY_FIX_NOW.md`

**Detailed Guide:** `python-scraper/RAILWAY_SETUP.md`

---

## 🎉 YOU'RE READY!

**Railway is easier than Render. Here's why:**

- ✅ Auto-detects everything
- ✅ Better free tier ($5 credit)
- ✅ Simpler configuration
- ✅ Great developer experience
- ✅ Cheaper at scale

**Got the "Detected Node" error?** → Open `RAILWAY_FIX_NOW.md` NOW!

**Starting fresh?** → Follow the Quick Start above (10 minutes)

**Want details?** → Read `python-scraper/RAILWAY_QUICKSTART.md`

---

**Good luck! You've got this!** 🚂💨

_Last Updated: November 18, 2025_

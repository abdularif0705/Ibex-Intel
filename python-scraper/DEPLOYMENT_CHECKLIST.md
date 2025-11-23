# 🚀 Render.com Deployment Checklist

**Follow this step-by-step checklist to deploy successfully.**

---

## 📦 Phase 1: Pre-Deployment (On Your Computer)

### ✅ Step 1: Verify Files Exist
```bash
cd python-scraper
ls -la
```

**You should see:**
- ✅ `main.py`
- ✅ `similarity.py`
- ✅ `requirements.txt`
- ✅ `render.yaml`
- ✅ `runtime.txt`

### ✅ Step 2: Test Locally (Optional but Recommended)
```bash
# Install dependencies
pip install -r requirements.txt

# Run server
python main.py

# In another terminal, test endpoints
curl http://localhost:8080/health
# Should return: {"status": "healthy", "service": "curl_cffi-scraper"}
```

### ✅ Step 3: Push to GitHub
```bash
git add .
git commit -m "Add Render.com deployment configuration"
git push origin main
```

---

## 🌐 Phase 2: Render.com Setup

### ✅ Step 4: Create Render Account
1. Go to: https://render.com
2. Click "Get Started for Free"
3. Sign up with GitHub (recommended)

### ✅ Step 5: Create New Web Service

**Option A: Using Blueprint (Automated)**
1. Dashboard → "New" → "Blueprint"
2. Connect GitHub repository
3. Select your repo
4. Render auto-detects `render.yaml`
5. Click "Apply Blueprint"
6. ⏳ Wait 5-8 minutes
7. ✅ Service is LIVE!

**Option B: Manual Setup**
1. Dashboard → "New" → "Web Service"
2. Connect GitHub → Select repository
3. Configure:

```
┌─────────────────────────────────────────────┐
│ RENDER.COM CONFIGURATION                    │
├─────────────────────────────────────────────┤
│ Name:          signalstream-python-scraper  │
│ Region:        Oregon                       │
│ Branch:        main                         │
│ Root Dir:      python-scraper               │
│ Runtime:       Python 3                     │
│ Build Cmd:     pip install --upgrade pip && │
│                pip install -r requirements.txt│
│ Start Cmd:     gunicorn --bind 0.0.0.0:$PORT│
│                --workers 2 --threads 4       │
│                --timeout 120 main:app        │
│ Plan:          Free (or Starter $7/mo)      │
└─────────────────────────────────────────────┘
```

4. **Environment Variables** (click "Add Environment Variable"):
   - `PORT` = `8080`
   - `ALLOWED_ORIGINS` = `*`
   - `PYTHON_ENV` = `production`

5. **Advanced**:
   - Health Check Path: `/health`
   - ✅ Auto-Deploy: ON

6. Click "Create Web Service"

---

## ✅ Phase 3: Verify Deployment

### ✅ Step 6: Wait for Build
Watch the logs in real-time:
```
Building...
Installing dependencies from requirements.txt...
Downloading sentence-transformers...
Downloading torch...
Build succeeded!
Starting service...
Service is live!
```

**Typical build time:** 5-8 minutes (due to ML models)

### ✅ Step 7: Get Your Service URL
After deployment, you'll see:
```
🌐 Your service is live at:
https://signalstream-python-scraper.onrender.com
```

**📝 COPY THIS URL - You'll need it next!**

---

## 🧪 Phase 4: Testing

### ✅ Step 8: Test Endpoints

**Test 1: Health Check**
```bash
curl https://YOUR-SERVICE-URL.onrender.com/health
```

✅ **Expected:**
```json
{"status": "healthy", "service": "curl_cffi-scraper"}
```

❌ **If failed:** Check Render logs for errors

---

**Test 2: Web Scraping**
```bash
curl -X POST https://YOUR-SERVICE-URL.onrender.com/scrape \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com"}'
```

✅ **Expected:** JSON with `"success": true` and `"content": "..."`

❌ **If failed:** Verify curl_cffi installed (check build logs)

---

**Test 3: NLP Signal Detection** (The Money Maker 💰)
```bash
curl -X POST https://YOUR-SERVICE-URL.onrender.com/api/v1/detect-signals \
  -H "Content-Type: application/json" \
  -d '{
    "text": "We are hiring an SAP S/4HANA Cutover Manager for our go-live weekend in Q1 2025. This 6-month contract requires experience with data migration, UAT testing, and hypercare support. Immediate start available.",
    "source": "linkedin"
  }'
```

✅ **Expected:** JSON like:
```json
{
  "signals_found": 8,
  "confidence_score_avg": 91.2,
  "top_signals": [
    {"signal": "cutover manager", "confidence": 98, "type": "exact"},
    {"signal": "go-live weekend", "confidence": 98, "type": "exact"},
    {"signal": "uat testing", "confidence": 79, "type": "vector"},
    ...
  ],
  "transformation_stage": {
    "stage": 4,
    "stage_name": "Late Stage (UAT/Cutover Prep)",
    "confidence": 95,
    "estimated_months_to_go_live": "1-6"
  }
}
```

❌ **If failed:** Check sentence-transformers model loaded (view logs)

---

## 🔗 Phase 5: Connect to Supabase

### ✅ Step 9: Add Secret to Supabase

**Method 1: Supabase Dashboard**
1. Go to: https://app.supabase.com
2. Select your project
3. **Project Settings** → **Edge Functions** → **Secrets**
4. Click "Add New Secret"
   - **Name:** `PYTHON_SCRAPER_URL`
   - **Value:** `https://YOUR-SERVICE-URL.onrender.com`
5. Click "Save"

**Method 2: Supabase CLI**
```bash
supabase secrets set PYTHON_SCRAPER_URL=https://YOUR-SERVICE-URL.onrender.com
```

### ✅ Step 10: Redeploy Edge Functions
```bash
# Deploy functions to pick up new secret
supabase functions deploy advanced-scrape
supabase functions deploy scrape-source
supabase functions deploy smart-search
```

**Verify secrets:**
```bash
supabase secrets list
```

Should show: `PYTHON_SCRAPER_URL`

---

## 🎯 Phase 6: End-to-End Test

### ✅ Step 11: Test from Your App

**Open your app and test:**

1. **Navigate to:** `/smart-search`
2. **Enter keyword:** `SAP S/4HANA implementation consultant`
3. **Select sources:** LinkedIn, Indeed
4. **Click:** "Start Smart Search"
5. **Wait:** 2-3 minutes
6. **Check:** Signals Dashboard for results

**OR test advanced scraping:**

1. Navigate to: `/scanner` (Scraping Dashboard)
2. Enter URL: `https://linkedin.com/jobs/view/3234567890`
3. Select method: **Python (Advanced)**
4. Click "Start Scan"
5. Verify signals detected with high confidence

---

## 📊 Phase 7: Monitor & Optimize

### ✅ Step 12: Check Logs
```bash
# View real-time logs
Render Dashboard → Your Service → "Logs" tab
```

**Look for:**
```
Starting curl_cffi scraper service on port 8080
Endpoints available: /health, /scrape, /api/v1/detect-signals
Loading model & building signal embeddings...
Loaded 94 context-aware signals
```

### ✅ Step 13: Monitor Performance
```bash
Render Dashboard → Your Service → "Metrics" tab
```

**Monitor:**
- **Response Time:** Should be < 2 seconds for /health
- **Memory:** ~500MB-1GB (due to ML models)
- **CPU:** 10-30% average

### ✅ Step 14: Set Alerts (Optional)
```bash
Render Dashboard → Your Service → Settings → Notifications
```

Add your email for:
- ✅ Deploy failures
- ✅ Service crashes
- ✅ High error rates

---

## 🎉 Success Criteria

### You're done when ALL of these pass:

- ✅ Service shows "Live" in Render Dashboard
- ✅ `/health` returns 200 OK
- ✅ `/scrape` successfully scrapes example.com
- ✅ `/api/v1/detect-signals` detects transformation signals
- ✅ `PYTHON_SCRAPER_URL` exists in Supabase secrets
- ✅ Supabase edge functions redeployed
- ✅ Smart Search finds signals from your app
- ✅ No errors in Render logs for 5 minutes

---

## 🐛 Troubleshooting Guide

### Issue: "Build failed - requirements.txt not found"
**Fix:** Verify Root Directory = `python-scraper`

### Issue: "ModuleNotFoundError: No module named 'curl_cffi'"
**Fix:** Check requirements.txt includes `curl_cffi>=0.6.0`

### Issue: "Application failed to respond"
**Fix:** Verify Start Command: `gunicorn --bind 0.0.0.0:$PORT --workers 2 main:app`

### Issue: "Health check failing"
**Fix:** Set Health Check Path to `/health` in Advanced settings

### Issue: "Out of memory"
**Fix:** Reduce workers: `--workers 1` instead of `--workers 2`

### Issue: "Model loading takes forever"
**Fix:** Normal! sentence-transformers is ~500MB. First load = 2-3 min

### Issue: "Service spins down (Free tier)"
**Fix:** Upgrade to Starter ($7/mo) or accept 30-60s first-request delay

### Issue: "CORS error from frontend"
**Fix:** Update `ALLOWED_ORIGINS` env var to your domain

---

## 💰 Cost Calculator

| Tier | Monthly Cost | Best For |
|------|-------------|----------|
| **Free** | $0 | Testing, hobby projects |
| **Starter** | $7 | Production (recommended) |
| **Standard** | $25 | High traffic |

**Free Tier Notes:**
- 750 hours/month
- Spins down after 15 min inactivity
- First request after spin = 30-60s delay

**Recommendation:** Start free, upgrade when you have paying customers

---

## 📞 Need Help?

**Check Logs First:**
```bash
Render Dashboard → Logs → Look for error messages
```

**Common Log Errors:**

| Error Message | Solution |
|---------------|----------|
| `ModuleNotFoundError` | Missing dependency in requirements.txt |
| `Address already in use` | Don't hardcode port, use `$PORT` |
| `No module named 'app'` | Start command should be `main:app` |
| `Permission denied` | Check file permissions in repo |

**Still stuck?**
- Render Community: https://community.render.com
- Render Status: https://status.render.com
- Check `RENDER_SETUP.md` for detailed guide

---

## 🎯 Next Steps After Deployment

1. **✅ Test for 24 hours** - Monitor logs for errors
2. **✅ Update documentation** - Add your service URL to team docs
3. **✅ Set up monitoring** - Configure alerts for downtime
4. **✅ Consider upgrade** - Move to Starter plan for production
5. **✅ Optimize costs** - Monitor usage, adjust workers as needed

---

**DEPLOYMENT STATUS:**

```
[ ] Pre-Deployment Complete
[ ] Render.com Setup Complete  
[ ] Deployment Verified
[ ] Testing Complete
[ ] Supabase Connected
[ ] End-to-End Test Passed
[ ] Monitoring Configured

✅ ALL DONE! Service is LIVE! 🚀
```

---

**Last Updated:** November 18, 2025
**Estimated Total Time:** 20-30 minutes
**Difficulty:** Easy (just follow the steps!)

Good luck! 🍀


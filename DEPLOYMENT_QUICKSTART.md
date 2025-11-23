# 🚀 Option 2 Implementation - Complete Deployment Guide

**Total Time: 45 minutes**

This guide will get your Smart Search feature working with Google Custom Search API + Python NLP Service.

---

## 📋 Prerequisites Checklist

Before starting, make sure you have:

- [ ] GitHub account
- [ ] Render.com account (free tier) - [Sign up here](https://render.com)
- [ ] Google account
- [ ] Supabase project
- [ ] Your code pushed to GitHub

---

## 🎯 Step-by-Step Implementation

### **Phase 1: Google Custom Search API Setup** (15 minutes)

📖 **Follow**: `GOOGLE_API_SETUP.md` (already created in your repo)

**Quick Summary:**
1. Create Google Cloud project
2. Enable Custom Search API
3. Get API key
4. Create Search Engine
5. Add secrets to Supabase

**Verification:**
```bash
# Test the API
curl "https://www.googleapis.com/customsearch/v1?key=YOUR_KEY&cx=YOUR_ENGINE_ID&q=SAP+implementation+site:linkedin.com/jobs" | jq '.items[0].link'
```

Expected: Returns a LinkedIn job URL

---

### **Phase 2: Deploy Python NLP Service** (15 minutes)

#### Option A: Deploy to Render.com (Recommended)

**1. Push Code to GitHub**
```bash
git add .
git commit -m "Add Python NLP service"
git push
```

**2. Create Render Web Service**

1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click "New +" → "Web Service"
3. Connect your GitHub repo
4. Configure:

```
Name:              signalstream-nlp
Region:            Oregon (US West)
Branch:            main (or your branch)
Root Directory:    python-scraper
Runtime:           Python 3
Build Command:     pip install --upgrade pip && pip install -r requirements.txt
Start Command:     gunicorn --bind 0.0.0.0:$PORT --workers 2 --threads 4 --timeout 120 main:app
Instance Type:     Free
```

5. **Environment Variables** (Click "Advanced"):
```
PORT=8080
ALLOWED_ORIGINS=*
PYTHON_ENV=production
```

6. **Health Check Path**: `/health`

7. Click "Create Web Service"

8. Wait 3-5 minutes for deployment

**3. Get Your Service URL**

After deployment completes:
- Copy URL from top of page (e.g., `https://signalstream-nlp.onrender.com`)

**4. Verify Deployment**

Test health endpoint:
```bash
curl https://YOUR-APP-URL.onrender.com/health
```

Expected:
```json
{
  "status": "healthy",
  "service": "curl_cffi-scraper"
}
```

Test NLP endpoint:
```bash
curl -X POST https://YOUR-APP-URL.onrender.com/api/v1/detect-signals \
  -H "Content-Type: application/json" \
  -d '{
    "text": "We are hiring an SAP S/4HANA Cutover Manager for a 6-month contract to lead our go-live weekend. Experience with data migration and UAT testing required.",
    "source": "test"
  }'
```

Expected: JSON with signals and transformation stage

---

### **Phase 3: Connect to Supabase** (5 minutes)

**1. Add Python Service URL as Secret**

```bash
# Using Supabase CLI
supabase secrets set PYTHON_SCRAPER_URL=https://YOUR-APP-URL.onrender.com

# Or via Supabase Dashboard:
# Project Settings → Edge Functions → Secrets → Add New Secret
# Name: PYTHON_SCRAPER_URL
# Value: https://YOUR-APP-URL.onrender.com
```

**2. Deploy Edge Functions**

```bash
# Deploy updated functions
supabase functions deploy scrape-source
supabase functions deploy smart-search
supabase functions deploy advanced-scrape
```

**3. Verify Secrets**

```bash
supabase secrets list
```

You should see:
- `GOOGLE_CUSTOM_SEARCH_KEY`
- `GOOGLE_SEARCH_ENGINE_ID`
- `PYTHON_SCRAPER_URL`
- `FIRECRAWL_API_KEY`
- (other existing secrets)

---

### **Phase 4: Test End-to-End** (10 minutes)

#### Test 1: Manual Scan with Python NLP

1. Open your app
2. Go to Scanner page
3. Enter URL: `https://www.linkedin.com/jobs/view/workday-hcm-administrator-at-the-planet-group-4319466344/`
4. Select scraping method: "Python (Advanced)"
5. Click "Scan Source"

**Expected Result:**
- Signal detected with transformation stage
- High confidence scores (85-100%)
- Evidence showing "nlp_vector_match"

#### Test 2: Smart Search

1. Go to Smart Search page (`/smart-search`)
2. Enter keyword: `SAP S/4HANA cutover manager`
3. Select sources: LinkedIn, Indeed
4. Max results: 10
5. Date range: Last 30 days
6. Click "Start Smart Search"

**Expected Result:**
- Job starts running
- Google finds ~10 individual job URLs
- Each URL is scraped
- Python NLP analyzes each job
- Signals appear in dashboard with transformation stages

#### Test 3: View Results

1. Go to Dashboard
2. Filter by "Smart Search" scan type
3. Look for signals with:
   - `python_nlp: true` in extracted_data
   - `transformation_stage` with stage name and confidence
   - High confidence scores

---

## 🎉 Success Criteria

You'll know it's working when:

- [ ] Google API returns job URLs (test in Phase 1)
- [ ] Python service health check passes
- [ ] Python NLP detects signals from test text
- [ ] Manual scan shows "nlp_vector_match" evidence
- [ ] Smart Search finds and analyzes multiple jobs
- [ ] Dashboard shows transformation stages
- [ ] Confidence scores are 80-100% for good matches

---

## 💰 Cost Summary

| Service | Free Tier | Paid Tier | Your Cost |
|---------|-----------|-----------|-----------|
| **Google Custom Search** | 100 queries/day | $5/1000 queries | **$0** (under limit) |
| **Render.com** | 750 hrs/month | $7/month always-on | **$0** (testing) or **$7** (production) |
| **Firecrawl** | Existing | Existing | Existing |
| **Supabase** | Existing | Existing | Existing |
| **Total** | | | **$0-7/month** |

---

## 🔧 Troubleshooting

### Issue: "PYTHON_SCRAPER_URL not configured"

**Solution:**
```bash
# Verify secret is set
supabase secrets list | grep PYTHON_SCRAPER_URL

# If not set, add it
supabase secrets set PYTHON_SCRAPER_URL=https://YOUR-APP.onrender.com

# Redeploy functions
supabase functions deploy scrape-source
```

### Issue: Python service returns 503

**Cause:** Free tier spins down after 15 minutes

**Solution:**
- First request takes 30-60 seconds (cold start)
- Subsequent requests are fast
- For production, upgrade to Starter ($7/mo)

### Issue: "Google Custom Search not configured"

**Solution:**
```bash
# Check secrets exist
supabase secrets list

# Should show:
# GOOGLE_CUSTOM_SEARCH_KEY
# GOOGLE_SEARCH_ENGINE_ID

# If missing, add them
supabase secrets set GOOGLE_CUSTOM_SEARCH_KEY=your_key
supabase secrets set GOOGLE_SEARCH_ENGINE_ID=your_engine_id
```

### Issue: No signals detected

**Check:**
1. Python service logs in Render dashboard
2. Supabase edge function logs: `supabase functions logs scrape-source`
3. Job URL is accessible (not behind login)
4. Content contains ERP/transformation keywords

### Issue: AbortSignal timeout error

**Solution:** Python service taking too long
- Check Render logs for errors
- Verify sentence-transformers model loaded
- Cold start can take 30-60s (expected on free tier)

---

## 📊 Monitoring

### Check Python Service Logs

1. Go to Render dashboard
2. Select your service
3. Click "Logs" tab
4. Watch for:
   - "Loading model & building signal embeddings..." (startup)
   - "Calling Python service at..." (requests)
   - "Loaded X context-aware signals" (model ready)

### Check Supabase Function Logs

```bash
# View scrape-source logs
supabase functions logs scrape-source --tail

# View smart-search logs
supabase functions logs smart-search --tail
```

Look for:
- "Calling Python NLP service for signal detection..."
- "Python NLP detected X signals with avg confidence Y%"

### Check Signal Quality

```sql
-- View signals with Python NLP
SELECT 
  company_name,
  confidence_score,
  extracted_data->'transformation_stage'->>'stage_name' as stage,
  extracted_data->'transformation_stage'->>'estimated_months_to_go_live' as timeline,
  created_at
FROM signals
WHERE extracted_data->>'python_nlp' = 'true'
ORDER BY created_at DESC
LIMIT 10;
```

---

## 🚀 Next Steps

After successful deployment:

1. **Test with Real Keywords:**
   - "Workday HCM implementation"
   - "Oracle Fusion consultant"
   - "SAP S/4HANA migration architect"

2. **Monitor Costs:**
   - Google Cloud Console for API usage
   - Render dashboard for service metrics

3. **Optimize:**
   - Adjust `maxResults` in smart search (start with 10-25)
   - Fine-tune date ranges for active jobs
   - Add more source types (Greenhouse, Glassdoor, etc.)

4. **Go to Production:**
   - Update `ALLOWED_ORIGINS` in Render to your domain
   - Upgrade Render to Starter plan ($7/mo) for always-on
   - Enable Google billing if exceeding 100 queries/day

---

## 📝 Final Checklist

Before marking complete:

- [ ] Google Custom Search API working
- [ ] Python NLP service deployed and healthy
- [ ] Secrets added to Supabase
- [ ] Edge functions redeployed
- [ ] Manual scan with Python works
- [ ] Smart search finds and analyzes jobs
- [ ] Transformation stages visible in dashboard
- [ ] Logs show Python NLP calls succeeding

---

**You're now running Option 2 with Google Custom Search + Python NLP!** 🎉

The smart search feature will:
1. Use Google to find ACTIVE job postings
2. Get individual job URLs (not search pages)
3. Scrape with Python (anti-bot bypass)
4. Analyze with NLP (vector embeddings)
5. Classify transformation stage
6. Show 85-100% confidence signals

**Estimated monthly cost: $0-7** (vs $100-250 with Firecrawl-only approach)


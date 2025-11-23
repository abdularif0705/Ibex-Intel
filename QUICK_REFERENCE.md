# 🎯 Option 2 Quick Reference Card

**Google Custom Search + Python NLP for Smart Search**

---

## 📋 URLs & Resources

### Your Services
```
Google Cloud Console:    https://console.cloud.google.com/
Google Search Engine:    https://programmablesearchengine.google.com/
Render Dashboard:        https://dashboard.render.com/
Supabase Dashboard:      https://app.supabase.com/
```

### Your Python NLP Service
```
Production URL:   https://YOUR-APP.onrender.com
Health Check:     https://YOUR-APP.onrender.com/health
Scrape Endpoint:  https://YOUR-APP.onrender.com/scrape
NLP Endpoint:     https://YOUR-APP.onrender.com/api/v1/detect-signals
```

---

## 🔑 Required Secrets in Supabase

```bash
GOOGLE_CUSTOM_SEARCH_KEY    # From Google Cloud Console
GOOGLE_SEARCH_ENGINE_ID     # From Programmable Search Engine
PYTHON_SCRAPER_URL          # From Render.com
FIRECRAWL_API_KEY          # Existing
```

**Set with:**
```bash
supabase secrets set SECRET_NAME=value
```

**View with:**
```bash
supabase secrets list
```

---

## 🚀 Deployment Commands

### Deploy Python Service to Render
1. Push to GitHub
2. Create Web Service on Render
3. Configure as per DEPLOYMENT_QUICKSTART.md
4. Wait 3-5 minutes
5. Copy URL

### Deploy Edge Functions
```bash
supabase functions deploy scrape-source
supabase functions deploy smart-search
supabase functions deploy advanced-scrape
```

### View Logs
```bash
# Supabase function logs
supabase functions logs scrape-source --tail
supabase functions logs smart-search --tail

# Render logs: Go to dashboard → your service → Logs tab
```

---

## 🧪 Quick Tests

### Test Google API
```bash
curl "https://www.googleapis.com/customsearch/v1?key=YOUR_KEY&cx=YOUR_ENGINE_ID&q=SAP+implementation+site:linkedin.com/jobs"
```

### Test Python Health
```bash
curl https://YOUR-APP.onrender.com/health
```

### Test Python NLP
```bash
curl -X POST https://YOUR-APP.onrender.com/api/v1/detect-signals \
  -H "Content-Type: application/json" \
  -d '{"text": "SAP S/4HANA cutover manager needed for go-live", "source": "test"}'
```

### Run Integration Tests
```bash
# Set environment variables first
export GOOGLE_CUSTOM_SEARCH_KEY=your_key
export GOOGLE_SEARCH_ENGINE_ID=your_engine_id
export PYTHON_SCRAPER_URL=https://your-app.onrender.com

# Run tests
./test-integration.sh
```

---

## 🎯 How It Works

```
User enters keywords
        ↓
Google Custom Search API
  → Returns 10 individual job URLs
  → Filters by date (last 30 days)
  → Costs: $0 (100/day free)
        ↓
Python Scraper (curl_cffi)
  → Bypasses anti-bot detection
  → Extracts full job content
  → Costs: $0-7/month (Render)
        ↓
Python NLP (sentence-transformers)
  → Vector similarity matching
  → 85-100% confidence scores
  → Transformation stage classification
        ↓
Supabase Database
  → Stores signals
  → Groups by company
  → Shows in dashboard
```

---

## 💰 Monthly Costs

| Service | Free Tier | Cost |
|---------|-----------|------|
| Google Custom Search | 100 queries/day | **$0** |
| Render (Free) | 750 hrs/month | **$0** |
| Render (Starter) | Always-on | **$7** |
| **Total** | | **$0-7/month** |

Compare to: Firecrawl-only approach = $100-250/month

---

## 🔍 Smart Search Parameters

### Optimal Settings
```
Keywords:     2-3 specific terms (e.g., "SAP S/4HANA cutover")
Sources:      LinkedIn, Indeed, Greenhouse
Location:     Optional (e.g., "United States")
Date Range:   Last 30 days (finds active jobs)
Max Results:  25-50 (balance speed vs coverage)
```

### Best Keywords
```
"SAP S/4HANA cutover manager"
"Workday HCM implementation consultant"
"Oracle Fusion Financials architect"
"Salesforce CPQ specialist"
"NetSuite ERP migration lead"
```

---

## 📊 Monitoring Queries

### View Python NLP Signals
```sql
SELECT 
  company_name,
  confidence_score,
  extracted_data->'transformation_stage'->>'stage_name' as stage,
  extracted_data->'transformation_stage'->>'estimated_months_to_go_live' as timeline,
  keywords,
  created_at
FROM signals
WHERE extracted_data->>'python_nlp' = 'true'
ORDER BY created_at DESC;
```

### Check API Usage
```sql
-- Google API usage (approximate)
SELECT 
  DATE(created_at) as date,
  COUNT(*) as searches
FROM scraping_jobs
WHERE source_type = 'smart_search'
GROUP BY DATE(created_at)
ORDER BY date DESC;
```

### Top Companies Found
```sql
SELECT 
  company_name,
  COUNT(*) as signal_count,
  AVG(confidence_score::numeric) as avg_confidence,
  MAX(extracted_data->'transformation_stage'->>'stage_name') as stage
FROM signals
WHERE scan_type = 'smart_search'
  AND extracted_data->>'python_nlp' = 'true'
GROUP BY company_name
ORDER BY signal_count DESC, avg_confidence DESC
LIMIT 20;
```

---

## 🆘 Quick Troubleshooting

### "PYTHON_SCRAPER_URL not configured"
```bash
supabase secrets set PYTHON_SCRAPER_URL=https://your-app.onrender.com
supabase functions deploy scrape-source
```

### "Google Custom Search not configured"
```bash
supabase secrets set GOOGLE_CUSTOM_SEARCH_KEY=your_key
supabase secrets set GOOGLE_SEARCH_ENGINE_ID=your_engine_id
```

### Python service returns 503
- First request after 15 min takes 30-60s (cold start on free tier)
- For always-on, upgrade to Starter ($7/mo)

### No signals detected
1. Check Python logs in Render dashboard
2. Check Supabase function logs
3. Verify job content has transformation keywords
4. Test Python NLP directly with job text

### AbortSignal timeout
- Python service cold start (wait and retry)
- Verify model loaded in Render logs
- Look for: "Loaded X context-aware signals"

---

## 📖 Documentation Files

```
DEPLOYMENT_QUICKSTART.md  → Full deployment guide
GOOGLE_API_SETUP.md       → Google API setup
RENDER_SETUP.md           → Render deployment
test-integration.sh       → Automated tests
QUICK_REFERENCE.md        → This file
```

---

## ✅ Success Checklist

- [ ] Google API returns job URLs
- [ ] Python health check passes
- [ ] Python NLP detects signals
- [ ] All secrets in Supabase
- [ ] Edge functions deployed
- [ ] Manual scan works
- [ ] Smart search works
- [ ] Dashboard shows transformation stages
- [ ] Confidence scores 80-100%

---

## 🎉 Ready to Use!

Your Smart Search is now powered by:
- ✅ Google Custom Search (finds active jobs)
- ✅ Python curl_cffi (bypasses anti-bot)
- ✅ Python NLP (vector embeddings)
- ✅ Transformation stage classification

**Cost: $0-7/month | Quality: 85-100% confidence**

---

*Last Updated: November 2024*


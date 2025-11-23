# Smart Search Quick Start Guide

## 🚀 Get Started in 5 Minutes

### What You'll Need
1. Google account (for Custom Search API)
2. Credit card (for Google Cloud - free tier available)
3. 10 minutes

---

## Step 1: Get Google Custom Search API (3 minutes)

### 1.1 Create API Key
1. Go to https://console.cloud.google.com/apis/credentials
2. Click "Create Credentials" → "API Key"
3. Copy the key (starts with `AIza...`)

### 1.2 Enable Custom Search API
1. Go to https://console.cloud.google.com/apis/library
2. Search "Custom Search API"
3. Click "Enable"

### 1.3 Create Search Engine
1. Go to https://programmablesearchengine.google.com/
2. Click "Add"
3. **Sites to search**: Leave empty
4. **Name**: "Transfer Signal"
5. Click "Create"
6. Copy the **Search Engine ID** (looks like: `a1b2c3d4e5f6g`)
7. Click "Edit search engine" → Toggle "Search the entire web" ON

---

## Step 2: Add Secrets to Supabase (1 minute)

```bash
# Set API key
supabase secrets set GOOGLE_CUSTOM_SEARCH_KEY=AIza...your_key_here

# Set Search Engine ID
supabase secrets set GOOGLE_SEARCH_ENGINE_ID=a1b2c3d4e5f6g
```

---

## Step 3: Deploy (2 minutes)

```bash
# Deploy edge function
supabase functions deploy smart-search

# Run migrations
supabase db push
```

---

## Step 4: Test It! (2 minutes)

1. Navigate to `/smart-search` in your app
2. Enter keyword: `SAP S/4HANA implementation`
3. Select sources: LinkedIn, Indeed
4. Click "Start Smart Search"
5. Wait 2-3 minutes
6. Check Signals Dashboard for results

---

## What Happens Next?

Smart Search will:
1. ✅ Search Google for job postings matching your keywords
2. ✅ Find 50-100 URLs across LinkedIn, Indeed, etc.
3. ✅ Scrape each URL (using Firecrawl)
4. ✅ Analyze content for transformation signals
5. ✅ Group results by company
6. ✅ Display ranked list of companies

---

## Expected Results

**Example Search**: "SAP S/4HANA implementation"

**You'll Find**:
- 10-30 companies actively hiring SAP consultants
- Confidence scores (60-95%)
- Job titles, dates, evidence
- Vendor detection (SAP, Workday, Oracle)
- Phase detection (cutover, go-live, planning)

**Time**: 2-5 minutes per search
**Cost**: $25-50 per search (50 URLs × $0.50-1.00)

---

## Cost Breakdown

| Component | Cost | Notes |
|-----------|------|-------|
| Google Custom Search | $0 | Free tier: 100 queries/day |
| Firecrawl | $25-50 | 50 URLs × $0.50-1.00 |
| **Total per search** | **$25-50** | |

**Monthly Budget** (20 searches):
- Google: $0-10
- Firecrawl: $500-1,000
- **Total: $500-1,010/month**

---

## Optimization Tips

### 1. Use Caching (Saves 30-50%)
The system automatically caches scraped content for 24 hours.

**Check cache stats**:
```sql
SELECT * FROM get_cache_stats();
```

### 2. Prioritize High-Value Sources
Default priority (already configured):
1. LinkedIn (best signal quality)
2. Greenhouse (high quality)
3. SEC Edgar (official filings)
4. Indeed (good volume)

### 3. Set Reasonable Limits
- Start with `maxResults: 25` for testing
- Increase to `50-100` for production
- Don't exceed `200` (diminishing returns)

---

## Troubleshooting

### "Google Custom Search not configured"
**Fix**: Check secrets are set:
```bash
supabase secrets list
```

### "No results found"
**Try**:
- Broader keywords ("SAP implementation" vs "SAP S/4HANA cutover manager")
- More sources (add Glassdoor, company websites)
- Wider date range (last_90_days vs last_7_days)

### "Rate limit exceeded"
**Cause**: Hit Google's 100 queries/day free limit

**Fix**:
1. Enable billing in Google Cloud Console
2. Or wait until midnight Pacific Time (limit resets)

---

## Next Steps

1. ✅ **Test with real keywords** from your target industries
2. ✅ **Monitor costs** in Google Cloud Console
3. ✅ **Refine source selection** based on results
4. ✅ **Set up automated searches** (coming soon)
5. ✅ **Export to reports** for your customers

---

## Example Searches to Try

### For Financial Analysts
- "Oracle ERP implementation consultant"
- "Workday HCM go-live manager"
- "SAP S/4HANA cutover"
- "Salesforce implementation architect"

### For Specific Industries
- "Retail ERP transformation" + location: "United States"
- "Healthcare Workday implementation"
- "Manufacturing SAP migration"
- "Banking Oracle cloud"

### For Specific Phases
- "ERP cutover manager" (go-live imminent)
- "ERP implementation consultant" (active project)
- "ERP RFP" (early planning)

---

## Support

**Check logs**:
```bash
supabase functions logs smart-search --follow
```

**View recent searches**:
```sql
SELECT * FROM scraping_jobs 
WHERE source_type = 'smart_search' 
ORDER BY started_at DESC 
LIMIT 10;
```

**Check processed URLs**:
```sql
SELECT 
  source_type,
  COUNT(*) as total,
  SUM(CASE WHEN signal_found THEN 1 ELSE 0 END) as with_signals
FROM processed_urls
GROUP BY source_type;
```

---

## Success Metrics

After your first 10 searches, you should see:
- ✅ 50-200 companies identified
- ✅ 100-500 transformation signals detected
- ✅ 60-80% confidence scores on average
- ✅ 10-20% cache hit rate (saves $50-100/month)

---

*Ready to find your first transformation signal? Let's go! 🚀*


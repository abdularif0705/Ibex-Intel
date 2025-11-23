# Smart Search Setup Guide

## Overview

Smart Search allows you to search across multiple job boards and sources to find companies undergoing enterprise transformations (SAP, Workday, Oracle, etc.) based on keywords rather than company names.

---

## Prerequisites

1. **Google Custom Search API** (Required)
2. **Existing Transfer Signal infrastructure** (Firecrawl, Supabase, etc.)

---

## Setup Steps

### 1. Get Google Custom Search API Credentials

#### Step 1.1: Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the **Custom Search API**:
   - Navigate to "APIs & Services" → "Library"
   - Search for "Custom Search API"
   - Click "Enable"

#### Step 1.2: Create API Key

1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "API Key"
3. Copy the API key (you'll need this)
4. **Restrict the API key** (recommended):
   - Click "Edit API key"
   - Under "API restrictions", select "Restrict key"
   - Choose "Custom Search API"
   - Save

#### Step 1.3: Create Custom Search Engine

1. Go to [Google Programmable Search Engine](https://programmablesearchengine.google.com/)
2. Click "Add" to create a new search engine
3. Configure:
   - **Sites to search**: Leave empty or add `*` (search entire web)
   - **Name**: "Transfer Signal Search"
   - **Search engine keywords**: (optional)
4. Click "Create"
5. Copy the **Search Engine ID** (looks like: `a1b2c3d4e5f6g7h8i`)

#### Step 1.4: Enable "Search the entire web"

1. In your search engine settings, click "Edit search engine"
2. Under "Basics", toggle "Search the entire web" to **ON**
3. Save

---

### 2. Add Secrets to Supabase

#### Option A: Via Supabase Dashboard

1. Go to your Supabase project dashboard
2. Navigate to "Project Settings" → "Edge Functions" → "Secrets"
3. Add two secrets:
   - **Name**: `GOOGLE_CUSTOM_SEARCH_KEY`
     **Value**: Your Google API key from Step 1.2
   - **Name**: `GOOGLE_SEARCH_ENGINE_ID`
     **Value**: Your Search Engine ID from Step 1.3

#### Option B: Via Supabase CLI

```bash
# Set Google Custom Search API key
supabase secrets set GOOGLE_CUSTOM_SEARCH_KEY=your_api_key_here

# Set Search Engine ID
supabase secrets set GOOGLE_SEARCH_ENGINE_ID=your_search_engine_id_here
```

---

### 3. Deploy Edge Functions

```bash
# Deploy the smart-search function
supabase functions deploy smart-search

# Verify deployment
supabase functions list
```

---

### 4. Run Database Migration

```bash
# Apply the processed_urls table migration
supabase db push

# Or if using migrations:
supabase migration up
```

Verify the table was created:
```sql
SELECT * FROM processed_urls LIMIT 1;
```

---

### 5. Update Frontend Routes

Add the Smart Search page to your router configuration.

**If using React Router** (in `src/App.tsx` or similar):

```typescript
import SmartSearch from '@/pages/SmartSearch';

// Add to your routes:
<Route path="/smart-search" element={<SmartSearch />} />
```

**If using file-based routing**, the file is already created at:
- `src/pages/SmartSearch.tsx`

---

### 6. Add Navigation Link

Update your sidebar/navigation to include Smart Search.

Example (in `src/constants/menu.tsx` or similar):

```typescript
{
  id: 'smart-search',
  label: 'Smart Search',
  icon: Search,
  path: '/smart-search',
}
```

---

## Testing

### Test 1: Verify Google Custom Search API

```bash
# Test the API directly
curl "https://www.googleapis.com/customsearch/v1?key=YOUR_API_KEY&cx=YOUR_SEARCH_ENGINE_ID&q=SAP+implementation"
```

Expected: JSON response with search results

### Test 2: Test Smart Search Function Locally

```bash
# Start Supabase functions locally
supabase functions serve smart-search --env-file .env.local

# In another terminal, test the function
curl -X POST http://localhost:54321/functions/v1/smart-search \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "keywords": ["SAP S/4HANA implementation"],
    "sourceTypes": ["linkedin", "indeed"],
    "maxResults": 10
  }'
```

Expected: JSON response with `jobId` and `urlsToScrape`

### Test 3: Full End-to-End Test

1. Navigate to `/smart-search` in your app
2. Enter keywords: `SAP S/4HANA consultant`
3. Select sources: LinkedIn, Indeed
4. Click "Start Smart Search"
5. Wait for results (check the Signals Dashboard)

---

## Cost Management

### Google Custom Search API Pricing

- **Free Tier**: 100 queries/day
- **Paid Tier**: $5 per 1,000 queries (after free tier)

### Estimated Costs

| Searches/Day | Queries/Day | Google Cost | Firecrawl Cost | Total/Month |
|--------------|-------------|-------------|----------------|-------------|
| 5 | 50 | $0 (free) | $125-250 | $125-250 |
| 20 | 200 | $15 | $500-1,000 | $515-1,015 |
| 50 | 500 | $60 | $1,250-2,500 | $1,310-2,560 |

**Optimization Tips**:
1. Use the `processed_urls` table to avoid re-scraping
2. Set reasonable `maxResults` limits (default: 50)
3. Cache search results for 24 hours
4. Prioritize high-value sources (LinkedIn, SEC Edgar)

---

## Troubleshooting

### Issue: "Google Custom Search not configured"

**Solution**: Verify secrets are set correctly in Supabase:
```bash
supabase secrets list
```

### Issue: "No results found"

**Possible causes**:
1. Keywords too specific
2. Date range too narrow
3. No matching content in selected sources

**Solution**: Try broader keywords or expand date range

### Issue: "Rate limit exceeded"

**Cause**: Hit Google's 100 queries/day free limit

**Solution**:
1. Enable billing in Google Cloud Console
2. Or wait until next day (limit resets at midnight Pacific Time)

### Issue: "Scraping failed after all retry attempts"

**Cause**: Firecrawl or Python scraper couldn't access URL

**Solution**:
1. Check if URL is accessible in browser
2. Verify Firecrawl API key is valid
3. Check Python scraper deployment (if using)

---

## Advanced Configuration

### Customize Source Priority

Edit `smart-search/index.ts`:

```typescript
const sourceScores: Record<string, number> = {
  'linkedin': 10,        // Highest priority
  'greenhouse': 9,
  'sec_edgar': 9,
  'indeed': 8,
  // ... adjust scores as needed
};
```

### Adjust Deduplication Window

Edit the migration file or run:

```sql
-- Change from 30 days to 60 days
ALTER TABLE processed_urls 
ADD CONSTRAINT processed_urls_ttl 
CHECK (processed_at > NOW() - INTERVAL '60 days');
```

### Add Custom Search Engines

Edit `search-discovery.ts`:

```typescript
function getSiteRestriction(sourceType: string): string {
  const siteMap: Record<string, string> = {
    // Add your custom sources here
    'custom_source': 'site:example.com',
  };
  return siteMap[sourceType] || '';
}
```

---

## Monitoring

### Track Search Performance

```sql
-- View recent smart searches
SELECT 
  target_url as keywords,
  status,
  results_count,
  started_at,
  completed_at,
  EXTRACT(EPOCH FROM (completed_at - started_at)) as duration_seconds
FROM scraping_jobs
WHERE source_type = 'smart_search'
ORDER BY started_at DESC
LIMIT 10;
```

### Track Most Productive Sources

```sql
-- Which sources find the most signals?
SELECT 
  source_type,
  COUNT(*) as urls_processed,
  SUM(CASE WHEN signal_found THEN 1 ELSE 0 END) as signals_found,
  ROUND(100.0 * SUM(CASE WHEN signal_found THEN 1 ELSE 0 END) / COUNT(*), 2) as success_rate
FROM processed_urls
GROUP BY source_type
ORDER BY signals_found DESC;
```

---

## Next Steps

1. **Test with real keywords** related to your target transformations
2. **Monitor costs** in Google Cloud Console and Firecrawl dashboard
3. **Refine source priorities** based on signal quality
4. **Set up alerts** for high-confidence signals
5. **Export results** to reports for your customers

---

## Support

For issues or questions:
1. Check Supabase function logs: `supabase functions logs smart-search`
2. Check Google Cloud Console for API errors
3. Review the `processed_urls` table for deduplication issues

---

*Last Updated: November 2024*


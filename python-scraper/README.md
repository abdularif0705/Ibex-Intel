# Python Scraper Service with curl_cffi

This service provides advanced web scraping capabilities using `curl_cffi`, which bypasses anti-bot detection by spoofing TLS/JA3 fingerprints to mimic real browsers.

## Features

- **Browser Impersonation**: Mimics Chrome, Edge, and Safari browsers
- **TLS Fingerprint Spoofing**: Bypasses Cloudflare, Akamai, and other anti-bot systems
- **JA3/JA4 Fingerprint Matching**: Matches real browser fingerprints
- **Simple REST API**: Easy integration with your Supabase Edge Functions

## Quick Start

### Local Development

```bash
# Install dependencies
pip install -r requirements.txt

# Run the service
python main.py

# Test it
curl -X POST http://localhost:8080/scrape \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com"}'
```

### Deploy to Railway.app (Recommended)

1. Create account at [Railway.app](https://railway.app)
2. Click "New Project" → "Deploy from GitHub repo"
3. Select this repository
4. Railway will auto-detect the Dockerfile
5. Set environment variables:
   - `PORT`: 8080 (Railway sets this automatically)
   - `ALLOWED_ORIGINS`: Your Supabase URL (optional, for CORS)
6. Deploy! You'll get a public URL like `https://your-app.railway.app`

### Deploy to Render.com

1. Create account at [Render.com](https://render.com)
2. Click "New Web Service"
3. Connect your GitHub repository
4. Configure:
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `gunicorn --bind 0.0.0.0:$PORT --workers 4 --timeout 120 main:app`
5. Set environment variables (same as above)
6. Deploy!

### Deploy with Docker

```bash
# Build
docker build -t python-scraper .

# Run
docker run -p 8080:8080 python-scraper

# Or use docker-compose
docker-compose up -d
```

## Integration with Supabase

Once deployed, add your service URL to Supabase secrets:

1. Go to your Lovable project settings
2. Add a new secret: `PYTHON_SCRAPER_URL`
3. Value: `https://your-service.railway.app/scrape`

Then update your scraping logic to use the advanced scraper:

```typescript
// In your frontend code
const { data, error } = await supabase.functions.invoke('advanced-scrape', {
  body: {
    url: 'https://difficult-website.com',
    method: 'python', // Use Python service
  }
});
```

## API Reference

### POST /scrape

Scrape a URL with browser impersonation.

**Request:**
```json
{
  "url": "https://example.com",
  "browser": "chrome120",  // optional, default: chrome120
  "headers": {}            // optional, additional headers
}
```

**Available browser profiles:**
- `chrome99`, `chrome100`, `chrome101`, `chrome104`, `chrome107`, `chrome110`, `chrome116`, `chrome119`, `chrome120`
- `edge99`, `edge101`
- `safari15_3`, `safari15_5`, `safari17_0`, `safari17_2_1`

**Response:**
```json
{
  "success": true,
  "content": "Extracted text content...",
  "html": "Full HTML...",
  "url": "https://example.com",
  "status_code": 200,
  "browser": "chrome120"
}
```

### POST /api/v1/detect-signals

Analyze text for ERP/HCM transformation signals using vector search.

**Request:**
```json
{
  "text": "We are hiring a Workday Cutover Lead for a 6-month contract...",
  "source": "linkedin" // optional
}
```

**Response:**
```json
{
  "signals_found": 2,
  "confidence_score_avg": 95.5,
  "top_signals": [
    {
      "signal": "cutover lead",
      "confidence": 98,
      "type": "exact",
      "evidence": "Cutover Lead"
    }
  ],
  "has_erp_context": true,
  "transformation_stage": {
    "stage": 5,
    "stage_name": "Go-Live / Hypercare",
    "confidence": 100,
    "estimated_months_to_go_live": "0-3 (NOW)",
    "evidence": ["Nuclear go-live signal detected"]
  }
}
```

### GET /health

Health check endpoint.

**Response:**
```json
{
  "status": "healthy",
  "service": "curl_cffi-scraper"
}
```

## Similarity Analysis & Signal Detection

This service uses **Vector Search (NLP)** via `sentence-transformers` instead of traditional TF-IDF or keyword matching.

### Why Vector Search?

1.  **Semantic Understanding**:
    - Traditional keyword matching (TF-IDF) looks for exact overlaps. It fails if a job post says "AI" but your list only has "Artificial Intelligence".
    - Vector search (using `all-MiniLM-L6-v2`) maps text to a 384-dimensional semantic space. It understands that "cutover" and "go-live" are semantically related to "implementation completion".

2.  **Context Awareness**:
    - The system employs a **Context Layer** that first checks for core ERP/HCM keywords (e.g., "SAP", "Workday", "Oracle").
    - Signals like "Project Manager" are ignored unless they appear in the context of a relevant system, reducing false positives.

3.  **Robustness**:
    - It handles variations in phrasing, typos, and synonyms much better than rigid regex or keyword lists.
    - It can detect the *intent* or *stage* of a project (e.g., "urgent hire" + "6 month contract" = Late Stage) by combining multiple weak signals into a strong one.

### Why NOT TF-IDF?

-   **Brittle for Short Text**: TF-IDF relies on term frequency across a corpus. For short texts like job titles or snippets, it lacks sufficient statistical data to be effective.
-   **No Semantic Meaning**: TF-IDF treats "manager" and "lead" as completely different words. Vector search knows they are similar roles.
-   **Hard to Tune**: Tuning TF-IDF thresholds for "high confidence" signals is difficult. Vector cosine similarity provides a normalized 0-1 score that is easier to calibrate for "high confidence" (e.g., >0.85).

## Cost Estimates

### Railway.app
- **Free Tier**: $5 credit/month (good for testing)
- **Paid**: ~$5-10/month for light usage
- **Scaling**: Automatic

### Render.com
- **Free Tier**: Available (spins down after inactivity)
- **Paid**: Starting at $7/month
- **Scaling**: Manual

### Self-Hosted (VPS)
- **DigitalOcean**: $6/month (basic droplet)
- **Linode**: $5/month
- **Scaling**: Manual

## Testing Anti-Bot Capabilities

Test against a fingerprint checking service:

```bash
curl -X POST http://localhost:8080/scrape \
  -H "Content-Type: application/json" \
  -d '{"url": "https://tls.browserleaks.com/json", "browser": "chrome120"}'
```

You should see JA3 fingerprints matching a real Chrome browser.

## Troubleshooting

### Service returns errors
- Check logs in your deployment platform
- Verify the target URL is accessible
- Try different browser profiles

### CORS errors
- Set `ALLOWED_ORIGINS` environment variable
- Include your Supabase URL

### Timeout errors
- Increase timeout in deployment configuration
- Some sites may take 30+ seconds to load

## Security Notes

⚠️ **Important**: This service can bypass anti-bot protection. Use responsibly:
- Respect robots.txt
- Don't overwhelm servers with requests
- Check website terms of service
- Consider rate limiting in production

## Support

For issues with:
- **curl_cffi**: https://github.com/yifeikong/curl_cffi
- **Deployment**: Check your platform's documentation
- **Integration**: See your Supabase Edge Function logs

# Python Scraper & NLP Service

This Flask microservice pairs `curl_cffi` (for TLS/JA3 spoofing) with our NLP signal stack (scikit-learn TF-IDF + optional PyTorch `sentence-transformers`) so we can both fetch and score evidence before it hits Supabase.

## Features

- **Browser Impersonation**: Mimics Chrome, Edge, and Safari browsers
- **TLS Fingerprint Spoofing**: Bypasses Cloudflare, Akamai, and other anti-bot systems
- **JA3/JA4 Fingerprint Matching**: Matches real browser fingerprints
- **Simple REST API**: Easy integration with your Supabase Edge Functions
- **NLP Signal Detection**: Runs TF-IDF + cosine scoring by default and can flip on a PyTorch MiniLM embedding model for premium scans

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

The Flask service exposes two complementary analyzers:

1. **`similarity.py` (default path)** – scikit-learn TF-IDF + cosine similarity, 824-signal taxonomy, <512 MB memory footprint, feeds `StageClassifier`.
2. **`similarity_vector.py` (optional path)** – PyTorch `sentence-transformers/all-MiniLM-L6-v2` embeddings with vector cosine scoring for semantic recall.

### Why keep both?

- **Determinism + speed**: TF-IDF path is cheap to run on every request (works on small Railway dynos) and provides exact-match guarantees analysts can audit.
- **Semantic recall**: The PyTorch MiniLM encoder understands that “cutover weekend” ≈ “go-live rehearsal”, so it recovers signals that never share exact tokens.
- **Context gating**: Both detectors reuse the same ERP keyword filter to avoid false positives like “Project Manager” without “SAP/Workday” context.

### Enabling the PyTorch vector path (plan)

1. Uncomment `sentence-transformers` in `requirements.txt` (pulls PyTorch) and redeploy.
2. In `python-scraper/main.py`, uncomment the import + `/api/v1/detect-signals-vector` route; optionally guard with an env flag like `USE_VECTOR_PIPELINE=1`.
3. Point premium workloads to `/api/v1/detect-signals-vector` or flip the default analyzer once budgets allow—no frontend changes required.

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

# Advanced Scraping Implementation Guide

Your project now has **two powerful scraping options** to bypass anti-bot detection:

## 🎯 Option 1: Enhanced Fetch (Deno Edge Function)

**Location**: `supabase/functions/advanced-scrape/index.ts`

### Features:
- Browser-like headers and fingerprints
- Realistic User-Agent strings
- Chrome security headers (sec-ch-ua)
- Built into your Edge Functions (no external service needed)

### Usage:
```typescript
const { data, error } = await supabase.functions.invoke('advanced-scrape', {
  body: {
    url: 'https://example.com',
    method: 'fetch'
  }
});
```

### Best For:
- Simple websites without heavy anti-bot
- Quick scraping tasks
- When you don't want to manage external services

---

## 🚀 Option 2: Python + curl_cffi (TLS Fingerprint Spoofing)

**Location**: `python-scraper/` folder

### Features:
- **TLS/JA3 fingerprint spoofing** - bypasses Cloudflare, Akamai, PerimeterX
- **Browser impersonation** - mimics real Chrome, Edge, Safari browsers
- **JA4 fingerprint matching** - matches exact browser versions
- Most powerful anti-bot bypass available

### Setup Steps:

#### 1. Deploy Python Service

**Railway.app (Recommended - Free Tier)**:
```bash
# 1. Create account at railway.app
# 2. Click "New Project" → "Deploy from GitHub"
# 3. Select your repository
# 4. Railway auto-detects Dockerfile
# 5. Deploy!

# You'll get: https://your-app.railway.app
```

**Render.com**:
```bash
# 1. Create account at render.com
# 2. New Web Service → Connect GitHub
# 3. Configure:
#    Build: pip install -r requirements.txt
#    Start: gunicorn --bind 0.0.0.0:$PORT --workers 4 main:app
# 4. Deploy!
```

**Local Testing**:
```bash
cd python-scraper
pip install -r requirements.txt
python main.py

# Test it:
curl -X POST http://localhost:8080/scrape \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com"}'
```

#### 2. Add Secret to Supabase

Once deployed, add your Python service URL:

1. Go to your Lovable project
2. Click Settings → Secrets (or use backend view)
3. Add new secret:
   - **Name**: `PYTHON_SCRAPER_URL`
   - **Value**: `https://your-service.railway.app/scrape`

#### 3. Use in Your Code

```typescript
const { data, error } = await supabase.functions.invoke('advanced-scrape', {
  body: {
    url: 'https://difficult-website.com',
    method: 'python'  // Use Python service
  }
});
```

### Browser Profiles Available:

The Python service supports these browser impersonations:

```python
# Chrome versions
'chrome99', 'chrome100', 'chrome101', 'chrome104', 
'chrome107', 'chrome110', 'chrome116', 'chrome119', 'chrome120'

# Edge versions
'edge99', 'edge101'

# Safari versions
'safari15_3', 'safari15_5', 'safari17_0', 'safari17_2_1'
```

Specify browser:
```typescript
const { data } = await supabase.functions.invoke('advanced-scrape', {
  body: {
    url: 'https://example.com',
    method: 'python',
    browser: 'chrome120'  // Optional, defaults to chrome120
  }
});
```

### Best For:
- Sites with Cloudflare protection
- Sites using TLS fingerprinting
- LinkedIn, Twitter, protected content
- When fetch method fails

---

## 📊 Comparison

| Feature | Enhanced Fetch | Python + curl_cffi |
|---------|---------------|-------------------|
| **Setup** | ✅ Built-in | ⚙️ Deploy service |
| **Cost** | ✅ Free | 💵 ~$5-10/month |
| **Anti-bot** | ⭐⭐ Good | ⭐⭐⭐⭐⭐ Excellent |
| **TLS Spoofing** | ❌ No | ✅ Yes |
| **Cloudflare** | ❌ Limited | ✅ Yes |
| **Speed** | ⚡ Fast | 🚀 Fast |

---

## 🛠️ Integration with Existing Scraping

You can update your existing scraping logic to try both methods:

```typescript
// Try fetch first, fallback to Python
try {
  const { data } = await supabase.functions.invoke('advanced-scrape', {
    body: { url, method: 'fetch' }
  });
  
  if (data?.success) {
    return data;
  }
} catch (error) {
  console.log('Fetch failed, trying Python...');
}

// Fallback to Python
const { data } = await supabase.functions.invoke('advanced-scrape', {
  body: { url, method: 'python' }
});
```

---

## 🔒 Security Best Practices

When using advanced scraping:

1. **Respect robots.txt** - Check site's scraping policy
2. **Rate limiting** - Don't overwhelm servers
3. **Terms of service** - Verify you're allowed to scrape
4. **Attribution** - Credit sources when using data
5. **Private data** - Don't scrape personal information

---

## 🐛 Troubleshooting

### Python service not responding
- Check deployment logs in Railway/Render
- Verify `PYTHON_SCRAPER_URL` secret is set correctly
- Test health endpoint: `curl https://your-service.railway.app/health`

### Still getting blocked
- Try different browser profiles (chrome120, safari17_0, etc.)
- Add delay between requests
- Some sites may use IP-based blocking (consider proxies)

### CORS errors
- Set `ALLOWED_ORIGINS` in Python service environment
- Add your Supabase URL to allowed origins

---

## 💰 Cost Breakdown

### Railway.app
- Free: $5 credit/month (good for testing)
- Pro: ~$5-10/month for light usage
- Scales automatically

### Render.com
- Free tier available (spins down after inactivity)
- Paid: Starting at $7/month
- Manual scaling

### Self-hosted (VPS)
- DigitalOcean: $6/month
- Linode: $5/month
- Requires server management

---

## 📚 Resources

- **curl_cffi GitHub**: https://github.com/yifeikong/curl_cffi
- **TLS Fingerprinting**: https://tls.browserleaks.com/json
- **JA3 Testing**: https://tools.scrapfly.io/api/fp/ja3
- **Railway.app Docs**: https://docs.railway.app
- **Render.com Docs**: https://docs.render.com

---

## 🎓 Next Steps

1. **Start with Enhanced Fetch** - Test if it works for your needs
2. **Deploy Python Service** - When you need more power
3. **Monitor Results** - Track success rates
4. **Optimize** - Use the right tool for each site

Both methods are now ready to use in your project! 🚀

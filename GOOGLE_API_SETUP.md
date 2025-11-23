# 🔍 Google Custom Search API Setup Guide

**Estimated Time: 15 minutes**

Follow these steps to get your Google Custom Search API credentials.

---

## Step 1: Create Google Cloud Project (5 minutes)

1. **Go to Google Cloud Console:**

   - Visit: [console.cloud.google.com](https://console.cloud.google.com/)
   - Sign in with your Google account

2. **Create New Project:**

   - Click the project dropdown at the top
   - Click "New Project"
   - **Project Name**: `SignalStream`
   - Click "Create"

3. **Wait for Project Creation:**
   - Takes about 30 seconds
   - You'll see a notification when ready

---

## Step 2: Enable Custom Search API (3 minutes)

1. **Navigate to APIs & Services:**

   - In the left sidebar, click "APIs & Services" → "Library"
   - Or use this direct link: [console.cloud.google.com/apis/library](https://console.cloud.google.com/apis/library)

2. **Search for Custom Search API:**

   - In the search bar, type: `Custom Search API`
   - Click on "Custom Search API" in the results

3. **Enable the API:**
   - Click the blue "Enable" button
   - Wait 10-20 seconds for activation

---

## Step 3: Create API Key (2 minutes)

1. **Go to Credentials:**

   - In the left sidebar, click "Credentials"
   - Click "Create Credentials" → "API Key"

2. **Copy Your API Key:**

   - A popup will show your API key
   - **COPY THIS KEY** - it looks like: `AIzaSyC9x_abc123def456ghi789jkl012mno345`
   - Click "Close"

3. **Restrict API Key (IMPORTANT for security):**
   - Find your new API key in the list
   - Click the pencil icon (Edit)
   - Under "API restrictions":
     - Select "Restrict key"
     - Choose "Custom Search API" from the dropdown
   - Click "Save"

---

## Step 4: Create Custom Search Engine (5 minutes)

1. **Go to Programmable Search Engine:**

   - Visit: [programmablesearchengine.google.com](https://programmablesearchengine.google.com/)
   - Sign in with the same Google account

2. **Create New Search Engine:**

   - Click "Add" or "Get Started"
   - Click "Create a new search engine"

3. **Configure Search Engine:**

   ```
   Search engine name: SignalStream Job Search

   What to search:
   ┌─────────────────────────────────────────┐
   │ ☑ Search the entire web                │
   └─────────────────────────────────────────┘

   (Leave "Sites to search" empty)
   ```

4. **Create & Customize:**

   - Click "Create"
   - On the next page, click "Customize"

5. **Copy Your Search Engine ID:**
   - Look for "Search engine ID" on the left
   - **COPY THIS ID** - it looks like: `a1b2c3d4e5f6g7h8i`
   - Or click the "Copy to clipboard" icon

---

## Step 5: Add Secrets to Supabase (3 minutes)

### Option A: Using Supabase Dashboard (Recommended)

1. **Go to Supabase Dashboard:**

   - Visit: [app.supabase.com](https://app.supabase.com)
   - Select your project

2. **Navigate to Secrets:**

   - Click "Project Settings" (gear icon in bottom left)
   - Click "Edge Functions" in the left sidebar
   - Scroll down to "Secrets"

3. **Add First Secret:**

   - Click "Add New Secret"
   - **Name**: `GOOGLE_CUSTOM_SEARCH_KEY`
   - **Value**: Paste your API key from Step 3
   - Click "Save"

4. **Add Second Secret:**
   - Click "Add New Secret" again
   - **Name**: `GOOGLE_SEARCH_ENGINE_ID`
   - **Value**: Paste your Search Engine ID from Step 4
   - Click "Save"

### Option B: Using Supabase CLI

```bash
# In your project directory
supabase secrets set GOOGLE_CUSTOM_SEARCH_KEY=AIzaSyC9x_abc123def456ghi789jkl012mno345
supabase secrets set GOOGLE_SEARCH_ENGINE_ID=a1b2c3d4e5f6g7h8i
```

---

## Step 6: Verify Setup (2 minutes)

### Test the API Directly

```bash
# Replace YOUR_API_KEY and YOUR_SEARCH_ENGINE_ID with your actual values
curl "https://www.googleapis.com/customsearch/v1?key=YOUR_API_KEY&cx=YOUR_SEARCH_ENGINE_ID&q=SAP+S/4HANA+implementation+site:linkedin.com/jobs"
```

**Expected Response:**

- JSON object with `items` array
- Each item has a `link` field with a LinkedIn job URL
- Should see 10 results

**If you get an error:**

- `403`: API key not enabled → Wait 5 mins, try again
- `Invalid API key`: Check you copied the key correctly
- `Custom Search API has not been used`: Wait 2-3 mins for activation

---

## ✅ Checklist

Before moving to the next step, verify:

- [ ] Google Cloud project created
- [ ] Custom Search API enabled
- [ ] API key created and copied
- [ ] API key restricted to Custom Search API only
- [ ] Search engine created with "Search entire web" enabled
- [ ] Search Engine ID copied
- [ ] Both secrets added to Supabase
- [ ] Test curl command returns job listings

---

## 📊 Usage Limits & Costs

### Free Tier

- **100 queries per day** - FREE
- Perfect for testing and small-scale usage

### Paid Tier (if you exceed 100/day)

- **$5 per 1,000 queries**
- Example: 500 queries/month = $2.50

### How to Monitor Usage

1. Go to Google Cloud Console
2. Click "APIs & Services" → "Dashboard"
3. Click "Custom Search API"
4. View usage graphs

---

## 🔒 Security Best Practices

### 1. Restrict Your API Key

✅ Already done in Step 3

### 2. Set Application Restrictions (Optional but Recommended)

1. Edit API key in Google Cloud Console
2. Under "Application restrictions":
   - Select "HTTP referrers (web sites)"
   - Add: `*.supabase.co/*`
   - This prevents unauthorized use

### 3. Set Quotas (Optional)

1. Go to "APIs & Services" → "Custom Search API" → "Quotas"
2. Set daily limit to prevent unexpected charges

---

## 🆘 Troubleshooting

### "This API project is not authorized to use this API"

**Solution:** Wait 2-3 minutes for API activation, then try again

### "The request is missing a required parameter: cx"

**Solution:** Make sure you're using the Search Engine ID, not the API key

### "Daily Limit Exceeded"

**Solution:**

- You've hit the 100 queries/day free limit
- Wait until midnight Pacific Time for reset
- Or enable billing in Google Cloud Console

### "Billing must be enabled for activation"

**Solution:**

- Some accounts require billing enabled (even for free tier)
- Add a payment method in Google Cloud Console
- You won't be charged unless you exceed 100 queries/day

---

## ✨ You're Done!

Your Google Custom Search API is now configured.

**Next Step:** Deploy your Python NLP service to Render.com

---

**Questions?**

- Check [Google's official documentation](https://developers.google.com/custom-search/v1/overview)
- Review usage in [Google Cloud Console](https://console.cloud.google.com/)

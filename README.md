# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/bca8be59-471b-4ec6-a908-5a5b95ed9280

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/bca8be59-471b-4ec6-a908-5a5b95ed9280) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

## Local Development

To run this project locally, you need to start three separate components in a specific order.

### Prerequisites
- **Node.js** & **npm** (for frontend)
- **Python 3.8+** (for the scraper service)
- **Supabase CLI** (for backend functions & database)
- **Docker** (required for Supabase CLI)

### Step 1: Start the Python Scraper (Critical Dependency)
The Supabase Edge Functions depend on this service for advanced scraping. It must be running first.

```bash
cd python-scraper
pip install -r requirements.txt
PORT=5000 python main.py
```
*Runs on `http://localhost:5000`*

### Step 2: Start Supabase Backend
Run the local Supabase stack and serve the Edge Functions.

```bash
# In a new terminal, from the project root
npx supabase start

#to stop:
npx supabase stop
```
*Ensure your `.env` has `PYTHON_SCRAPER_URL=http://host.docker.internal:5000 // or https://signalstream-python-1q73.onrender.com`*

### Step 3: Start React Frontend
Finally, start the UI.

```bash
# In a third terminal
npm i
npm run dev
```
*Runs on `http://localhost:8080` (Vite default) or similar*

### Deployment Order
When deploying to production:
1.  **Deploy Python Scraper** (e.g., to Railway/Render).
2.  **Get the URL** (e.g., `https://my-scraper.railway.app`).
3.  **Set Secret in Supabase**: `PYTHON_SCRAPER_URL` = `https://my-scraper.railway.app/scrape`.
4.  **Deploy Supabase Functions**: `supabase functions deploy`.
5.  **Deploy Frontend** (e.g., to Vercel/Netlify/Lovable).

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

**IMPORTANT: Python Scraper Dependency**
To use the Deep Scan feature in the cloud (Lovable), you **MUST** deploy the Python Scraper separately and add its URL to your Supabase secrets.

1.  **Deploy Python Scraper** (e.g., to Railway/Render).
2.  **Set Secret in Supabase**: `PYTHON_SCRAPER_URL` = `https://your-scraper-url.com/scrape`.
3.  **Deploy Project**: Simply open [Lovable](https://lovable.dev/projects/bca8be59-471b-4ec6-a908-5a5b95ed9280) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)

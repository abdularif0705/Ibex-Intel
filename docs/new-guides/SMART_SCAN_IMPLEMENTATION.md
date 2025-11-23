# Smart Scan Implementation Options

This document captures the top three approaches for making **Smart Scan** fully autonomous across LinkedIn, Indeed, company websites (careers, blogs, announcements), news/PR wires, X/Twitter, SEC filings, and consulting publications. Each option builds on the current UI entry point in `src/pages/Scanner.tsx` and the Supabase-backed workflow in `src/components/CompanySearchDashboard.tsx`.

---

## Option 1 – Phased Source Orchestrator (extend existing flow)

**Summary:** Enhance `supabase/functions/intelligent-scan/index.ts` so it fans out to the highest-impact sources in ordered phases, using Firecrawl as the primary fetcher and the Python curl_cffi service as a fallback.

**Steps**

1. **Source routing upgrades**
   - Expand `supabase/functions/shared/company-analyzer.ts` to always include the required channels: LinkedIn, Indeed, company careers/blog pages, news, PR Newswire, SEC, X/Twitter, and consulting PDFs.
   - For news/PR searches, seed URLs via Brave Search queries (e.g., “`{company} Workday implementation`”).
2. **Scraping logic**
   - Keep Firecrawl Growth plan as the default (`supabase/functions/scrape-source/index.ts` already handles retries, single-page vs. crawl, and SEC shortcuts).
   - If Firecrawl returns 4xx/5xx, fall back to `supabase/functions/advanced-scrape` with the external Python scraper for LinkedIn/Indeed/company sites.
3. **Signal analysis**
   - All fetched content flows through `supabase/functions/shared/signal-analyzer.ts`, so vendor/phase/confidence scoring stays centralized.

**Pros**

- Fastest to ship (minimal topology change).
- Single click for the user; progress still reported via the existing toast/status flow.

**Cons**

- Edge Function stays synchronous; long scans risk hitting time limits.
- Less control over per-source throttling or custom parsing.

**When to choose:** Immediate implementation to get Smart Scan working end-to-end this week.

---

## Option 2 – Source-Specific Connector Jobs

**Summary:** Build dedicated mini-pipelines per source (LinkedIn connector, Indeed connector, company-site crawler, PR feed watcher, SEC parser, etc.) and let `intelligent-scan` orchestrate them via a job/queue system.

**Steps**

1. **Connector functions**
   - Create new Supabase Edge Functions or cron-triggered jobs such as `scan-linkedin`, `scan-indeed`, `scan-company-site`, `scan-prnewswire`, `scan-sec`, `scan-consulting`.
   - Each connector knows how to generate URLs (LinkedIn company ID, Indeed query string, sitemap, RSS feed).
2. **Parsing tactics**
   - Reuse the heuristics from `PATTERN_MATCHING_STRATEGY.md`: DOM parsing for LinkedIn/Greenhouse, JSON-LD for Glassdoor, XML for SEC, PDF parsing for consulting decks.
   - Store raw text + evidence, then call `signal-analyzer.ts`.
3. **Aggregation & UI**
   - `intelligent-scan` enqueues connectors and returns a scan ID immediately.
   - `CompanySearchDashboard` polls a status table to show incremental results.

**Pros**

- Allows per-source tuning, throttling, and monitoring.
- Easier to add/remove sources without touching the core function.

**Cons**

- Requires a queue/cron setup (Supabase Scheduled Functions or external worker).
- More moving parts to secure and observe.

**When to choose:** Medium-term once Option 1 stabilizes; start with LinkedIn/Indeed/company connectors, then layer in news/PR/consulting.

---

## Option 3 – Search-Seeded Knowledge Harvest (news, PR, X, consulting PDFs)

**Summary:** Cover long-tail intelligence (press releases, partner announcements, municipal PDFs, tweets) by seeding targeted searches, scraping the resulting documents, and letting an LLM summarize potential signals.

**Steps**

1. **Search seeding**
   - Use Brave Search API to pull top URLs for queries like “`{company} SAP go-live`” (news + PR + blog).
   - For X/Twitter, integrate an API (or a third-party firehose) to fetch recent posts mentioning vendor/phase keywords.
2. **Document conversion**
   - Run HTML through Firecrawl `crawl`.
   - Send PDFs (consulting firm decks, city council packets) to the Python scraper, then pass the bytes through a pdf-to-text library inside an Edge Function.
3. **AI summarization**
   - Feed each document into a low-cost model (Gemini 1.5 Flash or GPT-4o mini) to extract vendor, phase, spend, and timeline hints.
   - Save summaries as `signals` with a `source_confidence_modifier` so analysts can weigh them differently from hiring signals.

**Pros**

- Captures signals that never show up in job postings (press releases, consulting announcements, municipal RFPs).
- Provides narrative context around the raw signal data.

**Cons**

- Requires more API keys (Brave, X) and LLM budget.
- Additional validation needed to avoid hallucinations.

**When to choose:** After Options 1–2, to broaden coverage beyond hiring data and deepen competitive intelligence.

---

## Recommended Rollout Order

1. **Option 1** – deliver full Smart Scan coverage with phased Firecrawl + Python fallback.
2. **Option 2** – move heavy sources into dedicated connectors for better reliability and observability.
3. **Option 3** – add search-seeded enrichment for PR/news/social/PDF intelligence.

This staged plan keeps Smart Scan shippable quickly while creating a roadmap for richer automation and resilience.

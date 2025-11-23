# Technical Design Document (TDD)
## SAAS Implementation Signal Detection Platform

**Document Version:** 1.0  
**Last Updated:** 2025  
**Status:** Production Development

---

## Table of Contents
1. [Executive Summary](#executive-summary)
2. [System Architecture](#system-architecture)
3. [Database Schema](#database-schema)
4. [API Endpoints & Edge Functions](#api-endpoints--edge-functions)
5. [Paid API Analysis](#paid-api-analysis)
6. [Core System Flows](#core-system-flows)
7. [Security Architecture](#security-architecture)
8. [Developer Onboarding Checklist](#developer-onboarding-checklist)

---

## 1. Executive Summary

### Project Overview
An AI-powered signal detection platform that scrapes and analyzes web content to identify enterprise SAAS implementations (SAP, Workday, Salesforce, etc.) for financial analysts and institutional investors.

### Tech Stack
- **Frontend:** React 18, TypeScript, Vite, TailwindCSS, shadcn/ui
- **Backend:** Supabase (PostgreSQL 15+, Edge Functions on Deno)
- **Authentication:** Supabase Auth (email, Google OAuth)
- **AI/ML:** Lovable AI Gateway (Gemini, GPT-5 models)
- **Web Scraping:** Firecrawl API + Custom Python service
- **Email:** Resend API
- **Search:** Brave Search API

### Current State
- ✅ MVP functional with basic scraping and signal detection
- ✅ Authentication and user management
- ✅ AI-powered company analysis and report generation
- ✅ Manual scan triggers via UI
- ⚠️ Missing: Payment processing, automated scheduling, admin dashboard
- ⚠️ Technical debt: Error handling, retry logic, rate limiting

---

## 2. System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                             │
│  React SPA (Vite) - TailwindCSS - React Router - React Query    │
└─────────────────┬───────────────────────────────────────────────┘
                  │ HTTPS/WebSocket
                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                      SUPABASE BACKEND                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ PostgreSQL   │  │ Edge         │  │ Supabase     │          │
│  │ Database     │  │ Functions    │  │ Auth         │          │
│  │ (RLS)        │  │ (Deno)       │  │ (JWT)        │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└─────────────────┬───────────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                     EXTERNAL SERVICES                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ Lovable AI   │  │ Firecrawl    │  │ Brave Search │          │
│  │ Gateway      │  │ API          │  │ API          │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│  ┌──────────────┐  ┌──────────────┐                            │
│  │ Resend       │  │ Python       │                            │
│  │ Email        │  │ Scraper      │                            │
│  └──────────────┘  └──────────────┘                            │
└─────────────────────────────────────────────────────────────────┘
```

### Component Architecture

#### Frontend Structure
```
src/
├── components/          # Reusable UI components
│   ├── ui/             # shadcn/ui primitives
│   ├── Hero.tsx
│   ├── SignalsDashboard.tsx
│   ├── ScrapingDashboard.tsx
│   ├── ReportsDashboard.tsx
│   ├── AutomationDashboard.tsx
│   └── ChatbotSidebar.tsx
├── pages/              # Route components
│   ├── Index.tsx       # Landing page
│   ├── Dashboard.tsx   # Main app dashboard
│   ├── Scanner.tsx     # Signal detection interface
│   ├── Auth.tsx        # Login/signup
│   ├── Onboarding.tsx  # First-time user flow
│   └── Automation.tsx  # Scheduled scans
├── integrations/       # External service clients
│   └── supabase/
│       ├── client.ts   # Supabase SDK instance
│       └── types.ts    # Auto-generated DB types
├── utils/              # Utility functions
│   ├── demo-report-generator.ts
│   ├── pdf-utils.ts
│   └── logo-utils.ts
└── lib/                # Core libraries
    └── utils.ts        # Shared helpers
```

#### Backend Structure
```
supabase/
├── functions/          # Edge Functions (Deno)
│   ├── intelligent-scan/
│   │   ├── index.ts           # Main orchestrator
│   │   └── url-extractor.ts   # URL parsing logic
│   ├── scrape-source/
│   │   └── index.ts           # Individual URL scraper
│   ├── advanced-scrape/
│   │   └── index.ts           # Python proxy scraper
│   ├── verify-company/
│   │   └── index.ts           # Company validation via AI
│   ├── generate-report/
│   │   └── index.ts           # AI report generation
│   ├── send-report/
│   │   └── index.ts           # Email report delivery
│   ├── chat/
│   │   └── index.ts           # AI chatbot endpoint
│   └── shared/
│       ├── signal-analyzer.ts      # Core NLP logic
│       ├── signal-taxonomy.ts      # Keyword taxonomy
│       ├── company-analyzer.ts     # Company profiling
│       └── vendor-validation-sources.ts
├── migrations/         # Database migrations (auto-applied)
└── config.toml        # Supabase project config
```

---

## 3. Database Schema

### ER Diagram

```
┌─────────────────┐
│ auth.users      │ (Supabase managed)
└────────┬────────┘
         │
         │ 1:1
         ▼
┌─────────────────────────────┐
│ user_preferences            │
├─────────────────────────────┤
│ id (PK)                     │
│ user_id (FK) → auth.users   │
│ professional_role           │
│ asset_class                 │
│ market_segment              │
│ coverage_group              │
│ onboarding_completed        │
│ other_details (jsonb)       │
└─────────────────────────────┘
         │ 1:1
         ▼
┌─────────────────────────────┐
│ user_scan_limits            │
├─────────────────────────────┤
│ id (PK)                     │
│ user_id (FK) → auth.users   │
│ scan_count                  │
│ plan_type                   │
│ created_at                  │
│ updated_at                  │
└─────────────────────────────┘
         │ 1:N
         ▼
┌─────────────────────────────┐
│ scraping_jobs               │
├─────────────────────────────┤
│ id (PK)                     │
│ user_id (FK)                │
│ target_url                  │
│ source_type (enum)          │
│ status                      │
│ started_at                  │
│ completed_at                │
│ results_count               │
│ error_message               │
└─────────────────────────────┘
         │ 1:N
         ▼
┌─────────────────────────────┐
│ signals                     │
├─────────────────────────────┤
│ id (PK)                     │
│ user_id (FK)                │
│ company_name                │
│ company_ticker              │
│ signal_type (enum)          │
│ confidence_score            │
│ source_type (enum)          │
│ source_url                  │
│ content_type (enum)         │
│ keywords (text[])           │
│ extracted_data (jsonb)      │
│ raw_content                 │
│ scan_type                   │
│ detected_at                 │
└─────────────────────────────┘
         │ 1:N
         ▼
┌─────────────────────────────┐
│ signal_evidence             │
├─────────────────────────────┤
│ id (PK)                     │
│ signal_id (FK) → signals    │
│ user_id (FK)                │
│ evidence_type               │
│ evidence_text               │
│ source_url                  │
│ relevance_score             │
└─────────────────────────────┘

┌─────────────────────────────┐
│ scheduled_scans             │
├─────────────────────────────┤
│ id (PK)                     │
│ user_id (FK)                │
│ name                        │
│ frequency                   │
│ target_urls (text[])        │
│ source_types (text[])       │
│ is_active                   │
│ last_run_at                 │
│ next_run_at                 │
└─────────────────────────────┘

┌─────────────────────────────┐
│ report_subscriptions        │
├─────────────────────────────┤
│ id (PK)                     │
│ user_id (FK)                │
│ email                       │
│ frequency                   │
│ report_name                 │
│ audience (enum)             │
│ min_confidence_score        │
│ signal_types (text[])       │
│ company_filters (text[])    │
│ source_filters (text[])     │
│ custom_monitor_urls (text[])│
│ is_active                   │
│ last_sent_at                │
└─────────────────────────────┘
```

### Table Details

#### **user_preferences**
Stores user profile and onboarding data.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PK, default gen_random_uuid() | Unique record ID |
| user_id | uuid | FK → auth.users, NOT NULL | User reference |
| professional_role | text | NOT NULL | Role: analyst, portfolio_manager, etc. |
| asset_class | text | NULL | e.g., "Technology", "Healthcare" |
| market_segment | text | NULL | e.g., "Enterprise", "Mid-Market" |
| coverage_group | text | NULL | Custom user grouping |
| onboarding_completed | boolean | default false | Onboarding status |
| other_details | jsonb | NULL | Extensible metadata |
| created_at | timestamptz | default now() | Creation timestamp |
| updated_at | timestamptz | default now() | Last update timestamp |

**RLS Policies:**
- Users can SELECT/INSERT/UPDATE their own preferences
- No DELETE (prevent accidental data loss)

---

#### **user_scan_limits**
Tracks scan usage and plan type for rate limiting.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PK | Unique record ID |
| user_id | uuid | FK, NOT NULL, UNIQUE | One record per user |
| scan_count | integer | NOT NULL, default 0 | Total scans performed |
| plan_type | text | NOT NULL, default 'free_trial' | Subscription tier |
| created_at | timestamptz | NOT NULL, default now() | Creation timestamp |
| updated_at | timestamptz | NOT NULL, default now() | Last update timestamp |

**RLS Policies:**
- Users can SELECT/INSERT their own limits
- Service role can UPDATE (for backend enforcement)
- No DELETE

---

#### **scraping_jobs**
Tracks scraping operations and their status.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PK | Unique job ID |
| user_id | uuid | FK, NOT NULL | Job owner |
| target_url | text | NOT NULL | URL being scraped |
| source_type | enum | NOT NULL | linkedin, careers_page, press_release, etc. |
| status | text | default 'pending' | pending, running, completed, failed |
| started_at | timestamptz | NULL | Job start time |
| completed_at | timestamptz | NULL | Job completion time |
| results_count | integer | default 0 | Number of signals found |
| error_message | text | NULL | Error details if failed |
| created_at | timestamptz | default now() | Creation timestamp |

**RLS Policies:**
- Users can SELECT/INSERT/UPDATE/DELETE their own jobs

---

#### **signals**
Core table storing detected SAAS implementation signals.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PK | Unique signal ID |
| user_id | uuid | FK, NOT NULL | Signal owner |
| company_name | text | NOT NULL | Detected company name |
| company_ticker | text | NULL | Stock ticker if public |
| signal_type | enum | NOT NULL | implementation, migration, failure, planning |
| confidence_score | numeric | NULL | 0.0 to 1.0 confidence |
| source_type | enum | NOT NULL | Source of detection |
| source_url | text | NOT NULL | Origin URL |
| content_type | enum | default 'webpage_text' | Type of content analyzed |
| keywords | text[] | NULL | Matched keywords |
| extracted_data | jsonb | NULL | Structured data (roles, vendors, etc.) |
| raw_content | text | NULL | Original scraped text |
| scan_type | text | default 'manual' | manual or scheduled |
| detected_at | timestamptz | default now() | Detection timestamp |
| created_at | timestamptz | default now() | Creation timestamp |
| updated_at | timestamptz | default now() | Last update timestamp |

**RLS Policies:**
- Users can SELECT/INSERT/UPDATE/DELETE their own signals

---

#### **signal_evidence**
Supporting evidence for detected signals (keywords, job roles, etc.).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PK | Unique evidence ID |
| signal_id | uuid | FK → signals | Parent signal |
| user_id | uuid | FK, NOT NULL | Evidence owner |
| evidence_type | text | NOT NULL | keyword, role, vendor_mention, etc. |
| evidence_text | text | NULL | Extracted evidence text |
| source_url | text | NULL | Source URL |
| relevance_score | numeric | NULL | Relevance score |
| created_at | timestamptz | default now() | Creation timestamp |

**RLS Policies:**
- Users can SELECT/INSERT/UPDATE/DELETE their own evidence

---

#### **scheduled_scans**
Automated scan configurations.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PK | Unique schedule ID |
| user_id | uuid | FK, NOT NULL | Schedule owner |
| name | text | NOT NULL | User-defined name |
| frequency | text | NOT NULL | daily, weekly, monthly |
| target_urls | text[] | NOT NULL | URLs to monitor |
| source_types | text[] | NOT NULL | Source types to scan |
| is_active | boolean | default true | Active status |
| last_run_at | timestamptz | NULL | Last execution time |
| next_run_at | timestamptz | NULL | Next scheduled run |
| created_at | timestamptz | default now() | Creation timestamp |
| updated_at | timestamptz | default now() | Last update timestamp |

**RLS Policies:**
- Users can SELECT/INSERT/UPDATE/DELETE their own schedules

---

#### **report_subscriptions**
Email report subscriptions.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PK | Unique subscription ID |
| user_id | uuid | FK, NOT NULL | Subscriber |
| email | text | NOT NULL | Delivery email |
| frequency | text | NOT NULL | daily, weekly, monthly |
| report_name | text | default 'Transformation Signals Report' | Report title |
| audience | enum | default 'analyst' | analyst or portfolio_manager |
| min_confidence_score | numeric | default 0.5 | Minimum confidence filter |
| signal_types | text[] | NULL | Signal type filters |
| company_filters | text[] | NULL | Company name filters |
| source_filters | text[] | NULL | Source type filters |
| custom_monitor_urls | text[] | NULL | Additional URLs to monitor |
| is_active | boolean | default true | Active status |
| last_sent_at | timestamptz | NULL | Last email sent time |
| created_at | timestamptz | default now() | Creation timestamp |
| updated_at | timestamptz | default now() | Last update timestamp |

**RLS Policies:**
- Users can SELECT/INSERT/UPDATE/DELETE their own subscriptions

---

### Enums

```sql
-- Signal type categories
create type signal_type as enum (
  'implementation',
  'migration',
  'failure',
  'planning'
);

-- Source type categories
create type source_type as enum (
  'linkedin',
  'careers_page',
  'company_website',
  'press_release',
  'sec_filing',
  'job_posting',
  'custom'
);

-- Content type for analysis
create type content_type as enum (
  'webpage_text',
  'job_description',
  'press_release',
  'sec_filing',
  'pdf_document'
);

-- Report audience type
create type report_audience as enum (
  'analyst',
  'portfolio_manager'
);
```

---

## 4. API Endpoints & Edge Functions

### Authentication Endpoints (Supabase Auth)

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/auth/v1/signup` | POST | Public | Email/password signup |
| `/auth/v1/token?grant_type=password` | POST | Public | Login |
| `/auth/v1/logout` | POST | Required | Logout |
| `/auth/v1/user` | GET | Required | Get current user |
| `/auth/v1/recover` | POST | Public | Password reset |

**OAuth Providers Configured:**
- Google (configured in Supabase Auth settings)

---

### Edge Functions (Custom Business Logic)

#### **1. intelligent-scan**
**Path:** `/functions/v1/intelligent-scan`  
**Method:** POST  
**Auth:** Required (JWT)  
**Purpose:** Main orchestrator for company scanning

**Request Body:**
```json
{
  "companyName": "string (optional)",
  "ticker": "string (optional)"
}
```

**Response:**
```json
{
  "jobId": "uuid",
  "status": "initiated",
  "companyProfile": {
    "name": "string",
    "ticker": "string",
    "description": "string",
    "industry": "string"
  },
  "suggestedSources": [
    {
      "type": "linkedin",
      "url": "string",
      "priority": "high|medium|low"
    }
  ],
  "estimatedDuration": "string",
  "progress": {
    "status": "string",
    "phasesCompleted": "number",
    "totalPhases": "number"
  }
}
```

**Key Logic:**
1. Validates user authentication
2. Checks user scan limits
3. Calls `verify-company` to get company profile
4. Creates `scraping_jobs` record
5. Organizes scan phases (high/medium/low priority)
6. Spawns async `performScan` background task
7. Returns immediately with job ID

**Background Task:**
- Iterates through scan phases
- Invokes `scrape-source` for each URL
- Extracts job URLs from listing pages
- Aggregates signals
- Updates job status
- Increments user scan count

---

#### **2. scrape-source**
**Path:** `/functions/v1/scrape-source`  
**Method:** POST  
**Auth:** Required (JWT)  
**Purpose:** Scrape and analyze individual URLs

**Request Body:**
```json
{
  "targetUrl": "string",
  "sourceType": "linkedin|careers_page|...",
  "scanType": "manual|scheduled",
  "scrapedContent": "string (optional)",
  "scrapingMethod": "firecrawl|python"
}
```

**Response:**
```json
{
  "success": true,
  "jobId": "uuid",
  "signalsFound": 5,
  "signals": [
    {
      "id": "uuid",
      "company_name": "string",
      "signal_type": "implementation",
      "confidence_score": 0.85,
      "keywords": ["SAP", "Cutover", "Go-live"],
      "extracted_data": {}
    }
  ],
  "metadata": {
    "scrapingMethod": "firecrawl",
    "processingTime": "2.5s"
  }
}
```

**Key Logic:**
1. Validates user and enforces scan limits
2. Auto-detects `sourceType` from URL if not provided
3. Creates `scraping_jobs` record
4. Scrapes content using Firecrawl or Python service
5. Analyzes content using `signal-analyzer.ts`
6. Inserts signals and evidence into database
7. Updates job status and user scan count

**Scraping Strategy:**
- **Single-page scrape** for specific job postings
- **Deep crawl (map mode)** for broader site exploration
- Uses Firecrawl for most sources, Python for heavy anti-bot sites
- Implements retry logic with exponential backoff

---

#### **3. advanced-scrape**
**Path:** `/functions/v1/advanced-scrape`  
**Method:** POST  
**Auth:** Required  
**Purpose:** Proxy for Python scraper service

**Request Body:**
```json
{
  "url": "string",
  "method": "GET|POST",
  "useJavaScript": true
}
```

**Response:**
```json
{
  "success": true,
  "html": "string",
  "text": "string",
  "metadata": {
    "url": "string",
    "scrapingMethod": "python",
    "timestamp": "ISO8601"
  }
}
```

**Key Logic:**
- Proxies requests to external Python scraping service
- Fallback to enhanced `fetch` if Python service unavailable
- Handles heavy JavaScript rendering and anti-bot measures

---

#### **4. verify-company**
**Path:** `/functions/v1/verify-company`  
**Method:** POST  
**Auth:** Required  
**Purpose:** Validate and enrich company data using AI

**Request Body:**
```json
{
  "companyName": "string (optional)",
  "ticker": "string (optional)"
}
```

**Response:**
```json
{
  "success": true,
  "company": {
    "name": "Microsoft Corporation",
    "ticker": "MSFT",
    "description": "...",
    "industry": "Technology",
    "headquarters": "Redmond, WA",
    "website": "https://microsoft.com",
    "employeeCount": 220000,
    "revenue": "$211B"
  }
}
```

**Key Logic:**
- Calls Lovable AI Gateway to fetch company details
- Handles rate limits and API errors
- Returns structured company profile

---

#### **5. generate-report**
**Path:** `/functions/v1/generate-report`  
**Method:** POST  
**Auth:** Required  
**Purpose:** Generate AI analysis reports from signals

**Request Body:**
```json
{
  "signalIds": ["uuid", "uuid"],
  "reportLevel": "analyst|portfolio_manager"
}
```

**Response:**
```json
{
  "success": true,
  "analysis": "string (markdown)",
  "signals": [...],
  "reportLevel": "analyst",
  "generatedAt": "ISO8601"
}
```

**Key Logic:**
- Fetches signals and evidence from database
- Constructs AI prompt based on report level
- Calls Lovable AI for analysis generation
- Returns markdown-formatted report

**Report Levels:**
- **analyst:** Detailed technical analysis with evidence
- **portfolio_manager:** High-level strategic insights

---

#### **6. send-report**
**Path:** `/functions/v1/send-report`  
**Method:** POST  
**Auth:** Required  
**Purpose:** Email reports to subscribers

**Request Body:**
```json
{
  "subscriptionId": "uuid (optional)",
  "reportContent": "string (optional)",
  "recipientEmail": "string (optional)"
}
```

**Response:**
```json
{
  "success": true,
  "emailsSent": 1,
  "details": [
    {
      "email": "user@example.com",
      "messageId": "string"
    }
  ]
}
```

**Key Logic:**
- Fetches subscription details or uses provided data
- Queries signals based on subscription filters
- Generates report using `generate-report` logic
- Sends email via Resend API
- Updates `last_sent_at` timestamp

---

#### **7. chat**
**Path:** `/functions/v1/chat`  
**Method:** POST  
**Auth:** Required  
**Purpose:** Financial analysis chatbot with web search

**Request Body:**
```json
{
  "messages": [
    { "role": "user", "content": "What's the latest on SAP implementations?" }
  ]
}
```

**Response:**
```json
{
  "id": "string",
  "choices": [
    {
      "message": {
        "role": "assistant",
        "content": "string"
      }
    }
  ]
}
```

**Key Logic:**
- Streams AI responses using Lovable AI Gateway
- Supports `web_search` tool for real-time research
- Calls Brave Search API when tool is invoked
- Returns streamed completion to client

---

### Database RPC Functions

#### **get_user_subscriptions()**
Returns all report subscriptions for authenticated user.

```sql
SELECT * FROM get_user_subscriptions();
```

**Returns:** Table of report_subscriptions

---

## 5. Paid API Analysis

### Summary Table

| Service | Current Usage | Monthly Cost Est. | Critical? | Alternative |
|---------|---------------|-------------------|-----------|-------------|
| **Firecrawl** | Primary scraping | $200-500+ | **YES** | Python service (complex) |
| **Lovable AI** | AI analysis & chat | $100-300 | **YES** | OpenAI direct (add complexity) |
| **Resend** | Email delivery | $10-50 | **YES** | AWS SES (more setup) |
| **Brave Search** | Web search for chatbot | $5-20 | **NO** | Remove feature or use Google Custom Search |
| **hCaptcha** | Bot protection | $0 (free tier) | **NO** | Cloudflare Turnstile |
| **Python Scraper Service** | Heavy scraping fallback | $50-150 (hosting) | **NO** | Firecrawl only (reduce capability) |

---

### Detailed Analysis

#### **1. Firecrawl API** 🔴 CRITICAL
**Purpose:** Web scraping with anti-bot handling  
**Usage:**
- Scraping job postings, career pages, press releases
- Deep crawl for LinkedIn company pages
- Handles JavaScript rendering and pagination

**Pricing:**
- Free tier: 500 credits/month
- Paid: $0.001/page (1,000 pages = $1)
- Deep crawl: 10-100 pages per site

**Why Critical:**
- Core functionality depends on reliable scraping
- Firecrawl handles CAPTCHAs and JavaScript better than simple fetch
- Alternative (Python service) is complex to maintain

**Cost Reduction:**
- Implement smart caching (deduplicate URLs)
- Rate limit user scans (currently 3 free, then paywall)
- Use `scrape` mode instead of `map` mode when possible (cheaper)

**Alternative:** Build robust Python service with Playwright/Selenium (high maintenance)

---

#### **2. Lovable AI Gateway** 🔴 CRITICAL
**Purpose:** AI-powered analysis and chat  
**Usage:**
- Company verification (`verify-company`)
- Signal analysis (keyword extraction, confidence scoring)
- Report generation (`generate-report`)
- Financial chatbot (`chat`)

**Pricing:**
- Pay-per-request model
- Varies by model (Gemini Flash is cheapest)

**Why Critical:**
- Core value proposition is AI-driven insights
- Used in 4+ edge functions
- No simple alternative without adding OpenAI SDK + key management

**Cost Reduction:**
- Use `google/gemini-2.5-flash` instead of GPT-5 (60% cheaper)
- Cache company verifications
- Batch signal analysis instead of one-by-one

**Alternative:** Switch to OpenAI API directly (adds complexity, loses built-in integration)

---

#### **3. Resend API** 🔴 CRITICAL
**Purpose:** Transactional email delivery  
**Usage:**
- Send generated reports to subscribers
- Future: Welcome emails, scan notifications

**Pricing:**
- Free tier: 100 emails/day
- Paid: $20/month for 50k emails

**Why Critical:**
- Required for report delivery feature
- High deliverability needed for financial content

**Cost Reduction:**
- Batch emails instead of real-time sending
- Implement daily/weekly digest only (no instant alerts)

**Alternative:** AWS SES ($0.10/1k emails but harder setup, domain verification)

---

#### **4. Brave Search API** 🟡 OPTIONAL
**Purpose:** Web search for chatbot  
**Usage:**
- Chatbot `web_search` tool
- Real-time financial news lookup

**Pricing:**
- Free tier: 2,000 queries/month
- Paid: $5/month for 15k queries

**Why Optional:**
- Chatbot works without web search (uses pre-trained knowledge)
- Feature is nice-to-have, not core to signal detection

**Cost Reduction:**
- Remove web search feature entirely
- Use canned responses with disclaimer
- Switch to Google Custom Search (100 queries/day free)

**Recommendation:** Remove or disable until user demand justifies cost.

---

#### **5. hCaptcha** 🟢 FREE
**Purpose:** Bot protection on signup  
**Current Cost:** $0 (free tier sufficient)

**Recommendation:** Keep as-is. Switch to Cloudflare Turnstile if scaling issues.

---

#### **6. Python Scraper Service** 🟡 OPTIONAL
**Purpose:** Fallback scraper with Playwright  
**Current Cost:** $0 (not deployed) or $50-150/month (if deployed on Render/Fly.io)

**Why Optional:**
- Firecrawl handles 95% of use cases
- Python service is overkill unless hitting heavy anti-bot sites

**Recommendation:** Don't deploy unless Firecrawl fails consistently on specific sites.

---

### Final Recommendation: Paid APIs to Keep

**Tier 1 (Must Keep):**
1. Firecrawl ($200-500/month) - Core scraping
2. Lovable AI ($100-300/month) - AI analysis
3. Resend ($10-50/month) - Email delivery

**Total Core Monthly Cost:** $310-850/month

**Tier 2 (Cut/Reduce):**
- Brave Search → Remove or replace with Google Custom Search
- Python Scraper → Don't deploy unless absolutely needed

**Expected Savings:** $55-170/month

---

## 6. Core System Flows

### Flow 1: User Onboarding

```
[User lands on app] → [Clicks Sign Up]
         ↓
[Supabase Auth signup] → [Creates auth.users record]
         ↓
[Redirect to /onboarding]
         ↓
[User selects professional role]
         ↓
[User enters coverage details (optional)]
         ↓
[INSERT into user_preferences]
         ↓
[INSERT into user_scan_limits with plan_type='free_trial']
         ↓
[Set onboarding_completed = true]
         ↓
[Redirect to /dashboard]
```

**Database Tables Touched:**
- `auth.users` (Supabase managed)
- `user_preferences`
- `user_scan_limits`

**Code Files:**
- `src/pages/Onboarding.tsx`
- `src/pages/Auth.tsx`

---

### Flow 2: Manual Company Scan (Intelligent Scan)

```
[User enters company name/ticker in UI]
         ↓
[Frontend calls /functions/v1/intelligent-scan]
         ↓
[intelligent-scan Edge Function]
         ├─ Check JWT authentication
         ├─ Verify user_scan_limits.scan_count < limit
         ├─ Call /functions/v1/verify-company (AI enrichment)
         ├─ INSERT into scraping_jobs (status='pending')
         ├─ Organize scan phases (high/med/low priority URLs)
         └─ Return job_id immediately
         ↓
[Frontend polls scraping_jobs.status]
         ↓
[Background async task: performScan()]
         ├─ For each phase:
         │    ├─ Call /functions/v1/scrape-source for each URL
         │    └─ Extract job URLs from listing pages → scrape those too
         ├─ Aggregate all detected signals
         ├─ UPDATE scraping_jobs (status='completed', results_count)
         └─ UPDATE user_scan_limits.scan_count++
         ↓
[Frontend displays signals in SignalsDashboard]
```

**Database Tables Touched:**
- `user_scan_limits` (read + update)
- `scraping_jobs` (insert + update)
- `signals` (insert)
- `signal_evidence` (insert)

**Code Files:**
- `src/pages/Scanner.tsx`
- `supabase/functions/intelligent-scan/index.ts`
- `supabase/functions/scrape-source/index.ts`
- `supabase/functions/verify-company/index.ts`
- `supabase/functions/shared/signal-analyzer.ts`

---

### Flow 3: Signal Detection & Analysis

```
[scrape-source receives URL and content]
         ↓
[Scraping Logic]
         ├─ If content not provided:
         │    ├─ Call Firecrawl API (scrape or map mode)
         │    └─ Handle pagination/crawl status polling
         ├─ Extract company name from URL or content
         └─ Determine content_type (job_description, press_release, etc.)
         ↓
[Signal Analysis - signal-analyzer.ts]
         ├─ Load keyword taxonomy (signal-taxonomy.ts)
         ├─ Extract keywords using regex + NLP
         ├─ Detect vendor mentions (SAP, Workday, etc.)
         ├─ Detect job roles (Implementation Consultant, Architect)
         ├─ Calculate confidence score (0.0-1.0)
         ├─ Classify signal_type (implementation, migration, failure)
         └─ Extract structured data (jsonb)
         ↓
[Database Insertion]
         ├─ INSERT into signals (with confidence_score, keywords, etc.)
         └─ INSERT into signal_evidence (for each keyword/role match)
         ↓
[Return signals to intelligent-scan]
```

**Key Components:**
- `supabase/functions/shared/signal-analyzer.ts` - Core NLP logic
- `supabase/functions/shared/signal-taxonomy.ts` - Keyword database
- `supabase/functions/shared/company-analyzer.ts` - Company profiling

**Confidence Scoring Formula:**
```
base_score = 0.3
+ keyword_matches * 0.05 (max +0.3)
+ vendor_mentions * 0.1 (max +0.2)
+ role_matches * 0.1 (max +0.2)
+ proximity_bonus * 0.1 (keywords near vendor names)
= final_score (capped at 1.0)
```

---

### Flow 4: Report Generation & Delivery

```
[User selects signals in dashboard]
         ↓
[User clicks "Generate Report"]
         ↓
[Frontend calls /functions/v1/generate-report]
         ├─ signalIds: ["uuid1", "uuid2"]
         └─ reportLevel: "analyst" or "portfolio_manager"
         ↓
[generate-report Edge Function]
         ├─ SELECT signals + signal_evidence WHERE id IN (signalIds)
         ├─ Construct AI prompt based on reportLevel
         ├─ Call Lovable AI Gateway (OpenAI/Gemini)
         └─ Return markdown-formatted analysis
         ↓
[Frontend displays report in modal]
         ↓
[User clicks "Download PDF"]
         ↓
[Frontend calls generateDemoReport() - pdf-utils.ts]
         └─ Uses jsPDF to create PDF with charts, tables, branding
         ↓
[User downloads PDF or emails it]
```

**Alternative Flow: Scheduled Email Reports**

```
[Cron job or manual trigger] → [Call /functions/v1/send-report]
         ↓
[send-report Edge Function]
         ├─ SELECT FROM report_subscriptions WHERE is_active=true
         ├─ For each subscription:
         │    ├─ Query signals based on filters
         │    ├─ Call generate-report internally
         │    ├─ Send email via Resend API
         │    └─ UPDATE last_sent_at
         └─ Return summary of emails sent
```

**Database Tables Touched:**
- `signals` (read)
- `signal_evidence` (read)
- `report_subscriptions` (read + update)

**Code Files:**
- `src/components/ReportsDashboard.tsx`
- `src/utils/demo-report-generator.ts`
- `src/utils/pdf-utils.ts`
- `supabase/functions/generate-report/index.ts`
- `supabase/functions/send-report/index.ts`

---

### Flow 5: Scheduled Scans (Automation)

```
[User creates scheduled scan in AutomationDashboard]
         ↓
[INSERT into scheduled_scans]
         ├─ name: "Daily LinkedIn scan for SAP jobs"
         ├─ frequency: "daily"
         ├─ target_urls: ["https://linkedin.com/company/..."]
         ├─ source_types: ["linkedin"]
         └─ next_run_at: tomorrow 9am UTC
         ↓
[Cron job checks scheduled_scans every hour]
         ↓
[For each scan where next_run_at <= now() AND is_active=true:]
         ├─ Call /functions/v1/intelligent-scan for each target_url
         ├─ UPDATE scheduled_scans:
         │    ├─ last_run_at = now()
         │    └─ next_run_at = calculate_next_run(frequency)
         └─ Optional: Send email notification to user
```

**Missing Implementation:**
- ⚠️ Cron job not implemented yet
- Requires external scheduler (GitHub Actions, Supabase Edge Function cron, or pg_cron)

**Database Tables Touched:**
- `scheduled_scans` (insert + update)
- `scraping_jobs` (via intelligent-scan)
- `signals` (via scrape-source)

**Code Files:**
- `src/components/AutomationDashboard.tsx`
- (Missing) `supabase/functions/run-scheduled-scans/index.ts` (needs creation)

---

### Flow 6: Financial Chatbot

```
[User types question in ChatbotSidebar]
         ↓
[Frontend sends messages to /functions/v1/chat]
         ↓
[chat Edge Function]
         ├─ Receive conversation history
         ├─ Add system prompt ("You are a financial analyst...")
         ├─ Call Lovable AI Gateway
         ├─ AI requests web_search tool (if needed)
         │    └─ Call Brave Search API
         │    └─ Return search results to AI
         └─ Stream AI response back to client
         ↓
[Frontend displays streamed response in chat UI]
```

**Code Files:**
- `src/components/ChatbotSidebar.tsx`
- `supabase/functions/chat/index.ts`

---

## 7. Security Architecture

### Authentication & Authorization

#### **Row-Level Security (RLS)**
All tables have RLS enabled with policies:
- Users can only SELECT/INSERT/UPDATE/DELETE their own records
- `user_id` foreign key enforces ownership
- Service role can bypass RLS for admin operations

**Example Policy:**
```sql
CREATE POLICY "Users can view their own signals"
ON signals FOR SELECT
TO authenticated
USING (auth.uid() = user_id);
```

#### **JWT Authentication**
- Supabase Auth issues JWT tokens
- Edge functions validate JWT via `Authorization: Bearer <token>`
- Token contains `sub` (user ID) used for RLS

#### **API Key Management**
All secrets stored in Supabase Secrets:
- `LOVABLE_API_KEY` - AI gateway
- `FIRECRAWL_API_KEY` - Web scraping
- `RESEND_API_KEY` - Email delivery
- `BRAVE_API_KEY` - Web search
- `SUPABASE_SERVICE_ROLE_KEY` - Admin operations

**Never exposed to client-side code.**

---

### Input Validation

#### **Edge Functions**
- Validate `targetUrl` format (URL regex)
- Sanitize `sourceType` enum values
- Escape user-provided company names before AI prompts
- Rate limit based on `user_scan_limits`

#### **Frontend**
- React Hook Form with Zod validation
- Client-side checks before API calls
- hCaptcha on signup form

---

### Rate Limiting

#### **Current Implementation**
- Free trial: 3 scans total
- Paid plans: TBD (not implemented)
- Enforced in `scrape-source` and `intelligent-scan` functions

**Code:**
```typescript
const { data: scanLimits, error: limitsError } = await supabase
  .from('user_scan_limits')
  .select('*')
  .eq('user_id', userId)
  .single();

if (scanLimits && scanLimits.scan_count >= 3 && scanLimits.plan_type === 'free_trial') {
  return new Response(JSON.stringify({
    error: 'Free trial scan limit reached. Please upgrade to continue.'
  }), { status: 403 });
}
```

#### **Missing:**
- ⚠️ No per-IP rate limiting (vulnerable to abuse)
- ⚠️ No request throttling (can overwhelm Firecrawl API)
- ⚠️ No CAPTCHA on scan submission (only on signup)

---

### Data Privacy

#### **PII Handling**
- User emails stored in `auth.users` (Supabase managed)
- No credit card data stored (payments not implemented)
- Company names and job descriptions scraped (public data)

#### **GDPR Compliance**
- ⚠️ No data deletion endpoint (violates right to erasure)
- ⚠️ No data export endpoint (violates data portability)
- ⚠️ No privacy policy or terms of service

---

### Security Vulnerabilities & Recommendations

| Risk | Severity | Current State | Recommendation |
|------|----------|---------------|----------------|
| No payment gateway | High | Blocking monetization | Integrate Stripe |
| SQL injection | Low | Supabase SDK prevents | Continue using SDK, never raw SQL |
| XSS attacks | Medium | React escapes by default | Add CSP headers |
| CSRF | Low | JWT auth mitigates | Add CSRF tokens if adding cookies |
| Abuse of free tier | High | No IP rate limiting | Add Cloudflare rate limiting |
| Scraping API key exposure | Medium | Firecrawl key on backend | ✅ Correct implementation |
| Missing user roles | High | No admin panel | Create `user_roles` table (see instructions) |
| No data retention policy | Medium | Signals stored forever | Add TTL or archive strategy |
| Unvalidated redirects | Low | No redirects used | N/A |

---

## 8. Developer Onboarding Checklist

### Prerequisites
- [ ] **Node.js** 18+ and **Bun/npm** installed
- [ ] **Git** installed
- [ ] **Supabase CLI** installed (`npm install -g supabase`)
- [ ] **Code editor** (VSCode recommended)

### Environment Setup

#### 1. Clone Repository
```bash
git clone <repo-url>
cd <project-directory>
```

#### 2. Install Dependencies
```bash
npm install
# or
bun install
```

#### 3. Environment Variables
Create `.env.local` (Lovable Cloud auto-generates `.env`):
```env
VITE_SUPABASE_URL=https://aiknteqeuydkeopstvrd.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_SUPABASE_PROJECT_ID=aiknteqeuydkeopstvrd
```

#### 4. Supabase Setup
```bash
# Link to existing Supabase project
supabase link --project-ref aiknteqeuydkeopstvrd

# Pull latest schema
supabase db pull

# (Optional) Start local Supabase for development
supabase start
```

#### 5. Run Development Server
```bash
npm run dev
# Opens on http://localhost:5173
```

---

### Code Understanding

#### Must-Read Files (Priority Order)
1. **`TECHNICAL_DESIGN_DOCUMENT.md`** (this file) - Architecture overview
2. **`supabase/functions/intelligent-scan/index.ts`** - Core orchestration logic
3. **`supabase/functions/scrape-source/index.ts`** - Scraping & analysis
4. **`supabase/functions/shared/signal-analyzer.ts`** - NLP logic
5. **`src/pages/Scanner.tsx`** - Main UI entry point
6. **`src/integrations/supabase/types.ts`** - Database types

#### Key Concepts to Understand
- **Signal Detection:** Uses keyword taxonomy to identify SAAS implementations
- **Confidence Scoring:** Algorithm combines keyword frequency, vendor mentions, job roles
- **Scraping Strategy:** Firecrawl API for most cases, Python service for heavy anti-bot sites
- **AI Integration:** Lovable AI Gateway for company verification and report generation
- **RLS Policies:** All data access controlled by user_id foreign keys

---

### Testing Your Setup

#### 1. Frontend Test
- Navigate to `http://localhost:5173`
- Sign up with test email (auto-confirmed in dev)
- Complete onboarding flow
- Should land on dashboard

#### 2. Backend Test
```bash
# Test edge function locally
supabase functions serve intelligent-scan --env-file .env.local

# In another terminal, call the function
curl -X POST http://localhost:54321/functions/v1/intelligent-scan \
  -H "Authorization: Bearer <YOUR_JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"companyName": "Microsoft"}'
```

#### 3. Database Test
```bash
# Check user_preferences table
supabase db query "SELECT * FROM user_preferences LIMIT 5;"

# Check signals table
supabase db query "SELECT company_name, signal_type, confidence_score FROM signals ORDER BY detected_at DESC LIMIT 10;"
```

---

### Common Development Tasks

#### Add a New Edge Function
```bash
# Create function
supabase functions new my-function

# Edit supabase/functions/my-function/index.ts
# Add function to supabase/config.toml

[functions.my-function]
verify_jwt = true
```

#### Add a New Database Table
```bash
# Create migration
supabase migration new add_my_table

# Edit migration file in supabase/migrations/
# Apply migration
supabase db push
```

#### Regenerate TypeScript Types
```bash
# After database changes
supabase gen types typescript --local > src/integrations/supabase/types.ts
```

#### Deploy Edge Functions
```bash
# Deploy all functions
supabase functions deploy

# Deploy specific function
supabase functions deploy intelligent-scan
```

---

### Debugging Tips

#### Check Edge Function Logs
```bash
# Real-time logs
supabase functions logs intelligent-scan --follow

# Filter by error
supabase functions logs scrape-source --filter "error"
```

#### Inspect Database
```bash
# Start Supabase Studio (GUI)
supabase start
# Open http://localhost:54323
```

#### Frontend Debugging
- Open browser DevTools → Network tab
- Check `POST` requests to `/functions/v1/...`
- Verify `Authorization` header is present
- Check console for React errors

#### Common Errors & Fixes

| Error | Cause | Fix |
|-------|-------|-----|
| `JWT expired` | Token older than 1 hour | Re-login or refresh token |
| `Row violates row-level security policy` | Missing `user_id` or wrong user | Check RLS policies |
| `Firecrawl API limit exceeded` | Free tier exhausted | Upgrade Firecrawl plan |
| `Function timeout` | Scraping took > 30s | Optimize scraping strategy |
| `LOVABLE_API_KEY not found` | Secret not set | Add secret in Supabase dashboard |

---

### Next Steps After Onboarding

1. **Read codebase** (start with files listed above)
2. **Run test scan** (search for "Microsoft" or "SAP")
3. **Review open issues** (if using GitHub)
4. **Set up API keys** (Firecrawl, Lovable AI, Resend)
5. **Deploy to staging** (`supabase functions deploy` + publish frontend)
6. **Test production** (verify RLS policies work correctly)

---

## Appendix: Technology Decisions

### Why React + Vite?
- Fast HMR (Hot Module Replacement)
- Modern ESM-based build
- Better DX than Create React App

### Why Supabase?
- PostgreSQL with built-in RLS
- Serverless edge functions (Deno runtime)
- Authentication out-of-the-box
- Real-time subscriptions (future feature)

### Why Firecrawl over Puppeteer/Playwright?
- Managed service (no browser infrastructure)
- Better CAPTCHA handling
- Scales automatically

### Why Lovable AI Gateway over OpenAI SDK?
- Pre-configured in Lovable Cloud
- No API key management needed
- Supports multiple models (Gemini + GPT)
- Usage-based pricing tied to Lovable account

### Why Resend over SendGrid?
- Simpler API
- Better deliverability
- Modern developer experience

---

## Document Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-01-XX | AI Assistant | Initial TDD creation |

---

**End of Technical Design Document**
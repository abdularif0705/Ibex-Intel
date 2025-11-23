# Pattern Matching Strategy by Source Type

## Executive Summary

This document analyzes each source type in the SAAS Implementation Signal Detection Platform and recommends optimal pattern matching techniques based on source-specific characteristics, data structure, and extraction requirements.

**Key Principle**: Use the simplest, most maintainable approach that reliably extracts the required data. Avoid regex complexity where native string methods or specialized parsers suffice.

---

## Source Type Analysis & Recommendations

### 1. **LinkedIn** (`linkedin`)

**Data Characteristics:**
- Heavily JavaScript-rendered
- Job postings with structured HTML
- Rich text descriptions in consistent divs
- URL patterns: `/jobs/view/`, `/jobs/collections/`

**Current Implementation:** Regex-based URL extraction

**Recommended Approach:** **String Methods + DOM Parser**
```typescript
// URL Validation - Simple string methods
if (url.includes('/jobs/view/') || url.includes('/jobs/collections/')) {
  // Valid LinkedIn job URL
}

// Content Extraction - Use DOMParser for structured HTML
const parser = new DOMParser();
const doc = parser.parseFromString(html, 'text/html');
const jobTitle = doc.querySelector('.job-title')?.textContent?.trim();
const company = doc.querySelector('.company-name')?.textContent?.trim();
```

**Why:** LinkedIn HTML is semi-structured. String methods handle URL patterns efficiently, while DOM parsing extracts content reliably without fragile regex patterns.

---

### 2. **Indeed** (`indeed`)

**Data Characteristics:**
- URL patterns: `/viewjob?`, `/rc/clk?`
- Query parameter-based routing
- Job cards with consistent class structures

**Current Implementation:** Regex-based URL extraction

**Recommended Approach:** **URL API + String Methods**
```typescript
// URL Validation - Use URL API for parameter parsing
const urlObj = new URL(url);
if (urlObj.pathname.includes('/viewjob') || urlObj.pathname.includes('/rc/clk')) {
  const jobKey = urlObj.searchParams.get('jk'); // Extract job key parameter
}

// Content Extraction - Logical conditions + string methods
const isJobDescription = content.includes('Job details') && 
                         content.includes('Full Job Description');
if (isJobDescription) {
  const sections = content.split('\n\n').filter(s => s.length > 50);
}
```

**Why:** Indeed uses query parameters extensively. The URL API provides native parameter parsing without regex. String splitting and logical conditions handle content sections cleanly.

---

### 3. **Glassdoor** (`glassdoor`)

**Data Characteristics:**
- URL patterns: `/job-listing/`, `/partner/jobListing`
- Heavy JavaScript rendering
- JSON-LD structured data embedded

**Recommended Approach:** **JSON Parser + String Methods**
```typescript
// URL Validation - Simple substring checks
if (url.includes('/job-listing/') || url.includes('/partner/jobListing')) {
  // Valid Glassdoor URL
}

// Content Extraction - Parse embedded JSON-LD
const jsonLdMatch = html.match(/<script type="application\/ld\+json">(.*?)<\/script>/s);
if (jsonLdMatch) {
  const structuredData = JSON.parse(jsonLdMatch[1]);
  const jobPosting = structuredData['@type'] === 'JobPosting' ? structuredData : null;
  const title = jobPosting?.title;
  const description = jobPosting?.description;
}
```

**Why:** Glassdoor embeds JSON-LD structured data. Native JSON parsing is more reliable than regex for job metadata. Use minimal regex only to extract the JSON block.

---

### 4. **Greenhouse** (`greenhouse`)

**Data Characteristics:**
- Clean, REST-style URLs: `/jobs/{id}`
- Well-formed HTML with semantic markup
- Consistent DOM structure

**Recommended Approach:** **String Methods + DOM Parser**
```typescript
// URL Validation - String methods with pattern check
const pathParts = new URL(url).pathname.split('/');
const hasJobsInPath = pathParts.includes('jobs');
const hasJobId = pathParts.length > pathParts.indexOf('jobs') + 1;
if (hasJobsInPath && hasJobId && !url.includes('/embed/')) {
  // Valid Greenhouse job URL
}

// Content Extraction - DOM traversal
const jobContainer = doc.querySelector('.job-post');
const sections = Array.from(jobContainer.querySelectorAll('section'))
  .map(section => ({
    heading: section.querySelector('h3')?.textContent?.trim(),
    content: section.querySelector('p')?.textContent?.trim()
  }));
```

**Why:** Greenhouse has clean URL structures and semantic HTML. String methods and DOM traversal provide maintainable extraction without regex complexity.

---

### 5. **Ashby** (`ashby`)

**Data Characteristics:**
- UUID-based URLs: `/jobs/{uuid}`
- Modern React-based rendering
- API-driven content delivery

**Recommended Approach:** **String Methods + UUID Library**
```typescript
// URL Validation - UUID pattern check using built-in crypto
const uuidPattern = /[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/;
const match = url.match(uuidPattern);
if (match && url.includes('/jobs/')) {
  const jobId = match[0];
}

// Content Extraction - JSON API parsing (if accessible)
const apiResponse = await fetch(`${baseUrl}/api/jobs/${jobId}`);
const jobData = await apiResponse.json();
```

**Why:** Ashby uses UUIDs which have a well-defined format. A single focused regex for UUID extraction is acceptable. Prefer API calls for content if available.

---

### 6. **SEC EDGAR** (`sec_edgar`)

**Data Characteristics:**
- XML/XBRL documents
- Structured financial filings (10-K, 10-Q, 8-K)
- Consistent schema-based format

**Recommended Approach:** **XML Parser + Specialized SEC Library**
```typescript
import { DOMParser } from 'https://deno.land/x/deno_dom/deno-dom-wasm.ts';

// Parse SEC XML filings
const parser = new DOMParser();
const doc = parser.parseFromString(xmlContent, 'text/xml');

// Extract specific tags
const companyCik = doc.querySelector('CIK')?.textContent?.trim();
const filingType = doc.querySelector('TYPE')?.textContent?.trim();

// Search for transformation keywords in text sections
const textSection = doc.querySelector('TEXT')?.textContent || '';
const hasErpMention = textSection.includes('ERP implementation') || 
                      textSection.includes('enterprise resource planning');
```

**Why:** SEC documents are XML-based. Use native XML parsers instead of regex. String search methods work well for keyword detection in text blocks.

---

### 7. **Government Finance** (`gov_finance`)

**Data Characteristics:**
- Budget PDFs, procurement documents
- Structured tables (budget line items)
- Inconsistent formatting across municipalities

**Recommended Approach:** **PDF Parser + Table Extraction Libraries**
```typescript
// Use pdf-parse or similar library
import pdfParse from 'https://esm.sh/pdf-parse@1.1.1';

const pdfData = await pdfParse(pdfBuffer);
const text = pdfData.text;

// Extract budget line items using string methods
const lines = text.split('\n');
const budgetItems = lines.filter(line => {
  // Look for currency patterns
  return line.includes('$') && /\d{1,3}(,\d{3})*/.test(line);
}).map(line => {
  const parts = line.split(/\s{2,}/); // Split on multiple spaces
  return {
    description: parts[0]?.trim(),
    amount: parts[1]?.replace(/[^0-9.]/g, '')
  };
});

// Search for technology keywords
const hasTechSpending = text.toLowerCase().includes('software') || 
                        text.toLowerCase().includes('information technology');
```

**Why:** PDFs require specialized parsers. String splitting on whitespace handles tabular data better than regex. Logical conditions identify relevant budget items.

---

### 8. **News Sites** (`news_site`, `prnewswire`)

**Data Characteristics:**
- Article-based content
- Bylines, dates, body text
- RSS/Atom feeds often available

**Recommended Approach:** **RSS Parser + DOM Parser**
```typescript
// For RSS feeds - use XML parser
const parser = new DOMParser();
const rssDoc = parser.parseFromString(rssFeed, 'text/xml');
const items = Array.from(rssDoc.querySelectorAll('item')).map(item => ({
  title: item.querySelector('title')?.textContent,
  link: item.querySelector('link')?.textContent,
  description: item.querySelector('description')?.textContent,
  pubDate: new Date(item.querySelector('pubDate')?.textContent || '')
}));

// For HTML articles - DOM parsing
const article = doc.querySelector('article');
const headline = article?.querySelector('h1')?.textContent?.trim();
const bodyParagraphs = Array.from(article?.querySelectorAll('p') || [])
  .map(p => p.textContent?.trim())
  .filter(text => text && text.length > 50);

// Keyword detection - simple string methods
const hasImplementationSignal = bodyParagraphs.some(para => 
  para.toLowerCase().includes('implementation') && 
  (para.includes('SAP') || para.includes('Workday') || para.includes('Oracle'))
);
```

**Why:** News sites often provide RSS feeds with structured data. Use XML parsers for feeds and DOM parsers for articles. String methods suffice for keyword matching.

---

### 9. **Company Websites** (`company_website`)

**Data Characteristics:**
- Careers/jobs pages with varied structures
- About/investor pages
- Press release sections

**Recommended Approach:** **DOM Parser + Heuristic-Based Extraction**
```typescript
// Careers page detection - URL and content heuristics
const isCareersPage = url.includes('/career') || 
                      url.includes('/jobs') || 
                      doc.querySelector('h1')?.textContent?.toLowerCase().includes('career');

// Job listing extraction - flexible DOM traversal
const jobListings = Array.from(doc.querySelectorAll('a')).filter(link => {
  const href = link.getAttribute('href') || '';
  const text = link.textContent?.toLowerCase() || '';
  return (href.includes('/job') || href.includes('/position')) && 
         text.length > 10 && 
         text.length < 200;
});

// Press release detection
const isPressRelease = doc.querySelector('meta[property="og:type"]')?.getAttribute('content') === 'article' &&
                       (doc.title.includes('Press Release') || 
                        doc.querySelector('.press-release') !== null);
```

**Why:** Company websites vary widely. DOM traversal with heuristic checks (URL patterns + content signals) provides flexibility. Avoid rigid regex patterns that break with site redesigns.

---

### 10. **Employee Profile Sites** (`levels_fyi`, `teamblind`, `fishbowl`)

**Data Characteristics:**
- User-generated content
- Comment threads, salary data
- Discussion forums

**Recommended Approach:** **String Methods + Sentiment Analysis**
```typescript
// Profile data extraction - string parsing
const lines = content.split('\n');
const profileData = lines.reduce((acc, line) => {
  if (line.startsWith('Title:')) {
    acc.title = line.replace('Title:', '').trim();
  } else if (line.startsWith('Company:')) {
    acc.company = line.replace('Company:', '').trim();
  } else if (line.includes('years of experience')) {
    const yearsMatch = line.match(/(\d+)\s*years/);
    acc.experience = yearsMatch ? parseInt(yearsMatch[1]) : null;
  }
  return acc;
}, {});

// Signal detection - keyword co-occurrence
const hasImplementationSignal = (content.includes('implementation') || 
                                 content.includes('migration') || 
                                 content.includes('rollout')) &&
                                (content.includes('consultant') || 
                                 content.includes('contractor') || 
                                 content.includes('project manager'));

// Sentiment indicators
const hasNegativeSignal = content.includes('failed') || 
                          content.includes('delayed') || 
                          content.includes('over budget');
```

**Why:** Forum content is unstructured. String methods handle line-by-line parsing. Logical conditions (keyword co-occurrence) detect signals better than complex regex.

---

### 11. **Recruiting/Staffing Sites** (`recruiting_site`, `teksystems`, `toptal`, `adecco_group`)

**Data Characteristics:**
- Contract/temporary role listings
- Structured job requirements
- Skills lists, duration, rate information

**Recommended Approach:** **String Methods + Structured Extraction**
```typescript
// Contract metadata extraction
const extractContractDetails = (text: string) => {
  const details: any = {};
  
  // Duration - string matching with variations
  if (text.includes('12 month') || text.includes('12-month')) {
    details.duration = '12 months';
  } else if (text.includes('6 month')) {
    details.duration = '6 months';
  }
  
  // Rate - currency detection
  const rateMatch = text.match(/\$(\d{1,3}(,\d{3})*(\.\d{2})?)\s*(\/hr|per hour)/);
  if (rateMatch) {
    details.rate = parseFloat(rateMatch[1].replace(',', ''));
  }
  
  // Required skills - list extraction
  const skillsSection = text.split('Required Skills:')[1]?.split('Responsibilities:')[0];
  if (skillsSection) {
    details.skills = skillsSection.split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0 && line.length < 100);
  }
  
  return details;
};

// Implementation role detection - vocabulary check
const implementationVocab = ['implementation', 'deployment', 'cutover', 'go-live', 'UAT'];
const roleVocab = ['consultant', 'architect', 'project manager', 'technical lead'];
const isImplementationRole = implementationVocab.some(term => text.toLowerCase().includes(term)) &&
                             roleVocab.some(role => text.toLowerCase().includes(role));
```

**Why:** Staffing sites have semi-structured job descriptions. String splitting and simple regex for numeric patterns (rates, dates) work well. Vocabulary-based detection is more maintainable than complex patterns.

---

### 12. **Social Media** (`twitter`, `reddit`, `hackernews`)

**Data Characteristics:**
- Short-form text (Twitter)
- Threaded discussions (Reddit, HN)
- JSON APIs available

**Recommended Approach:** **JSON API Parser + String Methods**
```typescript
// Twitter/X API response parsing
const tweet = {
  id: apiResponse.data.id,
  text: apiResponse.data.text,
  author: apiResponse.includes.users[0].username,
  created_at: new Date(apiResponse.data.created_at)
};

// Signal detection - keyword density
const detectSignal = (text: string) => {
  const lowerText = text.toLowerCase();
  const signalKeywords = ['sap', 'workday', 'oracle', 'salesforce', 'implementation', 'cutover'];
  const matchCount = signalKeywords.filter(kw => lowerText.includes(kw)).length;
  return matchCount >= 2; // At least 2 keywords
};

// Reddit thread parsing
const comments = apiResponse.data.children
  .filter(child => child.kind === 't1') // Comments only
  .map(child => ({
    author: child.data.author,
    body: child.data.body,
    score: child.data.score
  }))
  .filter(comment => comment.score > 5); // Filter low-quality comments
```

**Why:** Social platforms provide JSON APIs. Native JSON parsing is faster and more reliable than scraping HTML. String methods handle keyword detection in short text efficiently.

---

## Implementation Strategy Summary

### By Technique Priority

| Technique | Use Cases | Sources |
|-----------|-----------|---------|
| **String Methods** | URL validation, simple keyword matching, line splitting | All sources (primary) |
| **JSON Parser** | API responses, structured data, social media | Twitter, Reddit, HN, Ashby |
| **DOM Parser** | HTML content extraction, job listings | LinkedIn, Indeed, Greenhouse, Company websites |
| **XML Parser** | RSS feeds, SEC filings, structured documents | SEC EDGAR, News sites |
| **PDF Parser** | Government budgets, financial reports | gov_finance |
| **URL API** | Query parameter extraction, path parsing | Indeed, job boards |
| **Minimal Regex** | UUID patterns, numeric extraction (rates, dates) | Ashby (UUID only), Staffing sites (rates) |

### Pattern Matching Decision Tree

```
Is the data structured (JSON/XML)?
├─ YES → Use native JSON/XML parser
└─ NO  → Is it HTML with semantic markup?
         ├─ YES → Use DOM parser + string methods
         └─ NO  → Is it plain text with sections?
                  ├─ YES → Use string split/slice methods
                  └─ NO  → Use logical conditions + keyword checks
```

---

## Refactoring Recommendations

### 1. **Eliminate Regex from `url-extractor.ts`**

**Current:**
```typescript
function isJobPostingUrl(url: string, sourceType: string): boolean {
  const urlLower = url.toLowerCase();
  switch (sourceType) {
    case 'linkedin':
      return urlLower.includes('/jobs/view/') || urlLower.includes('/jobs/collections/');
    // ... more cases
  }
}
```

**Improved:**
```typescript
interface UrlPattern {
  pathIncludes?: string[];
  pathMatches?: (path: string) => boolean;
  excludePatterns?: string[];
}

const JOB_URL_PATTERNS: Record<string, UrlPattern> = {
  linkedin: {
    pathIncludes: ['/jobs/view/', '/jobs/collections/'],
  },
  indeed: {
    pathIncludes: ['/viewjob', '/rc/clk'],
  },
  greenhouse: {
    pathMatches: (path) => {
      const parts = path.split('/');
      return parts.includes('jobs') && parts.length > parts.indexOf('jobs') + 1;
    },
    excludePatterns: ['/embed/'],
  },
  ashby: {
    pathIncludes: ['/jobs/'],
    pathMatches: (path) => /[a-f0-9-]{36}/.test(path), // UUID only
  },
};

function isJobPostingUrl(url: string, sourceType: string): boolean {
  const pattern = JOB_URL_PATTERNS[sourceType];
  if (!pattern) return false;
  
  const urlLower = url.toLowerCase();
  
  // Check exclusions first
  if (pattern.excludePatterns?.some(ex => urlLower.includes(ex))) {
    return false;
  }
  
  // Check path inclusions
  if (pattern.pathIncludes?.some(inc => urlLower.includes(inc))) {
    return true;
  }
  
  // Check custom matcher
  if (pattern.pathMatches) {
    const urlObj = new URL(url);
    return pattern.pathMatches(urlObj.pathname);
  }
  
  return false;
}
```

**Benefits:**
- Declarative configuration
- Easier to maintain and test
- Only one focused regex (UUID pattern)
- String methods for all other checks

---

### 2. **Create Source-Specific Extractors**

**Structure:**
```typescript
// extractors/base.ts
export interface ContentExtractor {
  extractUrls(content: string, baseUrl: string): string[];
  extractMetadata(content: string): Record<string, any>;
  detectSignals(content: string): boolean;
}

// extractors/linkedin.ts
export class LinkedInExtractor implements ContentExtractor {
  extractUrls(content: string, baseUrl: string): string[] {
    const parser = new DOMParser();
    const doc = parser.parseFromString(content, 'text/html');
    return Array.from(doc.querySelectorAll('a'))
      .map(a => a.href)
      .filter(href => href.includes('/jobs/view/'));
  }
  
  extractMetadata(content: string): Record<string, any> {
    const doc = parser.parseFromString(content, 'text/html');
    return {
      title: doc.querySelector('.job-title')?.textContent?.trim(),
      company: doc.querySelector('.company-name')?.textContent?.trim(),
      location: doc.querySelector('.location')?.textContent?.trim(),
    };
  }
  
  detectSignals(content: string): boolean {
    const signalKeywords = ['implementation', 'consultant', 'SAP', 'Workday'];
    return signalKeywords.filter(kw => content.includes(kw)).length >= 2;
  }
}

// extractors/index.ts
export const EXTRACTORS: Record<string, ContentExtractor> = {
  linkedin: new LinkedInExtractor(),
  indeed: new IndeedExtractor(),
  // ... more
};
```

**Benefits:**
- Source-specific logic encapsulated
- Easy to add new sources
- Testable in isolation
- No monolithic regex functions

---

### 3. **Implement Fallback Chain**

```typescript
async function scrapeWithFallback(url: string, sourceType: string): Promise<ScrapedContent> {
  const strategies = [
    { name: 'api', fn: () => scrapeViaApi(url, sourceType) },
    { name: 'firecrawl', fn: () => scrapeWithFirecrawl(url) },
    { name: 'python', fn: () => scrapeWithPython(url) },
    { name: 'fetch', fn: () => scrapeWithFetch(url) },
  ];
  
  for (const strategy of strategies) {
    try {
      console.log(`Attempting ${strategy.name} for ${url}`);
      const result = await strategy.fn();
      if (result.success && result.content.length > 100) {
        console.log(`Success with ${strategy.name}`);
        return result;
      }
    } catch (error) {
      console.warn(`${strategy.name} failed:`, error.message);
      continue; // Try next strategy
    }
  }
  
  throw new Error('All scraping strategies failed');
}
```

**Benefits:**
- Automatic failover
- Prioritize cheapest/fastest methods first
- Centralized retry logic

---

## Testing Strategy

### Unit Tests by Pattern Type

```typescript
// tests/string-methods.test.ts
describe('String-based URL validation', () => {
  test('LinkedIn job URL detection', () => {
    expect(isJobPostingUrl('https://linkedin.com/jobs/view/123', 'linkedin')).toBe(true);
    expect(isJobPostingUrl('https://linkedin.com/feed', 'linkedin')).toBe(false);
  });
});

// tests/dom-parser.test.ts
describe('DOM-based content extraction', () => {
  test('Extract job metadata from Greenhouse', () => {
    const html = '<div class="job-post"><h1>Senior Engineer</h1></div>';
    const extractor = EXTRACTORS['greenhouse'];
    const metadata = extractor.extractMetadata(html);
    expect(metadata.title).toBe('Senior Engineer');
  });
});

// tests/json-parser.test.ts
describe('JSON API parsing', () => {
  test('Parse Twitter API response', () => {
    const apiResponse = { data: { id: '123', text: 'SAP implementation starting' } };
    const extractor = EXTRACTORS['twitter'];
    expect(extractor.detectSignals(apiResponse.data.text)).toBe(true);
  });
});
```

---

## Performance Comparison

| Method | Complexity | Speed | Maintainability | Error Handling |
|--------|-----------|-------|-----------------|----------------|
| **Regex** | High | Fast | Low | Poor |
| **String Methods** | Low | Very Fast | High | Excellent |
| **DOM Parser** | Medium | Fast | High | Good |
| **JSON Parser** | Low | Very Fast | Excellent | Excellent |
| **XML Parser** | Medium | Fast | Good | Good |

---

## Migration Plan

### Phase 1: URL Validation (Week 1)
- Replace all URL regex with string methods
- Implement `JOB_URL_PATTERNS` configuration
- Keep UUID regex for Ashby only
- Test across all source types

### Phase 2: Content Extraction (Week 2-3)
- Build source-specific extractors
- Migrate DOM-based sources first (LinkedIn, Greenhouse)
- Migrate JSON-based sources (Twitter, Reddit)
- Maintain backward compatibility

### Phase 3: Signal Detection (Week 4)
- Replace complex regex patterns in `signal-analyzer.ts`
- Use keyword co-occurrence logic
- Implement TF-IDF for weighted keyword matching
- A/B test with existing regex approach

### Phase 4: Optimization (Week 5)
- Add caching for parsed content
- Implement parallel extraction
- Monitor performance metrics
- Remove deprecated regex functions

---

## Conclusion

**Key Takeaways:**
1. **Default to string methods** for URL validation and simple checks
2. **Use native parsers** (JSON, XML, DOM) for structured data
3. **Reserve regex for narrow cases** (UUIDs, numeric patterns only)
4. **Encapsulate source logic** in dedicated extractor classes
5. **Test extraction independently** from scraping logic

This approach reduces technical debt, improves maintainability, and provides clearer debugging paths when sources change their structure.

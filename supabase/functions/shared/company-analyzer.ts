/**
 * Company Analyzer - Detects company type and characteristics to route to relevant sources
 */

export interface CompanyProfile {
  name: string;
  ticker?: string;
  type: 'public_company' | 'private_company' | 'municipality' | 'startup' | 'unknown';
  industry?: string;
  characteristics: {
    isPublic: boolean;
    isTech: boolean;
    isMunicipality: boolean;
    isEnterprise: boolean;
    isStaffingFirm: boolean;
  };
  suggestedSources: string[];
  searchTerms: string[];
}

/**
 * Analyze company name and return profile with source routing recommendations
 */
export async function analyzeCompany(companyName: string, ticker?: string): Promise<CompanyProfile> {
  const name = companyName.trim();
  const nameLower = name.toLowerCase();
  
  // Detect municipality patterns
  const isMunicipality = /\b(city|county|state|municipality|government|township|borough|district)\b/i.test(name) ||
    /\b(dept|department)\s+of\b/i.test(name);
  
  // Detect tech companies (basic pattern matching - can be enhanced)
  const isTech = /\b(software|tech|cloud|saas|digital|ai|data|cyber|systems)\b/i.test(name);
  
  // Detect staffing firms
  const isStaffingFirm = /\b(staffing|recruiting|talent|workforce|group|solutions|consulting)\b/i.test(name) &&
    /\b(teksystems|adecco|robert half|toptal|manpower|randstad)\b/i.test(nameLower);
  
  // Public company indicators (enhanced detection would use SEC API)
  const publicIndicators = [
    'inc.', 'incorporated', 'corp.', 'corporation', 'plc', 'ltd',
    'oracle', 'salesforce', 'microsoft', 'apple', 'google', 'amazon', 
    'workday', 'sap', 'servicenow', 'adobe'
  ];
  const isLikelyPublic = publicIndicators.some(indicator => nameLower.includes(indicator));
  
  // Enterprise size indicators
  const isEnterprise = isLikelyPublic || 
    /\b(global|international|worldwide|enterprise)\b/i.test(name) ||
    nameLower.length > 30;
  
  // Determine company type
  let type: CompanyProfile['type'] = 'unknown';
  if (isMunicipality) {
    type = 'municipality';
  } else if (isLikelyPublic) {
    type = 'public_company';
  } else if (/\b(startup|emerging|new)\b/i.test(name)) {
    type = 'startup';
  } else {
    type = 'private_company';
  }
  
  const characteristics = {
    isPublic: isLikelyPublic,
    isTech,
    isMunicipality,
    isEnterprise,
    isStaffingFirm
  };
  
  // Route to relevant sources based on characteristics
  const suggestedSources = routeToSources(characteristics);
  
  // Generate search terms for better scraping
  const searchTerms = generateSearchTerms(name, characteristics);
  
  return {
    name,
    ticker,
    type,
    characteristics,
    suggestedSources,
    searchTerms
  };
}

/**
 * Route company characteristics to relevant source bundles
 */
function routeToSources(characteristics: CompanyProfile['characteristics']): string[] {
  const sources: string[] = [];
  
  // Core sources for everyone
  sources.push('linkedin', 'company_website', 'google');
  
  // Public companies
  if (characteristics.isPublic) {
    sources.push('sec_edgar', 'news_site', 'prnewswire');
  }
  
  // Tech companies
  if (characteristics.isTech) {
    sources.push('hackernews', 'teamblind', 'levels_fyi');
  }
  
  // Municipalities
  if (characteristics.isMunicipality) {
    sources.push('news_site', 'blog', 'local_newspaper');
    // Skip job boards for municipalities as they rarely post implementation roles there
  } else {
    // For companies, include job boards
    sources.push('indeed', 'glassdoor', 'greenhouse', 'ashby');
  }
  
  // Enterprise companies - include staffing firms
  if (characteristics.isEnterprise) {
    sources.push('teksystems', 'toptal', 'adecco_group', 'headhunter');
  }
  
  // All non-municipal entities
  if (!characteristics.isMunicipality) {
    sources.push('recruiting_site');
  }
  
  // Tech-related social
  if (characteristics.isTech) {
    sources.push('reddit', 'twitter');
  }
  
  return [...new Set(sources)]; // Remove duplicates
}

/**
 * Generate search terms for better scraping accuracy
 */
function generateSearchTerms(name: string, characteristics: CompanyProfile['characteristics']): string[] {
  const terms: string[] = [name];
  
  // Add common transformations keywords
  const transformationKeywords = [
    'implementation', 'transformation', 'erp', 'crm', 'migration',
    'workday', 'salesforce', 'sap', 'oracle', 'netsuite'
  ];
  
  // Add role-based search terms
  const roleKeywords = [
    'implementation consultant', 'solution architect', 'project manager',
    'business analyst', 'technical architect'
  ];
  
  // Combine company name with key transformation terms
  terms.push(`${name} implementation`, `${name} transformation`);
  
  if (characteristics.isPublic) {
    terms.push(`${name} 10-K`, `${name} earnings`);
  }
  
  if (characteristics.isTech) {
    terms.push(`${name} engineer`, `${name} platform`);
  }
  
  return terms;
}

/**
 * Build URLs for each source type based on company name
 */
export function buildSourceUrl(companyName: string, sourceType: string): string {
  const encodedName = encodeURIComponent(companyName);
  
  switch(sourceType) {
    case 'google':
      return `https://www.google.com/search?q="${encodedName}"+job+%28erp+or+hcm+or+plm+or+crm%29`;

    case 'linkedin':
      return `https://www.linkedin.com/jobs/search?keywords=${encodedName}%20AND%20%28%20ERP%20OR%20HRM%20OR%20CRM%20OR%20PLM%20%29%20&pageNum=0`;
    
    case 'indeed':
      return `https://www.indeed.com/jobs?q=${encodedName}+erp+crm+plm+hcm`;
    
    case 'glassdoor':
      return `https://www.glassdoor.com/Job/jobs.htm?sc.keyword=${encodedName}`;
    
    case 'greenhouse':
      // Try to find greenhouse jobs page - most companies use subdomain pattern
      const companySlug = companyName.toLowerCase().replace(/[^a-z0-9]/g, '');
      return `https://boards.greenhouse.io/${companySlug}`;
    
    case 'ashby':
      const ashbySlug = companyName.toLowerCase().replace(/[^a-z0-9]/g, '');
      return `https://jobs.ashbyhq.com/${ashbySlug}`;
    
    case 'company_website':
      // Try common career page patterns
      const domain = companyName.toLowerCase().replace(/[^a-z0-9]/g, '');
      return `https://www.${domain}.com/careers`;
    
    case 'news_site':
      // Use Google News search
      return `https://news.google.com/search?q=${encodedName}%20implementation`;
    
    case 'prnewswire':
      return `https://www.prnewswire.com/search/?keyword=${encodedName}`;
    
    case 'sec_edgar':
      // SEC Edgar company search
      return `https://www.sec.gov/cgi-bin/browse-edgar?company=${encodedName}&action=getcompany`;
    
    case 'blog':
      // Use Google search for blog posts
      return `https://www.google.com/search?q=${encodedName}%20implementation%20blog`;
    
    case 'local_newspaper':
      // Search for local news about the municipality
      return `https://news.google.com/search?q=${encodedName}%20technology%20implementation`;
    
    case 'reddit':
      return `https://www.reddit.com/search/?q=${encodedName}%20implementation`;
    
    case 'twitter':
      return `https://twitter.com/search?q=${encodedName}%20implementation`;
    
    case 'hackernews':
      return `https://hn.algolia.com/?query=${encodedName}`;
    
    case 'teamblind':
      return `https://www.teamblind.com/search/${encodedName}`;
    
    case 'levels_fyi':
      return `https://www.levels.fyi/companies/${encodedName}/jobs`;
    
    case 'teksystems':
      return `https://www.teksystems.com/en/job-search?k=${encodedName}`;
    
    case 'toptal':
      return `https://www.toptal.com/jobs?skill=${encodedName}`;
    
    case 'adecco_group':
      return `https://jobs.adeccogroup.com/search-jobs/${encodedName}`;
    
    case 'headhunter':
      return `https://www.google.com/search?q=${encodedName}%20consultant%20staffing`;
    
    case 'recruiting_site':
      return `https://www.google.com/search?q=${encodedName}%20careers%20jobs`;
    
    default:
      // Fallback to company website
      return `https://www.${companyName.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`;
  }
}

/**
 * Calculate confidence threshold for progressive scanning
 */
export function calculateConfidenceThreshold(phase: number): number {
  // Phase 1 (high-signal sources): Continue if < 80%
  // Phase 2 (secondary sources): Continue if < 90%
  // Phase 3 (low-yield sources): Always scan remaining
  
  switch(phase) {
    case 1: return 0.80;
    case 2: return 0.90;
    default: return 1.0;
  }
}

/**
 * Organize sources into phases for progressive scanning
 */
export function organizeScanPhases(sources: string[]): string[][] {
  const phase1: string[] = []; // High-signal
  const phase2: string[] = []; // Secondary
  const phase3: string[] = []; // Low-yield
  
  const highSignalSources = ['linkedin', 'google', 'company_website', 'sec_edgar', 'greenhouse', 'ashby'];
  const secondarySources = ['indeed', 'glassdoor', 'news_site', 'prnewswire', 'teksystems', 'toptal', 'adecco_group'];
  
  sources.forEach(source => {
    if (highSignalSources.includes(source)) {
      phase1.push(source);
    } else if (secondarySources.includes(source)) {
      phase2.push(source);
    } else {
      phase3.push(source);
    }
  });
  
  return [phase1, phase2, phase3].filter(phase => phase.length > 0);
}

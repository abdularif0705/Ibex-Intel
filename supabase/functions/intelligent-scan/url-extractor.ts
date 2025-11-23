/**
 * Extract job posting URLs from scraped content
 */

export function extractJobUrls(content: string, baseUrl: string, sourceType: string): string[] {
  const urls: string[] = [];
  
  try {
    const urlObj = new URL(baseUrl);
    const domain = urlObj.hostname;
    
    // Extract all URLs from markdown links and HTML
    const markdownLinkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    const htmlLinkRegex = /href=["']([^"']+)["']/g;
    
    let match;
    const foundUrls = new Set<string>();
    
    // Extract from markdown links
    while ((match = markdownLinkRegex.exec(content)) !== null) {
      foundUrls.add(match[2]);
    }
    
    // Extract from HTML links
    while ((match = htmlLinkRegex.exec(content)) !== null) {
      foundUrls.add(match[1]);
    }
    
    // Filter based on source type patterns
    for (const url of foundUrls) {
      let fullUrl = url;
      
      // Convert relative URLs to absolute
      if (url.startsWith('/')) {
        fullUrl = `${urlObj.protocol}//${domain}${url}`;
      } else if (!url.startsWith('http')) {
        continue; // Skip invalid URLs
      }
      
      // Source-specific filtering
      if (isJobPostingUrl(fullUrl, sourceType)) {
        urls.push(fullUrl);
      }
    }
    
    // Deduplicate
    return [...new Set(urls)];
    
  } catch (error) {
    console.error('Error extracting job URLs:', error);
    return [];
  }
}

/**
 * Check if URL matches job posting patterns for the source type
 */
function isJobPostingUrl(url: string, sourceType: string): boolean {
  const urlLower = url.toLowerCase();
  
  switch (sourceType) {
    case 'google': return true;

    case 'linkedin':
      return urlLower.includes('/jobs/view/') || 
             urlLower.includes('/jobs/collections/');
    
    case 'indeed':
      return urlLower.includes('/viewjob?') || 
             urlLower.includes('/rc/clk?');
    
    case 'glassdoor':
      return urlLower.includes('/job-listing/') ||
             urlLower.includes('/partner/jobListing');
    
    case 'greenhouse':
      return urlLower.includes('/jobs/') && 
             !urlLower.endsWith('/jobs') &&
             !urlLower.includes('/embed/');
    
    case 'ashby':
      return urlLower.includes('/jobs/') &&
             !!urlLower.match(/\/jobs\/[a-f0-9-]{36}/); // UUID pattern
    
    case 'recruiting_site':
      // Common ATS patterns
      return urlLower.includes('/job/') ||
             urlLower.includes('/careers/job/') ||
             urlLower.includes('/position/') ||
             urlLower.includes('/opening/') ||
             !!urlLower.match(/\/jobs\/[0-9]+/);
    
    case 'company_website':
      return (urlLower.includes('/career') || urlLower.includes('/job')) &&
             (urlLower.includes('/opening/') || 
              urlLower.includes('/position/') ||
              !!urlLower.match(/\/jobs?\/[0-9a-z-]+/));
    
    default:
      // Generic job posting patterns
      return urlLower.includes('/job') && 
             !urlLower.includes('/jobs?') &&
             !urlLower.includes('/jobs/search');
  }
}

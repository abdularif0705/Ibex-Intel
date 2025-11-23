/**
 * Official vendor news and customer success sites for cross-referencing transformation completions
 * Used to validate "In Progress" classifications and reduce false positives
 */

export interface VendorSource {
  vendor: string;
  newsUrls: string[];
  customerStoryUrls: string[];
  searchPattern?: string;
  keywords: string[];
}

export const VENDOR_VALIDATION_SOURCES: VendorSource[] = [
  {
    vendor: "SAP",
    newsUrls: [
      "https://news.sap.com/"
    ],
    customerStoryUrls: [
      "https://www.sap.com/about/customer-stories.html"
    ],
    searchPattern: "site:news.sap.com OR site:sap.com/customer-stories",
    keywords: ["S/4HANA", "SAP ERP", "SAP implementation", "go-live", "migration complete"]
  },
  {
    vendor: "Oracle",
    newsUrls: [
      "https://www.oracle.com/news/"
    ],
    customerStoryUrls: [
      "https://blogs.oracle.com/cx/category/cx-customer-success-stories",
      "https://www.oracle.com/customers/"
    ],
    searchPattern: "site:oracle.com/news OR site:blogs.oracle.com/cx",
    keywords: ["Oracle Cloud", "Oracle ERP", "Fusion", "implementation", "go-live", "deployment"]
  },
  {
    vendor: "Workday",
    newsUrls: [
      "https://newsroom.workday.com/",
      "https://www.workday.com/en-us/company/newsroom.html"
    ],
    customerStoryUrls: [
      "https://www.workday.com/en-us/customer-stories.html"
    ],
    searchPattern: "site:newsroom.workday.com OR site:workday.com/customer-stories",
    keywords: ["Workday implementation", "Workday HCM", "Workday Financial", "go-live", "deployment complete"]
  },
  {
    vendor: "Salesforce",
    newsUrls: [
      "https://www.salesforce.com/news/"
    ],
    customerStoryUrls: [
      "https://www.salesforce.com/customer-stories/",
      "https://www.salesforce.com/customer-success-stories/"
    ],
    searchPattern: "site:salesforce.com/news OR site:salesforce.com/customer-stories",
    keywords: ["Salesforce CRM", "Service Cloud", "Sales Cloud", "implementation", "go-live", "deployment"]
  },
  {
    vendor: "Microsoft Dynamics",
    newsUrls: [
      "https://cloudblogs.microsoft.com/dynamics365/"
    ],
    customerStoryUrls: [
      "https://www.microsoft.com/en-us/dynamics-365/blog/content-type/customer-stories/",
      "https://www.microsoft.com/en-us/customers"
    ],
    searchPattern: "site:microsoft.com/dynamics-365 OR site:microsoft.com/customers",
    keywords: ["Dynamics 365", "Microsoft ERP", "Business Central", "implementation", "go-live", "deployment"]
  },
  {
    vendor: "ServiceNow",
    newsUrls: [
      "https://www.servicenow.com/company/media/press-room.html"
    ],
    customerStoryUrls: [
      "https://www.servicenow.com/customers.html"
    ],
    searchPattern: "site:servicenow.com/press-room OR site:servicenow.com/customers",
    keywords: ["ServiceNow implementation", "ITSM", "workflow automation", "go-live", "deployment"]
  },
  {
    vendor: "NetSuite",
    newsUrls: [
      "https://www.netsuite.com/portal/company/pressreleases.shtml"
    ],
    customerStoryUrls: [
      "https://www.netsuite.com/portal/customer-success-stories.shtml"
    ],
    searchPattern: "site:netsuite.com",
    keywords: ["NetSuite ERP", "Oracle NetSuite", "implementation", "go-live", "cloud ERP"]
  }
];

/**
 * Get all vendor sources for a specific vendor
 */
export function getVendorSources(vendorName: string): VendorSource | undefined {
  return VENDOR_VALIDATION_SOURCES.find(
    source => source.vendor.toLowerCase() === vendorName.toLowerCase()
  );
}

/**
 * Get search query for validating a company's transformation status
 */
export function buildValidationSearchQuery(companyName: string, vendorName: string): string {
  const vendor = getVendorSources(vendorName);
  if (!vendor) return "";
  
  return `"${companyName}" ${vendor.searchPattern} (${vendor.keywords.slice(0, 3).join(" OR ")})`;
}

/**
 * Get all vendor URLs for web scraping validation
 */
export function getAllVendorUrls(): string[] {
  return VENDOR_VALIDATION_SOURCES.flatMap(source => [
    ...source.newsUrls,
    ...source.customerStoryUrls
  ]);
}

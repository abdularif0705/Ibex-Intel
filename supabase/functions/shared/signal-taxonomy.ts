/**
 * Comprehensive Enterprise Implementation Detection Taxonomy
 * Based on academic research framework for SAAS transformation signal detection
 */

// ============= PHASE-BASED KEYWORDS (Tier 1: Maximum Confidence) =============
export const PHASE_KEYWORDS = {
  deployment: {
    weight: 10,
    keywords: [
      'cutover', 'go-live', 'go live', 'golive', 'production launch', 'production environment',
      'transition to support', 'transition to operations', 'launch', 'deployment', 
      'production deployment', 'final deployment', 'system go-live', 'production cutover'
    ]
  },
  lateStage: {
    weight: 8,
    keywords: [
      'mock cutover', 'dress rehearsal', 'uat', 'user acceptance testing', 
      'system integration testing', 'final testing', 'pre-production',
      'pilot launch', 'pilot deployment', 'production readiness', 'readiness assessment'
    ]
  },
  execution: {
    weight: 7,
    keywords: [
      'implementation', 'implementing', 'erp implementation', 'system implementation',
      'configuration', 'customization', 'development phase', 'build phase',
      'data migration', 'system configuration', 'integration testing', 'functional testing'
    ]
  },
  planning: {
    weight: 4,
    keywords: [
      'blueprinting', 'design phase', 'requirements gathering', 'discovery phase',
      'fit-gap analysis', 'solution design', 'architecture design'
    ]
  },
  evaluation: {
    weight: 2,
    keywords: [
      'rfp', 'request for proposal', 'vendor evaluation', 'vendor selection',
      'demo', 'proof of concept', 'poc', 'vendor demonstration'
    ]
  }
};

// ============= JOB ROLE HIERARCHY (Positional Scoring) =============
export interface RolePattern {
  pattern: RegExp;
  tier: 'executive' | 'principal' | 'delivery' | 'technical';
  multiplier: number;
  description: string;
}

export const JOB_ROLE_HIERARCHY: RolePattern[] = [
  // Tier 1: Executive / Strategy (x2.5-3.0)
  { pattern: /\b(?:cto|chief technology officer)\b/i, tier: 'executive', multiplier: 3.0, description: 'Chief Technology Officer' },
  { pattern: /\b(?:cio|chief information officer)\b/i, tier: 'executive', multiplier: 3.0, description: 'Chief Information Officer' },
  { pattern: /\b(?:cdo|chief digital officer)\b/i, tier: 'executive', multiplier: 3.0, description: 'Chief Digital Officer' },
  { pattern: /\bchief transformation officer\b/i, tier: 'executive', multiplier: 3.0, description: 'Chief Transformation Officer' },
  { pattern: /\bhead of transformation\b/i, tier: 'executive', multiplier: 2.8, description: 'Head of Transformation' },
  { pattern: /\b(?:vp|vice president).*(?:digital transformation|it transformation|technology)\b/i, tier: 'executive', multiplier: 2.8, description: 'VP of Transformation' },
  { pattern: /\bsteering committee.*(?:lead|chair|member)\b/i, tier: 'executive', multiplier: 2.5, description: 'Steering Committee' },
  { pattern: /\btransformation.*director\b/i, tier: 'executive', multiplier: 2.5, description: 'Transformation Director' },
  { pattern: /\bhead of.*(?:digital|technology|it modernization)\b/i, tier: 'executive', multiplier: 2.5, description: 'Head of Digital/Technology' },
  
  // Tier 1.5: Principal / Architect (x2.5-3.0)
  { pattern: /\bprincipal.*(?:implementation consultant|consultant)\b/i, tier: 'principal', multiplier: 3.0, description: 'Principal Implementation Consultant' },
  { pattern: /\b(?:solution architect|solutions architect|technical architect)\b/i, tier: 'principal', multiplier: 3.0, description: 'Solution Architect' },
  { pattern: /\b(?:sap|workday|salesforce|servicenow|oracle|netsuite).*architect\b/i, tier: 'principal', multiplier: 3.0, description: 'Platform Architect' },
  { pattern: /\benterprise architect\b/i, tier: 'principal', multiplier: 2.8, description: 'Enterprise Architect' },
  { pattern: /\bintegration architect\b/i, tier: 'principal', multiplier: 2.5, description: 'Integration Architect' },
  
  // Tier 2: Implementation / Delivery (x2.0-2.5)
  { pattern: /\bimplementation.*(?:manager|lead)\b/i, tier: 'delivery', multiplier: 2.5, description: 'Implementation Manager' },
  { pattern: /\b(?:program|programme) manager.*(?:transformation|implementation|erp)\b/i, tier: 'delivery', multiplier: 2.5, description: 'Program Manager' },
  { pattern: /\bproject manager.*(?:sap|workday|salesforce|erp|transformation)\b/i, tier: 'delivery', multiplier: 2.5, description: 'Project Manager' },
  { pattern: /\b(?:technical|agile).*product owner.*(?:sap|workday|salesforce|oracle|erp)\b/i, tier: 'delivery', multiplier: 2.3, description: 'Technical Product Owner' },
  { pattern: /\bproduct owner.*(?:advisor|consultant).*(?:sap|workday|salesforce|oracle)\b/i, tier: 'delivery', multiplier: 2.3, description: 'Product Owner Advisor' },
  { pattern: /\b(?:senior|lead|principal).*implementation consultant\b/i, tier: 'delivery', multiplier: 2.3, description: 'Senior Implementation Consultant' },
  { pattern: /\bimplementation consultant\b/i, tier: 'delivery', multiplier: 2.0, description: 'Implementation Consultant' },
  { pattern: /\b(?:implementation|erp|transformation).*advisor\b/i, tier: 'delivery', multiplier: 2.2, description: 'Implementation Advisor' },
  { pattern: /\bfunctional.*(?:lead|consultant).*(?:sap|workday|salesforce|oracle)\b/i, tier: 'delivery', multiplier: 2.0, description: 'Functional Consultant' },
  
  // Tier 3: Technical / Support (x1.5-2.0)
  { pattern: /\b(?:sap|workday|salesforce|servicenow).*developer\b/i, tier: 'technical', multiplier: 1.8, description: 'Platform Developer' },
  { pattern: /\babap developer\b/i, tier: 'technical', multiplier: 1.8, description: 'ABAP Developer' },
  { pattern: /\b(?:sap|workday|salesforce).*administrator\b/i, tier: 'technical', multiplier: 1.6, description: 'Platform Administrator' },
  { pattern: /\bsap basis.*(?:administrator|consultant)\b/i, tier: 'technical', multiplier: 1.8, description: 'SAP Basis Administrator' },
  { pattern: /\bfunctional analyst.*(?:sap|workday|salesforce)\b/i, tier: 'technical', multiplier: 1.6, description: 'Functional Analyst' },
  { pattern: /\bdata migration.*(?:specialist|consultant|analyst)\b/i, tier: 'technical', multiplier: 1.8, description: 'Data Migration Specialist' },
];

// ============= VENDOR PLATFORMS & MODULES =============
export const VENDOR_PLATFORMS = {
  sap: {
    weight: 6,
    core: ['sap', 's/4hana', 's4hana', 'sap ecc', 'sap erp', 'sap business suite'],
    modules: ['sap fi', 'sap co', 'sap mm', 'sap sd', 'sap pp', 'sap wm', 'sap hr', 'sap hcm',
              'finance (fi)', 'controlling (co)', 'materials management (mm)', 
              'sales and distribution (sd)', 'production planning (pp)',
              'vistex', 'sap vistex', 'pricing & rebates', 'trade promotion',
              'sap ariba', 'ariba', 'sap concur', 'concur', 'sap fieldglass', 'fieldglass']
  },
  workday: {
    weight: 6,
    core: ['workday', 'workday hcm', 'workday financials', 'workday planning'],
    modules: ['workday core hr', 'workday payroll', 'workday time tracking', 
              'workday benefits', 'workday recruiting', 'workday learning',
              'workday financial management', 'workforce planning']
  },
  oracle: {
    weight: 6,
    core: ['oracle cloud', 'oracle fusion', 'oracle erp', 'netsuite', 'oracle netsuite'],
    modules: ['oracle financials cloud', 'oracle hcm cloud', 'oracle scm cloud',
              'netsuite erp', 'netsuite financials', 'netsuite crm']
  },
  salesforce: {
    weight: 6,
    core: ['salesforce', 'salesforce crm', 'salesforce platform'],
    modules: ['sales cloud', 'service cloud', 'marketing cloud', 'commerce cloud',
              'vlocity', 'salesforce cpq', 'field service lightning', 'einstein analytics']
  },
  servicenow: {
    weight: 6,
    core: ['servicenow', 'service now'],
    modules: ['itsm', 'itom', 'service management', 'workflow automation',
              'incident management', 'change management', 'cmdb']
  },
  successFactors: {
    weight: 6,
    core: ['successfactors', 'sap successfactors', 'sf hcm'],
    modules: ['employee central', 'performance & goals', 'recruiting',
              'learning management', 'compensation management']
  },
  dynamics: {
    weight: 6,
    core: ['dynamics 365', 'microsoft dynamics', 'd365', 'business central'],
    modules: ['dynamics finance', 'dynamics operations', 'dynamics hr', 
              'dynamics sales', 'dynamics customer service']
  },
  cloud: {
    weight: 6,
    core: ['aws', 'amazon web services', 'azure', 'microsoft azure', 'gcp', 'google cloud platform', 
           'google cloud', 'cloud migration', 'cloud-first', 'cloud first'],
    modules: ['hybrid cloud', 'multi-cloud', 'multicloud', 'cloud infrastructure',
              'iaas', 'paas', 'saas platform', 'aws migration', 'azure migration']
  },
  dataAnalytics: {
    weight: 6,
    core: ['snowflake', 'databricks', 'data platform', 'analytics platform'],
    modules: ['data lake', 'data warehouse', 'data lakehouse', 'big data',
              'real-time analytics', 'business intelligence', 'bi platform']
  },
  ai: {
    weight: 7,
    core: ['ai integration', 'ai implementation', 'genai', 'generative ai', 
           'machine learning', 'ml platform', 'artificial intelligence'],
    modules: ['ai center of excellence', 'ai coe', 'ml ops', 'mlops',
              'ai at scale', 'enterprise ai', 'ai transformation']
  }
};

// ============= CORE BUSINESS PROCESSES (Tier 2) =============
export const BUSINESS_PROCESSES = {
  financial: {
    weight: 7,
    keywords: [
      'p2p', 'procure-to-pay', 'procure to pay',
      'r2r', 'record-to-report', 'record to report',
      'o2c', 'order-to-cash', 'order to cash',
      'q2c', 'quote-to-cash', 'quote to cash',
      'financial close', 'month end close', 'general ledger',
      'accounts payable', 'accounts receivable', 'ap automation', 'ar management'
    ]
  },
  hcm: {
    weight: 7,
    keywords: [
      'core hr', 'core human resources', 'employee central',
      'payroll processing', 'payroll system', 'global payroll',
      'time tracking', 'time and attendance', 'workforce management',
      'benefits administration', 'benefits enrollment',
      'talent acquisition', 'recruiting', 'onboarding',
      'performance management', 'succession planning',
      'workforce agility', 'workforce planning'
    ]
  },
  supply_chain: {
    weight: 7,
    keywords: [
      'supply chain management', 'scm implementation',
      'inventory management', 'warehouse management',
      'procurement', 'supplier management', 'vendor management',
      'demand planning', 'supply planning',
      'logistics', 'distribution'
    ]
  },
  crm: {
    weight: 6,
    keywords: [
      'customer relationship management', 'crm implementation',
      'sales force automation', 'sfa',
      'customer service management', 'case management',
      'marketing automation', 'campaign management',
      'customer 360', 'customer data platform'
    ]
  }
};

// ============= INTEGRATION & TECHNICAL KEYWORDS =============
export const INTEGRATION_KEYWORDS = {
  platforms: {
    weight: 6,
    keywords: [
      'boomi', 'dell boomi', 'certified boomi partner',
      'mulesoft', 'mule esb', 'anypoint platform',
      'informatica', 'talend', 'snaplogic',
      'breadwinner', 'celigo', 'jitterbit'
    ]
  },
  technical: {
    weight: 5,
    keywords: [
      'api integration', 'rest api', 'soap api', 'web services',
      'middleware', 'integration layer', 'connector',
      'etl', 'data integration', 'real-time integration',
      'master data management', 'mdm', 'data governance'
    ]
  },
  dataManagement: {
    weight: 7,
    keywords: [
      'data migration', 'data conversion', 'data cleansing', 'data scrubbing',
      'legacy data migration', 'historical data migration',
      'master data migration', 'cutover data load',
      'legacy decommissioning', 'system decommissioning',
      'data validation', 'data reconciliation'
    ]
  }
};

// ============= STAFFING & AUGMENTATION SIGNALS =============
export const STAFFING_KEYWORDS = {
  weight: 6,
  keywords: [
    'contract-to-hire', 'contract to hire', 'c2h',
    'contractor', 'contract position', 'temporary position',
    '6 month contract', '12 month contract', '18 month contract',
    'team augmentation', 'staff augmentation', 'resource augmentation',
    'external consultant', 'external resource', 'third party consultant',
    'system integrator', 'si partner', 'implementation partner',
    'big 4', 'accenture', 'deloitte', 'pwc', 'ey', 'kpmg',
    'professional services', 'ps implementation'
  ]
};

// ============= RISK & INSTABILITY FLAGS =============
export const RISK_KEYWORDS = {
  weight: 5, // High weight for presence, but flags for instability
  keywords: [
    'erp implementation failure', 'implementation failure', 'failed implementation',
    'rollback plan', 'rollback strategy', 'contingency plan',
    'system instability', 'performance issues', 'system issues',
    'scope creep', 'budget overrun', 'project delay',
    'change management resistance', 'user adoption issues',
    'project halt', 'project pause', 'implementation pause',
    'vendor dispute', 'contract termination'
  ]
};

// ============= SPECIALIZED CONTEXT KEYWORDS =============
export const SPECIALIZED_KEYWORDS = {
  govTech: {
    weight: 5,
    keywords: [
      'govtech', 'government modernization', 'public sector',
      'cgsi', 'core government systems', 'financial system modernization',
      'e-procurement', 'digital government', 'government cloud',
      'federal', 'municipal', 'state government', 'local government'
    ]
  },
  industry: {
    weight: 4,
    keywords: [
      'retail cloud pos', 'retail implementation',
      'healthcare erp', 'hospital system',
      'manufacturing erp', 'discrete manufacturing', 'process manufacturing',
      'financial services', 'banking platform',
      'travel & hospitality', 'transportation & logistics',
      'utilities', 'oil & gas', 'energy sector'
    ]
  }
};

// ============= TRANSFORMATION PROGRAM KEYWORDS =============
export const PROGRAM_KEYWORDS = {
  weight: 8,
  keywords: [
    'center of excellence', 'centre of excellence', 'coe', 'erp coe',
    'transformation program', 'transformation programme', 'transformation initiative',
    'digital transformation', 'business transformation', 'enterprise transformation',
    'technology transformation', 'tech transformation', 'it modernization',
    'transformation office', 'program management office', 'pmo',
    'change program', 'strategic initiative', 'modernization program',
    'enterprise-wide initiative', 'strategic technology roadmap',
    'application modernization', 'core systems overhaul',
    'technology investment', 'strategic partnership',
    'replatforming', 'platform modernization',
    'digital-first strategy', 'digital first',
    'cybersecurity overhaul', 'security transformation',
    'zero trust architecture', 'zero trust'
  ]
};

// ============= METHODOLOGY & PROCESS TRANSFORMATION =============
export const METHODOLOGY_KEYWORDS = {
  weight: 6,
  keywords: [
    'agile transformation', 'agile at scale', 'scaled agile',
    'devops', 'devsecops', 'devops implementation', 'devops culture',
    'ci/cd', 'continuous integration', 'continuous deployment',
    'site reliability engineering', 'sre',
    'value stream management', 'vsm',
    'it operating model', 'itom', 'new operating model',
    'automation strategy', 'rpa', 'robotic process automation',
    'business process automation', 'workflow automation',
    'infrastructure as code', 'iac'
  ]
};

// ============= LEGACY SYSTEMS (Migration Source Detection) =============
// These systems represent what companies are migrating AWAY FROM
// High weight when found with migration/replacement keywords
export const LEGACY_SYSTEMS = {
  weight: 7,
  systems: {
    mainframes: {
      keywords: [
        'cobol', 'cobol mainframe', 'ibm mainframe', 'mainframe system',
        'as/400', 'iseries', 'z/os', 'zos', 'legacy mainframe'
      ],
      industries: ['government', 'banking', 'insurance', 'healthcare']
    },
    legacyErp: {
      keywords: [
        'lawson', 'lawson erp', 'lawson m3', 'lawson s3',
        'jd edwards', 'jde', 'peoplesoft', 'oracle peoplesoft',
        'sap r/3', 'sap ecc 6.0', 'sap legacy',
        'oracle e-business suite', 'oracle ebs',
        'microsoft navision', 'navision',
        'sage', 'sage erp', 'sage x3',
        'epicor', 'epicor erp',
        'infor', 'infor erp'
      ],
      industries: ['manufacturing', 'retail', 'distribution', 'healthcare', 'government']
    },
    legacyDatabase: {
      keywords: [
        'db2', 'ibm db2', 'db2 database',
        'informix', 'sybase',
        'visual basic', 'vb.net', 'vb6', 'vb 6.0',
        'foxpro', 'microsoft access', 'access database',
        'dbase', 'clipper'
      ],
      industries: ['all']
    },
    legacyPlatforms: {
      keywords: [
        'windows 7', 'windows xp', 'windows server 2003', 'windows server 2008',
        'intel 286', 'legacy hardware', 'end of life', 'eol system',
        'end of support', 'eos system', 'unsupported system',
        'on-premise legacy', 'on-prem legacy', 'legacy infrastructure'
      ],
      industries: ['all']
    }
  },
  // Phrases that indicate migration away from legacy systems
  migrationPhrases: [
    'migrating away from', 'migrating from', 'moving away from', 'moving from',
    'replacing', 'decommissioning', 'retiring', 'sunsetting',
    'legacy system replacement', 'legacy modernization', 'legacy migration',
    'system replacement', 'platform replacement', 'technology refresh',
    'upgrade from', 'transition from', 'migration from'
  ]
};

// ============= HELPER FUNCTIONS =============

/**
 * Get all keywords as a flat array for initial detection
 */
export function getAllKeywords(): string[] {
  const allKeywords: string[] = [];
  
  // Phase keywords
  Object.values(PHASE_KEYWORDS).forEach(phase => allKeywords.push(...phase.keywords));
  
  // Vendor platforms
  Object.values(VENDOR_PLATFORMS).forEach(vendor => {
    allKeywords.push(...vendor.core, ...vendor.modules);
  });
  
  // Business processes
  Object.values(BUSINESS_PROCESSES).forEach(process => allKeywords.push(...process.keywords));
  
  // Integration
  Object.values(INTEGRATION_KEYWORDS).forEach(cat => allKeywords.push(...cat.keywords));
  
  // Other categories
  allKeywords.push(...STAFFING_KEYWORDS.keywords);
  allKeywords.push(...RISK_KEYWORDS.keywords);
  allKeywords.push(...PROGRAM_KEYWORDS.keywords);
  allKeywords.push(...METHODOLOGY_KEYWORDS.keywords);
  Object.values(SPECIALIZED_KEYWORDS).forEach(cat => allKeywords.push(...cat.keywords));
  
  // Legacy systems
  Object.values(LEGACY_SYSTEMS.systems).forEach(category => allKeywords.push(...category.keywords));
  allKeywords.push(...LEGACY_SYSTEMS.migrationPhrases);
  
  return allKeywords;
}

/**
 * Map keyword to its category and weight
 */
export function getKeywordMetadata(keyword: string): { category: string; weight: number; subcategory?: string } | null {
  const keywordLower = keyword.toLowerCase();
  
  // Check phase keywords
  for (const [phase, data] of Object.entries(PHASE_KEYWORDS)) {
    if (data.keywords.some(k => k.toLowerCase() === keywordLower)) {
      return { category: 'phase', subcategory: phase, weight: data.weight };
    }
  }
  
  // Check vendor platforms
  for (const [vendor, data] of Object.entries(VENDOR_PLATFORMS)) {
    if ([...data.core, ...data.modules].some(k => k.toLowerCase() === keywordLower)) {
      return { category: 'vendor', subcategory: vendor, weight: data.weight };
    }
  }
  
  // Check business processes
  for (const [process, data] of Object.entries(BUSINESS_PROCESSES)) {
    if (data.keywords.some(k => k.toLowerCase() === keywordLower)) {
      return { category: 'business_process', subcategory: process, weight: data.weight };
    }
  }
  
  // Check integration
  for (const [cat, data] of Object.entries(INTEGRATION_KEYWORDS)) {
    if (data.keywords.some(k => k.toLowerCase() === keywordLower)) {
      return { category: 'integration', subcategory: cat, weight: data.weight };
    }
  }
  
  // Check staffing
  if (STAFFING_KEYWORDS.keywords.some(k => k.toLowerCase() === keywordLower)) {
    return { category: 'staffing', weight: STAFFING_KEYWORDS.weight };
  }
  
  // Check risk
  if (RISK_KEYWORDS.keywords.some(k => k.toLowerCase() === keywordLower)) {
    return { category: 'risk', weight: RISK_KEYWORDS.weight };
  }
  
  // Check program
  if (PROGRAM_KEYWORDS.keywords.some(k => k.toLowerCase() === keywordLower)) {
    return { category: 'program', weight: PROGRAM_KEYWORDS.weight };
  }
  
  // Check methodology
  if (METHODOLOGY_KEYWORDS.keywords.some(k => k.toLowerCase() === keywordLower)) {
    return { category: 'methodology', weight: METHODOLOGY_KEYWORDS.weight };
  }
  
  // Check legacy systems
  for (const [systemType, data] of Object.entries(LEGACY_SYSTEMS.systems)) {
    if (data.keywords.some(k => k.toLowerCase() === keywordLower)) {
      return { category: 'legacy', subcategory: systemType, weight: LEGACY_SYSTEMS.weight };
    }
  }
  if (LEGACY_SYSTEMS.migrationPhrases.some(k => k.toLowerCase() === keywordLower)) {
    return { category: 'legacy', subcategory: 'migration', weight: LEGACY_SYSTEMS.weight };
  }
  
  // Check specialized
  for (const [cat, data] of Object.entries(SPECIALIZED_KEYWORDS)) {
    if (data.keywords.some(k => k.toLowerCase() === keywordLower)) {
      return { category: 'specialized', subcategory: cat, weight: data.weight };
    }
  }
  
  return null;
}

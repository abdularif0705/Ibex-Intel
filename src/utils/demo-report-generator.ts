import { PDFReportBuilder } from '@/lib/pdf-utils';

export interface DemoSignal {
  company_name: string;
  company_ticker?: string;
  signal_type: string;
  confidence_score: number;
  source_type: string;
  source_url: string;
  keywords: string[];
  detected_at: string;
  extracted_data: {
    vendor?: string;
    phase?: string;
    roles?: Array<{ role: string; tier: string }>;
  };
}

const DEMO_SIGNALS: DemoSignal[] = [
  {
    company_name: "GlobalTech Industries",
    company_ticker: "GTECH",
    signal_type: "implementation_active",
    confidence_score: 92.5,
    source_type: "job_posting",
    source_url: "https://example.com/careers/sap-cutover-manager",
    keywords: ["SAP S/4HANA", "Cutover", "Go-live", "Implementation Manager", "ERP", "Finance Module", "Q4 2024"],
    detected_at: new Date().toISOString(),
    extracted_data: {
      vendor: "SAP S/4HANA",
      phase: "Deployment",
      roles: [
        { role: "SAP Cutover Manager", tier: "Principal" },
        { role: "Implementation Consultant", tier: "Senior" }
      ]
    }
  },
  {
    company_name: "MegaCorp Financial Services",
    company_ticker: "MCFS",
    signal_type: "implementation_active",
    confidence_score: 88.3,
    source_type: "linkedin",
    source_url: "https://example.com/jobs/workday-architect",
    keywords: ["Workday HCM", "Solution Architect", "UAT", "Core HR", "Payroll", "System Integration Testing"],
    detected_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    extracted_data: {
      vendor: "Workday",
      phase: "Testing",
      roles: [
        { role: "Workday Solution Architect", tier: "Principal" },
        { role: "HCM Functional Analyst", tier: "Senior" }
      ]
    }
  },
  {
    company_name: "Retail Solutions Inc",
    company_ticker: "RSI",
    signal_type: "implementation_active",
    confidence_score: 85.7,
    source_type: "company_website",
    source_url: "https://example.com/careers/salesforce-technical-architect",
    keywords: ["Salesforce", "Technical Architect", "API Integration", "MuleSoft", "Production Launch", "CRM"],
    detected_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    extracted_data: {
      vendor: "Salesforce",
      phase: "Deployment",
      roles: [
        { role: "Salesforce Technical Architect", tier: "Principal" },
        { role: "Integration Developer", tier: "Senior" }
      ]
    }
  },
  {
    company_name: "Healthcare Systems Group",
    company_ticker: "HSG",
    signal_type: "implementation_active",
    confidence_score: 79.4,
    source_type: "indeed",
    source_url: "https://example.com/jobs/servicenow-implementation",
    keywords: ["ServiceNow", "ITSM", "Implementation Partner", "Mock Cutover", "Dress Rehearsal", "Project Manager"],
    detected_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    extracted_data: {
      vendor: "ServiceNow",
      phase: "Testing",
      roles: [
        { role: "ServiceNow Project Manager", tier: "Senior" },
        { role: "ITSM Consultant", tier: "Mid-Level" }
      ]
    }
  }
];

export function generateDemoReport(): void {
  const pdf = new PDFReportBuilder({
    companyName: "TSI Transformation Signals Intelligence",
    primaryColor: [59, 130, 246], // Blue
    accentColor: [147, 51, 234], // Purple
    website: "www.transformationsignal.ai"
  });

  // Header
  pdf.addBrandedHeader(
    "Enterprise SAAS Implementation Detection Report",
    "Demo Report - Sample High-Confidence Signals"
  );

  pdf.addPage();

  // Executive Summary
  pdf.addSectionHeader("Executive Summary", 1);
  pdf.addParagraph(
    "This demo report showcases the TSI platform's capability to detect active enterprise SAAS implementations with high confidence. The following signals represent typical detection patterns across multiple vendors and implementation phases."
  );
  
  pdf.addParagraph(
    `Analysis Period: Last 30 days\nTotal Signals Detected: ${DEMO_SIGNALS.length}\nAverage Confidence Score: ${(DEMO_SIGNALS.reduce((sum, s) => sum + s.confidence_score, 0) / DEMO_SIGNALS.length).toFixed(1)}%\nVendors Detected: SAP S/4HANA, Workday, Salesforce, ServiceNow`
  );

  pdf.addPage();

  // Key Findings
  pdf.addSectionHeader("Key Findings", 1);
  pdf.addBulletList([
    "4 high-confidence implementation signals detected (>75% confidence)",
    "Multiple vendors in active deployment phase (SAP, Salesforce)",
    "Principal-level roles indicate strategic, high-budget projects",
    "Clear evidence of late-stage testing and cutover planning",
    "Strong temporal clustering suggests coordinated transformation initiatives"
  ]);

  pdf.addPage();

  // Detailed Signal Analysis
  DEMO_SIGNALS.forEach((signal, index) => {
    if (index > 0) pdf.addPage();

    pdf.addSectionHeader(`Signal ${index + 1}: ${signal.company_name}`, 1);
    
    pdf.addMetadata({
      "Company": signal.company_name,
      "Ticker": signal.company_ticker || "N/A",
      "Confidence Score": `${signal.confidence_score.toFixed(1)}%`,
      "Vendor Platform": signal.extracted_data.vendor || "N/A",
      "Project Phase": signal.extracted_data.phase || "N/A",
      "Source Type": signal.source_type,
      "Detection Date": new Date(signal.detected_at).toLocaleDateString()
    });

    pdf.addSectionHeader("Analysis", 2);
    pdf.addParagraph(
      `This ${signal.confidence_score >= 85 ? "high" : "medium-high"} confidence signal indicates an active ${signal.extracted_data.vendor} implementation in the ${signal.extracted_data.phase?.toLowerCase()} phase. The presence of ${signal.extracted_data.roles?.[0]?.tier || "senior"}-level roles confirms significant organizational commitment and budget allocation.`
    );

    pdf.addSectionHeader("Key Indicators", 3);
    pdf.addBulletList(signal.keywords.slice(0, 6));

    if (signal.extracted_data.roles && signal.extracted_data.roles.length > 0) {
      pdf.addSectionHeader("Detected Roles", 3);
      pdf.addBulletList(
        signal.extracted_data.roles.map(r => `${r.role} (${r.tier} Tier)`)
      );
    }

    pdf.addSectionHeader("Investment Implications", 3);
    const implications = generateImplications(signal);
    pdf.addParagraph(implications);
  });

  // Add final page with recommendations
  pdf.addPage();
  pdf.addSectionHeader("Investment Recommendations", 1);
  pdf.addParagraph(
    "Based on the detected signals, the following strategic observations are recommended:"
  );
  
  pdf.addBulletList([
    "GlobalTech Industries (GTECH) - Highest confidence (92.5%). SAP S/4HANA cutover imminent. Monitor Q4 earnings for transformation costs and potential disruption.",
    "MegaCorp Financial (MCFS) - Workday HCM in testing phase. Expect 6-12 month implementation timeline. Track HR efficiency metrics post-go-live.",
    "Retail Solutions (RSI) - Salesforce with MuleSoft integration signals complex architecture. Technical debt reduction likely. Positive long-term margin impact.",
    "Healthcare Systems (HSG) - ServiceNow ITSM implementation. Operational efficiency play. Lower confidence but still actionable for IT services exposure."
  ]);

  pdf.addPage();
  pdf.addSectionHeader("Methodology & Confidence Framework", 1);
  pdf.addParagraph(
    "TSI employs a multi-factor confidence scoring algorithm combining:"
  );
  pdf.addBulletList([
    "Keyword Detection: Weighted taxonomy of 200+ implementation-specific terms",
    "Role Analysis: Tiered scoring based on seniority and specialization of detected positions",
    "Phase Mapping: Lifecycle position (evaluation, implementation, deployment)",
    "Temporal Clustering: Multiple signals within tight timeframes increase confidence",
    "Source Reliability: Bayesian updating based on historical source accuracy",
    "Statistical Validation: Z-score analysis and confidence intervals"
  ]);

  pdf.addParagraph(
    "\nConfidence Score Ranges:\n• 76-100%: Maximum Confidence (Imminent deployment, high-cost resources confirmed)\n• 51-75%: High Confidence (Active project, external resources allocated)\n• 26-50%: Medium Confidence (Project likely active, internal resources confirmed)\n• 0-25%: Low Confidence (Early evaluation or historical reference)"
  );

  // Save the PDF
  const timestamp = new Date().toISOString().split('T')[0];
  pdf.save(`TSI_Demo_Report_${timestamp}.pdf`);
}

function generateImplications(signal: DemoSignal): string {
  const { vendor, phase } = signal.extracted_data;
  const confidence = signal.confidence_score;

  if (confidence >= 90) {
    return `With ${confidence.toFixed(1)}% confidence, this represents a near-certain active ${vendor} transformation. The ${phase} phase indicates substantial capital expenditure is underway. Expect potential short-term margin pressure but long-term operational efficiency gains. Monitor quarterly earnings calls for transformation update commentary.`;
  } else if (confidence >= 80) {
    return `This ${confidence.toFixed(1)}% confidence signal suggests a committed ${vendor} implementation in ${phase} phase. The organization is likely experiencing change management challenges typical of this stage. Consider this data point when evaluating operational risk and future efficiency trajectories.`;
  } else {
    return `At ${confidence.toFixed(1)}% confidence, this ${vendor} implementation in ${phase} phase warrants monitoring. While not definitive, the signal strength justifies inclusion in broader transformation tracking. Correlate with other data sources for validation.`;
  }
}

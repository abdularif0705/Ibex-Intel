# 📂 Transformation Signals & Entity Taxonomy

**Purpose:** This document defines the domain knowledge required to identify, categorize, and analyze enterprise technology transformations. The system uses these keywords, entities, and service providers to detect "Transformation Signals" in unstructured data (news, job postings, press releases, earnings calls).

---

## 1. 📡 Signal Detection: Keywords & Phrases

*Detects intent and activity level.*

### Strategic High-Level Indicators
- Digital Transformation
- Tech Transformation
- IT Modernization
- Business Transformation
- Strategic Roadmap
- Legacy System Decommissioning
- Core Systems Overhaul
- Cloud-First Strategy

### Action Verbs (High Confidence)
- Implementation
- Migration
- Rollout
- Deployment
- Replatforming
- Modernization
- Transitioning to
- Adopting
- Deprecating legacy

### Role Indicators
- Chief Digital Officer (CDO)
- Head of Transformation
- VP of Enterprise Applications
- Director of ERP
- Agile Coach
- Release Train Engineer
- Principal Implementation Consultant
- Solution Architect
- Technical Architect

### Methodology Keywords
- Agile Transformation
- DevOps Implementation
- CI/CD Pipeline
- Value Stream Management
- IT Operating Model (ITOM) redesign
- Digital Operating Model

---

## 2. 🛠️ Entity Taxonomy: Software & Platforms

*Categorized by the type of business transformation they indicate.*

### A. Core Business & Finance (ERP)
**Signal:** "Heart transplant" of the business. High value, high risk.

**Enterprise:**
- SAP (S/4HANA, RISE, ECC)
- Oracle (Fusion, Cloud ERP, E-Business Suite)
- Microsoft Dynamics 365

**Mid-Market/Growth:**
- NetSuite
- Workday Financials
- Sage Intacct

**Key Modules & Processes:**
- Financial Management (FI)
- Controlling (CO)
- Record-to-Report (R2R)
- Procure-to-Pay (P2P)
- Order-to-Cash (O2C)
- Quote-to-Cash (Q2C)

### B. Human Capital & Workforce (HCM/HRIS)
**Signal:** Modernizing the employee experience and payroll.

**Enterprise:**
- Workday HCM
- SAP SuccessFactors
- UKG Pro
- ADP Workforce Now
- Dayforce (Ceridian)

**Mid-Market/Growth:**
- Paycom
- Paylocity
- Rippling
- Deel
- HiBob
- BambooHR
- Gusto
- Namely

**Talent Acquisition (ATS):**
- Greenhouse
- Ashby
- Lever
- SmartRecruiters
- Taleo (Legacy)
- iCIMS
- Workable

**Key Modules:**
- Core HR
- Payroll
- Time Tracking
- Benefits Administration
- Talent Management
- Workforce Planning
- Learning Management (LMS)

### C. Customer & Revenue Operations (CRM/RevOps)
**Signal:** Overhauling how the company sells and supports customers.

**CRM Platforms:**
- Salesforce (Sales Cloud, Service Cloud, Revenue Cloud)
- HubSpot
- Microsoft Dynamics 365 Sales
- Zoho CRM
- Pipedrive

**Sales Engagement & Intelligence:**
- Salesloft
- Outreach
- Gong
- Clari
- ZoomInfo
- Apollo.io
- 6sense (ABM)
- Demandbase

**Support/Customer Experience:**
- ServiceNow (CSM)
- Zendesk
- Intercom
- Freshdesk
- Genesys
- Five9
- NICE
- Kustomer

### D. Supply Chain & Logistics (SCM)
**Signal:** Digitizing physical goods movement and planning.

**Planning & Execution:**
- Blue Yonder (JDA)
- SAP (IBP, TM, EWM)
- Oracle SCM Cloud
- Kinaxis RapidResponse
- Logility
- o9 Solutions

**Logistics & Visibility:**
- Descartes
- project44
- FourKites
- Maersk Neo
- Shippeo

**Warehouse Management:**
- Manhattan Associates
- Blue Yonder WMS
- Körber
- HighJump

**Fleet & Telematics:**
- Samsara
- Motive (KeepTruckin)
- Geotab
- Verizon Connect

### E. Cloud, Data & AI Infrastructure
**Signal:** Modernizing the technical foundation.

**Cloud Infrastructure (IaaS):**
- Amazon Web Services (AWS)
- Microsoft Azure
- Google Cloud Platform (GCP)
- Oracle Cloud Infrastructure (OCI)

**Data Platforms:**
- Snowflake
- Databricks
- Palantir Foundry
- Salesforce Data Cloud
- Google BigQuery
- Amazon Redshift
- Azure Synapse

**Data Visualization:**
- Tableau
- Microsoft Power BI
- Looker (Google)
- Qlik Sense
- Domo

**Data Integration:**
- Boomi
- MuleSoft
- Informatica
- Talend
- Fivetran
- Airbyte

**Identity & Security:**
- Okta
- SailPoint
- CyberArk
- Zscaler
- CrowdStrike
- SentinelOne
- Palo Alto Networks
- Proofpoint

### F. Industry-Specific Verticals
**Signal:** Specialized "Rip and Replace" of core vertical systems.

**Healthcare:**
- Epic Systems (EHR)
- Cerner (Oracle Health)
- Meditech
- Allscripts

**Banking/FinTech:**
- nCino
- Temenos
- Mambu
- Q2
- Finastra
- FIS

**Insurance:**
- Guidewire
- Duck Creek
- Majesco
- Insurity

**Construction:**
- Procore
- Autodesk Construction Cloud
- Oracle Aconex
- Yardi (Real Estate)

**Legal:**
- Ironclad
- Icertis
- DocuSign CLM
- Conga

**Industrial/Manufacturing (PLM/MES):**
- Siemens Teamcenter
- PTC Windchill
- Dassault Systèmes (3DEXPERIENCE)
- SAP Digital Manufacturing
- Teleo (Autonomy)

**Retail & CPG:**
- Blue Yonder Luminate
- Manhattan Active Omni
- Aptos
- Cegid

### G. Commerce & Digital
**Signal:** Modernizing digital revenue channels.

**E-Commerce Platforms:**
- Shopify Plus
- Salesforce Commerce Cloud
- Adobe Commerce (Magento)
- HCL Commerce
- BigCommerce
- Commercetools
- Fabric

**Digital Experience (CMS/DXP):**
- Adobe Experience Manager
- Sitecore
- Contentful
- Contentstack

### H. IT Operations & Governance
**Signal:** Maturing internal operations and compliance.

**ITOM/ITSM:**
- ServiceNow (ITOM, ITSM)
- Atlassian (Jira Service Management)
- BMC Helix
- Ivanti
- PagerDuty

**IT Asset Management:**
- Flexera
- Snow Software
- ServiceNow ITAM

**Governance, Risk & Compliance (GRC):**
- OneTrust
- Vanta
- Drata
- AuditBoard
- Workiva
- RSA Archer
- MetricStream

**Configuration Management:**
- Ansible
- Puppet
- Chef
- Terraform

---

## 3. 🤝 The Partner Ecosystem: System Integrators (SIs)

**Detection Logic:** If a company announces a partnership with one of these firms, a transformation project is imminent or active.

### Tier 1: Global Strategy & Implementation ("The Big Firms")

**Strategy/Audit Roots:**
- Deloitte
- PwC (PricewaterhouseCoopers)
- EY (Ernst & Young)
- KPMG

**Tech/Outsourcing Roots:**
- Accenture
- Capgemini
- Tata Consultancy Services (TCS)
- Infosys
- Wipro
- HCLTech
- Cognizant
- NTT DATA
- IBM Consulting
- DXC Technology
- Atos

### Tier 2: Specialized & Boutique Partners

**Salesforce/RevOps:**
- Slalom
- Coastal Cloud
- Silverline
- CloudMasonry
- Bluewolf (IBM)
- Paxata
- ATG

**Workday/HR:**
- Kainos
- Collaborative Solutions
- Alight Solutions
- OneSource Virtual
- Deloitte Workday Practice
- Accenture Workday Practice

**SAP:**
- Deloitte SAP Practice
- Accenture SAP Practice
- Capgemini SAP Practice
- TATA SAP Practice
- All for One Group
- Westernacher

**Oracle:**
- Deloitte Oracle Practice
- Accenture Oracle Practice
- Capgemini Oracle Practice
- Hitachi Vantara

**Data/AI/Analytics:**
- Lovelytics
- phData
- Tredence
- InterWorks
- Slalom Data & AI
- Quantiphi
- Tiger Analytics

**Supply Chain:**
- Bristlecone
- Spinnaker Supply Chain Analytics
- Westernacher
- Kinaxis Professional Services
- Blue Yonder Consulting

**Cyber/Identity:**
- Optiv
- BeyondID
- GuidePoint Security
- Coalfire
- Kudelski Security

**Legal/CLM:**
- Spaulding Ridge
- Morae Global
- Wolf & Company

**Construction/Engineering:**
- Calance
- Kalypso (Rockwell Automation)
- Tata Technologies
- KPIT Technologies

**ServiceNow:**
- Accenture ServiceNow Practice
- Deloitte ServiceNow Practice
- Cognizant ServiceNow Practice
- DXC ServiceNow Practice

**Microsoft:**
- Avanade (Accenture + Microsoft)
- Hitachi Solutions
- HSO
- Velosio

---

## 4. 🧠 Analysis Logic for Detection Engine

### Correlation Rules

**1. Keyword + Entity (High Confidence)**
```
IF text contains [Migration Keyword] 
AND [Entity: SAP S/4HANA]
THEN classify as "Core ERP Transformation"
CONFIDENCE: 85-95%
```

**2. Role + Entity (Medium-High Confidence)**
```
IF Job Description contains [Role: Solution Architect] 
AND [Entity: Snowflake]
THEN classify as "Data Modernization"
CONFIDENCE: 70-85%
```

**3. Partner + Industry (High Confidence)**
```
IF News contains [Partner: Guidewire] 
AND [Company Sector: Insurance]
THEN classify as "Insurance Core Systems Transformation"
CONFIDENCE: 80-90%
```

**4. Phase Keywords + Vendor (Maximum Confidence)**
```
IF text contains [Phase: Go-Live, Cutover, Deployment]
AND [Vendor: Workday]
AND [Timeframe: Q4 2024, Next Month]
THEN classify as "Active Implementation - Deployment Phase"
CONFIDENCE: 90-100%
```

**5. Multiple High-Tier Roles + Vendor (High Confidence)**
```
IF Job Postings within 90 days contain:
  - [Role: Principal Consultant OR Solution Architect]
  - [Role: Project Manager]
  - [Role: Technical Lead]
AND all mention [Same Vendor]
THEN classify as "Active PMO Stood Up - Major Project"
CONFIDENCE: 85-95%
```

### Contextual Nuance & Disambiguation

**Product Usage vs. Transformation:**
- ❌ **Usage:** "We use Slack for team communication"
- ✅ **Transformation:** "We are rolling out Slack Enterprise Grid to 50,000 users across EMEA"

**Vendor Name Conflicts:**
- **HCL:** Can refer to **HCLTech** (System Integrator) or **HCLSoftware** (Product Vendor)
  - Context: "partnering with HCL" = HCLTech (SI)
  - Context: "implementing HCL Commerce" = HCLSoftware (Vendor)

**Maintenance vs. Implementation:**
- ❌ **Maintenance:** "SAP Basis Administrator - supporting existing ECC environment"
- ✅ **Implementation:** "SAP S/4HANA Migration Architect - leading cutover from ECC to S/4"

**Evaluation vs. Execution:**
- ❌ **Evaluation:** "RFP for new CRM platform", "Demo scheduled with Workday"
- ✅ **Execution:** "Workday HCM Go-Live Date: Q3 2024", "UAT testing underway"

### Proximity & Sequence Scoring

**Tier 1 Proximity (0-5 words apart):**
- Weight: 3.0x
- Example: "SAP S/4HANA cutover weekend"

**Tier 2 Proximity (6-15 words apart):**
- Weight: 2.0x
- Example: "implementing SAP with a planned cutover in Q4"

**Tier 3 Proximity (16-50 words apart):**
- Weight: 1.5x
- Example: "The company is modernizing its technology stack. SAP S/4HANA will replace the legacy ERP system with a cutover planned for next year."

### Signal Strength Multipliers

**Maximum Convergence Multiplier (MCM):**
```
IF [Tier 1 Role] (e.g., Principal Consultant)
AND [Tier 1 Phase] (e.g., Cutover, Go-Live)
AND [Major Vendor] (e.g., SAP, Workday, Salesforce)
WITHIN SAME TEXT BLOCK (50 words)
THEN apply 4.0x multiplier
```

**Temporal Clustering Multiplier (TCM):**
```
IF multiple high-tier job postings
FOR same vendor/transformation type
WITHIN 90-day window
THEN apply 2.5x multiplier
```

**Risk Mitigation Multiplier (RMM):**
```
IF [Rollback Plan] OR [Dress Rehearsal] OR [Mock Cutover]
NEAR [Vendor Name] (within 10 words)
THEN apply 3.0x multiplier (signals late-stage execution)
```

**Contextual Specificity Multiplier (CSM):**
```
IF [Generic Role: "Implementation Consultant"]
NEAR [Specific Vendor: "Workday"] (within 5 words)
THEN apply 2.0x multiplier
```

---

## 5. 📊 Confidence Scoring Framework

### Score Bands

| Score Range | Classification | Description |
|-------------|---------------|-------------|
| 0-25 | Low Confidence | Early evaluation, planning, or legacy maintenance |
| 26-50 | Medium Confidence | Confirmed scope, internal resources allocated |
| 51-75 | High Confidence | External partners engaged, active build/test phase |
| 76-100 | Maximum Confidence | Imminent deployment, cutover activities, go-live scheduled |

### Score Calculation
```
Confidence Score = 
  (Frequency Score × 0.25) +
  (Positional Score × 0.35) +
  (Sequence Score × 0.20) +
  (Contextual Score × 0.20)
```

**Frequency Score (F):** Normalized count of weighted keywords
**Positional Score (P):** Sum of job role tier multipliers
**Sequence Score (S):** Proximity and sequence logic activations
**Contextual Score (C):** Semantic consensus + temporal consistency

---

## 6. 🎯 Industry-Specific Detection Patterns

### Financial Services
**Key Signals:**
- Core banking platform replacement (Temenos, Finastra, FIS)
- Regulatory compliance modernization (KYC/AML)
- Trading platform upgrades (Murex, Calypso)

**Partner Indicators:** Accenture Financial Services, Deloitte Banking, Capgemini FSI

### Healthcare & Life Sciences
**Key Signals:**
- EHR migrations (Epic, Cerner/Oracle Health)
- Clinical trial management (Veeva Vault)
- Revenue cycle modernization

**Partner Indicators:** Deloitte Life Sciences, Accenture Health, Nordic Consulting

### Manufacturing & Industrial
**Key Signals:**
- PLM implementations (Siemens, PTC, Dassault)
- MES/Smart Factory (SAP Digital Manufacturing)
- IoT/OT integration (PTC ThingWorx)

**Partner Indicators:** Kalypso, Tata Technologies, KPIT

### Retail & Consumer Goods
**Key Signals:**
- Omnichannel commerce platforms
- Supply chain digitization (Blue Yonder)
- Store operations modernization

**Partner Indicators:** Bristlecone, Spinnaker, Accenture Retail

### Public Sector & Government
**Key Signals:**
- GovTech initiatives
- Core Government Systems Index (CGSI) improvements
- Financial System Modernization
- e-Procurement platforms

**Terminology:**
- Fund Accounting
- Grants Management
- Citizen Services Portal
- Open Data API

---

## 7. 🚩 Risk & Instability Flags

**Keywords Indicating Project Issues:**
- ERP Implementation Failures
- Rollback Plan (when mentioned frequently)
- System Instability
- Change Management Resistance
- Scope Creep
- Project Halt / Project Freeze
- Budget Overrun
- Delayed Go-Live
- Vendor Dispute

**Analysis Rule:**
```
IF high frequency of risk keywords
THEN maintain high "Project Existence" score
BUT assign low "Project Velocity" score
AND flag with "Instability Warning"
```

---

## 8. 🔗 Cross-Reference with Existing Files

This taxonomy extends and complements:
- `supabase/functions/shared/signal-taxonomy.ts` - Technical implementation
- `PATTERN_MATCHING_STRATEGY.md` - Detection algorithms
- `PROJECT_OVERVIEW.md` - Business context
- `GLOSSARY_FOR_BEGINNERS.md` - Plain-language explanations

---

## 9. 🎓 Usage Guidelines for AI Detection

1. **Always prioritize phase keywords** (Go-Live, Cutover) over generic mentions
2. **Validate vendor-role proximity** before assigning high confidence
3. **Distinguish product usage from transformation projects**
4. **Apply temporal context** - recent signals score higher
5. **Consider industry context** - certain vendors are vertical-specific
6. **Monitor partner announcements** - strong leading indicator
7. **Flag ambiguous entities** - resolve HCL, Oracle, SAP context
8. **Weight job postings heavily** - direct evidence of resource allocation

---

**Last Updated:** 2025-01-19
**Maintained By:** Enterprise Transformation Intelligence Team

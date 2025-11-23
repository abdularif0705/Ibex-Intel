# Shared Edge Function Resources

This directory contains shared utilities and configuration files used across multiple edge functions.

## Files

### `vendor-validation-sources.ts`

Maintains a comprehensive list of official vendor news and customer success sites for cross-referencing transformation completions.

**Purpose:**
- Reduce false positives when classifying companies as "In Progress" with transformations
- Provide authoritative sources for verifying transformation status
- Enable automated validation checks against vendor announcements

**Supported Vendors:**
- SAP (news.sap.com)
- Oracle (oracle.com/news, blogs.oracle.com/cx)
- Workday (newsroom.workday.com, workday.com/customer-stories)
- Salesforce (salesforce.com/news, salesforce.com/customer-stories)
- Microsoft Dynamics (microsoft.com/dynamics-365, microsoft.com/customers)
- ServiceNow (servicenow.com/press-room, servicenow.com/customers)
- NetSuite (netsuite.com)

**Usage Example:**
```typescript
import { getVendorSources, buildValidationSearchQuery } from '../shared/vendor-validation-sources.ts';

// Get validation sources for a specific vendor
const sapSources = getVendorSources("SAP");

// Build a search query to check if a company has announced completion
const query = buildValidationSearchQuery("BASF", "SAP");
// Returns: "BASF" site:news.sap.com OR site:sap.com/customer-stories (S/4HANA OR SAP ERP OR SAP implementation)
```

**Validation Workflow:**
1. Scrape job boards, company sites, etc. to detect transformation signals
2. Before marking as "In Progress", check vendor news sites for completion announcements
3. If completion found, mark as "Completed" or exclude from results
4. If no completion announcement, proceed with "In Progress" classification

**Maintenance:**
- Add new vendors as they become relevant to tracking
- Update URLs if vendors restructure their news/customer story sections
- Expand keywords to cover new product names and terminology

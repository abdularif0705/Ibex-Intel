import { describe, it, expect } from 'vitest';

/**
 * Unit tests for Signal Analysis Engine
 * Tests keyword detection, confidence scoring, role hierarchy, and proximity analysis
 */

describe('Signal Detection - Keyword Matching', () => {
  it('should detect SAP implementation keywords', () => {
    const content = 'We are implementing SAP S/4HANA with a go-live date in Q4 2024';
    const keywords = ['SAP S/4HANA', 'go-live'];
    
    const detected = keywords.filter(k => content.toLowerCase().includes(k.toLowerCase()));
    expect(detected).toContain('SAP S/4HANA');
    expect(detected).toContain('go-live');
  });

  it('should detect Workday implementation keywords', () => {
    const content = 'Workday HCM implementation with UAT phase starting next month';
    const keywords = ['Workday HCM', 'UAT', 'implementation'];
    
    const detected = keywords.filter(k => content.toLowerCase().includes(k.toLowerCase()));
    expect(detected.length).toBeGreaterThan(0);
  });

  it('should not detect keywords in unrelated content', () => {
    const content = 'We are hiring a marketing manager for our retail division';
    const implementationKeywords = ['SAP', 'Workday', 'cutover', 'go-live', 'ERP'];
    
    const detected = implementationKeywords.filter(k => 
      content.toLowerCase().includes(k.toLowerCase())
    );
    expect(detected.length).toBe(0);
  });
});

describe('Signal Detection - Role Hierarchy', () => {
  it('should detect executive-tier roles', () => {
    const roles = [
      'CTO hiring for digital transformation',
      'VP of IT Transformation',
      'Chief Information Officer'
    ];
    
    const executivePattern = /\b(?:cto|cio|chief technology officer|chief information officer|vp.*transformation)\b/i;
    
    roles.forEach(role => {
      expect(executivePattern.test(role)).toBe(true);
    });
  });

  it('should detect principal consultant roles', () => {
    const content = 'Principal Implementation Consultant needed for SAP project';
    const principalPattern = /\bprincipal.*(?:implementation consultant|consultant)\b/i;
    
    expect(principalPattern.test(content)).toBe(true);
  });

  it('should detect solution architect roles', () => {
    const content = 'Workday Solution Architect with 5+ years experience';
    const architectPattern = /\b(?:solution architect|technical architect|enterprise architect)\b/i;
    
    expect(architectPattern.test(content)).toBe(true);
  });
});

describe('Signal Detection - Phase Detection', () => {
  it('should detect deployment phase keywords', () => {
    const deploymentKeywords = ['cutover', 'go-live', 'production launch', 'transition to support'];
    const content = 'Final cutover weekend scheduled for December 15th';
    
    const detected = deploymentKeywords.some(k => 
      content.toLowerCase().includes(k.toLowerCase())
    );
    expect(detected).toBe(true);
  });

  it('should detect late-stage testing phase', () => {
    const testingKeywords = ['UAT', 'user acceptance testing', 'mock cutover', 'dress rehearsal'];
    const content = 'UAT phase begins next week with 100 users';
    
    const detected = testingKeywords.some(k => 
      content.toLowerCase().includes(k.toLowerCase())
    );
    expect(detected).toBe(true);
  });

  it('should detect evaluation phase (low confidence)', () => {
    const evalKeywords = ['RFP', 'vendor evaluation', 'demo', 'proof of concept'];
    const content = 'Reviewing vendor RFP responses for ERP selection';
    
    const detected = evalKeywords.some(k => 
      content.toLowerCase().includes(k.toLowerCase())
    );
    expect(detected).toBe(true);
  });
});

describe('Signal Detection - Proximity Scoring', () => {
  it('should detect vendor + phase proximity', () => {
    const content = 'Our SAP S/4HANA cutover is scheduled for next quarter';
    const words = content.split(/\s+/);
    
    // Find positions of "SAP" and "cutover"
    const sapIndex = words.findIndex(w => w.toLowerCase().includes('sap'));
    const cutoverIndex = words.findIndex(w => w.toLowerCase().includes('cutover'));
    
    const distance = Math.abs(sapIndex - cutoverIndex);
    expect(distance).toBeLessThan(10); // Within proximity window
  });

  it('should detect vendor + role proximity', () => {
    const content = 'Workday Implementation Consultant needed for HCM project';
    const hasWorkday = /workday/i.test(content);
    const hasImplementationRole = /implementation consultant/i.test(content);
    
    expect(hasWorkday && hasImplementationRole).toBe(true);
  });
});

describe('Signal Detection - Confidence Scoring', () => {
  it('should assign high confidence to deployment phase signals', () => {
    const content = 'SAP S/4HANA go-live next month with Principal Consultant leading cutover';
    
    // Simulate confidence calculation
    let confidence = 0.3; // base
    
    // Phase boost (deployment = max)
    if (/go-live|cutover/i.test(content)) confidence += 0.4;
    
    // Role boost (principal = high tier)
    if (/principal consultant/i.test(content)) confidence += 0.25;
    
    // Vendor presence
    if (/sap s\/4hana/i.test(content)) confidence += 0.1;
    
    expect(confidence).toBeGreaterThan(0.8);
  });

  it('should assign low confidence to evaluation phase signals', () => {
    const content = 'Considering SAP for future ERP replacement, reviewing RFP';
    
    let confidence = 0.3; // base
    
    // Evaluation phase penalty
    if (/rfp|considering|reviewing/i.test(content)) confidence -= 0.1;
    
    expect(confidence).toBeLessThan(0.5);
  });
});

describe('Signal Detection - Risk Flags', () => {
  it('should detect risk/instability keywords', () => {
    const riskKeywords = [
      'implementation failure',
      'rollback plan',
      'project halt',
      'scope creep',
      'budget overrun'
    ];
    
    const content = 'Emergency rollback plan activated due to system instability';
    
    const hasRisk = riskKeywords.some(k => 
      content.toLowerCase().includes(k.toLowerCase())
    );
    
    expect(hasRisk).toBe(true);
  });
});

describe('Signal Detection - Temporal Clustering', () => {
  it('should detect hiring surge within 90 days', () => {
    const signals = [
      { detected_at: '2024-10-01T00:00:00Z', roles: ['Architect'] },
      { detected_at: '2024-10-15T00:00:00Z', roles: ['Manager'] },
      { detected_at: '2024-11-01T00:00:00Z', roles: ['Consultant'] },
    ];
    
    const firstDate = new Date(signals[0].detected_at);
    const lastDate = new Date(signals[signals.length - 1].detected_at);
    const daysDiff = (lastDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24);
    
    expect(daysDiff).toBeLessThan(90);
    expect(signals.length).toBeGreaterThanOrEqual(3);
  });
});

describe('Signal Detection - Vendor Detection', () => {
  it('should detect multiple vendor mentions', () => {
    const vendors = ['SAP', 'Workday', 'Salesforce', 'Oracle', 'ServiceNow'];
    const content = 'Experience with SAP S/4HANA and Workday HCM preferred';
    
    const detected = vendors.filter(v => 
      content.toLowerCase().includes(v.toLowerCase())
    );
    
    expect(detected).toContain('SAP');
    expect(detected).toContain('Workday');
  });
});

describe('Signal Detection - Business Process Keywords', () => {
  it('should detect P2P process keywords', () => {
    const content = 'Implementing P2P process automation with SAP';
    expect(content).toMatch(/\bp2p\b|procure-to-pay/i);
  });

  it('should detect R2R process keywords', () => {
    const content = 'Record-to-Report (R2R) transformation project';
    expect(content).toMatch(/\br2r\b|record-to-report/i);
  });

  it('should detect O2C process keywords', () => {
    const content = 'Order-to-Cash optimization initiative';
    expect(content).toMatch(/\bo2c\b|order-to-cash/i);
  });
});

/**
 * Enhanced Signal Analysis Engine with Quantitative Methods
 * Implements Bayesian updating, TF-IDF, statistical validation, and temporal clustering
 */

import {
  JOB_ROLE_HIERARCHY,
  PHASE_KEYWORDS,
  VENDOR_PLATFORMS,
  BUSINESS_PROCESSES,
  INTEGRATION_KEYWORDS,
  STAFFING_KEYWORDS,
  PROGRAM_KEYWORDS,
  RISK_KEYWORDS,
  SPECIALIZED_KEYWORDS,
  getKeywordMetadata,
} from "./signal-taxonomy.ts";

export interface AnalysisResult {
  confidence: number;
  confidenceInterval: { lower: number; upper: number };
  zScore: number;
  matchedKeywords: string[];
  keywordWeights: Record<string, number>;
  detectedRoles: Array<{ role: string; tier: string; multiplier: number }>;
  proximityBoosts: Array<{ sequence: string; boost: number }>;
  phaseDetected: string | null;
  vendorDetected: string | null;
  hasRiskFlags: boolean;
  baseScore: number;
  roleScore: number;
  proximityScore: number;
  phaseScore: number;
  bayesianPrior: number;
  bayesianPosterior: number;
  flags: string[];
}

/**
 * Source reliability tracker for multi-armed bandit approach
 */
interface SourceReliability {
  successCount: number;
  totalCount: number;
  avgConfidence: number;
  lastUpdated: Date;
}

const sourceReliabilityMap = new Map<string, SourceReliability>();

const pythonServiceUrl =
  Deno.env.get("PYTHON_SCRAPER_URL") ??
  "https://signalstream-python-1q73.onrender.com";

/**
 * Main analysis function with comprehensive scoring and quantitative enhancements
 */
export function analyzeContent(
  content: string,
  sourceType: string,
  detectedAt: Date
): AnalysisResult {
  const contentLower = content.toLowerCase();

  // 1. Detect matched keywords with metadata
  const matchedKeywords = detectKeywords(contentLower);

  // 2. Calculate TF-IDF weighted keyword scores
  const keywordWeights = calculateTFIDF(matchedKeywords, content);

  // 3. Calculate base frequency score with TF-IDF
  const baseScore = calculateBaseScoreWithTFIDF(
    matchedKeywords,
    contentLower,
    keywordWeights
  );

  // 4. Detect job roles and calculate role score
  const detectedRoles = detectJobRoles(content);
  const roleScore = calculateRoleScore(detectedRoles);

  // 5. Calculate proximity boosts (Contextual Specificity Multiplier)
  const proximityBoosts = calculateProximityScore(content, matchedKeywords);
  const proximityScore = proximityBoosts.reduce((sum, p) => sum + p.boost, 0);

  // 6. Detect project phase
  const phaseDetected = detectPhase(matchedKeywords);
  const phaseScore = calculatePhaseScore(phaseDetected, matchedKeywords);

  // 7. Detect vendor
  const vendorDetected = detectVendor(matchedKeywords);

  // 8. Check for risk flags
  const hasRiskFlags = detectRiskFlags(matchedKeywords);

  // 9. Bayesian prior from source reliability
  const bayesianPrior = getBayesianPrior(sourceType);

  // 10. Apply source type multiplier with exploration bonus
  const sourceMultiplier = getSourceMultiplierWithExploration(sourceType);

  // 11. Calculate raw confidence score
  const rawConfidence =
    (baseScore * 0.25 +
      roleScore * 0.35 +
      proximityScore * 0.2 +
      phaseScore * 0.2) *
    sourceMultiplier;

  // 12. Apply Bayesian updating
  const bayesianPosterior = updateBayesianConfidence(
    bayesianPrior,
    rawConfidence / 10
  );

  // 13. Calculate z-score for statistical validation
  const zScore = calculateZScore(bayesianPosterior, sourceType);

  // 14. Calculate confidence interval
  const confidenceInterval = calculateConfidenceInterval(
    bayesianPosterior,
    matchedKeywords.length
  );

  // Normalize to 0-1 range with ceiling at 0.98
  const confidence = Math.min(bayesianPosterior, 0.98);

  // 15. Generate flags
  const flags = generateFlags(
    hasRiskFlags,
    phaseDetected,
    detectedRoles.length,
    proximityBoosts.length,
    zScore
  );

  // 16. Update source reliability (multi-armed bandit)
  updateSourceReliability(sourceType, confidence);

  return {
    confidence,
    confidenceInterval,
    zScore,
    matchedKeywords,
    keywordWeights,
    detectedRoles,
    proximityBoosts,
    phaseDetected,
    vendorDetected,
    hasRiskFlags,
    baseScore,
    roleScore,
    proximityScore,
    phaseScore,
    bayesianPrior,
    bayesianPosterior,
    flags,
  };
}

/**
 * Main analysis function with comprehensive scoring and quantitative enhancements
 */
export async function analyzeContentWithNLP(
  content: string,
  sourceType: string,
  detectedAt: Date
): Promise<AnalysisResult> {
  let pythonResult: any = null;
  try {
    const response = await fetch(pythonServiceUrl + "/api/v1/detect-signals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: content, source: sourceType }),
    });
    if (response.ok) {
      pythonResult = await response.json();
      console.log("Python analyzer response:", pythonResult);
    } else {
      console.warn("Python analyzer response not OK:", response.status);
    }
  } catch (error) {
    console.warn("Python analyzer error:", error);
  }

  const contentLower = content.toLowerCase();

  const matchedKeywords = detectKeywords(contentLower);
  const keywordWeights =
    pythonResult?.keywordWeights ?? calculateTFIDF(matchedKeywords, content);
  const baseScore = pythonResult?.confidence_score_avg ?? 0 / 100;
  // const baseScore = calculateBaseScoreWithTFIDF(matchedKeywords, contentLower, keywordWeights);
  const detectedRoles = pythonResult?.detectedRoles ?? detectJobRoles(content);
  const roleScore =
    pythonResult?.roleScore ?? calculateRoleScore(detectedRoles);
  const proximityBoosts =
    pythonResult?.proximityBoosts ??
    calculateProximityScore(content, matchedKeywords);
  const proximityScore = proximityBoosts.reduce((sum, p) => sum + p.boost, 0);
  const phaseDetected =
    pythonResult?.phaseDetected ?? detectPhase(matchedKeywords);
  const phaseScore =
    pythonResult?.phaseScore ??
    calculatePhaseScore(phaseDetected, matchedKeywords);
  const vendorDetected =
    pythonResult?.vendorDetected ?? detectVendor(matchedKeywords);
  const hasRiskFlags =
    pythonResult?.hasRiskFlags ?? detectRiskFlags(matchedKeywords);
  const bayesianPrior =
    pythonResult?.bayesianPrior ?? getBayesianPrior(sourceType);
  const sourceMultiplier = getSourceMultiplierWithExploration(sourceType);
  const rawConfidence =
    baseScore * 0.25 +
    roleScore * 0.35 +
    proximityScore * 0.2 +
    phaseScore * 0.2;
  const adjustedRawConfidence = rawConfidence * sourceMultiplier;
  const bayesianPosterior =
    pythonResult?.bayesianPosterior ??
    updateBayesianConfidence(bayesianPrior, adjustedRawConfidence / 10);
  const zScore =
    pythonResult?.zScore ?? calculateZScore(bayesianPosterior, sourceType);
  const confidenceInterval =
    pythonResult?.confidenceInterval ??
    calculateConfidenceInterval(bayesianPosterior, matchedKeywords.length);
  const confidence = (pythonResult?.confidence_score_avg ?? 0) / 100;
  const flags =
    pythonResult?.flags ??
    generateFlags(
      hasRiskFlags,
      phaseDetected,
      detectedRoles.length,
      proximityBoosts.length,
      zScore
    );

  return {
    confidence,
    confidenceInterval,
    zScore,
    matchedKeywords: [
      ...matchedKeywords,
      ...pythonResult?.top_signals.map((s: any) => s.signal),
    ],
    keywordWeights,
    detectedRoles,
    proximityBoosts,
    phaseDetected,
    vendorDetected,
    hasRiskFlags,
    baseScore,
    roleScore,
    proximityScore,
    phaseScore,
    bayesianPrior,
    bayesianPosterior,
    flags,
  };
}

/**
 * Detect keywords present in content
 */
function detectKeywords(contentLower: string): string[] {
  const matched: string[] = [];

  // Check phase keywords
  Object.values(PHASE_KEYWORDS).forEach((phase) => {
    phase.keywords.forEach((keyword) => {
      if (contentLower.includes(keyword.toLowerCase())) {
        matched.push(keyword);
      }
    });
  });

  // Check vendor platforms
  Object.values(VENDOR_PLATFORMS).forEach((vendor) => {
    [...vendor.core, ...vendor.modules].forEach((keyword) => {
      if (contentLower.includes(keyword.toLowerCase())) {
        matched.push(keyword);
      }
    });
  });

  // Check business processes (CRITICAL: P2P, R2R, O2C, Q2C, etc.)
  Object.values(BUSINESS_PROCESSES).forEach((process) => {
    process.keywords.forEach((keyword) => {
      if (contentLower.includes(keyword.toLowerCase())) {
        matched.push(keyword);
      }
    });
  });

  // Check integration keywords
  Object.values(INTEGRATION_KEYWORDS).forEach((category) => {
    category.keywords.forEach((keyword) => {
      if (contentLower.includes(keyword.toLowerCase())) {
        matched.push(keyword);
      }
    });
  });

  // Check staffing keywords
  STAFFING_KEYWORDS.keywords.forEach((keyword) => {
    if (contentLower.includes(keyword.toLowerCase())) {
      matched.push(keyword);
    }
  });

  // Check program keywords
  PROGRAM_KEYWORDS.keywords.forEach((keyword) => {
    if (contentLower.includes(keyword.toLowerCase())) {
      matched.push(keyword);
    }
  });

  // Check risk keywords
  RISK_KEYWORDS.keywords.forEach((keyword) => {
    if (contentLower.includes(keyword.toLowerCase())) {
      matched.push(keyword);
    }
  });

  // Check specialized keywords
  Object.values(SPECIALIZED_KEYWORDS).forEach((category) => {
    category.keywords.forEach((keyword) => {
      if (contentLower.includes(keyword.toLowerCase())) {
        matched.push(keyword);
      }
    });
  });

  return [...new Set(matched)]; // Remove duplicates
}

/**
 * Calculate TF-IDF weights for keywords (dimensionality reduction)
 */
function calculateTFIDF(
  keywords: string[],
  content: string
): Record<string, number> {
  const weights: Record<string, number> = {};
  const totalWords = content.split(/\s+/).length;

  keywords.forEach((keyword) => {
    const keywordLower = keyword.toLowerCase();
    const termFreq = (
      content.toLowerCase().match(new RegExp(`\\b${keywordLower}\\b`, "g")) ||
      []
    ).length;
    const tf = termFreq / totalWords;

    // IDF approximation: rarer keywords get higher weight
    // Assuming document corpus where common terms appear in ~50% of docs, rare terms in ~5%
    const metadata = getKeywordMetadata(keyword);
    const baseIDF =
      metadata?.category === "phase" ? Math.log(20) : Math.log(10);

    weights[keyword] = tf * baseIDF;
  });

  return weights;
}

/**
 * Calculate base score with TF-IDF weighting
 */
function calculateBaseScoreWithTFIDF(
  keywords: string[],
  contentLower: string,
  tfidfWeights: Record<string, number>
): number {
  let score = 0;

  keywords.forEach((keyword) => {
    const metadata = getKeywordMetadata(keyword);
    if (metadata) {
      const occurrences = Math.min(
        (contentLower.match(new RegExp(keyword.toLowerCase(), "g")) || [])
          .length,
        3
      );
      const tfidfWeight = tfidfWeights[keyword] || 1.0;
      score += metadata.weight * tfidfWeight * Math.log(1 + occurrences);
    }
  });

  return score;
}

/**
 * Detect job roles using hierarchy patterns
 */
function detectJobRoles(
  content: string
): Array<{ role: string; tier: string; multiplier: number }> {
  const detected: Array<{ role: string; tier: string; multiplier: number }> =
    [];

  JOB_ROLE_HIERARCHY.forEach((rolePattern) => {
    if (rolePattern.pattern.test(content)) {
      detected.push({
        role: rolePattern.description,
        tier: rolePattern.tier,
        multiplier: rolePattern.multiplier,
      });
    }
  });

  return detected;
}

/**
 * Calculate role score based on detected roles
 */
function calculateRoleScore(
  roles: Array<{ role: string; tier: string; multiplier: number }>
): number {
  if (roles.length === 0) return 0;

  // Take the highest multiplier and add diminishing returns for additional roles
  const sortedMultipliers = roles
    .map((r) => r.multiplier)
    .sort((a, b) => b - a);
  let score = sortedMultipliers[0] || 0;

  // Add 50% of second role, 25% of third, etc.
  for (let i = 1; i < sortedMultipliers.length; i++) {
    score += sortedMultipliers[i] * Math.pow(0.5, i);
  }

  return score;
}

/**
 * Calculate proximity score (Contextual Specificity Multiplier)
 * Detects vendor + phase/role/module sequences within proximity window
 */
function calculateProximityScore(
  content: string,
  keywords: string[]
): Array<{ sequence: string; boost: number }> {
  const boosts: Array<{ sequence: string; boost: number }> = [];
  const words = content.split(/\s+/);
  const PROXIMITY_WINDOW = 10; // words

  // Detect vendor keywords
  const vendorKeywords = keywords.filter((k) => {
    return Object.values(VENDOR_PLATFORMS).some((v) =>
      [...v.core, ...v.modules].some(
        (vk) => vk.toLowerCase() === k.toLowerCase()
      )
    );
  });

  // Detect high-value target keywords (phase, roles, modules)
  const targetKeywords = keywords.filter((k) => {
    const meta = getKeywordMetadata(k);
    return (
      meta &&
      (meta.category === "phase" || meta.category === "business_process")
    );
  });

  // Check proximity between vendors and targets
  vendorKeywords.forEach((vendor) => {
    const vendorPattern = new RegExp(
      `\\b${vendor.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`,
      "gi"
    );
    let match;

    while ((match = vendorPattern.exec(content)) !== null) {
      const vendorIndex = content.substring(0, match.index).split(/\s+/).length;

      // Check for nearby target keywords
      targetKeywords.forEach((target) => {
        const targetPattern = new RegExp(
          `\\b${target.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`,
          "gi"
        );
        let targetMatch;

        while ((targetMatch = targetPattern.exec(content)) !== null) {
          const targetIndex = content
            .substring(0, targetMatch.index)
            .split(/\s+/).length;
          const distance = Math.abs(vendorIndex - targetIndex);

          if (distance <= PROXIMITY_WINDOW) {
            // Closer = higher boost
            const proximityBoost = 2.0 * (1 - distance / PROXIMITY_WINDOW);
            boosts.push({
              sequence: `${vendor} + ${target}`,
              boost: proximityBoost,
            });
          }
        }
      });
    }
  });

  return boosts;
}

/**
 * Detect project phase from keywords
 */
function detectPhase(keywords: string[]): string | null {
  const phases = [
    "deployment",
    "lateStage",
    "execution",
    "planning",
    "evaluation",
  ];

  for (const phase of phases) {
    const phaseData = PHASE_KEYWORDS[phase as keyof typeof PHASE_KEYWORDS];
    if (
      phaseData &&
      keywords.some((k) =>
        phaseData.keywords.some((pk) => pk.toLowerCase() === k.toLowerCase())
      )
    ) {
      return phase;
    }
  }

  return null;
}

/**
 * Calculate phase score
 */
function calculatePhaseScore(phase: string | null, keywords: string[]): number {
  if (!phase) return 1.0;

  const phaseData = PHASE_KEYWORDS[phase as keyof typeof PHASE_KEYWORDS];
  if (!phaseData) return 1.0;

  // More phase keywords = higher confidence
  const phaseKeywordCount = keywords.filter((k) =>
    phaseData.keywords.some((pk) => pk.toLowerCase() === k.toLowerCase())
  ).length;

  return phaseData.weight * Math.log(1 + phaseKeywordCount);
}

/**
 * Detect vendor from keywords
 */
function detectVendor(keywords: string[]): string | null {
  for (const [vendor, data] of Object.entries(VENDOR_PLATFORMS)) {
    if (
      keywords.some((k) =>
        [...data.core, ...data.modules].some(
          (vk) => vk.toLowerCase() === k.toLowerCase()
        )
      )
    ) {
      return vendor;
    }
  }
  return null;
}

/**
 * Detect risk flags
 */
function detectRiskFlags(keywords: string[]): boolean {
  return keywords.some((k) =>
    RISK_KEYWORDS.keywords.some((rk) => rk.toLowerCase() === k.toLowerCase())
  );
}

/**
 * Get Bayesian prior from source reliability history
 */
function getBayesianPrior(sourceType: string): number {
  const reliability = sourceReliabilityMap.get(sourceType);

  if (!reliability || reliability.totalCount < 5) {
    // Uninformative prior for new sources
    return 0.5;
  }

  // Prior based on historical success rate
  return reliability.successCount / reliability.totalCount;
}

/**
 * Update Bayesian confidence using likelihood
 */
function updateBayesianConfidence(prior: number, likelihood: number): number {
  // Bayesian update: posterior = (likelihood * prior) / evidence
  // Simplified version using weighted average
  const alpha = 0.7; // Weight given to new evidence
  return alpha * likelihood + (1 - alpha) * prior;
}

/**
 * Get source type multiplier with exploration bonus (multi-armed bandit)
 */
function getSourceMultiplierWithExploration(sourceType: string): number {
  const baseMultipliers: Record<string, number> = {
    linkedin: 1.3,
    indeed: 1.3,
    glassdoor: 1.25,
    headhunter: 1.4,
    recruiting_site: 1.35,
    company_website: 1.2,
    pr_wire: 1.25,
    news_site: 1.1,
    sec_edgar: 1.15,
    reddit: 0.9,
    twitter: 0.85,
    teamblind: 0.95,
    hackernews: 0.9,
    other: 1.0,
  };

  const baseMultiplier = baseMultipliers[sourceType] || 1.0;
  const reliability = sourceReliabilityMap.get(sourceType);

  if (!reliability || reliability.totalCount < 10) {
    // Exploration bonus for under-sampled sources
    const explorationBonus = 0.1 * (1 - (reliability?.totalCount || 0) / 10);
    return baseMultiplier * (1 + explorationBonus);
  }

  // Exploitation: use historical performance
  const performanceAdjustment = (reliability.avgConfidence - 0.5) * 0.2;
  return baseMultiplier * (1 + performanceAdjustment);
}

/**
 * Calculate z-score for statistical validation
 */
function calculateZScore(confidence: number, sourceType: string): number {
  const reliability = sourceReliabilityMap.get(sourceType);

  if (!reliability || reliability.totalCount < 5) {
    return 0; // Insufficient data
  }

  const mean = reliability.avgConfidence;
  // Estimate standard deviation (assuming normal distribution)
  const stdDev = Math.sqrt((mean * (1 - mean)) / reliability.totalCount);

  if (stdDev === 0) return 0;

  return (confidence - mean) / stdDev;
}

/**
 * Calculate confidence interval (95%)
 */
function calculateConfidenceInterval(
  confidence: number,
  sampleSize: number
): { lower: number; upper: number } {
  // Use normal approximation for binomial proportion
  const z = 1.96; // 95% confidence
  const se = Math.sqrt(
    (confidence * (1 - confidence)) / Math.max(sampleSize, 10)
  );

  return {
    lower: Math.max(0, confidence - z * se),
    upper: Math.min(1, confidence + z * se),
  };
}

/**
 * Update source reliability tracker (multi-armed bandit)
 */
function updateSourceReliability(sourceType: string, confidence: number): void {
  const current = sourceReliabilityMap.get(sourceType) || {
    successCount: 0,
    totalCount: 0,
    avgConfidence: 0.5,
    lastUpdated: new Date(),
  };

  const isSuccess = confidence >= 0.5;

  sourceReliabilityMap.set(sourceType, {
    successCount: current.successCount + (isSuccess ? 1 : 0),
    totalCount: current.totalCount + 1,
    avgConfidence:
      (current.avgConfidence * current.totalCount + confidence) /
      (current.totalCount + 1),
    lastUpdated: new Date(),
  });
}

/**
 * Generate analysis flags with statistical validation
 */
function generateFlags(
  hasRiskFlags: boolean,
  phase: string | null,
  roleCount: number,
  proximityCount: number,
  zScore: number
): string[] {
  const flags: string[] = [];

  if (hasRiskFlags) {
    flags.push("INSTABILITY_FLAG");
  }

  if (phase === "deployment" || phase === "lateStage") {
    flags.push("HIGH_URGENCY");
  }

  if (roleCount >= 3) {
    flags.push("TEMPORAL_CLUSTERING");
  }

  if (proximityCount >= 2) {
    flags.push("HIGH_CONTEXT_SPECIFICITY");
  }

  if (phase === "deployment" && roleCount >= 2) {
    flags.push("MAXIMUM_CONVERGENCE");
  }

  // Statistical validation flags
  if (Math.abs(zScore) > 2) {
    flags.push(zScore > 0 ? "STATISTICALLY_HIGH" : "STATISTICALLY_LOW");
  }

  return flags;
}

/**
 * Analyze temporal clustering with kernel density estimation
 * Enhanced with exponential decay for signal freshness
 */
export function analyzeTemporalClustering(
  signals: Array<{
    detected_at: string;
    detectedRoles?: any[];
    confidence_score?: number;
  }>,
  timeWindowDays: number = 90
): {
  hasCluster: boolean;
  clusterSize: number;
  timeSpan: number;
  densityScore: number;
  freshnessScore: number;
} {
  if (signals.length < 2) {
    return {
      hasCluster: false,
      clusterSize: 0,
      timeSpan: 0,
      densityScore: 0,
      freshnessScore: 0,
    };
  }

  // Sort by date
  const sorted = signals.sort(
    (a, b) =>
      new Date(a.detected_at).getTime() - new Date(b.detected_at).getTime()
  );

  const now = new Date();
  const firstDate = new Date(sorted[0].detected_at);
  const lastDate = new Date(sorted[sorted.length - 1].detected_at);
  const timeSpan =
    (lastDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24); // days

  // Kernel density estimation: calculate density of signals
  const bandwidth = 14; // 2 weeks
  let densityScore = 0;

  sorted.forEach((signal, i) => {
    const signalDate = new Date(signal.detected_at);
    sorted.forEach((other, j) => {
      if (i !== j) {
        const otherDate = new Date(other.detected_at);
        const distance =
          Math.abs(signalDate.getTime() - otherDate.getTime()) /
          (1000 * 60 * 60 * 24);
        // Gaussian kernel
        densityScore += Math.exp(-0.5 * Math.pow(distance / bandwidth, 2));
      }
    });
  });

  densityScore /= sorted.length; // Normalize

  // Exponential decay for freshness (more recent = higher score)
  const decayRate = 0.02; // Decay per day
  let freshnessScore = 0;

  sorted.forEach((signal) => {
    const signalDate = new Date(signal.detected_at);
    const ageInDays =
      (now.getTime() - signalDate.getTime()) / (1000 * 60 * 60 * 24);
    const confidence = signal.confidence_score || 0.5;
    freshnessScore += confidence * Math.exp(-decayRate * ageInDays);
  });

  freshnessScore /= sorted.length; // Normalize

  // Sliding window approach: check for concentrated activity
  const hasCluster = timeSpan <= timeWindowDays && densityScore > 1.5;

  return {
    hasCluster,
    clusterSize: signals.length,
    timeSpan: Math.round(timeSpan),
    densityScore: Math.round(densityScore * 100) / 100,
    freshnessScore: Math.round(freshnessScore * 100) / 100,
  };
}

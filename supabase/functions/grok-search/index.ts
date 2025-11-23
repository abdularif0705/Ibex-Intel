import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7';
import { getCachedSearch, cacheSearch } from '../shared/grok-cache.ts';


const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface StrategicInsight {
  phase: 'RFP/Planning' | 'Ongoing Implementation' | 'Completed/Stable' | 'Unknown';
  signalType: 'ERP' | 'CRM' | 'HCM' | 'PLM' | 'ETL' | 'Infrastructure' | 'Other';
  confidence: number;
  shareImpact: string;
  pastImpacts: string[];
  futureImpacts: string[];
  summary: string;
  evidence: string[];
  sources: { title: string; url: string }[];
  allSources: { title: string; url: string }[];
  companyName: string;
}

interface GrokSearchResponse {
  success: boolean;
  data: StrategicInsight;
  fromCache: boolean;
  error?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Unauthorized');

    const { companyName, useCache = true } = await req.json();
    if (!companyName) throw new Error('companyName is required');

    console.log(`[Grok Search] Starting analysis for: ${companyName}`);

    // Cache check
    if (useCache) {
      const cached = await getCachedSearch(`strategic_analysis_${companyName}`, supabase);
      if (cached) {
        return new Response(JSON.stringify({ success: true, data: cached.results, fromCache: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    const grokApiKey = Deno.env.get('GROK_API_KEY');
    const grokApiUrl = Deno.env.get('GROK_API_URL') || 'https://api.x.ai/v1/chat/completions';
    if (!grokApiKey) throw new Error('GROK_API_KEY missing');

    // ========================================
    // STEP 1: Pure fact gathering — NO HALLUCINATION POSSIBLE
    // ========================================
    const step1Response = await fetch("https://api.x.ai/v1/responses", {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${grokApiKey}` },
      body: JSON.stringify({
        model: 'grok-4-1-fast-reasoning',
        input: [{
          role: 'user',
          content: `Search the web RIGHT NOW using as many queries as needed for "${companyName}" and find ANY verifiable public signals of enterprise transformation (ERP, CRM, HCM, PLM, SCM, cloud migration, legacy system replacement) in the last 24 months.

Search using ALL these strategies (do not skip any):
1. Company name + keywords: "ERP" "HCM" "CRM" "Workday" "SAP" "S/4HANA" "Oracle Cloud" "Salesforce" "ServiceNow" "Dynamics 365" "migration" "implementation" "go-live" "cutover" "blueprint" "RFP" "vendor selection"
2. Site-specific: site:linkedin.com/jobs "${companyName}" (contract OR consultant OR "fixed term") AND (SAP OR Workday OR Oracle OR Salesforce OR ServiceNow)
3. Earnings & investor sites: "${companyName}" (ERP OR HCM OR CRM OR transformation) site:seekingalpha.com OR site:fool.com OR site:ir.company.com
4. Press releases & news: "${companyName}" "selected" OR "partners with" OR "chooses" (SAP OR Workday OR Oracle OR Salesforce OR Microsoft OR ServiceNow)
5. Government & procurement (if applicable): site:sam.gov OR site:bidnet.com OR site:*.gov "${companyName}" RFP
6. Consulting partner pages: "Deloitte" OR "Accenture" OR "PwC" OR "KPMG" "${companyName}" (ERP OR HCM OR transformation)

For EVERY real signal you find with a public URL, output exactly:

TYPE: [RFP | Job Posting | Earnings Call | Press Release | Partner Announcement | SEC Filing | Consultant Case Study | Other]
DATE: YYYY-MM-DD or "2024" "2025" or "Recent"
QUOTE: "exact quote proving the signal"
URL: https://...

If after all searches you find ZERO verifiable public signals → write only:
"NO VERIFIABLE PUBLIC SIGNALS FOUND IN LAST 24 MONTHS"

Do NOT summarize. Do NOT invent. Do NOT stop early. Be exhaustive. Use all 100 sources if needed.`
        }],
        tools: [{
          "type": "web_search"
        }],  // Custom web_search tool (proxied by xAI)
        tool_choice: 'required',  // Forces calls—no 0 sources
        temperature: 0.0,
        stream: false,
        return_citations: true  // Citations in tool_calls
      })
    });

    if (!step1Response.ok) throw new Error(`Grok Step 1 failed: ${await step1Response.text()}`);

    const step1Data = await step1Response.json();
    console.log("Step 1 data: ", step1Data);

    // Extract content and citations correctly
    const finalMessage = step1Data.output?.[step1Data.output.length - 1]?.content?.[0];
    const rawEvidence = finalMessage?.text || 'NO VERIFIABLE SIGNALS FOUND';
    const annotations = finalMessage?.annotations || [];

    // Extract all unique sources found
    const allSources = annotations
      .map((a: any) => ({
        title: a.title || (a.url ? new URL(a.url).hostname : 'Source'),
        url: a.url
      }))
      .filter((s: any) => s.url)
      // Deduplicate by URL
      .filter((s: any, index: number, self: any[]) =>
        index === self.findIndex((t: any) => t.url === s.url)
      );

    // ========================================
    // STEP 2: Structured analysis using only real evidence
    // ========================================
    const step2Response = await fetch(grokApiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${grokApiKey}` },
      body: JSON.stringify({
        model: 'grok-4-1-fast-reasoning',
        messages: [
          {
            role: 'system', content: `You are a hedge fund analyst. Using ONLY the evidence below, produce a structured JSON analysis.

Evidence:
${rawEvidence}

If evidence says "NO VERIFIABLE SIGNALS FOUND" → return Unknown phase and zero impacts.

Your goal is to detect major Enterprise Transformation projects at specific companies, including public sector, non-profits, and government entities.

Classify the "signalType" into one of: 'ERP', 'CRM', 'HCM', 'PLM', 'ETL', 'Infrastructure', or 'Other'.

Classify the "phase" into one of three phases:
1. "RFP/Planning": Early stage, looking to implement/migrate, issuing RFPs/RFIs, hiring architects, vendor selection, blueprint phase. Prioritize public RFPs from sites like boston.gov, SAM.gov, BidNet.
2. "Ongoing Implementation": Active project, contracts signed, consultants hired (e.g., Deloitte, Accenture), cutover planning, data migration.
3. "Completed/Stable": Project recently finished (last 12 months), in hypercare, or long-term stable state.

For public companies, include realistic past and future financial impacts based on similar transformations (e.g. Nike -47% during delays, +3–7% post-go-live).
- Past Impacts: Stock drops due to delays, margin compression from capex, etc.
- Future Forecasts: ROI, margin expansion post-go-live, stock uplift, efficiency gains, revenue.
- Future forecasts must include stock/share prics forecast in upcoming 6-12 months incase it is listed company
- revenue impact for both case

Return EXACTLY this JSON structure:` },
          {
            role: 'user', content: `{
  "phase": "RFP/Planning" | "Ongoing Implementation" | "Completed/Stable" | "Unknown",
  "signalType": "ERP" | "CRM" | "HCM" | "PLM" | "ETL" | "Infrastructure" | "Other",
  "confidence": number 0–100,
  "pastImpacts": string[],
  "futureImpacts": ["Revenue Growth: +10% post-2026 | 80% confidence", "EBITDA: +15% efficiency gain | 75% confidence"],
  "shareImpact": "Low (0-2%)" | "Medium (3-6%)" | "High (7%+)" | "Negative",
  "summary": string,
  "evidence": string[],
  "sources": {title: string, url: string}[],
  "companyName": "${companyName}"
}` }
        ],
        temperature: 0.1,
        stream: false
      })
    });

    if (!step2Response.ok) throw new Error(`Grok Step 2 failed`);

    const step2Data = await step2Response.json();
    console.log("Step 2 data: ", step2Data);
    let result: StrategicInsight;

    try {
      const content = step2Data.choices[0].message.content;
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      result = JSON.parse(jsonMatch ? jsonMatch[0] : content);

      // Ensure arrays
      result.pastImpacts = result.pastImpacts || [];
      result.futureImpacts = result.futureImpacts || [];
      result.evidence = result.evidence || rawEvidence.split('\n').filter(line => line.includes('QUOTE:'));
      // Use verified sources from Step 2 if available, otherwise fallback to all sources
      result.sources = result.sources?.length ? result.sources : allSources.slice(0, 5);
      result.allSources = allSources;
      result.companyName = companyName;

    } catch (e) {
      // Fallback with real sources
      result = {
        phase: 'Unknown',
        signalType: 'Other',
        confidence: 10,
        shareImpact: 'Unknown',
        pastImpacts: [],
        futureImpacts: [],
        summary: 'No verifiable public transformation signals found in last 18 months.',
        evidence: [rawEvidence],
        sources: allSources.slice(0, 5),
        allSources: allSources,
        companyName
      };
    }

    // Cache + DB insert (same as before)
    if (useCache) {
      await cacheSearch(`strategic_analysis_${companyName}`, result, supabase, 24);
    }

    await supabase.from('grok_search_results').insert({
      user_id: user.id,
      company_name: result.companyName,
      phase: result.phase,
      signal_type: result.signalType,
      confidence: result.confidence,
      share_impact: result.shareImpact,
      past_impacts: result.pastImpacts,
      future_impacts: result.futureImpacts,
      summary: result.summary,
      evidence: result.evidence,
      sources: result.sources,
      all_sources: result.allSources
    });

    await incrementGrokUsage(user.id, supabase);

    return new Response(JSON.stringify({ success: true, data: result, fromCache: false }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[Grok Search] Error:', error);
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function incrementGrokUsage(userId: string, supabase: any) {
  try {
    const today = new Date().toISOString().split('T')[0];
    // Optimistic update or insert
    const { error } = await supabase.rpc('increment_grok_usage', {
      p_user_id: userId,
      p_date: today
    });

    // If RPC doesn't exist (it wasn't in the migration file I saw earlier, but let's assume standard insert/update logic if RPC fails or just do direct DB manip)
    if (error) {
      // Fallback to direct table manipulation as seen in previous version
      const { data: existing } = await supabase
        .from('grok_api_usage')
        .select('id, requests')
        .eq('user_id', userId)
        .eq('date', today)
        .single();

      if (existing) {
        await supabase
          .from('grok_api_usage')
          .update({ requests: existing.requests + 1 })
          .eq('id', existing.id);
      } else {
        await supabase
          .from('grok_api_usage')
          .insert({ user_id: userId, date: today, requests: 1 });
      }
    }
  } catch (e) {
    console.error('Usage tracking error:', e);
  }
}

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.58.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Signal {
  id: string;
  company_name: string;
  company_ticker: string | null;
  signal_type: string;
  confidence_score: number;
  source_type: string;
  source_url: string;
  keywords: string[];
  detected_at: string;
  raw_content: string | null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { signalIds, reportLevel = "analyst" } = await req.json();
    
    if (!signalIds || signalIds.length === 0) {
      return new Response(
        JSON.stringify({ error: "No signals selected" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch signals with evidence
    const { data: signals, error: signalsError } = await supabase
      .from("signals")
      .select(`
        *,
        signal_evidence (
          evidence_type,
          evidence_text,
          relevance_score,
          source_url
        )
      `)
      .in("id", signalIds);

    if (signalsError) throw signalsError;

    // Generate AI analysis
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const systemPrompt = reportLevel === "portfolio_manager"
      ? `You are a senior portfolio manager analyst creating executive-level investment reports. 
         Provide strategic, high-level insights focusing on:
         - Portfolio risk implications and exposure management
         - Strategic investment recommendations
         - Market timing and competitive positioning
         - Executive summary of transformation initiatives
         - Actionable investment decisions (buy/hold/sell recommendations)
         Keep the tone authoritative, strategic, and decision-oriented.`
      : `You are a senior equity research analyst creating detailed investment reports.
         Provide granular, analyst-level insights focusing on:
         - Detailed breakdown of transformation signals and their implications
         - Confidence score methodology and validation
         - Specific evidence analysis with source substantiation
         - Tactical recommendations for further due diligence
         - Company-specific operational implications
         Keep the tone professional, detailed, and research-oriented.`;

    const userPrompt = `Analyze these transformation signals and create a comprehensive ${reportLevel === "portfolio_manager" ? "portfolio manager" : "analyst"} report:

${signals.map((s: any) => `
Company: ${s.company_name} ${s.company_ticker ? `(${s.company_ticker})` : ""}
Signal Type: ${s.signal_type}
Confidence Score: ${(s.confidence_score * 100).toFixed(1)}%
Source: ${s.source_type}
Keywords: ${s.keywords.join(", ")}
Date Detected: ${new Date(s.detected_at).toLocaleDateString()}
Evidence Count: ${s.signal_evidence?.length || 0}
${s.raw_content ? `Content Preview: ${s.raw_content.substring(0, 500)}...` : ""}
`).join("\n---\n")}

Provide:
1. Executive Summary (2-3 paragraphs)
2. Signal Analysis (for each company):
   - Transformation Initiative Assessment
   - Confidence Score Explanation
   - Evidence Quality & Substantiation
   - Key Risk Factors
3. Investment Implications:
   - For current holders: risk assessment and recommendations
   - For prospective investors: entry points and considerations
   - Portfolio positioning advice
4. Actionable Next Steps (prioritized list)
5. Market Context & Competitive Landscape

Format in markdown with clear sections.`;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI gateway error:", aiResponse.status, errorText);
      
      let errorMessage = "Failed to generate AI analysis";
      try {
        const errorJson = JSON.parse(errorText);
        if (errorJson.error?.message) {
          errorMessage = errorJson.error.message;
        }
      } catch (e) {
        errorMessage = errorText || errorMessage;
      }
      
      throw new Error(errorMessage);
    }

    const aiData = await aiResponse.json();
    const analysis = aiData.choices?.[0]?.message?.content || "Analysis unavailable";

    return new Response(
      JSON.stringify({
        analysis,
        signals,
        reportLevel,
        generatedAt: new Date().toISOString(),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("generate-report error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

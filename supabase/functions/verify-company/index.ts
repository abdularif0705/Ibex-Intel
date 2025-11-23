import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.58.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CompanyInfo {
  name: string;
  ticker: string | null;
  website: string | null;
  industry: string | null;
  location: string | null;
  type: 'public' | 'private' | 'municipality' | 'unknown';
  confidence: number;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { companyName, ticker } = await req.json();
    
    if (!companyName && !ticker) {
      return new Response(
        JSON.stringify({ error: "Either companyName or ticker is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    // Build search query
    let searchQuery = ticker 
      ? `${ticker} stock ticker company information` 
      : `${companyName} company official website headquarters`;

    console.log(`Verifying company: ${searchQuery}`);

    // Search for company information
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `You are a company verification assistant. Extract accurate company information from web searches.
Return a JSON object with these fields:
- name: Official company name
- ticker: Stock ticker symbol (null if private/municipality)
- website: Official website URL
- industry: Primary industry/sector
- location: Headquarters location
- type: "public", "private", "municipality", or "unknown"
- confidence: 0-1 score for data accuracy

If you cannot find the company, set confidence to 0.`
          },
          {
            role: "user",
            content: `Search for information about: ${searchQuery}\n\nReturn verified company information as JSON.`
          }
        ],
        tools: [{
          type: "function",
          function: {
            name: "return_company_info",
            description: "Return verified company information",
            parameters: {
              type: "object",
              properties: {
                name: { type: "string" },
                ticker: { type: ["string", "null"] },
                website: { type: ["string", "null"] },
                industry: { type: ["string", "null"] },
                location: { type: ["string", "null"] },
                type: { type: "string", enum: ["public", "private", "municipality", "unknown"] },
                confidence: { type: "number", minimum: 0, maximum: 1 }
              },
              required: ["name", "ticker", "website", "industry", "location", "type", "confidence"],
              additionalProperties: false
            }
          }
        }],
        tool_choice: { type: "function", function: { name: "return_company_info" } }
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI gateway error:", aiResponse.status, errorText);
      
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: "Rate limit exceeded. Please try again later.",
            code: 429
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: "AI credits exhausted. You can proceed without AI verification.",
            code: 402
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Failed to verify company information. You can proceed without AI verification.",
          code: aiResponse.status
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiData = await aiResponse.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    
    if (!toolCall) {
      throw new Error("No company information found");
    }

    const companyInfo: CompanyInfo = JSON.parse(toolCall.function.arguments);
    
    console.log("Company verified:", companyInfo);

    return new Response(
      JSON.stringify({ 
        success: true,
        company: companyInfo
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("verify-company error:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Unknown error",
        success: false
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

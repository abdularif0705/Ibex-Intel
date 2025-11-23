import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Web search function tool definition
const webSearchTool = {
  type: "function",
  function: {
    name: "web_search",
    description: "Search the internet for current information, news, company data, market trends, or any real-time information. Use this when you need up-to-date information that may not be in your training data.",
    parameters: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "The search query to look up on the internet"
        }
      },
      required: ["query"],
      additionalProperties: false
    }
  }
};

async function performWebSearch(query: string): Promise<string> {
  try {
    const BRAVE_API_KEY = Deno.env.get("BRAVE_API_KEY");
    
    if (!BRAVE_API_KEY) {
      console.log("No Brave API key, falling back to basic search");
      return `I don't have access to live web search at the moment. However, I can help you understand this topic based on my training data up to my knowledge cutoff.`;
    }

    const response = await fetch(`https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}&count=5`, {
      headers: {
        "Accept": "application/json",
        "X-Subscription-Token": BRAVE_API_KEY
      }
    });

    if (!response.ok) {
      throw new Error(`Search API error: ${response.status}`);
    }

    const data = await response.json();
    const results = data.web?.results || [];
    
    if (results.length === 0) {
      return "No search results found for this query.";
    }

    const searchSummary = results
      .slice(0, 5)
      .map((r: any, i: number) => `${i + 1}. ${r.title}\n   ${r.description}\n   Source: ${r.url}`)
      .join("\n\n");

    return `Here are the top search results:\n\n${searchSummary}`;
  } catch (error) {
    console.error("Web search error:", error);
    return `I encountered an error while searching. I'll provide an answer based on my existing knowledge instead.`;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    // Verify authentication
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Authentication required" }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Verify the JWT token
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.error("Auth verification failed:", authError);
      return new Response(JSON.stringify({ error: "Invalid authentication" }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log("Authenticated user:", user.id);

    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // Enhanced system prompt with web search capability
    const systemPrompt = `You are an expert financial analyst AI assistant with access to real-time internet search. 

Key capabilities:
- Access current market data, company news, and industry trends via web search
- Analyze SAAS transformation signals and implementation projects
- Provide investment recommendations and due diligence guidance
- Research vendors, technologies, and competitive landscapes

When you need current information (stock prices, recent news, company updates, market trends), use the web_search tool to get real-time data.

Always provide clear, actionable insights with proper citations when using web search results.`;

    let conversationMessages = [
      { role: "system", content: systemPrompt },
      ...messages
    ];

    // First call to check if AI wants to use tools
    const initialResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: conversationMessages,
        tools: [webSearchTool],
        stream: false,
      }),
    });

    if (!initialResponse.ok) {
      throw new Error(`Initial AI call failed: ${initialResponse.status}`);
    }

    const initialData = await initialResponse.json();
    const choice = initialData.choices?.[0];
    const toolCalls = choice?.message?.tool_calls;

    // If AI wants to use web search, execute it
    if (toolCalls && toolCalls.length > 0) {
      console.log("AI requested web search:", toolCalls);
      
      for (const toolCall of toolCalls) {
        if (toolCall.function.name === "web_search") {
          const args = JSON.parse(toolCall.function.arguments);
          const searchResults = await performWebSearch(args.query);
          
          // Add the tool call and result to conversation
          conversationMessages.push({
            role: "assistant",
            content: null,
            tool_calls: [toolCall]
          } as any);
          
          conversationMessages.push({
            role: "tool",
            tool_call_id: toolCall.id,
            content: searchResults
          } as any);
        }
      }
    }

    // Final streaming response with or without tool results
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: conversationMessages,
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limits exceeded, please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required, please add funds to your Lovable AI workspace." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

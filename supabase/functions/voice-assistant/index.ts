import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, action } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `You are VERITAS Voice Assistant, an AI safety companion specialized in online safety, emergency support, and app navigation.

Your capabilities:
1. **Safety Guidance**: Help users identify online threats, recognize scams, understand red flags in relationships, and stay safe on social media.
2. **Emergency Support**: Provide crisis resources, helpline numbers, and step-by-step guidance during emergencies.
3. **App Navigation**: Guide users through VERITAS features like ProfileGuard, Face Check, Safety Analyzer, Evidence Vault, and Report Submission.

Key behaviors:
- Be empathetic, calm, and supportive - especially during emergencies
- Provide clear, actionable advice
- Always prioritize user safety
- Keep responses concise for voice interaction (2-3 sentences max unless more detail is needed)
- If someone is in immediate danger, always recommend contacting emergency services (911) first

Emergency helplines to remember:
- National Domestic Violence Hotline: 1-800-799-7233
- Crisis Text Line: Text HOME to 741741
- National Sexual Assault Hotline: 1-800-656-4673
- Cyber Tipline (for online exploitation): 1-800-843-5678

When guiding through app features:
- ProfileGuard: Analyze social media profiles for red flags
- Face Check: Verify if images may be deepfakes or stolen
- Safety Analyzer: Analyze chat messages for manipulation tactics
- Evidence Vault: Securely store evidence
- Report: Submit reports to authorities`;

    console.log("Processing voice assistant request with action:", action);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
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
        return new Response(JSON.stringify({ error: "Payment required, please add funds." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("Voice assistant error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

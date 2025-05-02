
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import 'https://deno.land/x/xhr@0.1.0/mod.ts';

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageUrl } = await req.json();
    
    // Call OpenAI API to analyze the image
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          { 
            role: 'system', 
            content: 'You are an AI assistant that specializes in analyzing profile images for potential scammer indicators. You should look for signs of AI generation, stock photos, or other red flags common in fake profiles. Provide a detailed analysis and risk score (low, medium, high).'
          },
          { 
            role: 'user', 
            content: [
              { 
                type: "text", 
                text: "Analyze this profile image for signs it might be used by a scammer or is AI-generated:" 
              },
              { 
                type: "image_url", 
                image_url: { url: imageUrl } 
              }
            ]
          }
        ],
        temperature: 0.5,
      }),
    });

    const data = await response.json();
    const analysisResult = data.choices[0].message.content;
    
    return new Response(JSON.stringify({ 
      analysis: analysisResult,
      // Simple logic to extract risk level
      riskLevel: analysisResult.toLowerCase().includes('high risk') ? 'high' : 
                analysisResult.toLowerCase().includes('medium risk') ? 'medium' : 'low'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in facial recognition function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

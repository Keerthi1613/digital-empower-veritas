
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
    if (!openAIApiKey) {
      throw new Error('OPENAI_API_KEY is not set');
    }

    const { imageUrl } = await req.json();
    console.log("Received image URL for analysis:", imageUrl);
    
    if (!imageUrl) {
      throw new Error('No image URL provided');
    }
    
    console.log("Calling OpenAI API for image analysis");
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

    if (!response.ok) {
      const errorData = await response.text();
      console.error("OpenAI API error:", response.status, errorData);
      throw new Error(`OpenAI API error: ${response.status} - ${errorData}`);
    }

    const data = await response.json();
    console.log("OpenAI API response received");
    
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      console.error("Unexpected API response format:", data);
      throw new Error('Unexpected API response format');
    }
    
    const analysisResult = data.choices[0].message.content;
    console.log("Analysis complete:", analysisResult.substring(0, 100) + "...");
    
    // Simple logic to extract risk level
    let riskLevel = 'low';
    if (analysisResult.toLowerCase().includes('high risk')) {
      riskLevel = 'high';
    } else if (analysisResult.toLowerCase().includes('medium risk')) {
      riskLevel = 'medium';
    }
    
    return new Response(JSON.stringify({ 
      analysis: analysisResult,
      riskLevel: riskLevel
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in facial recognition function:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      details: 'There was an error analyzing the image'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});


import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import 'https://deno.land/x/xhr@0.1.0/mod.ts';

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

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

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Supabase credentials are not set');
    }
    
    // Create Supabase client with service role key for admin access
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Make sure storage buckets exist
    try {
      const { data: buckets } = await supabase.storage.listBuckets();
      
      // Check if vault-files bucket exists
      const vaultBucket = buckets?.find(bucket => bucket.name === 'vault-files');
      if (!vaultBucket) {
        console.log("Creating vault-files bucket");
        const { error } = await supabase.storage.createBucket('vault-files', {
          public: false,
          fileSizeLimit: 10485760, // 10MB file size limit
        });
        if (error) {
          console.error("Error creating vault-files bucket:", error);
        } else {
          console.log("vault-files bucket created successfully");
        }
      }
      
      // Check if profile-images bucket exists
      const profileBucket = buckets?.find(bucket => bucket.name === 'profile-images');
      if (!profileBucket) {
        console.log("Creating profile-images bucket");
        const { error } = await supabase.storage.createBucket('profile-images', {
          public: true, // Make this bucket public for profile images
          fileSizeLimit: 5242880, // 5MB file size limit
        });
        if (error) {
          console.error("Error creating profile-images bucket:", error);
        } else {
          console.log("profile-images bucket created successfully");
        }
      }
    } catch (error) {
      console.error("Error checking/creating buckets:", error);
    }

    const { imageUrl } = await req.json();
    console.log("Received image URL for analysis:", imageUrl);
    
    if (!imageUrl) {
      throw new Error('No image URL provided');
    }
    
    console.log("Calling OpenAI API for image analysis");
    
    try {
      // Call OpenAI API to analyze the image with enhanced expert prompt
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
              content: `You are an expert forensic image analyst specializing in detecting AI-generated images. 
              Your task is to analyze profile photos with extreme precision, looking ONLY for definitive evidence of AI generation.
              
              IMPORTANT: Default to assuming images are authentic unless there is CLEAR evidence otherwise.
              
              Look for these specific AI indicators:
              1. Unnatural eye asymmetry or iris inconsistencies
              2. Bizarre teeth, finger or ear formations
              3. Impossible physics or lighting inconsistencies
              4. Background distortions or impossible architecture
              5. Unusual skin textures or hair patterns that defy natural growth
              
              Never classify based on:
              - Image quality (real photos can be low quality)
              - Normal photo editing (filters, lighting adjustments, etc.)
              - Normal asymmetry found in real faces
              - Cultural unfamiliarity or unusual but possible features
              
              Report format:
              - Analysis: Detailed examination highlighting specific observations
              - Risk Level: Low (authentic), Medium (suspicious but uncertain), High (clearly AI-generated)
              - Only assign "High" risk with overwhelming evidence`
            },
            { 
              role: 'user', 
              content: [
                { 
                  type: "text", 
                  text: "Analyze this profile image carefully. Is it an authentic photograph or AI-generated? Provide specific visual evidence and avoid false positives. Most photos people upload are authentic." 
                },
                { 
                  type: "image_url", 
                  image_url: { url: imageUrl } 
                }
              ]
            }
          ],
          temperature: 0.2, // Even lower temperature for more consistent, conservative results
        }),
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error("OpenAI API error:", response.status, errorData);
        
        // Check for quota exceeded error
        if (errorData.includes("quota") || errorData.includes("billing") || response.status === 429) {
          return new Response(JSON.stringify({ 
            error: "OpenAI API quota exceeded. Please try again later or contact the administrator to update the API key.",
            analysis: "Unable to analyze image due to API quota limitations. The service is temporarily unavailable.",
            riskLevel: "medium" // Default to medium when we can't analyze
          }), {
            status: 200, // Return 200 to the client so the app can handle this gracefully
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        
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
      
      // Enhanced classification logic with strong bias toward authentic classification
      let riskLevel = 'low'; // Default to low - assume real unless proven otherwise
      const lowerCaseAnalysis = analysisResult.toLowerCase();
      
      // Only flag as high risk if explicitly mentioned with strong evidence
      if (lowerCaseAnalysis.includes('high risk') && 
          (lowerCaseAnalysis.includes('clearly ai-generated') || 
           lowerCaseAnalysis.includes('definitely synthetic') || 
           lowerCaseAnalysis.includes('unmistakable signs'))) {
        riskLevel = 'high';
      } 
      // Only flag medium if there are specific suspicious elements noted
      else if (lowerCaseAnalysis.includes('medium risk') && 
              (lowerCaseAnalysis.includes('suspicious elements') || 
               lowerCaseAnalysis.includes('some indicators') ||
               lowerCaseAnalysis.includes('possible ai artifacts'))) {
        riskLevel = 'medium';
      }
      
      // Strong override checks for authentic images
      if ((riskLevel !== 'low') && 
          (lowerCaseAnalysis.includes('appears authentic') || 
           lowerCaseAnalysis.includes('likely real person') || 
           lowerCaseAnalysis.includes('genuine portrait') ||
           lowerCaseAnalysis.includes('natural facial features') ||
           lowerCaseAnalysis.includes('no clear indicators of ai'))) {
        riskLevel = 'low';
      }
      
      // Final confidence check - if uncertainty is expressed, lean toward "low"
      if (riskLevel !== 'low' && 
          (lowerCaseAnalysis.includes('cannot be certain') ||
           lowerCaseAnalysis.includes('difficult to determine') ||
           lowerCaseAnalysis.includes('not conclusive'))) {
        riskLevel = 'low';
      }
      
      return new Response(JSON.stringify({ 
        analysis: analysisResult,
        riskLevel: riskLevel
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } catch (openAIError) {
      console.error('Error with OpenAI API:', openAIError);
      
      // Handle API key errors gracefully
      if (openAIError.message.includes('quota') || openAIError.message.includes('billing')) {
        return new Response(JSON.stringify({ 
          error: "OpenAI API quota exceeded. Please try again later or contact the administrator to update the API key.",
          analysis: "Unable to analyze image due to API quota limitations. The service is temporarily unavailable.",
          riskLevel: "medium" // Default to medium when we can't analyze
        }), {
          status: 200, // Return 200 to the client so the app can handle this gracefully
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      throw openAIError; // Re-throw for general error handling
    }
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

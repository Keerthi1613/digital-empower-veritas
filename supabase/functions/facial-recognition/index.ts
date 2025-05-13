
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

// Configure API request retry settings
const MAX_RETRIES = 2;
const RETRY_DELAY = 1000; // 1 second

async function retryFetch(url, options, retries = MAX_RETRIES, delay = RETRY_DELAY) {
  try {
    const response = await fetch(url, options);
    
    // If rate limited, wait and retry
    if (response.status === 429 && retries > 0) {
      console.log(`Rate limited. Retrying in ${delay}ms. Retries left: ${retries}`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return retryFetch(url, options, retries - 1, delay * 2);
    }
    
    return response;
  } catch (error) {
    if (retries > 0) {
      console.log(`Fetch error: ${error.message}. Retrying in ${delay}ms. Retries left: ${retries}`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return retryFetch(url, options, retries - 1, delay * 2);
    }
    throw error;
  }
}

function getFallbackAnalysis(imageUrl) {
  // Create a fallback analysis if the AI service is unavailable
  return {
    analysis: "We were unable to perform a detailed analysis at this time due to high demand. Here are some general tips for identifying fake profiles:\n\n" +
      "1. Look for inconsistencies in facial features\n" +
      "2. Check for unnatural backgrounds or lighting\n" +
      "3. Look for unusual artifacts around edges of the image\n" +
      "4. Consider the context of how you received this image\n\n" +
      "We recommend being cautious and looking for other verification before trusting profiles with suspicious characteristics.",
    riskLevel: "medium",
    isFallback: true
  };
}

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
      // Call OpenAI API with retry mechanism
      const response = await retryFetch('https://api.openai.com/v1/chat/completions', {
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
        
        // Check for quota or rate limit errors
        if (errorData.includes("quota") || errorData.includes("billing") || response.status === 429) {
          console.log("API quota or rate limit exceeded, using fallback analysis");
          const fallback = getFallbackAnalysis(imageUrl);
          return new Response(JSON.stringify(fallback), {
            status: 200,
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
      
      // Record the analysis result in the database for future reference (optional)
      try {
        const { error } = await supabase.from('image_analyses').insert({
          image_url: imageUrl,
          risk_level: riskLevel,
          analysis: analysisResult,
          created_at: new Date()
        }).maybeSingle();
        
        if (error) {
          console.error("Error storing analysis result:", error);
          // Continue anyway - this is non-critical
        }
      } catch (dbError) {
        console.error("Database error when storing analysis:", dbError);
        // Continue anyway - this is non-critical
      }
      
      return new Response(JSON.stringify({ 
        analysis: analysisResult,
        riskLevel: riskLevel
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } catch (openAIError) {
      console.error('Error with OpenAI API:', openAIError);
      
      // Handle API key errors or network errors gracefully
      console.log("API error occurred, using fallback analysis");
      const fallback = getFallbackAnalysis(imageUrl);
      return new Response(JSON.stringify(fallback), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  } catch (error) {
    console.error('Error in facial recognition function:', error);
    
    // Return a user-friendly error with a fallback mechanism
    const fallback = getFallbackAnalysis("error");
    fallback.error = error.message;
    
    return new Response(JSON.stringify(fallback), {
      status: 200, // Return 200 even for errors to handle gracefully on client
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

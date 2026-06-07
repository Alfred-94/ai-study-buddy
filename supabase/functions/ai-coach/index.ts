import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req:Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 1. Destructure the custom document name sent by your AiCoach component
    const { message, documentName } = await req.json();
    const apiKey = Deno.env.get('GEMINI_API_KEY');
    
    // We get these standard variables directly from Supabase's environment
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';

    if (!apiKey) {
      return new Response(JSON.stringify({ reply: "Missing GEMINI_API_KEY cloud variable." }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    let documentContext = "";

    // 2. If a specific document is active, try to fetch it from your Supabase Storage bucket
    if (documentName && documentName !== 'General Study Guide' && documentName !== 'No document selected') {
      const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
      
      // We download the file from your storage bucket (assuming your bucket name is 'materials')
      const { data, error } = await supabaseClient
        .storage
        .from('materials') 
        .download(documentName);

      if (!error && data) {
        // Read the binary file data as readable text context
        const extractedText = await data.text();
        // Clean up text length to keep it inside Gemini's token limits safely
        documentContext = `\n[CONTEXT MATERIAL FROM UPLOADED DOCUMENT "${documentName}"]: \n${extractedText.substring(0, 15000)}\n`;
      } else {
        console.warn("Could not download file context from storage bucket:", error?.message);
      }
    }

    // 3. Assemble the prompt, injecting the study material context dynamically if it exists
    const targetUrl = `https://generatelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    
    const promptText = `You are an expert academic study assistant. 
    ${documentContext}
    Using the context above (if provided), answer this user query cleanly and thoroughly: ${message}`;

    const apiResponse = await fetch(targetUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: promptText }]
        }]
      })
    });

    const rawText = await apiResponse.text();
if (!rawText) throw new Error("Empty body from Google endpoint.");

// Handle HTML error responses (e.g. rate limit pages)
if (rawText.trim().startsWith('<')) {
  throw new Error("Gemini quota exceeded. Please wait a moment and try again.");
}

const data = JSON.parse(rawText);
    if (data.error) {
      return new Response(JSON.stringify({ reply: `Google API Error: ${data.error.message}` }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const botReply = data.candidates?.[0]?.content?.parts?.[0]?.text || "I was unable to assemble a readable text response.";

    return new Response(
      JSON.stringify({ reply: botReply }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({ reply: `Internal Edge Pipeline Failure: ${error.message}` }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
})
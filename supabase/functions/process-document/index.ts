import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.23.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle preflight requests cleanly
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { storagePath, bucketName } = await req.json();

    if (!storagePath || !bucketName) {
      return new Response(JSON.stringify({ error: "Missing storagePath or bucketName parameters" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);

    // Grab file from bucket storage instances directly
    const { data: fileBlob, error: downloadError } = await supabaseClient.storage
      .from(bucketName)
      .download(storagePath);

    if (downloadError) throw downloadError;

    const arrayBuffer = await fileBlob.arrayBuffer();
const bytes = new Uint8Array(arrayBuffer);
const raw = new TextDecoder('latin1').decode(bytes);

// Extract only readable strings from PDF binary
const matches = raw.match(/[^\x00-\x1F\x7F-\xFF]{4,}/g) || [];
let textContent = matches.join(' ').slice(0, 50000);

if (textContent.trim().length < 10) {
  textContent = `[Could not extract text from: ${storagePath.split('/').pop()}]`;
}

    return new Response(JSON.stringify({ text: textContent }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
 
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 200, // Return a friendly success response code so your UI doesn't crash on layout elements
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
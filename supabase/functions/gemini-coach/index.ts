import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-expected-format',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // accept fileUrl metadata parameters safely passed from the client context
    const { prompt, fileUrl, mimeType } = await req.json()
    const expectedFormat = req.headers.get('x-expected-format') || 'text'
    
    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')
    if (!GEMINI_API_KEY) throw new Error("Missing GEMINI_API_KEY")

    // 🎯 Change this line from: const parts = [{ text: prompt }]
    // ➔ To this (adds : any[]), which completely satisfies the compiler:
    const parts: any[] = [{ text: prompt }]

    // If a file link exists, fetch the raw external file bytes, transform to base64, and pass to Gemini
if (fileUrl) {
  const fileResponse = await fetch(fileUrl);
  const arrayBuffer = await fileResponse.arrayBuffer();

  // Convert buffer data vectors to standard base64 strings
  // Note: If running inside Deno/Supabase, make sure btoa is available globally or use standard buffer conversions
  const base64Data = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));

  // ✅ CORRECT FIX: Shift the properly structured object into the parts array
  parts.unshift({
    inlineData: {
      mimeType: mimeType || "application/pdf", // Falls back gracefully to PDF configurations
      data: base64Data
    }
  });
}

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts }] })
      }
    )

    const data = await response.json()
    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || ""

    if (expectedFormat === 'json-array') {
      const cleanJsonString = rawText.replace(/`json|```/g, "").trim()
      return new Response(cleanJsonString, { headers: corsHeaders, status: 200 })
    }

    return new Response(JSON.stringify(data), { headers: corsHeaders, status: 200 })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { headers: corsHeaders, status: 500 })
  }
})
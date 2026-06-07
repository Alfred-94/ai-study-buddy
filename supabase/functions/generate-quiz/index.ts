import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const apiKey = Deno.env.get('GEMINI_API_KEY');

    const prompt = `You are a strict test examination generator. Create 3 multiple choice questions testing knowledge on general educational study strategies. Return your answer ONLY as a raw JSON object with no markdown formatting or backticks. Follow this exact schema:
{
  "questions": [
    {
      "question": "The question string here?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswerIndex": 0
    }
  ]
}`;

    const apiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
      }
    );

    const rawData = await apiResponse.json();
    let textReply = rawData.candidates?.[0]?.content?.parts?.[0]?.text || "{}";

    textReply = textReply.replace(/`json/g, "").replace(/```/g, "").trim();
    const parsedQuiz = JSON.parse(textReply);

    return new Response(JSON.stringify(parsedQuiz), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
})
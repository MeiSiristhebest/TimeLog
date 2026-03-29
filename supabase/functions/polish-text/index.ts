import "jsr:@supabase/functions-js/edge-runtime.client-helpers";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { text } = await req.json();
    const apiKey = Deno.env.get("GEMINI_API_KEY");

    if (!text) {
      throw new Error("Missing 'text' parameter");
    }

    if (!apiKey) {
      throw new Error("Missing GEMINI_API_KEY");
    }

    const payload = {
      model: "models/gemini-1.5-flash",
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `You are a professional memoir editor. Your task is to take a transcript of an elderly person's spoken recording—which may contain grammatical errors, pauses, repetitions, and logical inconsistencies—and polish it into a beautiful piece of writing suitable for a printed commemorative book or memoir.

Requirements:
1. Maintain the first-person narrative tone.
2. Correct typos and grammatical errors, and remove oral fillers like "uh," "um," "well," etc.
3. Organize the logic to make paragraph transitions more natural.
4. IMPORTANT: Never change the original meaning or intent. Preserve the speaker's true emotions. Do not make it overly formal; keep it life-like and authentic.

Original Transcript:
${text}`
            }
          ]
        }
      ],
      generationConfig: {
        temperature: 0.4,
        maxOutputTokens: 2048,
      }
    };

    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    
    if (data.error) {
      throw new Error(data.error.message || "Failed to call Gemini API");
    }

    const polishedText = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!polishedText) {
      throw new Error("No output generated from Gemini");
    }

    return new Response(JSON.stringify({ polishedText }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

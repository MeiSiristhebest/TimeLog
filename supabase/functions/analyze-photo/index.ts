import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { GoogleGenerativeAI } from 'npm:@google/generative-ai';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AnalyzeRequest {
  base64Image: string;
  mimeType: string;
  language?: string;
}

interface AnalyzeResponse {
  questions: string[];
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Authenticate the user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    // Parse request
    const { base64Image, mimeType, language = 'en-US' }: AnalyzeRequest = await req.json();

    if (!base64Image || !mimeType) {
      throw new Error('Missing required image data');
    }

    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
    if (!geminiApiKey) {
      throw new Error('Gemini API key not configured');
    }

    // Initialize Gemini
    const genAI = new GoogleGenerativeAI(geminiApiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = `
    Analyze this photo. This app is designed for elderly users to record their life stories.
    Based on the objects, people, environment, or activities in the photo, generate exactly 3 highly engaging, warm, open-ended questions.
    These questions should encourage the elderly person to recall past memories and tell a story.
    
    CRITICAL: 
    - The language must be ${language}.
    - The output MUST be a valid JSON array of 3 strings. Example: ["Question 1?", "Question 2?", "Question 3?"]
    - Do NOT output any markdown blocks, do not output any surrounding text. ONLY the JSON array.
    `;

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: base64Image.replace(/^data:image\/(png|jpeg|webp);base64,/, ''),
          mimeType: mimeType,
        },
      },
    ]);

    const text = result.response.text();
    let questions: string[] = [];

    try {
      // Clean up potential markdown formatting from Gemini
      const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
      questions = JSON.parse(cleanJson);
      
      if (!Array.isArray(questions) || questions.length === 0) {
        throw new Error('Invalid JSON format returned from AI');
      }
      
      // Ensure we only have 3 questions maximum
      questions = questions.slice(0, 3);
    } catch (e) {
      console.error('Failed to parse Gemini output:', text);
      throw new Error('AI failed to generate parseable questions');
    }

    const response: AnalyzeResponse = { questions };

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('Error analyzing photo:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return new Response(
      JSON.stringify({
        error: errorMessage,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});

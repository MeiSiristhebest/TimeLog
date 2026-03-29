import "jsr:@supabase/functions-js/edge-runtime.client-helpers";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      {
        auth: {
          persistSession: false,
        },
      }
    );

    // Get Auth user (for RLS and user filtering)
    const authHeader = req.headers.get("Authorization")!;
    const {
      data: { user },
      error: userError,
    } = await createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: { headers: { Authorization: authHeader } },
      }
    ).auth.getUser();

    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { action, query, story_id, text } = await req.json();
    const apiKey = Deno.env.get("GEMINI_API_KEY");

    if (!apiKey) {
      throw new Error("Missing GEMINI_API_KEY");
    }

    if (action === "index") {
      // Generate embedding for a story
      if (!story_id || !text) {
        throw new Error("story_id and text are required for index action");
      }

      const embedRes = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "models/text-embedding-004",
            content: { parts: [{ text }] },
          }),
        }
      );

      const embedData = await embedRes.json();
      if (!embedData.embedding?.values) {
        throw new Error("Failed to generate embedding");
      }

      const { error: updateError } = await supabaseClient
        .from("stories")
        .update({ embedding: embedData.embedding.values })
        .eq("id", story_id)
        .eq("user_id", user.id); // Ensure user owns the story

      if (updateError) {
        throw updateError;
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } else if (action === "search") {
      // Search for stories
      if (!query) {
        throw new Error("query is required for search action");
      }

      const embedRes = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "models/text-embedding-004",
            content: { parts: [{ text: query }] },
          }),
        }
      );

      const embedData = await embedRes.json();
      if (!embedData.embedding?.values) {
        throw new Error("Failed to generate embedding for query");
      }

      // Call RPC match_stories
      const { data: matchedStories, error: matchError } = await supabaseClient.rpc(
        "match_stories",
        {
          query_embedding: embedData.embedding.values,
          match_threshold: 0.5,
          match_count: 10,
          user_id_filter: user.id,
        }
      );

      if (matchError) {
        throw matchError;
      }

      return new Response(JSON.stringify({ results: matchedStories }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } else {
      throw new Error("Invalid action. Must be 'index' or 'search'");
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

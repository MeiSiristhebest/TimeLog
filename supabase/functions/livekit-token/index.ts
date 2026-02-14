import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { AccessToken } from 'https://esm.sh/livekit-server-sdk@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TokenRequest {
  roomName: string;
  identity?: string;
  storyId?: string;
  topicText?: string;
  language?: string;
}

interface TokenResponse {
  token: string;
  url: string;
  expiresAt: number;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Extract JWT from Authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const token = authHeader.replace('Bearer ', '');

    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    // Verify JWT and get user (OFFICIAL RECOMMENDED METHOD)
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);

    if (userError || !user) {
      throw new Error('Invalid JWT');
    }

    // Parse request body
    const { roomName, identity, storyId, topicText, language }: TokenRequest = await req.json();

    if (!roomName) {
      throw new Error('Missing required field: roomName');
    }

    // Use authenticated user's ID as identity
    const userId = identity || user.id;

    // Get LiveKit credentials from environment
    const livekitApiKey = Deno.env.get('LIVEKIT_API_KEY');
    const livekitApiSecret = Deno.env.get('LIVEKIT_API_SECRET');
    const livekitUrl = Deno.env.get('LIVEKIT_URL');

    if (!livekitApiKey || !livekitApiSecret || !livekitUrl) {
      throw new Error('LiveKit credentials not configured');
    }

    const trimmedTopicText = topicText?.trim();
    const trimmedLanguage = language?.trim();
    const resolvedStoryId = storyId?.trim() || (roomName.startsWith('story_') ? roomName.slice(6) : roomName);

    const participantContext = {
      storyId: resolvedStoryId,
      topicText: trimmedTopicText,
      language: trimmedLanguage,
    };

    const attributes: Record<string, string> = {};
    if (participantContext.storyId) attributes.storyId = participantContext.storyId;
    if (participantContext.topicText) attributes.topicText = participantContext.topicText;
    if (participantContext.language) attributes.language = participantContext.language;

    // Create LiveKit access token
    const at = new AccessToken(livekitApiKey, livekitApiSecret, {
      identity: userId,
      // Token valid for 24 hours
      ttl: '24h',
      metadata: JSON.stringify(participantContext),
      attributes,
    });

    // Grant permissions
    at.addGrant({
      roomJoin: true,
      room: roomName,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true,
    });

    const livekitToken = await at.toJwt();

    // Calculate expiration (24 hours from now)
    const expiresAt = Date.now() + 24 * 60 * 60 * 1000;

    const response: TokenResponse = {
      token: livekitToken,
      url: livekitUrl,
      expiresAt,
    };

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});

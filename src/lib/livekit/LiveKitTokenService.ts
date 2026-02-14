/**
 * LiveKit Token Service
 * 
 * Manages LiveKit JWT tokens via Supabase Edge Functions.
 * Handles token fetching, caching, and refresh.
 */

import { supabase } from '@/lib/supabase';
import { ApiError } from '@/lib/api/types';

export interface LiveKitTokenResponse {
  token: string;
  url: string;
  expiresAt: number; // Unix timestamp
}

export interface LiveKitTokenRequest {
  roomName: string;
  identity: string;
  storyId?: string;
  topicText?: string;
  language?: string;
}

const TOKEN_REFRESH_BUFFER_MS = 5 * 60 * 1000; // Refresh 5 mins before expiry

export class LiveKitTokenService {
  private tokenCache: Map<string, LiveKitTokenResponse> = new Map();

  /**
   * Fetch LiveKit token from Supabase Edge Function
   */
  async fetchToken(request: LiveKitTokenRequest): Promise<LiveKitTokenResponse> {
    const cacheKey = `${request.roomName}-${request.identity}`;

    // Check cache first
    const cached = this.tokenCache.get(cacheKey);
    if (cached && !this.isTokenExpiringSoon(cached)) {
      return cached;
    }

    // Fetch from Supabase Edge Function
    const { data, error } = await supabase.functions.invoke<LiveKitTokenResponse>(
      'livekit-token',
      {
        body: request,
      }
    );

    if (error) {
      throw new ApiError(`Failed to fetch LiveKit token: ${error.message}`, 500, 'LIVEKIT_TOKEN_ERROR');
    }

    if (!data) {
      throw new ApiError('No token data returned from server', 500, 'NO_DATA');
    }

    // Cache the token
    this.tokenCache.set(cacheKey, data);

    return data;
  }

  /**
   * Refresh token for given room and identity
   */
  async refreshToken(request: LiveKitTokenRequest): Promise<LiveKitTokenResponse> {
    const cacheKey = `${request.roomName}-${request.identity}`;

    // Remove from cache to force refresh
    this.tokenCache.delete(cacheKey);

    return this.fetchToken(request);
  }

  /**
   * Check if token is expiring soon (within 5 minutes)
   */
  private isTokenExpiringSoon(token: LiveKitTokenResponse): boolean {
    const now = Date.now();
    return token.expiresAt - now < TOKEN_REFRESH_BUFFER_MS;
  }

  /**
   * Clear all cached tokens
   */
  clearCache(): void {
    this.tokenCache.clear();
  }

  /**
   * Get cached token if available and valid
   */
  getCachedToken(roomName: string, identity: string): LiveKitTokenResponse | null {
    const cacheKey = `${roomName}-${identity}`;
    const cached = this.tokenCache.get(cacheKey);

    if (!cached || this.isTokenExpiringSoon(cached)) {
      return null;
    }

    return cached;
  }
}

// Singleton instance
export const livekitTokenService = new LiveKitTokenService();

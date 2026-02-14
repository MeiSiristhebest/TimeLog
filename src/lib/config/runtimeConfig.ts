export class RuntimeConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RuntimeConfigError';
  }
}

type SupabaseRuntimeConfig = {
  url: string;
  anonKey: string;
  isConfigured: boolean;
};

function normalizeValue(raw: string | undefined): string | undefined {
  if (typeof raw !== 'string') {
    return undefined;
  }

  const value = raw.trim();
  return value.length > 0 ? value : undefined;
}

export function getSupabaseRuntimeConfig(): SupabaseRuntimeConfig {
  const url = normalizeValue(process.env.EXPO_PUBLIC_SUPABASE_URL);
  const anonKey = normalizeValue(process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY);

  return {
    url: url ?? '',
    anonKey: anonKey ?? '',
    isConfigured: Boolean(url && anonKey),
  };
}

export function getRequiredWeatherApiUrl(): string {
  const value = normalizeValue(process.env.EXPO_PUBLIC_WEATHER_API_URL);
  if (!value) {
    throw new RuntimeConfigError(
      'Missing EXPO_PUBLIC_WEATHER_API_URL. Configure it to enable weather sync.'
    );
  }

  return value;
}

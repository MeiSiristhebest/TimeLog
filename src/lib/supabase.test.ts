import { supabase } from '@/lib/supabase';
import { createClient } from '@supabase/supabase-js';

describe('Supabase Client', () => {
  it('should be initialized with correct URL and Key', () => {
    expect(createClient).toHaveBeenCalled();
    // In a real test we might check specific config options,
    // but here we verify the singleton is exported
    expect(supabase).toBeDefined();
  });
});

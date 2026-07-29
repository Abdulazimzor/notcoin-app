import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ijhclpaptrzlcyftllqi.supabase.co';
const supabaseAnonKey = 'sb_publishable_s5Uf5lW4rWBhq_z2NTjR1Q_7bv5xRh8';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

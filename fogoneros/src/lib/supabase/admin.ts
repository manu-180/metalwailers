import 'server-only';
import { createClient } from '@supabase/supabase-js';

// Service role del proyecto compartido: sólo para el webhook, el bot y el cron,
// que corren sin sesión. Lo que hace el panel va con el cliente de sesión y RLS.
export function supabaseAdmin() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

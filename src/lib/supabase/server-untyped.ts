import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import { getSupabaseConfig } from "@/lib/supabase/config";

/**
 * Server client used only by the newly introduced supervision/capsule domain.
 * The generated Database type is intentionally kept separate until it is
 * refreshed from the project schema, avoiding a broad rewrite of existing
 * learner queries while this feature is still in the draft PR.
 */
export async function createExtendedClient() {
  const cookieStore = await cookies();
  const { url, publishableKey } = getSupabaseConfig();

  return createServerClient(url, publishableKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // Server Components cannot set cookies. The Proxy refreshes sessions.
        }
      },
    },
  });
}

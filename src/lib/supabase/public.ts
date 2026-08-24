import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Public read-only Supabase client — anon key, no session/cookies. Because it
 * never carries an auth session, `is_admin()` is always false for it, so RLS
 * returns only published/active rows regardless of who is browsing. Use for
 * public-site reads (docs/06-admin/ §5).
 *
 * 모듈 레벨 싱글턴으로 관리한다 — 함수 호출마다 새 인스턴스를 만들면
 * 연결 풀이 재사용되지 않고 오버헤드가 쌓인다. 이 클라이언트는 세션/쿠키를
 * 쓰지 않아 요청 간 상태 오염이 없으므로 싱글턴이 안전하다.
 */
let _publicClient: SupabaseClient | null = null;

export function createSupabasePublicClient(): SupabaseClient {
  if (_publicClient) return _publicClient;
  _publicClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
  return _publicClient;
}

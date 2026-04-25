// src/server/routing/candidates.ts
import type { SupabaseClient } from '@supabase/supabase-js'
import type { KeyCandidate } from '@/features/routing/application/types'

/**
 * 查询能服务指定 logical model 且状态可用的 key 列表。
 * 联表 user_key_capabilities + user_api_keys。
 */
export async function findCandidates(
  supabase: SupabaseClient,
  userId: string,
  logicalModelId: string
): Promise<KeyCandidate[]> {
  const { data, error } = await supabase
    .from('user_key_capabilities')
    .select(
      `logical_model_id,
       key_id,
       user_api_keys!inner(
         id, provider, display_name, status,
         base_url, protocol, encrypted_key, iv, user_id
       )`
    )
    .eq('logical_model_id', logicalModelId)
    .eq('user_api_keys.user_id', userId)
    .in('user_api_keys.status', ['active', 'unverified'])

  if (error) throw new Error(error.message)

  return (data ?? []).map((row: Record<string, unknown>) => {
    // 支持 flat(mock)和 nested(真实 Supabase JOIN)两种结构
    const nested = row['user_api_keys'] as Record<string, unknown> | undefined
    const src = nested ?? row
    return {
      keyId: (row['key_id'] ?? src['id']) as string,
      provider: src['provider'] as string,
      displayName: (src['display_name'] as string | null) ?? null,
      status: src['status'] as 'active' | 'unverified',
      baseUrl: (src['base_url'] as string | null) ?? null,
      protocol: src['protocol'] as 'native' | 'openai-compat',
      encryptedKey: src['encrypted_key'] as string,
      iv: src['iv'] as string,
      score: 0,
    }
  })
}

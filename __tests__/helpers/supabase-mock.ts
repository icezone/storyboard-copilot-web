import { vi } from 'vitest'

/**
 * 模拟 Supabase 客户端 - 用于 vi.mock 工厂内部创建。
 */
export function createMockSupabaseClient(options?: {
  userId?: string | null
}) {
  const userId = options?.userId ?? 'user-1'

  let resolvedResult: { data: unknown; error: unknown } = {
    data: null,
    error: null,
  }

  const chainable: Record<string, ReturnType<typeof vi.fn>> & { then?: unknown } = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    upsert: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    neq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    single: vi.fn().mockImplementation(() => Promise.resolve(resolvedResult)),
    maybeSingle: vi.fn().mockImplementation(() => Promise.resolve(resolvedResult)),
  }

  // thenable
  chainable.then = function (resolve: (v: unknown) => void, reject: (e: unknown) => void) {
    return Promise.resolve(resolvedResult).then(resolve, reject)
  }

  const from = vi.fn().mockReturnValue(chainable)
  const rpc = vi.fn().mockImplementation(() => Promise.resolve(resolvedResult))

  const auth = {
    getUser: vi.fn().mockResolvedValue(
      userId
        ? { data: { user: { id: userId } }, error: null }
        : { data: { user: null }, error: { message: 'not authenticated' } }
    ),
  }

  const client = { from, rpc, auth }

  return {
    client,
    chainable,
    setResult(data: unknown, error?: unknown) {
      resolvedResult = { data, error: error ?? null }
    },
    setError(error: unknown) {
      resolvedResult = { data: null, error }
    },
  }
}

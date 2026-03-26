import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Mock idb-keyval
vi.mock('idb-keyval', () => ({
  get: vi.fn().mockResolvedValue(undefined),
  set: vi.fn().mockResolvedValue(undefined),
  del: vi.fn().mockResolvedValue(undefined),
}))

// Mock BroadcastChannel
class MockBroadcastChannel {
  name: string
  onmessage: ((ev: MessageEvent) => void) | null = null
  postMessage = vi.fn()
  close = vi.fn()
  constructor(name: string) { this.name = name }
}
vi.stubGlobal('BroadcastChannel', MockBroadcastChannel)
vi.stubGlobal('requestIdleCallback', (cb: () => void) => setTimeout(cb, 0))
vi.stubGlobal('cancelIdleCallback', (id: number) => clearTimeout(id))

// Mock fetch
const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

import { set as idbSet } from 'idb-keyval'
import { useProjectStore } from '@/stores/projectStore'

describe('projectStore - 保存', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
    mockFetch.mockResolvedValue(new Response(JSON.stringify({ revision: 1 }), { status: 200 }))
    // Reset store state
    useProjectStore.setState({
      saveStatus: 'saved',
      currentProjectId: null,
      revision: 0,
    })
  })

  afterEach(() => {
    useProjectStore.getState()._cleanup()
    vi.useRealTimers()
  })

  it('save 应立即写入 IndexedDB', () => {
    const store = useProjectStore.getState()
    store.setCurrentProject('proj-1')
    store.save({ nodes: [], edges: [] })

    expect(idbSet).toHaveBeenCalledWith(
      'scw-draft-proj-1',
      expect.objectContaining({ nodes: [], edges: [] })
    )
  })

  it('save 应在 1s 防抖后调用 API', async () => {
    const store = useProjectStore.getState()
    store.setCurrentProject('proj-1')
    store.save({ nodes: [1], edges: [] })

    // 不应立即调用
    expect(mockFetch).not.toHaveBeenCalled()

    // 快进 1s 防抖 + requestIdleCallback 的 setTimeout(0)
    await vi.advanceTimersByTimeAsync(1100)

    expect(mockFetch).toHaveBeenCalledWith(
      '/api/projects/proj-1/draft',
      expect.objectContaining({ method: 'PUT' })
    )
  })

  it('多次 save 应合并为一次 API 调用（防抖）', async () => {
    const store = useProjectStore.getState()
    store.setCurrentProject('proj-1')

    store.save({ nodes: [1], edges: [] })
    await vi.advanceTimersByTimeAsync(500)
    store.save({ nodes: [1, 2], edges: [] })
    await vi.advanceTimersByTimeAsync(500)
    store.save({ nodes: [1, 2, 3], edges: [] })

    await vi.advanceTimersByTimeAsync(1100)

    const putCalls = mockFetch.mock.calls.filter(
      (c: unknown[]) => typeof c[1] === 'object' && (c[1] as { method?: string }).method === 'PUT'
    )
    expect(putCalls.length).toBe(1)
  })
})

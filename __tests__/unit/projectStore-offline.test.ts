import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

vi.mock('idb-keyval', () => ({
  get: vi.fn().mockResolvedValue(undefined),
  set: vi.fn().mockResolvedValue(undefined),
  del: vi.fn().mockResolvedValue(undefined),
}))

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

const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

import { useProjectStore } from '@/stores/projectStore'

describe('projectStore - 离线处理', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
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

  it('网络错误应将状态设为 offline', async () => {
    mockFetch.mockRejectedValue(new Error('Network error'))

    const store = useProjectStore.getState()
    store.setCurrentProject('proj-1')
    store.save({ nodes: [], edges: [] })

    // 快进防抖 + idle callback
    await vi.advanceTimersByTimeAsync(1100)
    // 等待 fetch promise 结算
    await vi.advanceTimersByTimeAsync(100)

    expect(useProjectStore.getState().saveStatus).toBe('offline')
  })
})

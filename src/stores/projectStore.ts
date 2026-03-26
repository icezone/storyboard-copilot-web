import { create } from 'zustand'
import { set as idbSet, get as idbGet } from 'idb-keyval'

export type SaveStatus = 'saving' | 'saved' | 'unsynced' | 'offline' | 'conflict'

export interface Viewport {
  x: number
  y: number
  zoom: number
}

export interface CanvasDraft {
  nodes: unknown[]
  edges: unknown[]
  [key: string]: unknown
}

interface ProjectState {
  saveStatus: SaveStatus
  currentProjectId: string | null
  revision: number
  setCurrentProject: (id: string) => void
  save: (data: CanvasDraft) => void
  load: (projectId: string) => Promise<CanvasDraft | null>
  saveViewport: (viewport: Viewport) => void
  _cleanup: () => void
}

const DEBOUNCE_MS = 1000
const VIEWPORT_DEBOUNCE_MS = 500

function idbKey(projectId: string) {
  return `scw-draft-${projectId}`
}

let saveTimer: ReturnType<typeof setTimeout> | null = null
let viewportTimer: ReturnType<typeof setTimeout> | null = null
let broadcastChannel: BroadcastChannel | null = null

export const useProjectStore = create<ProjectState>((set, get) => ({
  saveStatus: 'saved',
  currentProjectId: null,
  revision: 0,

  setCurrentProject(id: string) {
    // 清理旧的 BroadcastChannel
    if (broadcastChannel) {
      broadcastChannel.close()
    }

    set({ currentProjectId: id })

    // 重复标签检测 (B.5)
    if (typeof BroadcastChannel !== 'undefined') {
      broadcastChannel = new BroadcastChannel(`scw-project-${id}`)
      broadcastChannel.onmessage = () => {
        console.warn('[projectStore] 此项目已在其他标签页打开')
      }
      broadcastChannel.postMessage('ping')
    }
  },

  save(data: CanvasDraft) {
    const projectId = get().currentProjectId
    if (!projectId) return

    // 立即写入 IndexedDB
    idbSet(idbKey(projectId), data)
    set({ saveStatus: 'saving' })

    // 防抖：1s 后写入 API
    if (saveTimer) clearTimeout(saveTimer)
    saveTimer = setTimeout(() => {
      const state = get()
      const pid = state.currentProjectId
      if (!pid) return

      const requestIdleCallbackFn =
        typeof requestIdleCallback !== 'undefined' ? requestIdleCallback : (cb: () => void) => setTimeout(cb, 0)

      requestIdleCallbackFn(() => {
        fetch(`/api/projects/${pid}/draft`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            data,
            expectedRevision: state.revision,
          }),
        })
          .then(async (res) => {
            if (res.status === 409) {
              set({ saveStatus: 'conflict' })
              return
            }
            if (!res.ok) {
              set({ saveStatus: 'unsynced' })
              return
            }
            const result = await res.json()
            set({ saveStatus: 'saved', revision: result.revision })
          })
          .catch(() => {
            set({ saveStatus: 'offline' })
          })
      })
    }, DEBOUNCE_MS)
  },

  async load(projectId: string) {
    set({ currentProjectId: projectId })

    // 先尝试 IndexedDB
    const local = await idbGet(idbKey(projectId))

    // 再从 API 加载
    try {
      const res = await fetch(`/api/projects/${projectId}/draft`)
      if (res.ok) {
        const remote = await res.json()
        set({ revision: remote.revision, saveStatus: 'saved' })
        return remote.data as CanvasDraft
      }
    } catch {
      // 离线，使用本地缓存
      if (local) {
        set({ saveStatus: 'offline' })
        return local as CanvasDraft
      }
    }

    return local as CanvasDraft | null
  },

  saveViewport(viewport: Viewport) {
    const projectId = get().currentProjectId
    if (!projectId) return

    if (viewportTimer) clearTimeout(viewportTimer)
    viewportTimer = setTimeout(() => {
      fetch(`/api/projects/${projectId}/draft/viewport`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(viewport),
      }).catch(() => {
        // viewport 保存失败不影响主状态
      })
    }, VIEWPORT_DEBOUNCE_MS)
  },

  _cleanup() {
    if (saveTimer) clearTimeout(saveTimer)
    if (viewportTimer) clearTimeout(viewportTimer)
    if (broadcastChannel) broadcastChannel.close()
    saveTimer = null
    viewportTimer = null
    broadcastChannel = null
  },
}))

'use client'

import { useEffect, useState } from 'react'

interface CapabilitiesResponse {
  byKey: Record<string, string[]>
  all: string[]
}

export interface UnlockedModelsState {
  unlockedIds: Set<string>
  loading: boolean
  /** 用户是否有至少一个已解锁模型 */
  hasKeys: boolean
}

export function useUnlockedModels(): UnlockedModelsState {
  const [unlockedIds, setUnlockedIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    fetch('/api/settings/capabilities')
      .then((r) => {
        if (!r.ok) throw new Error(`capabilities ${r.status}`)
        return r.json() as Promise<CapabilitiesResponse>
      })
      .then((data) => {
        if (!cancelled) {
          setUnlockedIds(new Set(data.all))
          setLoading(false)
        }
      })
      .catch(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  return { unlockedIds, loading, hasKeys: unlockedIds.size > 0 }
}

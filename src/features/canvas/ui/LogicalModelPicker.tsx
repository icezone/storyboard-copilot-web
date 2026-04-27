'use client'

import { Lock } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { type ModelScenario, listLogicalModels } from '@/config/logical-models'
import { useUnlockedModels } from '@/hooks/useUnlockedModels'

interface Props {
  scenario: ModelScenario
  value: string | null
  onChange: (id: string) => void
  className?: string
}

export function LogicalModelPicker({ scenario, value, onChange, className }: Props) {
  const router = useRouter()
  const { unlockedIds, loading } = useUnlockedModels()
  const models = listLogicalModels(scenario)

  if (loading) {
    return (
      <div className={`text-xs text-gray-400 ${className ?? ''}`}>加载中...</div>
    )
  }

  return (
    <div className={`flex flex-wrap gap-1 ${className ?? ''}`}>
      {models.map((m) => {
        const locked = !unlockedIds.has(m.id)
        const selected = m.id === value

        function handleClick() {
          if (locked) {
            router.push('/settings')
          } else {
            onChange(m.id)
          }
        }

        return (
          <button
            key={m.id}
            type="button"
            data-testid={`model-option-${m.id}`}
            onClick={handleClick}
            className={[
              'flex items-center gap-1 rounded-md border px-2 py-1 text-xs transition-colors',
              selected
                ? 'border-blue-500 bg-blue-50 text-blue-700'
                : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300',
              locked ? 'opacity-50' : '',
            ].join(' ')}
            title={locked ? '需要配置 API Key — 点击跳转设置' : m.displayName}
          >
            {locked && <Lock size={10} className="shrink-0" />}
            {m.displayName}
          </button>
        )
      })}
    </div>
  )
}

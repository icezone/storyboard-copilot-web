'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import { AddKeyForm } from '@/features/settings/KeyManager/AddKeyForm'
import { ScenarioDefaults } from '@/features/settings/ScenarioDefaults'
import type { AddKeyInput } from '@/features/settings/KeyManager/useKeyManager'

type Step = 1 | 2 | 3

interface Props {
  show: boolean
  onDismiss: () => void
}

const STEP_LABELS: Record<Step, string> = {
  1: '添加 API Key',
  2: '发现可用模型',
  3: '设置使用偏好',
}

export function OnboardingWizard({ show, onDismiss }: Props) {
  const [step, setStep] = useState<Step>(1)
  const [addedKeyId, setAddedKeyId] = useState<string | null>(null)

  if (!show) return null

  async function handleAddKey(input: AddKeyInput) {
    const res = await fetch('/api/settings/api-keys', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(input),
    })
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      throw new Error((body as Record<string, string>).error ?? '添加失败')
    }
    const data = (await res.json()) as { id: string }
    setAddedKeyId(data.id)
    // 后台触发探测，不阻塞用户
    void fetch(`/api/settings/api-keys/${data.id}/probe`, { method: 'POST' })
    setStep(2)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        {/* 关闭按钮 */}
        <button
          type="button"
          onClick={onDismiss}
          className="absolute right-4 top-4 text-gray-400 hover:text-gray-600"
          aria-label="跳过引导"
        >
          <X size={18} />
        </button>

        {/* 步骤指示器 */}
        <div className="mb-6 flex items-center gap-2">
          {([1, 2, 3] as Step[]).map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div
                className={[
                  'flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold',
                  s < step
                    ? 'bg-green-500 text-white'
                    : s === step
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-400',
                ].join(' ')}
              >
                {s < step ? '✓' : s}
              </div>
              <span
                className={`text-xs ${s === step ? 'font-medium text-gray-800' : 'text-gray-400'}`}
              >
                {STEP_LABELS[s]}
              </span>
              {s < 3 && <div className="h-px w-4 bg-gray-200" />}
            </div>
          ))}
        </div>

        {/* 步骤 1：添加 Key */}
        {step === 1 && (
          <div>
            <h2 className="mb-1 text-base font-semibold">添加你的第一个 API Key</h2>
            <p className="mb-4 text-sm text-gray-500">
              支持 KIE、PPIO、FAL、GRSAI 等内置 provider，也可以自定义 OpenAI 兼容端点。
            </p>
            <AddKeyForm onSubmit={handleAddKey} />
          </div>
        )}

        {/* 步骤 2：探测模型 */}
        {step === 2 && (
          <div>
            <h2 className="mb-1 text-base font-semibold">正在发现可用模型</h2>
            <p className="mb-4 text-sm text-gray-500">
              Key 已保存，系统正在后台探测可用模型。这通常只需几秒钟。
              你可以继续，稍后在设置页查看解锁的模型列表。
            </p>
            {addedKeyId && (
              <div className="mb-4 rounded-lg bg-green-50 p-3 text-sm text-green-700">
                ✓ Key 已添加，探测任务已启动
              </div>
            )}
            <button
              type="button"
              onClick={() => setStep(3)}
              className="w-full rounded-lg bg-blue-600 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              继续
            </button>
          </div>
        )}

        {/* 步骤 3：设偏好 */}
        {step === 3 && (
          <div>
            <h2 className="mb-1 text-base font-semibold">设置使用偏好</h2>
            <p className="mb-4 text-sm text-gray-500">
              指定不同场景下优先使用哪种策略：自动最优、最低成本或最快速度。
            </p>
            <ScenarioDefaults />
            <button
              type="button"
              onClick={onDismiss}
              className="mt-4 w-full rounded-lg bg-blue-600 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              完成配置
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

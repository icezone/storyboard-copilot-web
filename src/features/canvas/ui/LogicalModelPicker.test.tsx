import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { LogicalModelPicker } from './LogicalModelPicker'

vi.mock('@/hooks/useUnlockedModels', () => ({
  useUnlockedModels: vi.fn(),
}))
const pushMock = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock }),
}))

import { useUnlockedModels } from '@/hooks/useUnlockedModels'

describe('LogicalModelPicker', () => {
  const onChange = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('loading 时显示加载文本', () => {
    vi.mocked(useUnlockedModels).mockReturnValue({
      unlockedIds: new Set(),
      loading: true,
      hasKeys: false,
      error: null,
    })
    render(<LogicalModelPicker scenario="image" value={null} onChange={onChange} />)
    expect(screen.getByText('加载中...')).toBeInTheDocument()
  })

  it('显示 image 场景的逻辑模型名称', () => {
    vi.mocked(useUnlockedModels).mockReturnValue({
      unlockedIds: new Set(['nano-banana-2']),
      loading: false,
      hasKeys: true,
      error: null,
    })
    render(<LogicalModelPicker scenario="image" value="nano-banana-2" onChange={onChange} />)
    expect(screen.getByText('Nano Banana 2')).toBeInTheDocument()
  })

  it('未解锁的模型带有 opacity-50 样式', () => {
    vi.mocked(useUnlockedModels).mockReturnValue({
      unlockedIds: new Set(['nano-banana-2']),
      loading: false,
      hasKeys: true,
      error: null,
    })
    render(<LogicalModelPicker scenario="image" value="nano-banana-2" onChange={onChange} />)
    const proItem = screen.getByTestId('model-option-nano-banana-pro')
    expect(proItem.className).toContain('opacity-50')
  })

  it('点击已解锁模型调用 onChange', () => {
    vi.mocked(useUnlockedModels).mockReturnValue({
      unlockedIds: new Set(['nano-banana-2', 'nano-banana-pro']),
      loading: false,
      hasKeys: true,
      error: null,
    })
    render(<LogicalModelPicker scenario="image" value="nano-banana-2" onChange={onChange} />)
    fireEvent.click(screen.getByTestId('model-option-nano-banana-pro'))
    expect(onChange).toHaveBeenCalledWith('nano-banana-pro')
  })

  it('点击锁定模型跳转到 /settings 而不调用 onChange', () => {
    vi.mocked(useUnlockedModels).mockReturnValue({
      unlockedIds: new Set(['nano-banana-2']),
      loading: false,
      hasKeys: true,
      error: null,
    })
    render(<LogicalModelPicker scenario="image" value="nano-banana-2" onChange={onChange} />)
    fireEvent.click(screen.getByTestId('model-option-nano-banana-pro'))
    expect(pushMock).toHaveBeenCalledWith('/settings')
    expect(onChange).not.toHaveBeenCalled()
  })

  it('无任何解锁模型时所有条目都带 opacity-50', () => {
    vi.mocked(useUnlockedModels).mockReturnValue({
      unlockedIds: new Set(),
      loading: false,
      hasKeys: false,
      error: null,
    })
    render(<LogicalModelPicker scenario="image" value={null} onChange={onChange} />)
    const items = screen.getAllByTestId(/^model-option-/)
    items.forEach((item) => expect(item.className).toContain('opacity-50'))
  })
})

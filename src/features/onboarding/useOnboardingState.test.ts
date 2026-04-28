import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useOnboardingState, ONBOARDING_STORAGE_KEY } from './useOnboardingState'

describe('useOnboardingState', () => {
  beforeEach(() => {
    localStorage.clear()
  })
  afterEach(() => {
    localStorage.clear()
  })

  it('keyCount=0 且未完成引导 → show=true', () => {
    const { result } = renderHook(() => useOnboardingState(0))
    expect(result.current.show).toBe(true)
  })

  it('keyCount>0 → show=false（已有 key，跳过引导）', () => {
    const { result } = renderHook(() => useOnboardingState(3))
    expect(result.current.show).toBe(false)
  })

  it('localStorage 已设置完成标志 → show=false', () => {
    localStorage.setItem(ONBOARDING_STORAGE_KEY, 'true')
    const { result } = renderHook(() => useOnboardingState(0))
    expect(result.current.show).toBe(false)
  })

  it('dismiss() 设置 localStorage 并 show 变为 false', () => {
    const { result } = renderHook(() => useOnboardingState(0))
    expect(result.current.show).toBe(true)
    act(() => result.current.dismiss())
    expect(result.current.show).toBe(false)
    expect(localStorage.getItem(ONBOARDING_STORAGE_KEY)).toBe('true')
  })
})

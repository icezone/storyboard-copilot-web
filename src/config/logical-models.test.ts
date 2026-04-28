import { describe, it, expect } from 'vitest'
import {
  listLogicalModels,
  getLogicalModel,
  LOGICAL_MODELS,
  mapToCanvasModelId,
} from './logical-models'

describe('logical-models', () => {
  it('LOGICAL_MODELS 包含至少 6 个条目', () => {
    expect(LOGICAL_MODELS.length).toBeGreaterThanOrEqual(6)
  })

  it('listLogicalModels() 不传参数返回全部', () => {
    expect(listLogicalModels().length).toBe(LOGICAL_MODELS.length)
  })

  it('listLogicalModels("image") 只返回 image 类型', () => {
    const result = listLogicalModels('image')
    expect(result.length).toBeGreaterThan(0)
    result.forEach((m) => expect(m.scenario).toBe('image'))
  })

  it('listLogicalModels("video") 只返回 video 类型', () => {
    const result = listLogicalModels('video')
    expect(result.length).toBeGreaterThan(0)
    result.forEach((m) => expect(m.scenario).toBe('video'))
  })

  it('getLogicalModel("nano-banana-2") 返回正确条目', () => {
    const m = getLogicalModel('nano-banana-2')
    expect(m).toBeDefined()
    expect(m?.displayName).toBeTruthy()
    expect(m?.scenario).toBe('image')
  })

  it('getLogicalModel("not-exist") 返回 undefined', () => {
    expect(getLogicalModel('not-exist')).toBeUndefined()
  })

  it('每个条目的 id 唯一', () => {
    const ids = LOGICAL_MODELS.map((m) => m.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
})

describe('mapToCanvasModelId', () => {
  const canvasIds = [
    'kie/nano-banana-2',
    'fal/nano-banana-2',
    'grsai/nano-banana-2',
    'ppio/gemini-3.1-flash',
    'kling/kling-3.0',
  ]

  it('优先返回 kie provider 的 canvas 模型 ID', () => {
    expect(mapToCanvasModelId('nano-banana-2', canvasIds)).toBe('kie/nano-banana-2')
  })

  it('kie 不可用时退回 fal', () => {
    const ids = canvasIds.filter((id) => !id.startsWith('kie/'))
    expect(mapToCanvasModelId('nano-banana-2', ids)).toBe('fal/nano-banana-2')
  })

  it('无匹配时返回 null', () => {
    expect(mapToCanvasModelId('sora2-pro', canvasIds)).toBeNull()
  })

  it('支持 provider/model 直接匹配', () => {
    expect(mapToCanvasModelId('gemini-3.1-flash', canvasIds)).toBe('ppio/gemini-3.1-flash')
  })
})

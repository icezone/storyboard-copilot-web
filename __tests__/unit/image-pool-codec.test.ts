import { describe, it, expect } from 'vitest'
import { encodeImagePool, decodeImagePool } from '@/lib/image-pool-codec'

describe('imagePool 编解码 (INV-6)', () => {
  it('编码后解码应还原原始数据', () => {
    const nodes = [
      { id: 'n1', data: { imageUrl: 'data:image/png;base64,abc123', previewImageUrl: 'data:image/jpeg;base64,preview1' } },
      { id: 'n2', data: { imageUrl: 'data:image/png;base64,abc123', previewImageUrl: null } },
      { id: 'n3', data: { imageUrl: 'data:image/png;base64,def456', previewImageUrl: 'data:image/jpeg;base64,preview2' } },
    ]

    const encoded = encodeImagePool(nodes)
    expect(encoded.imagePool).toBeDefined()
    // 重复图片应被去重
    expect(Object.keys(encoded.imagePool).length).toBeLessThanOrEqual(4) // abc123 deduped

    // 节点中的 imageUrl 应被替换为引用
    for (const node of encoded.nodes) {
      if (node.data.imageUrl) {
        expect(node.data.imageUrl).toMatch(/^__img_ref__/)
      }
    }

    const decoded = decodeImagePool(encoded.nodes, encoded.imagePool)
    expect(decoded).toEqual(nodes)
  })

  it('空节点列表应正常处理', () => {
    const encoded = encodeImagePool([])
    expect(encoded.imagePool).toEqual({})
    expect(encoded.nodes).toEqual([])

    const decoded = decodeImagePool([], {})
    expect(decoded).toEqual([])
  })

  it('无图片的节点应正常通过', () => {
    const nodes = [
      { id: 'n1', data: { label: 'text node' } },
    ]
    const encoded = encodeImagePool(nodes)
    expect(encoded.imagePool).toEqual({})

    const decoded = decodeImagePool(encoded.nodes, encoded.imagePool)
    expect(decoded[0].data.label).toBe('text node')
  })
})

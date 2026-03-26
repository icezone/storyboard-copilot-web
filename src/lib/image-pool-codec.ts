/**
 * imagePool 编解码：将节点中的图片数据去重存储。
 * 编码：将节点 data 中的 imageUrl/previewImageUrl 替换为 __img_ref__<hash> 引用。
 * 解码：将 __img_ref__ 引用还原为原始图片数据。
 */

const IMAGE_FIELDS = ['imageUrl', 'previewImageUrl'] as const
const REF_PREFIX = '__img_ref__'

interface NodeLike {
  id: string
  data: Record<string, unknown>
}

function simpleHash(str: string): string {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash |= 0
  }
  return Math.abs(hash).toString(36)
}

export function encodeImagePool(nodes: NodeLike[]): {
  nodes: NodeLike[]
  imagePool: Record<string, string>
} {
  const imagePool: Record<string, string> = {}
  const valueToRef = new Map<string, string>()

  const encodedNodes = nodes.map(node => {
    const newData = { ...node.data }

    for (const field of IMAGE_FIELDS) {
      const value = newData[field]
      if (typeof value !== 'string' || !value) continue

      let ref = valueToRef.get(value)
      if (!ref) {
        ref = `${REF_PREFIX}${simpleHash(value)}_${valueToRef.size}`
        valueToRef.set(value, ref)
        imagePool[ref] = value
      }
      newData[field] = ref
    }

    return { ...node, data: newData }
  })

  return { nodes: encodedNodes, imagePool }
}

export function decodeImagePool(
  nodes: NodeLike[],
  imagePool: Record<string, string>
): NodeLike[] {
  return nodes.map(node => {
    const newData = { ...node.data }

    for (const field of IMAGE_FIELDS) {
      const value = newData[field]
      if (typeof value !== 'string' || !value.startsWith(REF_PREFIX)) continue

      const resolved = imagePool[value]
      if (resolved !== undefined) {
        newData[field] = resolved
      }
    }

    return { ...node, data: newData }
  })
}

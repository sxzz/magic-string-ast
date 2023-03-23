import MagicStringBase from 'magic-string'
import type { OverwriteOptions } from 'magic-string'
import type { Node } from '@babel/types'

export * from 'magic-string'
export { MagicStringBase }

export class MagicString extends MagicStringBase {
  removeNode(node: Node | Node[], { offset = 0 }: { offset?: number } = {}) {
    if (isEmptyNodes(node)) return this
    super.remove(...getNodePos(node, offset))
    return this
  }

  moveNode(
    node: Node | Node[],
    index: number,
    { offset = 0 }: { offset?: number } = {}
  ) {
    if (isEmptyNodes(node)) return this
    super.move(...getNodePos(node, offset), index)
    return this
  }

  sliceNode(node: Node | Node[], { offset = 0 }: { offset?: number } = {}) {
    if (isEmptyNodes(node)) return ''
    return super.slice(...getNodePos(node, offset))
  }

  overwriteNode(
    node: Node | Node[],
    content: string | Node | Node[],
    { offset = 0, ...options }: OverwriteOptions & { offset?: number } = {}
  ) {
    if (isEmptyNodes(node)) return this

    const _content =
      typeof content === 'string' ? content : this.sliceNode(content)
    super.overwrite(...getNodePos(node, offset), _content, options)
    return this
  }

  snipNode(node: Node | Node[], { offset = 0 }: { offset?: number } = {}) {
    if (isEmptyNodes(node))
      return new MagicStringBase('', {
        // @ts-expect-error
        filename: super.filename,
      })
    return super.snip(...getNodePos(node, offset))
  }
}

function getNodePos(
  nodes: Node | Node[],
  offset: number
): [start: number, end: number] {
  if (Array.isArray(nodes))
    return [offset + nodes[0].start!, offset + nodes.slice(-1)[0].end!]
  else return [offset + nodes.start!, offset + nodes.end!]
}

function isEmptyNodes(nodes: Node | Node[]) {
  return Array.isArray(nodes) && nodes.length === 0
}

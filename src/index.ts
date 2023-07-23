import MagicStringBase, {
  type MagicStringOptions,
  type OverwriteOptions,
} from 'magic-string'
import { type Node } from '@babel/types'

export * from 'magic-string'
export { MagicStringBase }

export class MagicString extends MagicStringBase {
  offset: number

  constructor(
    str: string,
    options?: MagicStringOptions & {
      /** offset of node */
      offset?: number
    }
  ) {
    super(str, options)
    this.offset = options?.offset ?? 0
  }

  private getNodePos(
    nodes: Node | Node[],
    offset?: number
  ): [start: number, end: number] {
    const _offset = offset ?? this.offset
    if (Array.isArray(nodes))
      return [_offset + nodes[0].start!, _offset + nodes.at(-1)!.end!]
    else return [_offset + nodes.start!, _offset + nodes.end!]
  }

  removeNode(node: Node | Node[], { offset }: { offset?: number } = {}) {
    if (isEmptyNodes(node)) return this
    super.remove(...this.getNodePos(node, offset))
    return this
  }

  moveNode(
    node: Node | Node[],
    index: number,
    { offset }: { offset?: number } = {}
  ) {
    if (isEmptyNodes(node)) return this
    super.move(...this.getNodePos(node, offset), index)
    return this
  }

  sliceNode(node: Node | Node[], { offset }: { offset?: number } = {}) {
    if (isEmptyNodes(node)) return ''
    return super.slice(...this.getNodePos(node, offset))
  }

  overwriteNode(
    node: Node | Node[],
    content: string | Node | Node[],
    { offset, ...options }: OverwriteOptions & { offset?: number } = {}
  ) {
    if (isEmptyNodes(node)) return this

    const _content =
      typeof content === 'string' ? content : this.sliceNode(content)
    super.overwrite(...this.getNodePos(node, offset), _content, options)
    return this
  }

  snipNode(node: Node | Node[], { offset }: { offset?: number } = {}) {
    if (isEmptyNodes(node))
      return new MagicStringBase('', {
        // @ts-expect-error
        filename: super.filename,
      })
    return super.snip(...this.getNodePos(node, offset))
  }
}

function isEmptyNodes(nodes: Node | Node[]) {
  return Array.isArray(nodes) && nodes.length === 0
}

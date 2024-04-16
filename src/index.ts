import MagicStringBase, {
  type MagicStringOptions,
  type OverwriteOptions,
} from 'magic-string'
import type { Node } from '@babel/types'

export * from 'magic-string'
export { MagicStringBase }

// @ts-expect-error whatever
class MagicStringImpl implements MagicStringBase {
  offset: number
  s: MagicStringBase

  constructor(
    str: string,
    options?: MagicStringOptions & {
      /** offset of node */
      offset?: number
    },
  ) {
    this.s = new MagicStringBase(str, options)
    this.offset = options?.offset ?? 0
    return new Proxy(this.s, {
      get: (target, p, receiver) => {
        let parent = Reflect.get(target, p, receiver)
        if (parent) {
          if (typeof parent === 'function') parent = parent.bind(target)
          return parent
        }

        return Reflect.get(this, p, receiver)
      },
    }) as any
  }

  private getNodePos(
    nodes: Node | Node[],
    offset?: number,
  ): [start: number, end: number] {
    const _offset = offset ?? this.offset
    if (Array.isArray(nodes))
      return [_offset + nodes[0].start!, _offset + nodes.at(-1)!.end!]
    else return [_offset + nodes.start!, _offset + nodes.end!]
  }

  removeNode(node: Node | Node[], { offset }: { offset?: number } = {}) {
    if (isEmptyNodes(node)) return this
    this.s.remove(...this.getNodePos(node, offset))
    return this
  }

  moveNode(
    node: Node | Node[],
    index: number,
    { offset }: { offset?: number } = {},
  ) {
    if (isEmptyNodes(node)) return this
    this.s.move(...this.getNodePos(node, offset), index)
    return this
  }

  sliceNode(node: Node | Node[], { offset }: { offset?: number } = {}) {
    if (isEmptyNodes(node)) return ''
    return this.s.slice(...this.getNodePos(node, offset))
  }

  overwriteNode(
    node: Node | Node[],
    content: string | Node | Node[],
    { offset, ...options }: OverwriteOptions & { offset?: number } = {},
  ) {
    if (isEmptyNodes(node)) return this

    const _content =
      typeof content === 'string' ? content : this.sliceNode(content)
    this.s.overwrite(...this.getNodePos(node, offset), _content, options)
    return this
  }

  snipNode(node: Node | Node[], { offset }: { offset?: number } = {}) {
    if (isEmptyNodes(node))
      return new MagicStringBase('', {
        // @ts-expect-error
        filename: super.filename,
      })
    return this.s.snip(...this.getNodePos(node, offset))
  }
}

export const MagicString = MagicStringImpl as any as {
  new (
    ...args: ConstructorParameters<typeof MagicStringImpl>
  ): MagicStringImpl & MagicStringBase
}

function isEmptyNodes(nodes: Node | Node[]) {
  return Array.isArray(nodes) && nodes.length === 0
}

export function generateTransform(
  s: MagicStringBase | undefined,
  id: string,
): { code: string; map: any } | undefined {
  if (s?.hasChanged()) {
    return {
      code: s.toString(),
      get map() {
        return s.generateMap({
          source: id,
          includeContent: true,
          hires: 'boundary',
        })
      },
    }
  }
}

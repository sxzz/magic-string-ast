import MagicString, {
  type MagicStringOptions,
  type OverwriteOptions,
} from 'magic-string'

export * from 'magic-string'
export { MagicString }

interface Node {
  start?: number | null
  end?: number | null
}

// eslint-disable-next-line @typescript-eslint/no-unsafe-declaration-merging
export interface MagicStringAST extends MagicString {}

/**
 * MagicString with AST manipulation
 */
// eslint-disable-next-line @typescript-eslint/no-unsafe-declaration-merging
export class MagicStringAST implements MagicString {
  s: MagicString

  constructor(
    str: string | MagicString,
    options?: MagicStringOptions,
    private prototype: typeof MagicString = typeof str === 'string'
      ? MagicString
      : (str.constructor as any),
  ) {
    this.s = typeof str === 'string' ? new prototype(str, options) : str
    return new Proxy(this.s, {
      get: (target, p, receiver) => {
        if (Reflect.has(this, p)) return Reflect.get(this, p, receiver)

        let parent = Reflect.get(target, p, receiver)
        if (typeof parent === 'function') parent = parent.bind(target)
        return parent
      },
    }) as any
  }

  private getNodePos(
    nodes: Node | Node[],
    offset: number = 0,
  ): [start: number, end: number] {
    if (Array.isArray(nodes))
      return [offset + nodes[0].start!, offset + nodes.at(-1)!.end!]
    else return [offset + nodes.start!, offset + nodes.end!]
  }

  removeNode(node: Node | Node[], { offset }: { offset?: number } = {}): this {
    if (isEmptyNodes(node)) return this
    this.s.remove(...this.getNodePos(node, offset))
    return this
  }

  moveNode(
    node: Node | Node[],
    index: number,
    { offset }: { offset?: number } = {},
  ): this {
    if (isEmptyNodes(node)) return this
    this.s.move(...this.getNodePos(node, offset), index)
    return this
  }

  sliceNode(node: Node | Node[], { offset }: { offset?: number } = {}): string {
    if (isEmptyNodes(node)) return ''
    return this.s.slice(...this.getNodePos(node, offset))
  }

  overwriteNode(
    node: Node | Node[],
    content: string | Node | Node[],
    { offset, ...options }: OverwriteOptions & { offset?: number } = {},
  ): this {
    if (isEmptyNodes(node)) return this

    const _content =
      typeof content === 'string' ? content : this.sliceNode(content)
    this.s.overwrite(...this.getNodePos(node, offset), _content, options)
    return this
  }

  snipNode(
    node: Node | Node[],
    { offset }: { offset?: number } = {},
  ): MagicStringAST {
    let newS: MagicString
    if (isEmptyNodes(node)) newS = this.s.snip(0, 0)
    else newS = this.s.snip(...this.getNodePos(node, offset))
    return new MagicStringAST(newS, undefined, this.prototype)
  }

  clone(): this {
    return new MagicStringAST(this.s.clone(), undefined, this.prototype) as any
  }

  toString(): string {
    return this.s.toString()
  }

  private replaceRangeState: Record<
    number,
    { nodes: Node[]; indexes: Record<number, number> }
  > = {}

  /**
   * Replace a range of text with new nodes.
   * @param start The start index of the range to replace.
   * @param end The end index of the range to replace.
   * @param nodes The nodes or strings to insert into the range.
   */
  replaceRange(start: number, end: number, ...nodes: (string | Node)[]): this {
    const state =
      this.replaceRangeState[this.offset] ||
      (this.replaceRangeState[this.offset] = { nodes: [], indexes: {} })

    if (nodes.length) {
      let index = state.indexes[start] || 0
      let intro = ''
      let prevNode
      for (const node of nodes) {
        if (typeof node === 'string') {
          node && (intro += node)
        } else {
          this.move(node.start!, node.end!, start)
          index = node.start!
          prevNode = node
          if (intro) {
            this.appendRight(index, intro)
            intro = ''
          }
          state.nodes.push(node)
        }
      }
      if (intro) {
        this.appendLeft(prevNode?.end || start, intro)
      }
      state.indexes[start] = index
    }

    if (end > start) {
      let index = start
      state.nodes
        .filter((node) => node.start! >= start && node.end! <= end)
        .sort((a, b) => a.start! - b.start!)
        .forEach((node) => {
          if (node.start! > index) {
            this.remove(index, node.start!)
          }
          index = node.end!
        })
      this.remove(index, end)
    }
    return this
  }
}

function isEmptyNodes(nodes: Node | Node[]) {
  return Array.isArray(nodes) && nodes.length === 0
}

/**
 * The result of code transformation.
 */
export interface CodeTransform {
  code: string
  map: any
}

/**
 * Generate an object of code and source map from MagicString.
 */
export function generateTransform(
  s: MagicString | undefined,
  id: string,
): CodeTransform | undefined {
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

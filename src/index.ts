import MagicString, {
  type MagicStringOptions,
  type OverwriteOptions,
  type UpdateOptions,
} from 'magic-string'
import type { Node } from '@babel/types'

export * from 'magic-string'
export { MagicString }

// eslint-disable-next-line @typescript-eslint/no-unsafe-declaration-merging
export interface MagicStringAST extends MagicString { }

/**
 * MagicString with AST manipulation
 */
// eslint-disable-next-line @typescript-eslint/no-unsafe-declaration-merging
export class MagicStringAST implements MagicString {
  offset: number
  s: MagicString

  constructor(
    str: string | MagicString,
    options?: MagicStringOptions & {
      /** offset of node */
      offset?: number
    },
    private prototype: typeof MagicString = typeof str === 'string'
      ? MagicString
      : (str.constructor as any),
  ) {
    this.s = typeof str === 'string' ? new prototype(str, options) : str
    this.offset = options?.offset ?? 0
    return new Proxy(this.s, {
      get: (target, p, receiver) => {
        if (Reflect.has(this, p)) return Reflect.get(this, p, receiver)

        let parent = Reflect.get(target, p, receiver)
        if (typeof parent === 'function') parent = parent.bind(target)
        return parent
      },
      set: (target, p, value, receiver) => {
        if (Reflect.has(this, p)) return Reflect.set(this, p, value)

        return Reflect.set(target, p, value, receiver)
      }
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

  private getOffset(offset?: number): number {
    return offset ?? this.offset
  }

  remove(
    start: number,
    end: number,
    { offset }: { offset?: number } = {},
  ): this {
    this.s.remove(start + this.getOffset(offset), end + this.getOffset(offset))
    return this
  }

  removeNode(node: Node | Node[], { offset }: { offset?: number } = {}): this {
    if (isEmptyNodes(node)) return this
    this.s.remove(...this.getNodePos(node, offset))
    return this
  }

  move(
    start: number,
    end: number,
    index: number,
    { offset }: { offset?: number } = {},
  ): this {
    this.s.move(
      start + this.getOffset(offset),
      end + this.getOffset(offset),
      index,
    )
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

  slice(
    start: number,
    end: number,
    { offset }: { offset?: number } = {},
  ): string {
    return this.s.slice(
      start + this.getOffset(offset),
      end + this.getOffset(offset),
    )
  }

  sliceNode(node: Node | Node[], { offset }: { offset?: number } = {}): string {
    if (isEmptyNodes(node)) return ''
    return this.s.slice(...this.getNodePos(node, offset))
  }

  overwrite(
    start: number,
    end: number,
    content: string,
    { offset, ...options }: OverwriteOptions & { offset?: number } = {},
  ): this {
    this.s.overwrite(
      start + this.getOffset(offset),
      end + this.getOffset(offset),
      content,
      options,
    )
    return this
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

  snip(start: number, end: number, { offset }: { offset?: number } = {}): this {
    this.s.snip(start + this.getOffset(offset), end + this.getOffset(offset))
    return this
  }

  snipNode(
    node: Node | Node[],
    { offset }: { offset?: number } = {},
  ): MagicStringAST {
    let newS: MagicString
    if (isEmptyNodes(node)) newS = this.s.snip(0, 0)
    else newS = this.s.snip(...this.getNodePos(node, offset))
    return new MagicStringAST(newS, { offset: this.offset }, this.prototype)
  }

  appendLeft(
    index: number,
    content: string,
    { offset }: { offset?: number } = {},
  ): this {
    this.s.appendLeft(index + this.getOffset(offset), content)
    return this
  }

  prependLeft(
    index: number,
    content: string,
    { offset }: { offset?: number } = {},
  ): this {
    this.s.prependLeft(index + this.getOffset(offset), content)
    return this
  }

  appendRight(
    index: number,
    content: string,
    { offset }: { offset?: number } = {},
  ): this {
    this.s.appendRight(index + this.getOffset(offset), content)
    return this
  }

  prependRight(
    index: number,
    content: string,
    { offset }: { offset?: number } = {},
  ): this {
    this.s.prependRight(index + this.getOffset(offset), content)
    return this
  }

  update(
    start: number,
    end: number,
    content: string,
    { offset, ...options }: UpdateOptions & { offset?: number } = {},
  ): this {
    this.s.update(
      start + this.getOffset(offset),
      end + this.getOffset(offset),
      content,
      options,
    )
    return this
  }

  reset(
    start: number,
    end: number,
    { offset }: { offset?: number } = {},
  ): this {
    this.s.reset(start + this.getOffset(offset), end + this.getOffset(offset))
    return this
  }

  clone(): this {
    return new MagicStringAST(
      this.s.clone(),
      { offset: this.offset },
      this.prototype,
    ) as any
  }

  toString(): string {
    return this.s.toString()
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

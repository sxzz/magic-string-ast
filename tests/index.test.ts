import MagicStringStack from 'magic-string-stack'
import { expect, test } from 'vitest'
import { MagicString, MagicStringAST } from '../src'

test('basic', () => {
  const s = new MagicStringAST('foo')
  s.append('hello')
  expect(s.toString()).toBe('foohello')
  expect(s instanceof MagicString).toBe(true)
  expect(s.offset).toBe(0)
})

test('offset', () => {
  const s = new MagicStringAST('hello world', { offset: 6 })
  expect(s.slice(0, 5)).toBe('world')
  expect(s.sliceNode({ start: 0, end: 5 } as any)).toBe('world')

  expect(s.appendLeft(0, ',').toString()).toBe('hello ,world')
  expect(s.appendRight(0, ' ').toString()).toBe('hello , world')

  expect(s.update(-1, 0, '').toString()).toBe('hello, world')
  expect(s.overwrite(0, 1, 'w').toString()).toBe('hello,world')

  s.offset = 12
  expect(s.offset).toBe(12)
})

test('clone', () => {
  const s1 = new MagicStringAST('hello world', { offset: 6 })
  const s2 = s1.clone()
  s1.append('!')

  expect(s1).not.toBe(s2)
  expect(s1.s).not.toBe(s2.s)

  expect(s1.sliceNode({ start: 0, end: 5 } as any)).toBe('world')
  expect(s1.toString()).toBe('hello world!')

  expect(s2.sliceNode({ start: 0, end: 5 } as any)).toBe('world')
  expect(s2.toString()).toBe('hello world')
})

test('empty array', () => {
  const ORIGINAL = 'foo'
  const s = new MagicStringAST(ORIGINAL)
  expect(s.sliceNode([])).toBe('')
  expect(s.snipNode([]).toString()).toBe('')
  expect(s.overwriteNode([], 'new').toString()).toBe(ORIGINAL)
  expect(s.moveNode([], 0).toString()).toBe(ORIGINAL)
})

test('compatible with magic-string-stack', () => {
  const s = new MagicStringAST(
    'hello world',
    undefined,
    MagicStringStack,
  ) as MagicStringAST & MagicStringStack
  expect(s.commit).toBeDefined()
  expect(s.clone().commit).toBeDefined()

  const s2 = new MagicStringAST(
    new MagicStringStack('hello world'),
  ) as MagicStringAST & MagicStringStack
  expect(s2.commit).toBeDefined()
  expect(s2.clone().commit).toBeDefined()
})

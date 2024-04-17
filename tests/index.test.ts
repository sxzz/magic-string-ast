import { expect, test } from 'vitest'
import { MagicString, MagicStringAST } from '../src'

test('basic', () => {
  const s = new MagicStringAST('foo')
  s.append('hello')
  expect(s.toString()).toBe('foohello')
  expect(s instanceof MagicString).toBe(true)
})

test('offset', () => {
  const s = new MagicStringAST('hello world', { offset: 6 })
  expect(s.sliceNode({ start: 0, end: 5 } as any)).toBe('world')
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

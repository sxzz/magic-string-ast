import { expect, test } from 'vitest'
import { MagicString, MagicStringBase } from '../src'

test('basic', () => {
  const s = new MagicString('foo')
  expect(s.toString()).toBe('foo')
  expect(s instanceof MagicStringBase).toBe(true)
})

test('offset', () => {
  const s = new MagicString('hello world', { offset: 6 })
  expect(s.sliceNode({ start: 0, end: 5 } as any)).toBe('world')
})

test('empty array', () => {
  const ORIGINAL = 'foo'
  const s = new MagicString(ORIGINAL)
  expect(s.sliceNode([])).toBe('')
  expect(s.snipNode([]).toString()).toBe('')
  expect(s.overwriteNode([], 'new').toString()).toBe(ORIGINAL)
  expect(s.moveNode([], 0).toString()).toBe(ORIGINAL)
})

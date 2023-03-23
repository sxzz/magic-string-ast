import { expect, test } from 'vitest'
import { MagicString } from '../src'

test('basic', () => {
  const s = new MagicString('foo')
  expect(s.toString()).toBe('foo')
})

test('empty array', () => {
  const ORIGINAL = 'foo'
  const s = new MagicString(ORIGINAL)
  expect(s.sliceNode([])).toBe('')
  expect(s.snipNode([]).toString()).toBe('')
  expect(s.overwriteNode([], 'new').toString()).toBe(ORIGINAL)
  expect(s.moveNode([], 0).toString()).toBe(ORIGINAL)
})

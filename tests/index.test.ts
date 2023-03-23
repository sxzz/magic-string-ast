import { expect, test } from 'vitest'
import { MagicString } from '../src'

test('basic', () => {
  const s = new MagicString('foo')
  expect(s.toString()).toBe('foo')
})

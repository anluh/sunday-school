import { describe, expect, it } from 'vitest'
import { createStableIdPart } from './crypto'

describe('createStableIdPart', () => {
  it('creates deterministic id-safe text without Web Crypto subtle digest', () => {
    expect(createStableIdPart('session-1:марко петренко')).toBe(createStableIdPart('session-1:марко петренко'))
    expect(createStableIdPart('session-1:марко петренко')).toMatch(/^[a-z0-9]+$/)
  })

  it('creates different values for different names', () => {
    expect(createStableIdPart('session-1:марко')).not.toBe(createStableIdPart('session-1:іван'))
  })
})

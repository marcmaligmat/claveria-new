import { describe, expect, it } from 'vitest'
import { excerpt, formatDate, formatSlug, MAX_PAGE, parsePage, plainText } from '@/lib/format'

describe('formatSlug', () => {
  it('lowercases and hyphenates', () => {
    expect(formatSlug('Sangguniang Bayan Session')).toBe('sangguniang-bayan-session')
  })
  it('strips punctuation and accents', () => {
    expect(formatSlug("Mayor's Office: Año 2026!")).toBe('mayors-office-ano-2026')
  })
  it('collapses repeated separators and trims', () => {
    expect(formatSlug('  hello   --  world  ')).toBe('hello-world')
  })
  it('returns empty string for empty input', () => {
    expect(formatSlug('')).toBe('')
  })
})

describe('plainText', () => {
  const rich = {
    root: {
      type: 'root',
      children: [
        { type: 'paragraph', children: [{ type: 'text', text: 'First para.' }] },
        { type: 'paragraph', children: [{ type: 'text', text: 'Second ' }, { type: 'text', text: 'para.' }] },
      ],
    },
  }
  it('joins text nodes with spaces between blocks', () => {
    expect(plainText(rich)).toBe('First para. Second para.')
  })
  it('returns empty string for null or malformed input', () => {
    expect(plainText(null)).toBe('')
    expect(plainText({})).toBe('')
  })
})

describe('excerpt', () => {
  it('returns short text unchanged', () => {
    expect(excerpt('short text', 20)).toBe('short text')
  })
  it('cuts at a word boundary and appends an ellipsis', () => {
    expect(excerpt('the quick brown fox jumps over the lazy dog', 20)).toBe('the quick brown fox…')
  })
})

describe('formatDate', () => {
  it('formats ISO strings as Mon DD, YYYY', () => {
    expect(formatDate('2026-10-07T03:00:00.000Z')).toBe('Oct 07, 2026')
  })
})

describe('parsePage', () => {
  it('defaults to 1 for missing or invalid input', () => {
    expect(parsePage(undefined)).toBe(1)
    expect(parsePage('abc')).toBe(1)
    expect(parsePage('0')).toBe(1)
    expect(parsePage('-5')).toBe(1)
  })
  it('keeps valid pages', () => {
    expect(parsePage('3')).toBe(3)
  })
  it('clamps huge values to MAX_PAGE', () => {
    expect(parsePage('99999999999999999999')).toBe(MAX_PAGE)
    expect(parsePage('1e400')).toBe(1)
    expect(parsePage(String(MAX_PAGE + 1))).toBe(MAX_PAGE)
  })
})

import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { normalizeName } from './name'
import { getEndOfDay, formatDateTime } from './date'
import { EMPTY_ANSWERS } from '../constants/questions'
import {
  clearExpiredLocalSubmissionSession,
  getLocalSubmissionSession,
  saveLocalSubmissionSession,
} from './localSubmissionSession'
import {
  clearSubmissionDraft,
  getSubmissionDraft,
  saveSubmissionDraft,
} from './submissionDraft'

describe('normalizeName', () => {
  it('trims, lowercases, and collapses spaces', () => {
    expect(normalizeName('  Марко   Петренко  ')).toBe('марко петренко')
  })
})

describe('date utils', () => {
  it('returns end of the same local day', () => {
    const result = getEndOfDay(new Date('2026-09-06T10:15:00'))
    expect(result.getHours()).toBe(23)
    expect(result.getMinutes()).toBe(59)
    expect(result.getSeconds()).toBe(59)
  })

  it('formats Ukrainian date and time', () => {
    const formatted = formatDateTime(new Date('2026-09-06T10:15:00'))
    expect(formatted).toMatch(/2026|вер|06|6/)
  })
})

describe('local submission session', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-09-06T10:00:00'))
  })

  afterEach(() => {
    vi.useRealTimers()
    localStorage.clear()
  })

  it('stores and reads a same-day submission session', () => {
    saveLocalSubmissionSession({
      submissionId: 'sub-1',
      submissionViewToken: 'token-1',
      sessionId: 'session-1',
      expiresAt: new Date('2026-09-06T23:59:59'),
    })

    expect(getLocalSubmissionSession()).toEqual({
      submissionId: 'sub-1',
      submissionViewToken: 'token-1',
      sessionId: 'session-1',
      expiresAt: new Date('2026-09-06T23:59:59').toISOString(),
    })
  })

  it('clears an expired local session', () => {
    saveLocalSubmissionSession({
      submissionId: 'sub-1',
      submissionViewToken: 'token-1',
      sessionId: 'session-1',
      expiresAt: new Date('2026-09-06T09:00:00'),
    })

    clearExpiredLocalSubmissionSession()

    expect(getLocalSubmissionSession()).toBeNull()
  })
})

describe('submission draft session', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-09-06T10:00:00'))
  })

  afterEach(() => {
    vi.useRealTimers()
    localStorage.clear()
  })

  it('stores and reads an unsubmitted same-day draft', () => {
    saveSubmissionDraft({
      sessionId: 'session-1',
      childName: 'Марко',
      answers: { ...EMPTY_ANSWERS, biblePassage: 'Івана 3:16' },
      expiresAt: new Date('2026-09-06T23:59:59'),
    })

    expect(getSubmissionDraft('session-1')).toEqual({
      sessionId: 'session-1',
      childName: 'Марко',
      answers: { ...EMPTY_ANSWERS, biblePassage: 'Івана 3:16' },
      expiresAt: new Date('2026-09-06T23:59:59').toISOString(),
    })
  })

  it('does not return a draft for another session', () => {
    saveSubmissionDraft({
      sessionId: 'session-1',
      childName: 'Марко',
      answers: { ...EMPTY_ANSWERS },
      expiresAt: new Date('2026-09-06T23:59:59'),
    })

    expect(getSubmissionDraft('session-2')).toBeNull()
  })

  it('clears draft after successful submission', () => {
    saveSubmissionDraft({
      sessionId: 'session-1',
      childName: 'Марко',
      answers: { ...EMPTY_ANSWERS },
      expiresAt: new Date('2026-09-06T23:59:59'),
    })

    clearSubmissionDraft()

    expect(getSubmissionDraft('session-1')).toBeNull()
  })
})

import { describe, expect, it } from 'vitest'
import { buildUserScoreStats, normalizeTeacherLogin } from './auth'

describe('normalizeTeacherLogin', () => {
  it('maps simple teacher username to Firebase-compatible email', () => {
    expect(normalizeTeacherLogin('teacher')).toBe('teacher@sunday-school.local')
  })

  it('keeps real email login unchanged', () => {
    expect(normalizeTeacherLogin('admin@example.com')).toBe('admin@example.com')
  })
})

describe('buildUserScoreStats', () => {
  it('builds default persistent score stats for a Google account', () => {
    expect(
      buildUserScoreStats({
        uid: 'uid-1',
        displayName: 'Марко',
        email: 'marko@gmail.com',
        photoURL: 'https://example.com/a.png',
      }),
    ).toEqual({
      uid: 'uid-1',
      displayName: 'Марко',
      email: 'marko@gmail.com',
      photoURL: 'https://example.com/a.png',
      totalScore: 0,
      reviewedSubmissionsCount: 0,
      lastReviewedAt: null,
    })
  })
})

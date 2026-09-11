import { describe, expect, it } from 'vitest'
import { buildReviewedUserScoreUpdate, buildSubmissionId, calculateTotalScore } from './submissions'

describe('submission scoring', () => {
  it('calculates total score from per-answer scores', () => {
    expect(calculateTotalScore({ worshipSongs: 1, biblePassage: 5, sermonTheme: 3 })).toBe(9)
  })

  it('builds a stable same-session submission id from a plain child name', () => {
    expect(buildSubmissionId('session-1', '  Марко   Петренко  ')).toBe(buildSubmissionId('session-1', 'марко петренко'))
    expect(buildSubmissionId('session-1', 'Марко')).not.toBe(buildSubmissionId('session-2', 'Марко'))
  })

  it('builds persistent user stats update when a submission is reviewed', () => {
    expect(
      buildReviewedUserScoreUpdate({
        previousTotalScore: 12,
        previousReviewedCount: 2,
        newSubmissionTotalScore: 5,
        wasAlreadyReviewed: false,
      }),
    ).toEqual({ totalScore: 17, reviewedSubmissionsCount: 3 })
  })

  it('does not double count already reviewed submissions', () => {
    expect(
      buildReviewedUserScoreUpdate({
        previousTotalScore: 12,
        previousReviewedCount: 2,
        newSubmissionTotalScore: 5,
        wasAlreadyReviewed: true,
      }),
    ).toEqual({ totalScore: 12, reviewedSubmissionsCount: 2 })
  })
})

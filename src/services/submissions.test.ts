import { describe, expect, it } from 'vitest'
import { buildReviewedUserScoreUpdate, calculateTotalScore } from './submissions'

describe('submission scoring', () => {
  it('calculates total score from per-answer scores', () => {
    expect(calculateTotalScore({ worshipSongs: 1, biblePassage: 5, sermonTheme: 3 })).toBe(9)
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

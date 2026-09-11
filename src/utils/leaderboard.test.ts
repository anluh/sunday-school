import { describe, expect, it } from 'vitest'
import type { Submission } from '../types'
import { buildLeaderboard } from './leaderboard'
const entry = (changes: Partial<Submission>): Submission => ({ id: '1', sessionId: 'first', childName: 'Анна', childNameNormalized: 'анна', childUid: 'a', childEmail: '', answers: {} as Submission['answers'], scores: {}, totalScore: 10, reviewed: true, ...changes })
describe('leaderboard', () => {
  it('totals reviewed Sundays and filters a single Sunday', () => {
    const data = [entry({}), entry({sessionId: 'second', totalScore: 15}), entry({reviewed: false, totalScore: 25})]
    expect(buildLeaderboard(data)[0]).toMatchObject({totalScore: 25, sundayCount: 2})
    expect(buildLeaderboard(data, 'second')[0]).toMatchObject({totalScore: 15, sundayCount: 1})
    expect(buildLeaderboard(data, 'empty')).toEqual([])
  })
  it('keeps different accounts with the same name separate and assigns equal ranks to ties', () => {
    const rows = buildLeaderboard([entry({}), entry({childUid: 'b'}), entry({childUid: 'c', totalScore: 5})])
    expect(rows).toHaveLength(3)
    expect(rows.map(row => row.rank)).toEqual([1, 1, 3])
  })
  it('retains legacy name-based answers without merging them into a Google account', () => {
    const rows = buildLeaderboard([entry({childUid: ''}), entry({childUid: '', sessionId: 'second'}), entry({})])
    expect(rows.map(row => row.totalScore)).toEqual([20, 10])
  })
})

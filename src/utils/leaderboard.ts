import type { Submission } from '../types'

export function buildLeaderboard(submissions: Submission[], sessionId = '') {
  const grouped = new Map<string, { key: string; childName: string; totalScore: number; sessions: Set<string> }>()
  for (const submission of submissions) {
    if (!submission.reviewed || (sessionId && submission.sessionId !== sessionId)) continue
    const key = submission.childUid ? `uid:${submission.childUid}` : `name:${submission.childNameNormalized || submission.childName.trim().toLowerCase()}`
    const row = grouped.get(key) ?? { key, childName: submission.childName, totalScore: 0, sessions: new Set<string>() }
    row.totalScore += submission.totalScore
    row.sessions.add(submission.sessionId)
    grouped.set(key, row)
  }
  const sorted = [...grouped.values()].sort((a, b) => b.totalScore - a.totalScore || a.childName.localeCompare(b.childName, 'uk'))
  let rank = 0
  return sorted.map((row, index) => {
    if (index === 0 || row.totalScore !== sorted[index - 1]!.totalScore) rank = index + 1
    return { key: row.key, childName: row.childName, totalScore: row.totalScore, sundayCount: row.sessions.size, rank }
  })
}

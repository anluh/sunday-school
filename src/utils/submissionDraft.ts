import type { Answers } from '../types'

const STORAGE_KEY = 'sunday-school-submission-draft'

export type SubmissionDraft = {
  sessionId: string
  childName: string
  answers: Answers
  expiresAt: string
}

export function saveSubmissionDraft(input: Omit<SubmissionDraft, 'expiresAt'> & { expiresAt: Date }): void {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      ...input,
      expiresAt: input.expiresAt.toISOString(),
    }),
  )
}

export function getSubmissionDraft(sessionId: string): SubmissionDraft | null {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return null

  try {
    const parsed = JSON.parse(raw) as SubmissionDraft
    if (!parsed.sessionId || !parsed.answers || !parsed.expiresAt) return null
    if (parsed.sessionId !== sessionId) return null
    if (new Date(parsed.expiresAt).getTime() < Date.now()) {
      localStorage.removeItem(STORAGE_KEY)
      return null
    }
    return parsed
  } catch {
    localStorage.removeItem(STORAGE_KEY)
    return null
  }
}

export function clearSubmissionDraft(): void {
  localStorage.removeItem(STORAGE_KEY)
}

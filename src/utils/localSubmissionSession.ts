const STORAGE_KEY = 'sunday-school-submission-session'

export type LocalSubmissionSession = {
  submissionId: string
  submissionViewToken: string
  sessionId: string
  expiresAt: string
}

export function saveLocalSubmissionSession(input: Omit<LocalSubmissionSession, 'expiresAt'> & { expiresAt: Date }): void {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      ...input,
      expiresAt: input.expiresAt.toISOString(),
    }),
  )
}

export function getLocalSubmissionSession(): LocalSubmissionSession | null {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as LocalSubmissionSession
    if (!parsed.submissionId || !parsed.submissionViewToken || !parsed.sessionId || !parsed.expiresAt) return null
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

export function clearExpiredLocalSubmissionSession(): void {
  void getLocalSubmissionSession()
}

export function clearLocalSubmissionSession(): void {
  localStorage.removeItem(STORAGE_KEY)
}

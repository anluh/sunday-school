import type { Timestamp } from 'firebase/firestore'

export type AnswerKey = 'worshipSongs' | 'biblePassage' | 'sermonTheme' | 'personalInsight' | 'actionStep'

export type Answers = Record<AnswerKey, string>
export type Scores = Partial<Record<AnswerKey, number>>

export type Session = {
  id: string
  title: string
  date: string
  isOpen: boolean
  createdAt?: Timestamp
  openedAt?: Timestamp
  closedAt?: Timestamp
}

export type Submission = {
  id: string
  sessionId: string
  childName: string
  childNameNormalized: string
  childUid: string
  childEmail: string
  childPhotoURL?: string | null
  answers: Answers
  scores: Scores
  totalScore: number
  reviewed: boolean
  submittedAt?: Timestamp
  reviewedAt?: Timestamp
}

export type ChildReceipt = {
  id: string
  submissionId: string
  sessionId: string
  childName: string
  answers: Answers
  submittedAt?: Timestamp
  expiresAt?: Timestamp
}

export type UserScoreStats = {
  uid: string
  displayName: string
  email: string
  photoURL?: string | null
  totalScore: number
  reviewedSubmissionsCount: number
  lastReviewedAt?: Timestamp | null
  updatedAt?: Timestamp
}

import {
  collection,
  doc,
  getDoc,
  getDocs,
  increment,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  Timestamp,
} from 'firebase/firestore'
import { getFirebaseAuth, getFirebaseDb } from '../firebase'
import { EMPTY_ANSWERS } from '../constants/questions'
import type { AnswerKey, Answers, ChildReceipt, Scores, Submission, UserScoreStats } from '../types'
import { getEndOfDay } from '../utils/date'
import { getLocalSubmissionSession, saveLocalSubmissionSession } from '../utils/localSubmissionSession'
import { normalizeName } from '../utils/name'
import { createRandomToken, createStableIdPart } from './crypto'

function mapSubmission(id: string, data: Record<string, any>): Submission {
  return {
    id,
    sessionId: data.sessionId,
    childName: data.childName,
    childNameNormalized: data.childNameNormalized,
    childUid: data.childUid ?? '',
    childEmail: data.childEmail ?? '',
    childPhotoURL: data.childPhotoURL ?? null,
    answers: { ...EMPTY_ANSWERS, ...data.answers },
    scores: data.scores ?? {},
    totalScore: data.totalScore ?? 0,
    reviewed: Boolean(data.reviewed),
    submittedAt: data.submittedAt,
    reviewedAt: data.reviewedAt,
  }
}

function mapReceipt(id: string, data: Record<string, any>): ChildReceipt {
  return {
    id,
    submissionId: data.submissionId,
    sessionId: data.sessionId,
    childName: data.childName,
    answers: { ...EMPTY_ANSWERS, ...data.answers },
    submittedAt: data.submittedAt,
    expiresAt: data.expiresAt,
  }
}

export function calculateTotalScore(scores: Scores): number {
  return Object.values(scores).reduce((sum, score) => sum + (Number(score) || 0), 0)
}


export function buildReviewedUserScoreUpdate(input: {
  previousTotalScore: number
  previousReviewedCount: number
  newSubmissionTotalScore: number
  wasAlreadyReviewed: boolean
}): { totalScore: number; reviewedSubmissionsCount: number } {
  if (input.wasAlreadyReviewed) {
    return {
      totalScore: input.previousTotalScore,
      reviewedSubmissionsCount: input.previousReviewedCount,
    }
  }
  return {
    totalScore: input.previousTotalScore + input.newSubmissionTotalScore,
    reviewedSubmissionsCount: input.previousReviewedCount + 1,
  }
}

function mapUserScoreStats(id: string, data: Record<string, any>): UserScoreStats {
  return {
    uid: id,
    displayName: data.displayName ?? data.email ?? 'Учень',
    email: data.email ?? '',
    photoURL: data.photoURL ?? null,
    totalScore: data.totalScore ?? 0,
    reviewedSubmissionsCount: data.reviewedSubmissionsCount ?? 0,
    lastReviewedAt: data.lastReviewedAt ?? null,
    updatedAt: data.updatedAt,
  }
}

export function buildSubmissionId(sessionId: string, childName: string, childUid = ''): string {
  const identity = childUid || normalizeName(childName)
  return `${sessionId}_${createStableIdPart(`${sessionId}:${identity}`)}`
}

export async function createSubmission(input: { sessionId: string; childName: string; answers: Answers; childUid?: string; childEmail?: string; childPhotoURL?: string | null }): Promise<{ submissionId: string; receiptToken: string }> {
  const user = getFirebaseAuth().currentUser
  if (!user || !user.providerData.some(provider => provider.providerId === 'google.com')) throw new Error('Увійди через Google, щоб відправити відповіді.')
  input = { ...input, childUid: user.uid, childEmail: user.email || '', childPhotoURL: user.photoURL }
  const db = getFirebaseDb()
  const childNameNormalized = normalizeName(input.childName)
  const childNameIdPart = createStableIdPart(`${input.sessionId}:${childNameNormalized}`)
  const submissionId = buildSubmissionId(input.sessionId, input.childName, input.childUid)
  const receiptToken = createRandomToken()
  const expiresAt = getEndOfDay()
  const submissionRef = doc(db, 'submissions', submissionId)
  const existing = await getDoc(submissionRef)
  if (existing.exists()) {
    throw new Error('Ти вже відправив/відправила відповіді за цю неділю.')
  }

  const submittedAt = serverTimestamp()
  await setDoc(submissionRef, {
    sessionId: input.sessionId,
    childName: input.childName.trim(),
    childNameNormalized,
    childUid: input.childUid ?? '',
    childEmail: input.childEmail ?? '',
    childPhotoURL: input.childPhotoURL ?? null,
    childNameIdPart,
    answers: input.answers,
    scores: {},
    totalScore: 0,
    reviewed: false,
    submittedAt,
  })

  await setDoc(doc(db, 'childReceipts', receiptToken), {
    submissionId,
    sessionId: input.sessionId,
    childName: input.childName.trim(),
    answers: input.answers,
    submittedAt,
    expiresAt: Timestamp.fromDate(expiresAt),
  })

  saveLocalSubmissionSession({ submissionId, submissionViewToken: receiptToken, sessionId: input.sessionId, expiresAt })
  return { submissionId, receiptToken }
}

export async function getOwnSubmissionFromLocalSession(): Promise<ChildReceipt | null> {
  const local = getLocalSubmissionSession()
  if (!local) return null
  const db = getFirebaseDb()
  const receiptSnap = await getDoc(doc(db, 'childReceipts', local.submissionViewToken))
  if (!receiptSnap.exists()) return null
  const receipt = mapReceipt(receiptSnap.id, receiptSnap.data())
  if (receipt.submissionId !== local.submissionId || receipt.sessionId !== local.sessionId) return null
  return receipt
}

export async function getSubmissionsBySession(sessionId: string): Promise<Submission[]> {
  const db = getFirebaseDb()
  const snapshot = await getDocs(query(collection(db, 'submissions'), where('sessionId', '==', sessionId), orderBy('submittedAt', 'desc')))
  return snapshot.docs.map((item) => mapSubmission(item.id, item.data()))
}

export async function updateAnswerScore(submissionId: string, answerKey: AnswerKey, score: number): Promise<void> {
  if (score < 1 || score > 5) throw new Error('Бал має бути від 1 до 5')
  const db = getFirebaseDb()
  const ref = doc(db, 'submissions', submissionId)
  const snap = await getDoc(ref)
  if (!snap.exists()) throw new Error('Відповідь не знайдена')
  const current = mapSubmission(snap.id, snap.data())
  const scores = { ...current.scores, [answerKey]: score }
  const nextTotalScore = calculateTotalScore(scores)
  const delta = nextTotalScore - current.totalScore
  await updateDoc(ref, {
    [`scores.${answerKey}`]: score,
    totalScore: nextTotalScore,
  })
  if (current.reviewed && current.childUid && delta !== 0) {
    await updateDoc(doc(db, 'users', current.childUid), {
      totalScore: increment(delta),
      updatedAt: serverTimestamp(),
    })
  }
}

export async function markReviewed(submissionId: string): Promise<void> {
  const db = getFirebaseDb()
  const ref = doc(db, 'submissions', submissionId)
  const snap = await getDoc(ref)
  if (!snap.exists()) throw new Error('Відповідь не знайдена')
  const submission = mapSubmission(snap.id, snap.data())
  await updateDoc(ref, {
    reviewed: true,
    reviewedAt: serverTimestamp(),
  })
  if (!submission.reviewed && submission.childUid) {
    await updateDoc(doc(db, 'users', submission.childUid), {
      totalScore: increment(submission.totalScore),
      reviewedSubmissionsCount: increment(1),
      lastReviewedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
  }
}

export async function getReviewedSubmissions(): Promise<Submission[]> {
  const db = getFirebaseDb()
  const snapshot = await getDocs(query(collection(db, 'submissions'), where('reviewed', '==', true)))
  return snapshot.docs.map((item) => mapSubmission(item.id, item.data()))
}

export async function listUserScoreStats(): Promise<UserScoreStats[]> {
  const db = getFirebaseDb()
  const snapshot = await getDocs(query(collection(db, 'users'), orderBy('totalScore', 'desc')))
  return snapshot.docs.map((item) => mapUserScoreStats(item.id, item.data()))
}

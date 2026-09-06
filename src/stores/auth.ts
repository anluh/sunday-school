import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  type User,
} from 'firebase/auth'
import { doc, getDoc, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore'
import { reactive } from 'vue'
import { getFirebaseAuth, getFirebaseDb, isFirebaseConfigured } from '../firebase'

import type { UserScoreStats } from '../types'

export const TEACHER_EMAILS = ['teacher@sunday-school.local', ...(import.meta.env.VITE_TEACHER_EMAILS || '').split(',').map((email: string) => email.trim()).filter(Boolean)]

export function isTeacherUser(user: Pick<User, 'email'> | null): boolean {
  return Boolean(user?.email && TEACHER_EMAILS.includes(user.email))
}

export const authState = reactive<{ user: User | null; ready: boolean }>({
  user: null,
  ready: !isFirebaseConfigured,
})

let subscribed = false

export function initAuthListener(): void {
  if (subscribed || !isFirebaseConfigured) return
  subscribed = true
  onAuthStateChanged(getFirebaseAuth(), async (user) => {
    authState.user = user
    authState.ready = true
    if (user) await ensureUserProfile(user)
  })
}

export function normalizeTeacherLogin(login: string): string {
  const trimmed = login.trim()
  if (trimmed.includes('@')) return trimmed
  return `${trimmed}@sunday-school.local`
}

export function buildUserScoreStats(user: Pick<User, 'uid' | 'displayName' | 'email' | 'photoURL'>): Omit<UserScoreStats, 'updatedAt'> {
  return {
    uid: user.uid,
    displayName: user.displayName || user.email?.split('@')[0] || 'Учень',
    email: user.email || '',
    photoURL: user.photoURL || null,
    totalScore: 0,
    reviewedSubmissionsCount: 0,
    lastReviewedAt: null,
  }
}

export async function ensureUserProfile(user: User): Promise<void> {
  const db = getFirebaseDb()
  const userRef = doc(db, 'users', user.uid)
  const existing = await getDoc(userRef)
  const profileFields = {
    uid: user.uid,
    displayName: user.displayName || user.email?.split('@')[0] || 'Учень',
    email: user.email || '',
    photoURL: user.photoURL || null,
    updatedAt: serverTimestamp(),
  }

  if (existing.exists()) {
    await updateDoc(userRef, profileFields)
    return
  }

  await setDoc(userRef, {
    ...buildUserScoreStats(user),
    updatedAt: serverTimestamp(),
  })
}

export async function loginTeacher(login: string, password: string): Promise<void> {
  await signInWithEmailAndPassword(getFirebaseAuth(), normalizeTeacherLogin(login), password)
}

export async function loginWithGoogle(): Promise<void> {
  const provider = new GoogleAuthProvider()
  provider.setCustomParameters({ prompt: 'select_account' })
  const result = await signInWithPopup(getFirebaseAuth(), provider)
  await ensureUserProfile(result.user)
}

export async function logoutTeacher(): Promise<void> {
  await signOut(getFirebaseAuth())
}

export async function logoutUser(): Promise<void> {
  await signOut(getFirebaseAuth())
}

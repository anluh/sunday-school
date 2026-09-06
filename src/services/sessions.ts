import {
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  writeBatch,
} from 'firebase/firestore'
import { getFirebaseDb } from '../firebase'
import type { Session } from '../types'

const CONFIG_DOC = 'main'

function mapSession(id: string, data: Record<string, any>): Session {
  return {
    id,
    title: data.title ?? 'Неділя',
    date: data.date ?? '',
    isOpen: Boolean(data.isOpen),
    createdAt: data.createdAt,
    openedAt: data.openedAt,
    closedAt: data.closedAt,
  }
}

export async function getActiveSession(): Promise<Session | null> {
  const db = getFirebaseDb()
  const configSnap = await getDoc(doc(db, 'appConfig', CONFIG_DOC))
  const activeSessionId = configSnap.exists() ? configSnap.data().activeSessionId : null
  if (!activeSessionId) return null
  const sessionSnap = await getDoc(doc(db, 'sessions', activeSessionId))
  if (!sessionSnap.exists()) return null
  const session = mapSession(sessionSnap.id, sessionSnap.data())
  return session.isOpen ? session : null
}

export async function listSessions(): Promise<Session[]> {
  const db = getFirebaseDb()
  const snapshot = await getDocs(query(collection(db, 'sessions'), orderBy('date', 'desc')))
  return snapshot.docs.map((item) => mapSession(item.id, item.data()))
}

export async function createSession(input: { title: string; date: string }): Promise<string> {
  const db = getFirebaseDb()
  const id = input.date || crypto.randomUUID()
  await setDoc(doc(db, 'sessions', id), {
    title: input.title,
    date: input.date,
    isOpen: false,
    createdAt: serverTimestamp(),
  })
  return id
}

export async function openSession(sessionId: string): Promise<void> {
  const db = getFirebaseDb()
  const sessions = await listSessions()
  const batch = writeBatch(db)
  for (const session of sessions) {
    batch.update(doc(db, 'sessions', session.id), {
      isOpen: false,
      closedAt: serverTimestamp(),
    })
  }
  batch.update(doc(db, 'sessions', sessionId), {
    isOpen: true,
    openedAt: serverTimestamp(),
    closedAt: null,
  })
  batch.set(doc(db, 'appConfig', CONFIG_DOC), { activeSessionId: sessionId }, { merge: true })
  await batch.commit()
}

export async function closeSession(sessionId: string): Promise<void> {
  const db = getFirebaseDb()
  await updateDoc(doc(db, 'sessions', sessionId), {
    isOpen: false,
    closedAt: serverTimestamp(),
  })
  await setDoc(doc(db, 'appConfig', CONFIG_DOC), { activeSessionId: null }, { merge: true })
}

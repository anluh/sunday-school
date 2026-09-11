import { beforeEach, describe, expect, it, vi } from 'vitest'
const mocks = vi.hoisted(() => ({ auth: { currentUser: { uid: 'student-a' } as {uid: string} | null }, getDoc: vi.fn() }))
vi.mock('../firebase', () => ({ getFirebaseAuth: () => mocks.auth, getFirebaseDb: () => ({}) }))
vi.mock('firebase/firestore', async (original) => ({ ...await original<typeof import('firebase/firestore')>(), doc: vi.fn((_db, _collection, id) => id), getDoc: mocks.getDoc }))
import { buildSubmissionId, getOwnSubmissionForSession } from './submissions'
describe('account submission recovery', () => {
  beforeEach(() => { localStorage.clear(); mocks.auth.currentUser = { uid: 'student-a' }; mocks.getDoc.mockReset() })
  it('recovers the same account submission without any local browser data', async () => {
    mocks.getDoc.mockResolvedValue({ exists: () => true, data: () => ({childUid: 'student-a', sessionId: 'sunday', childName: 'Анна', answers: {sermonTheme: 'Любов'}}) })
    expect(await getOwnSubmissionForSession('sunday')).toMatchObject({childName: 'Анна', answers: {sermonTheme: 'Любов'}})
    expect(mocks.getDoc).toHaveBeenCalledWith(buildSubmissionId('sunday', '', 'student-a'))
  })
  it('does not show a response belonging to another account', async () => {
    mocks.getDoc.mockResolvedValue({ exists: () => true, data: () => ({childUid: 'student-b'}) })
    expect(await getOwnSubmissionForSession('sunday')).toBeNull()
  })
  it('discards an in-flight response after account switching', async () => {
    mocks.getDoc.mockImplementation(async () => { mocks.auth.currentUser = { uid: 'student-b' }; return { exists: () => true, data: () => ({childUid: 'student-a'}) } })
    expect(await getOwnSubmissionForSession('sunday')).toBeNull()
  })
})

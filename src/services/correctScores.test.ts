import { expect, it, vi } from 'vitest'
const tx = vi.hoisted(() => ({ get: vi.fn(), update: vi.fn() }))
vi.mock('../firebase', () => ({ getFirebaseDb: () => ({}) }))
vi.mock('firebase/firestore', async original => ({
  ...await original<typeof import('firebase/firestore')>(),
  doc: (_db: unknown, collection: string, id: string) => `${collection}/${id}`,
  runTransaction: (_db: unknown, callback: (value: typeof tx) => unknown) => callback(tx),
  increment: (value: number) => ({delta: value}), serverTimestamp: () => 'now',
}))
import { correctReviewedScores } from './submissions'
it('corrects the total by the difference without counting the Sunday again', async () => {
  tx.get.mockResolvedValue({exists: () => true, id: 's', data: () => ({reviewed: true, childUid: 'u', totalScore: 10})})
  await correctReviewedScores('s', {worshipSongs: 5, biblePassage: 3})
  expect(tx.update).toHaveBeenCalledWith('submissions/s', {scores: {worshipSongs: 5, biblePassage: 3}, totalScore: 8, reviewedAt: 'now'})
  expect(tx.update).toHaveBeenCalledWith('users/u', {totalScore: {delta: -2}, updatedAt: 'now'})
})
it('rejects invalid scores before saving', async () => {
  await expect(correctReviewedScores('s', {worshipSongs: 6})).rejects.toThrow('Бал має бути від 1 до 5')
})

<template>
  <section class="space-y-4">
    <div class="card p-5">
      <h2 class="text-2xl font-black text-slate-900">Перевірка відповідей</h2>
      <select v-model="selectedSessionId" class="input mt-4" @change="loadSubmissions">
        <option value="">Вибери неділю</option>
        <option v-for="session in sessions" :key="session.id" :value="session.id">{{ session.title }} — {{ formatDate(session.date) }}</option>
      </select>
    </div>

    <LoadingState v-if="loading" />
    <EmptyState v-else-if="selectedSessionId && submissions.length === 0" title="Відповідей ще немає">Коли діти відправлять форму, відповіді зʼявляться тут.</EmptyState>

    <article v-for="submission in submissions" :key="submission.id" class="card p-4">
      <div class="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 class="text-xl font-black text-slate-900">{{ submission.childName }}</h3>
          <p class="text-sm text-slate-600">{{ formatDateTime(submission.submittedAt) }}</p>
        </div>
        <div class="flex items-center gap-2">
          <span class="rounded-full bg-amber-100 px-3 py-1 text-sm font-black text-amber-700">{{ submission.totalScore }} балів</span>
          <span v-if="submission.reviewed" class="rounded-full bg-emerald-100 px-3 py-1 text-sm font-black text-emerald-700">Перевірено</span>
        </div>
      </div>

      <div class="space-y-4">
        <section v-for="question in QUESTIONS" :key="question.key" class="rounded-2xl bg-white p-4">
          <h4 class="font-extrabold text-slate-900">{{ question.label }}</h4>
          <p class="mb-3 mt-2 whitespace-pre-wrap text-slate-700">{{ submission.answers[question.key] || '—' }}</p>
          <ScoreButtons :model-value="submission.scores[question.key]" @update:model-value="score(submission.id, question.key, $event)" />
        </section>
      </div>
      <button class="btn-primary mt-4 w-full sm:w-auto" :disabled="submission.reviewed" @click="review(submission.id)">Позначити як перевірено</button>
    </article>
    <div v-if="error" class="rounded-2xl bg-rose-100 p-4 font-bold text-rose-700">{{ error }}</div>
  </section>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import EmptyState from '../components/EmptyState.vue'
import LoadingState from '../components/LoadingState.vue'
import ScoreButtons from '../components/ScoreButtons.vue'
import { QUESTIONS } from '../constants/questions'
import { listSessions } from '../services/sessions'
import { getSubmissionsBySession, markReviewed, updateAnswerScore } from '../services/submissions'
import type { AnswerKey, Session, Submission } from '../types'
import { formatDate, formatDateTime } from '../utils/date'

const sessions = ref<Session[]>([])
const submissions = ref<Submission[]>([])
const selectedSessionId = ref('')
const loading = ref(false)
const error = ref('')

onMounted(async () => {
  sessions.value = await listSessions()
})

async function loadSubmissions() {
  if (!selectedSessionId.value) return
  loading.value = true
  try {
    submissions.value = await getSubmissionsBySession(selectedSessionId.value)
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Не вдалося завантажити відповіді'
  } finally {
    loading.value = false
  }
}

async function score(submissionId: string, answerKey: AnswerKey, value: number) {
  await updateAnswerScore(submissionId, answerKey, value)
  await loadSubmissions()
}

async function review(submissionId: string) {
  await markReviewed(submissionId)
  await loadSubmissions()
}
</script>

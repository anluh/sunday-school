<template>
  <section class="card p-3 sm:p-4">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <h2 class="text-xl font-black text-slate-900">Рейтинг</h2>
      <select v-model="selectedSession" aria-label="Період рейтингу" class="min-w-0 max-w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800" :disabled="loading">
        <option value="">Загальний · усі неділі</option>
        <option v-for="session in sessions" :key="session.id" :value="session.id">{{ session.date }} · {{ session.title }}</option>
      </select>
    </div>
    <LoadingState v-if="loading" class="mt-3" />
    <div v-else-if="error" role="alert" class="mt-3 text-sm text-rose-700">
      {{ error }} <button class="font-bold underline" @click="load">Спробувати ще раз</button>
    </div>
    <template v-else>
      <p class="my-2 text-xs text-slate-500">Лише перевірені відповіді · Учасників: {{ rows.length }}</p>
      <ol class="divide-y divide-slate-100 overflow-hidden rounded-xl bg-white">
        <li v-for="row in rows" :key="row.key" class="flex items-center gap-3 px-3 py-2">
          <span class="grid h-7 w-7 shrink-0 place-items-center rounded-lg text-xs font-black" :class="row.rank <= 3 ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'">{{ row.rank }}</span>
          <div class="min-w-0 flex-1">
            <h3 class="break-words text-sm font-bold text-slate-900">{{ row.childName }}</h3>
            <p v-if="!selectedSession" class="text-xs text-slate-500">Неділь: {{ row.sundayCount }}</p>
          </div>
          <span class="shrink-0 text-lg font-black tabular-nums text-indigo-600">{{ row.totalScore }} <span class="text-xs font-medium text-slate-500">б.</span></span>
        </li>
      </ol>
      <p v-if="!rows.length" class="py-4 text-sm text-slate-500">{{ selectedSession ? 'За цю неділю ще немає перевірених відповідей.' : 'Поки немає перевірених відповідей.' }}</p>
    </template>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import LoadingState from '../components/LoadingState.vue'
import { getReviewedSubmissions } from '../services/submissions'
import { listSessions } from '../services/sessions'
import type { Session, Submission } from '../types'
import { buildLeaderboard } from '../utils/leaderboard'

const submissions = ref<Submission[]>([])
const sessions = ref<Session[]>([])
const selectedSession = ref('')
const loading = ref(true)
const error = ref('')
const rows = computed(() => buildLeaderboard(submissions.value, selectedSession.value))

async function load() {
  loading.value = true
  error.value = ''
  try {
    const [answers, sundays] = await Promise.all([getReviewedSubmissions(), listSessions()])
    submissions.value = answers
    sessions.value = sundays
  } catch {
    error.value = 'Не вдалося завантажити рейтинг.'
  } finally {
    loading.value = false
  }
}
onMounted(load)
</script>

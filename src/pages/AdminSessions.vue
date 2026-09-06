<template>
  <section class="space-y-4">
    <form class="card space-y-3 p-5" @submit.prevent="create">
      <h2 class="text-2xl font-black text-slate-900">Неділі</h2>
      <input v-model="title" class="input" placeholder="Назва, наприклад: Неділя 6 вересня" />
      <input v-model="date" class="input" type="date" />
      <button class="btn-primary w-full sm:w-auto">Створити неділю</button>
    </form>

    <LoadingState v-if="loading" />
    <article v-for="session in sessions" :key="session.id" class="card flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h3 class="text-lg font-black text-slate-900">{{ session.title }}</h3>
        <p class="text-sm text-slate-600">{{ formatDate(session.date) }}</p>
        <span v-if="session.isOpen" class="mt-2 inline-block rounded-full bg-emerald-100 px-3 py-1 text-xs font-black text-emerald-700">Відкрита</span>
      </div>
      <div class="flex gap-2">
        <button v-if="!session.isOpen" class="rounded-xl bg-indigo-600 px-4 py-2 font-bold text-white" @click="open(session.id)">Відкрити</button>
        <button v-else class="rounded-xl bg-slate-900 px-4 py-2 font-bold text-white" @click="close(session.id)">Закрити</button>
      </div>
    </article>
    <div v-if="error" class="rounded-2xl bg-rose-100 p-4 font-bold text-rose-700">{{ error }}</div>
  </section>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import LoadingState from '../components/LoadingState.vue'
import { closeSession, createSession, listSessions, openSession } from '../services/sessions'
import type { Session } from '../types'
import { formatDate } from '../utils/date'

const sessions = ref<Session[]>([])
const loading = ref(true)
const title = ref('')
const date = ref(new Date().toISOString().slice(0, 10))
const error = ref('')

onMounted(load)

async function load() {
  loading.value = true
  try {
    sessions.value = await listSessions()
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Не вдалося завантажити неділі'
  } finally {
    loading.value = false
  }
}

async function create() {
  error.value = ''
  await createSession({ title: title.value || `Неділя ${date.value}`, date: date.value })
  title.value = ''
  await load()
}

async function open(id: string) {
  await openSession(id)
  await load()
}

async function close(id: string) {
  await closeSession(id)
  await load()
}
</script>

<template>
  <LoadingState v-if="loading || !authState.ready" />
  <EmptyState v-else-if="configError" title="Потрібно підключити Firebase">
    {{ configError }}
  </EmptyState>
  <section v-else-if="!authState.user || isTeacherUser(authState.user)" class="card mx-auto max-w-md space-y-4 p-6">
    <h2 class="text-2xl font-black">Вхід учня</h2>
    <p>Увійди через Google, щоб заповнити відповіді.</p>
    <button class="btn-primary w-full" :disabled="signingIn" @click="googleLogin">{{ signingIn ? 'Входимо…' : 'Увійти через Google' }}</button>
    <p v-if="error" role="alert" class="text-rose-700">{{ error }}</p>
  </section>
  <div v-else-if="error" role="alert" class="card p-5 text-rose-700">{{ error }} <button class="font-bold underline" @click="load">Спробувати ще раз</button></div>
  <section v-else-if="ownReceipt" class="card p-5">
    <p class="mb-2 text-sm font-bold uppercase tracking-wide text-emerald-600">Відправлено</p>
    <h2 class="text-2xl font-black text-slate-900">{{ ownReceipt.childName }}, твої відповіді збережені</h2>
    <p class="mt-2 text-slate-600">Час відправлення: <strong>{{ formatDateTime(ownReceipt.submittedAt) }}</strong></p>
    <div class="mt-5 space-y-4">
      <article v-for="question in QUESTIONS" :key="question.key" class="rounded-2xl bg-white p-4">
        <h3 class="font-extrabold text-slate-900">{{ question.label }}</h3>
        <p class="mt-2 whitespace-pre-wrap text-slate-700">{{ ownReceipt.answers[question.key] || '—' }}</p>
      </article>
    </div>
  </section>
  <EmptyState v-else-if="!activeSession" title="Зараз немає відкритого завдання">
    Викладач відкриє неділю, і тут зʼявиться форма для відповідей.
  </EmptyState>
  <form v-else class="space-y-4" @submit.prevent="submit">
    <section class="card p-5">
      <p class="mb-2 text-sm font-bold uppercase tracking-wide text-indigo-600">{{ activeSession.title }}</p>
      <h2 class="text-2xl font-black text-slate-900">Напиши, що ти почув/почула сьогодні</h2>
      <p class="mt-2 text-slate-600">Заповнено {{ completedCount }} з {{ QUESTIONS.length }}</p>
      <label class="mt-5 block text-sm font-extrabold text-slate-800" for="childName">Твоє імʼя</label>
      <input id="childName" v-model="childName" class="input mt-2" placeholder="Наприклад: Марко" autocomplete="name" />
    </section>

    <QuestionCard v-for="(question, index) in QUESTIONS" :key="question.key" v-model="answers[question.key]" :question="question" :index="index" />

    <div v-if="error" class="rounded-2xl bg-rose-100 p-4 font-bold text-rose-700">{{ error }}</div>
    <button class="btn-primary w-full" :disabled="submitting || !canSubmit">{{ submitting ? 'Відправляємо…' : 'Відправити відповіді' }}</button>
  </form>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import EmptyState from '../components/EmptyState.vue'
import LoadingState from '../components/LoadingState.vue'
import QuestionCard from '../components/QuestionCard.vue'
import { EMPTY_ANSWERS, QUESTIONS } from '../constants/questions'
import { isFirebaseConfigured } from '../firebase'
import { getActiveSession, listSessions } from '../services/sessions'
import { createSubmission, getOwnSubmissionForSession } from '../services/submissions'
import type { Answers, ChildReceipt, Session } from '../types'
import { formatDateTime, getEndOfDay } from '../utils/date'
import { clearSubmissionDraft, getSubmissionDraft, saveSubmissionDraft } from '../utils/submissionDraft'

import { authState, isTeacherUser, loginWithGoogle } from '../stores/auth'

const signingIn = ref(false)
async function googleLogin() {
  signingIn.value = true
  error.value = ''
  try { await loginWithGoogle() }
  catch (err) { error.value = err instanceof Error ? err.message : 'Не вдалося увійти через Google' }
  finally { signingIn.value = false }
}

const router = useRouter()
const loading = ref(true)
const submitting = ref(false)
const error = ref('')
const configError = ref('')
const activeSession = ref<Session | null>(null)
const ownReceipt = ref<ChildReceipt | null>(null)
const childName = ref('')
const answers = ref<Answers>({ ...EMPTY_ANSWERS })

const completedCount = computed(() => QUESTIONS.filter((question) => answers.value[question.key].trim()).length)
const canSubmit = computed(() => childName.value.trim().length >= 2 && completedCount.value === QUESTIONS.length)

watch(
  [childName, answers, activeSession],
  () => {
    if (!activeSession.value || ownReceipt.value) return
    saveSubmissionDraft({
      sessionId: activeSession.value.id,
      childName: childName.value,
      answers: answers.value,
      expiresAt: getEndOfDay(),
    })
  },
  { deep: true },
)

let loadVersion = 0

watch(() => [authState.ready, authState.user?.uid], load, { immediate: true })

async function load() {
  const version = ++loadVersion
  error.value = ''
  ownReceipt.value = null
  activeSession.value = null
  childName.value = ''
  answers.value = { ...EMPTY_ANSWERS }
  try {
    if (!isFirebaseConfigured) {
      configError.value = 'Доступ до Firebase буде додано пізніше. Після цього форма запрацює.'
      return
    }
    if (!authState.ready || !authState.user || isTeacherUser(authState.user)) return
    loading.value = true
    childName.value = authState.user.displayName || ''
    const session = await getActiveSession()
    if (version !== loadVersion) return
    const candidates = session ? [session] : await listSessions()
    for (const candidate of candidates) {
      const receipt = await getOwnSubmissionForSession(candidate.id)
      if (version !== loadVersion) return
      if (receipt) { ownReceipt.value = receipt; break }
    }
    if (version !== loadVersion) return
    activeSession.value = session
    if (!ownReceipt.value && session) restoreDraft(session.id)
  } catch (err) {
    if (version === loadVersion) error.value = err instanceof Error ? err.message : 'Не вдалося завантажити форму'
  } finally {
    if (version === loadVersion) loading.value = false
  }
}

async function submit() {
  if (!activeSession.value || !canSubmit.value) return
  error.value = ''
  submitting.value = true
  try {
    await createSubmission({
      sessionId: activeSession.value.id,
      childName: childName.value,
      answers: answers.value,
    })
    clearSubmissionDraft()
    await router.push('/thanks')
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Не вдалося відправити відповіді'
  } finally {
    submitting.value = false
  }
}

function restoreDraft(sessionId: string) {
  const draft = getSubmissionDraft(sessionId)
  if (!draft) return
  childName.value = draft.childName
  answers.value = { ...EMPTY_ANSWERS, ...draft.answers }
}

</script>

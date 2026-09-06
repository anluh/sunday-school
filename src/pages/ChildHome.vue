<template>
  <LoadingState v-if="loading" />
  <EmptyState v-else-if="configError" title="Потрібно підключити Firebase">
    {{ configError }}
  </EmptyState>
  <EmptyState v-else-if="!authState.user" title="Увійди через Gmail">
    <div class="space-y-4">
      <p>Щоб кожна дитина бачила тільки свої відповіді і бали зберігались за акаунтом, потрібно увійти через Google.</p>
      <button class="btn-primary" @click="loginWithGoogle">Увійти через Google</button>
    </div>
  </EmptyState>
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
    <p class="mt-5 rounded-2xl bg-indigo-50 p-4 text-sm font-semibold text-indigo-800">Бали бачить тільки викладач. Ти можеш переглядати цю відповідь з цього пристрою до кінця дня.</p>
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
      <div class="mt-3 flex items-center gap-3 rounded-2xl bg-white p-3 text-sm text-slate-600">
        <img v-if="authState.user?.photoURL" :src="authState.user.photoURL" alt="" class="h-8 w-8 rounded-full" />
        <span>Акаунт: <strong>{{ authState.user?.email }}</strong></span>
      </div>
    </section>

    <QuestionCard v-for="(question, index) in QUESTIONS" :key="question.key" v-model="answers[question.key]" :question="question" :index="index" />

    <div v-if="error" class="rounded-2xl bg-rose-100 p-4 font-bold text-rose-700">{{ error }}</div>
    <button class="btn-primary w-full" :disabled="submitting || !canSubmit">{{ submitting ? 'Відправляємо…' : 'Відправити відповіді' }}</button>
  </form>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import EmptyState from '../components/EmptyState.vue'
import LoadingState from '../components/LoadingState.vue'
import QuestionCard from '../components/QuestionCard.vue'
import { EMPTY_ANSWERS, QUESTIONS } from '../constants/questions'
import { isFirebaseConfigured } from '../firebase'
import { getActiveSession } from '../services/sessions'
import { createSubmission, getOwnSubmissionFromLocalSession } from '../services/submissions'
import { authState, initAuthListener, loginWithGoogle } from '../stores/auth'
import type { Answers, ChildReceipt, Session } from '../types'
import { formatDateTime, getEndOfDay } from '../utils/date'
import { clearSubmissionDraft, getSubmissionDraft, saveSubmissionDraft } from '../utils/submissionDraft'

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

onMounted(load)

async function load() {
  try {
    if (!isFirebaseConfigured) {
      configError.value = 'Доступ до Firebase буде додано пізніше. Після цього форма запрацює.'
      return
    }
    initAuthListener()
    await waitForAuthReady()
    if (!authState.user) return
    childName.value = authState.user.displayName || authState.user.email?.split('@')[0] || ''
    ownReceipt.value = await getOwnSubmissionFromLocalSession()
    if (!ownReceipt.value) {
      activeSession.value = await getActiveSession()
      if (activeSession.value) restoreDraft(activeSession.value.id)
    }
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Не вдалося завантажити форму'
  } finally {
    loading.value = false
  }
}

async function submit() {
  if (!activeSession.value || !canSubmit.value || !authState.user) return
  error.value = ''
  submitting.value = true
  try {
    await createSubmission({
      sessionId: activeSession.value.id,
      childName: childName.value,
      answers: answers.value,
      childUid: authState.user.uid,
      childEmail: authState.user.email || '',
      childPhotoURL: authState.user.photoURL,
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

async function waitForAuthReady() {
  if (authState.ready) return
  await new Promise<void>((resolve) => {
    const timer = setInterval(() => {
      if (authState.ready) {
        clearInterval(timer)
        resolve()
      }
    }, 25)
  })
}
</script>

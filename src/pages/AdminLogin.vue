<template>
  <form class="card mx-auto max-w-md space-y-4 p-6" @submit.prevent="login">
    <div>
      <p class="text-sm font-bold uppercase tracking-wide text-indigo-600">Викладач</p>
      <h2 class="text-2xl font-black text-slate-900">Вхід в адмінку</h2>
    </div>
    <input v-model="loginName" class="input" type="text" placeholder="Логін" autocomplete="username" />
    <input v-model="password" class="input" type="password" placeholder="Пароль" autocomplete="current-password" />
    <div v-if="error" class="rounded-2xl bg-rose-100 p-3 text-sm font-bold text-rose-700">{{ error }}</div>
    <button class="btn-primary w-full" :disabled="loading">{{ loading ? 'Вхід…' : 'Увійти' }}</button>
  </form>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { loginTeacher } from '../stores/auth'

const router = useRouter()
const loginName = ref('')
const password = ref('')
const loading = ref(false)
const error = ref('')

async function login() {
  loading.value = true
  error.value = ''
  try {
    await loginTeacher(loginName.value, password.value)
    await router.push('/admin')
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Не вдалося увійти'
  } finally {
    loading.value = false
  }
}
</script>

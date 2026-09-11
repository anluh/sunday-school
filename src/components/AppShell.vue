<template>
  <main class="min-h-screen bg-gradient-to-br from-orange-50 via-violet-50 to-sky-50 px-4 py-5 sm:px-6">
    <div class="mx-auto max-w-5xl">
      <header class="mb-5 flex items-center justify-between gap-3">
        <RouterLink :to="isTeacherUser(authState.user) ? '/admin' : '/'" aria-label="AG Sunday School — головна" class="flex shrink-0 items-center gap-2.5 rounded-xl focus-visible:outline-indigo-500">
          <svg viewBox="0 0 56 56" class="h-11 w-11 sm:h-14 sm:w-14" aria-hidden="true">
            <defs>
              <linearGradient id="ag-logo-gradient" x1="0" y1="0" x2="1" y2="1">
                <stop stop-color="#7c3aed" />
                <stop offset="1" stop-color="#2563eb" />
              </linearGradient>
            </defs>
            <rect x="2" y="4" width="50" height="50" rx="17" fill="url(#ag-logo-gradient)" />
            <path d="M12 39 Q22 35 28 39 Q36 35 44 39" fill="none" stroke="#a5f3fc" stroke-width="3" stroke-linecap="round" />
            <text x="27" y="32" text-anchor="middle" fill="white" font-size="23" font-weight="900" font-family="Arial, sans-serif" letter-spacing="-1.5">AG</text>
            <path d="M47 0 L49 6 L55 8 L49 10 L47 16 L45 10 L39 8 L45 6 Z" fill="#fbbf24" />
          </svg>
          <div class="leading-none">
            <span class="block text-xl font-black tracking-tight text-violet-600 sm:text-2xl">Sunday<span class="text-amber-400">.</span></span>
            <span class="mt-1 block text-[10px] font-extrabold uppercase tracking-[0.25em] text-sky-600 sm:text-xs">School</span>
          </div>
        </RouterLink>
        <div class="flex min-w-0 items-center gap-2 sm:gap-3">
          <span v-if="authState.user" class="hidden max-w-48 truncate text-xs text-slate-500 md:block">{{ authState.user.displayName || authState.user.email }}</span>
          <RouterLink v-if="!isTeacherUser(authState.user)" to="/admin" class="rounded-full bg-white/80 px-3 py-2 text-xs font-bold text-slate-700 shadow-sm sm:text-sm">Викладач</RouterLink>
          <button v-if="authState.user" class="rounded-full bg-white/80 px-3 py-2 text-xs font-bold text-indigo-700 shadow-sm transition hover:bg-indigo-50 disabled:opacity-50 sm:text-sm" :disabled="signingOut" @click="logout">{{ signingOut ? 'Виходимо…' : 'Вийти' }}</button>
        </div>
      </header>
      <p v-if="logoutError" role="alert" class="mb-3 text-sm text-rose-700">{{ logoutError }}</p>
      <slot />
    </div>
  </main>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { authState, isTeacherUser, logoutUser } from '../stores/auth'
const router = useRouter()
const signingOut = ref(false)
const logoutError = ref('')
async function logout() {
  const teacher = isTeacherUser(authState.user)
  signingOut.value = true
  logoutError.value = ''
  try {
    await logoutUser()
    await router.push(teacher ? '/admin/login' : '/')
  } catch {
    logoutError.value = 'Не вдалося вийти. Спробуйте ще раз.'
  } finally {
    signingOut.value = false
  }
}
</script>

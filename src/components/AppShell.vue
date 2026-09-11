<template>
  <main class="min-h-screen bg-gradient-to-br from-orange-50 via-violet-50 to-sky-50 px-4 py-5 sm:px-6">
    <div class="mx-auto max-w-5xl">
      <header class="mb-6 flex items-center justify-between gap-3">
        <RouterLink to="/" class="flex items-center gap-3">
          <div class="grid h-11 w-11 place-items-center rounded-2xl bg-indigo-600 text-xl font-black text-white shadow-lg shadow-indigo-200">НС</div>
          <div>
            <p class="text-sm font-bold uppercase tracking-wide text-indigo-600">Недільна школа</p>
            <h1 class="text-xl font-black text-slate-900 sm:text-2xl">Відповіді та бали</h1>
          </div>
        </RouterLink>
        <RouterLink to="/admin" class="rounded-full bg-white/80 px-4 py-2 text-sm font-bold text-slate-700 shadow-sm">Викладач</RouterLink>
      </header>
      <div v-if="authState.user" class="mb-4 flex items-center justify-between gap-3 text-sm">
        <span>{{ authState.user.displayName || authState.user.email }}</span>
        <button class="font-bold text-indigo-700" @click="logoutUser">Вийти</button>
      </div>
      <slot />
    </div>
  </main>
</template>

<script setup lang="ts">
import { authState, logoutUser } from '../stores/auth'
</script>

<template>
  <section class="grid gap-4 sm:grid-cols-3">
    <RouterLink v-for="item in items" :key="item.to" :to="item.to" class="card block p-5 transition hover:-translate-y-1 hover:shadow-xl">
      <div class="text-3xl">{{ item.icon }}</div>
      <h2 class="mt-4 text-xl font-black text-slate-900">{{ item.title }}</h2>
      <p class="mt-2 text-sm text-slate-600">{{ item.description }}</p>
    </RouterLink>
  </section>
  <button class="mt-5 rounded-2xl bg-white px-4 py-3 font-bold text-slate-700" @click="logout">Вийти</button>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { logoutTeacher } from '../stores/auth'

const router = useRouter()
const items = [
  { to: '/admin/sessions', icon: '📅', title: 'Неділі', description: 'Створити, відкрити або закрити неділю' },
  { to: '/admin/review', icon: '✍️', title: 'Перевірка', description: 'Переглянути відповіді і поставити бали' },
  { to: '/admin/leaderboard', icon: '🏆', title: 'Рейтинг', description: 'Побачити сумарні бали дітей' },
]

async function logout() {
  await logoutTeacher()
  await router.push('/admin/login')
}
</script>

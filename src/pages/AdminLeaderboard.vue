<template>
  <section class="card p-5">
    <h2 class="text-2xl font-black text-slate-900">Загальна статистика</h2>
    <p class="mt-2 text-slate-600">Бали збережені за Gmail акаунтами дітей за всі неділі.</p>
    <LoadingState v-if="loading" class="mt-4" />
    <div v-else class="mt-5 space-y-3">
      <article v-for="(row, index) in rows" :key="row.uid" class="flex items-center justify-between rounded-2xl bg-white p-4">
        <div class="flex items-center gap-3">
          <div class="grid h-10 w-10 place-items-center rounded-xl bg-amber-100 font-black text-amber-700">{{ index + 1 }}</div>
          <img v-if="row.photoURL" :src="row.photoURL" alt="" class="h-10 w-10 rounded-full" />
          <div>
            <h3 class="font-black text-slate-900">{{ row.displayName }}</h3>
            <p class="text-sm text-slate-600">{{ row.email }}</p>
            <p class="text-xs text-slate-500">Перевірено неділь: {{ row.reviewedSubmissionsCount }}</p>
          </div>
        </div>
        <div class="text-right">
          <div class="text-2xl font-black text-indigo-600">{{ row.totalScore }}</div>
          <div class="text-xs font-bold text-slate-500">балів</div>
        </div>
      </article>
      <p v-if="rows.length === 0" class="text-slate-600">Поки немає статистики.</p>
    </div>
  </section>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import LoadingState from '../components/LoadingState.vue'
import { listUserScoreStats } from '../services/submissions'
import type { UserScoreStats } from '../types'

const rows = ref<UserScoreStats[]>([])
const loading = ref(true)

onMounted(async () => {
  rows.value = await listUserScoreStats()
  loading.value = false
})
</script>

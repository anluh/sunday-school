<template>
  <section class="card p-5">
    <h2 class="text-2xl font-black text-slate-900">Рейтинг</h2>
    <p class="mt-2 text-slate-600">MVP-режим: сумарні бали рахуються за звичайним імʼям дитини з усіх перевірених неділь.</p>
    <LoadingState v-if="loading" class="mt-4" />
    <div v-else class="mt-5 space-y-3">
      <article v-for="(row, index) in rows" :key="row.nameNormalized" class="flex items-center justify-between rounded-2xl bg-white p-4">
        <div class="flex items-center gap-3">
          <div class="grid h-10 w-10 place-items-center rounded-xl bg-amber-100 font-black text-amber-700">{{ index + 1 }}</div>
          <div>
            <h3 class="font-black text-slate-900">{{ row.childName }}</h3>
            <p class="text-xs text-slate-500">Перевірено неділь: {{ row.reviewedSubmissionsCount }}</p>
          </div>
        </div>
        <div class="text-right">
          <div class="text-2xl font-black text-indigo-600">{{ row.totalScore }}</div>
          <div class="text-xs font-bold text-slate-500">балів</div>
        </div>
      </article>
      <p v-if="rows.length === 0" class="text-slate-600">Поки немає перевірених відповідей.</p>
    </div>
  </section>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import LoadingState from '../components/LoadingState.vue'
import { getReviewedSubmissions } from '../services/submissions'

type NameScoreRow = {
  nameNormalized: string
  childName: string
  totalScore: number
  reviewedSubmissionsCount: number
}

const rows = ref<NameScoreRow[]>([])
const loading = ref(true)

onMounted(async () => {
  const submissions = await getReviewedSubmissions()
  const byName = new Map<string, NameScoreRow>()

  for (const submission of submissions) {
    const key = submission.childNameNormalized || submission.childName.trim().toLowerCase()
    const current = byName.get(key) ?? {
      nameNormalized: key,
      childName: submission.childName,
      totalScore: 0,
      reviewedSubmissionsCount: 0,
    }
    current.totalScore += submission.totalScore
    current.reviewedSubmissionsCount += 1
    byName.set(key, current)
  }

  rows.value = [...byName.values()].sort((a, b) => b.totalScore - a.totalScore)
  loading.value = false
})
</script>

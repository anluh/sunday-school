<template>
  <div class="card p-6 text-center">
    <div class="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-amber-100 text-2xl">☀️</div>
    <h2 class="text-xl font-black text-slate-900">{{ title }}</h2>
    <p class="mt-2 text-slate-600"><slot /></p>
  </div>
</template>

<script setup lang="ts">
defineProps<{ title: string }>()
</script>

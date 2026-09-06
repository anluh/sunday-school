<template>
  <div class="flex flex-wrap gap-2">
    <button
      v-for="score in [1, 2, 3, 4, 5]"
      :key="score"
      type="button"
      class="h-10 w-10 rounded-xl border text-sm font-black transition"
      :class="modelValue === score ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-indigo-100 bg-white text-slate-700 hover:border-indigo-400'"
      @click="$emit('update:modelValue', score)"
    >
      {{ score }}
    </button>
  </div>
</template>

<script setup lang="ts">
defineProps<{ modelValue?: number }>()
defineEmits<{ 'update:modelValue': [value: number] }>()
</script>

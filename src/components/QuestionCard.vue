<template>
  <section class="card p-4">
    <label :for="question.key" class="mb-2 block text-base font-extrabold text-slate-900">{{ index + 1 }}. {{ question.label }}</label>
    <textarea
      :id="question.key"
      :value="modelValue"
      :placeholder="question.placeholder"
      rows="4"
      class="input resize-y"
      @input="$emit('update:modelValue', ($event.target as HTMLTextAreaElement).value)"
    />
  </section>
</template>

<script setup lang="ts">
import type { QUESTIONS } from '../constants/questions'

defineProps<{
  question: (typeof QUESTIONS)[number]
  index: number
  modelValue: string
}>()

defineEmits<{ 'update:modelValue': [value: string] }>()
</script>

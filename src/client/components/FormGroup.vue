<template>
  <div class="mb-4">
    <label v-if="label" :for="id" class="block mb-2 font-bold">{{ label }}</label>
    <slot></slot>
    <div v-if="error" class="text-red-700 text-sm mt-1">{{ error }}</div>
  </div>
</template>

<script>
export default {
  name: 'FormGroup',
  props: {
    label: {
      type: String,
      default: ''
    },
    id: {
      type: String,
      default: ''
    },
    error: {
      type: String,
      default: ''
    }
  }
}
</script>

<style scoped>
/* All styles have been replaced with Tailwind utility classes */
</style>
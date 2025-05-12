<template>
  <div class="py-3 px-5 mb-4 rounded" :class="alertClass" role="alert">
    <slot>{{ message }}</slot>
  </div>
</template>

<script>
export default {
  name: 'AlertMessage',
  props: {
    type: {
      type: String,
      default: 'info',
      validator: (value) => ['info', 'success', 'warning', 'danger'].includes(value)
    },
    message: {
      type: String,
      default: ''
    }
  },
  computed: {
    alertClass() {
      const classes = {
        'info': 'bg-blue-100 text-blue-800',
        'success': 'bg-green-100 text-green-800',
        'warning': 'bg-yellow-100 text-yellow-800',
        'danger': 'bg-red-100 text-red-800'
      };
      return classes[this.type];
    }
  }
}
</script>

<style scoped>
/* All styles have been replaced with Tailwind utility classes */
</style>
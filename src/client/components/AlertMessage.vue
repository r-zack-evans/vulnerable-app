<template>
  <div class="alert" :class="alertClass" role="alert">
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
      return `alert-${this.type}`
    }
  }
}
</script>

<style scoped>
.alert {
  padding: 0.75rem 1.25rem;
  margin-bottom: 1rem;
  border-radius: 0.25rem;
}

.alert-info {
  background-color: #d1ecf1;
  color: #0c5460;
}

.alert-success {
  background-color: #d4edda;
  color: #155724;
}

.alert-warning {
  background-color: #fff3cd;
  color: #856404;
}

.alert-danger {
  background-color: #f8d7da;
  color: #721c24;
}
</style>
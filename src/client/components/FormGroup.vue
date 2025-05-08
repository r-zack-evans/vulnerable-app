<template>
  <div class="form-group">
    <label v-if="label" :for="id">{{ label }}</label>
    <slot></slot>
    <div v-if="error" class="form-error">{{ error }}</div>
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
.form-group {
  margin-bottom: 1rem;
}

label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: bold;
}

.form-error {
  color: #721c24;
  font-size: 0.875rem;
  margin-top: 0.25rem;
}
</style>
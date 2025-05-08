<template>
  <button 
    :type="type" 
    class="btn" 
    :class="buttonClass" 
    @click="$emit('click', $event)"
    :disabled="disabled || loading"
  >
    <span v-if="loading" class="spinner"></span>
    <slot>{{ text }}</slot>
  </button>
</template>

<script>
export default {
  name: 'Button',
  props: {
    type: {
      type: String,
      default: 'button'
    },
    variant: {
      type: String,
      default: 'primary',
      validator: (value) => ['primary', 'secondary', 'danger', 'outline', 'link'].includes(value)
    },
    text: {
      type: String,
      default: 'Button'
    },
    disabled: {
      type: Boolean,
      default: false
    },
    loading: {
      type: Boolean,
      default: false
    }
  },
  computed: {
    buttonClass() {
      return `btn-${this.variant}`
    }
  }
}
</script>

<style scoped>
.btn {
  display: inline-block;
  font-weight: 500;
  text-align: center;
  vertical-align: middle;
  user-select: none;
  background-color: transparent;
  border: 1px solid transparent;
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
  line-height: 1.5;
  border-radius: 2rem;
  transition: all 0.3s ease;
  cursor: pointer;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
}

.btn:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}

.btn-primary {
  color: #fff;
  background-color: #5c6bc0; /* Pastel indigo */
  border-color: #5c6bc0;
}

.btn-primary:hover {
  background-color: #4d5cb3;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(92, 107, 192, 0.2);
}

.btn-secondary {
  color: #5c6bc0;
  background-color: #e8eaf6; /* Very light indigo */
  border-color: #e8eaf6;
}

.btn-secondary:hover {
  background-color: #d1d6f0;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(92, 107, 192, 0.1);
}

.btn-danger {
  color: #fff;
  background-color: #ef9a9a; /* Pastel red */
  border-color: #ef9a9a;
}

.btn-danger:hover {
  background-color: #e57373;
  transform: translateY(-2px);
}

.btn-outline {
  color: #5c6bc0;
  border-color: #5c6bc0;
  background-color: transparent;
}

.btn-outline:hover {
  background-color: rgba(92, 107, 192, 0.05);
  transform: translateY(-2px);
}

.btn-link {
  font-weight: 500;
  color: #5c6bc0;
  text-decoration: none;
  background-color: transparent;
  border: none;
  box-shadow: none;
  padding: 0.5rem 0.75rem;
}

.btn-link:hover {
  color: #3949ab;
  text-decoration: underline;
}

.spinner {
  display: inline-block;
  width: 1rem;
  height: 1rem;
  margin-right: 0.5rem;
  border: 0.2em solid currentColor;
  border-right-color: transparent;
  border-radius: 50%;
  animation: spinner-border .75s linear infinite;
}

@keyframes spinner-border {
  to { transform: rotate(360deg); }
}
</style>
<template>
  <button 
    :type="type" 
    class="inline-flex items-center justify-center font-medium transition-all duration-300 rounded-full shadow-sm focus:outline-none" 
    :class="buttonClass" 
    @click="$emit('click', $event)"
    :disabled="disabled || loading"
  >
    <span v-if="loading" class="inline-block w-4 h-4 mr-2 border-2 border-current border-r-transparent rounded-full animate-spin"></span>
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
      const classes = {
        'primary': 'px-6 py-3 text-white bg-indigo-500 hover:bg-indigo-600 hover:-translate-y-0.5 hover:shadow-md',
        'secondary': 'px-6 py-3 text-indigo-600 bg-indigo-100 hover:bg-indigo-200 hover:-translate-y-0.5 hover:shadow-md',
        'danger': 'px-6 py-3 text-white bg-red-400 hover:bg-red-500 hover:-translate-y-0.5 hover:shadow-md',
        'outline': 'px-6 py-3 text-indigo-600 bg-transparent border border-indigo-500 hover:bg-indigo-50 hover:-translate-y-0.5',
        'link': 'px-3 py-2 text-indigo-600 bg-transparent hover:underline shadow-none'
      };
      
      // Add disabled styles
      if (this.disabled || this.loading) {
        return `${classes[this.variant]} opacity-65 cursor-not-allowed`;
      }
      
      return classes[this.variant];
    }
  }
}
</script>

<style scoped>
/* All styles have been replaced with Tailwind utility classes in the template */
</style>
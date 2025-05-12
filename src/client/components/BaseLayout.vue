<template>
  <div class="flex flex-col min-h-screen">
    <AppHeader />
    <main class="container flex-1 py-6">
      <slot></slot>
    </main>
    <AppFooter />
  </div>
</template>

<script>
import AppHeader from './AppHeader.vue'
import AppFooter from './AppFooter.vue'

export default {
  name: 'BaseLayout',
  components: {
    AppHeader,
    AppFooter
  }
}
</script>

<style scoped>
/* All styles have been replaced with Tailwind utility classes */
</style>
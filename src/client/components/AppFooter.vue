<template>
  <footer class="bg-white text-gray-800 py-4 mt-8 border-t border-gray-200">
    <div class="container">
      <div class="flex justify-center text-sm">
        <div class="text-gray-500">
          &copy; {{ currentYear }} ProjectTrack
        </div>
      </div>
    </div>
  </footer>
</template>

<script>
export default {
  name: 'AppFooter',
  computed: {
    currentYear() {
      return new Date().getFullYear()
    }
  }
}
</script>

<style scoped>
/* All styles have been replaced with Tailwind utility classes */
</style>
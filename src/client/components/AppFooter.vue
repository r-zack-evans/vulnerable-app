<template>
  <footer class="app-footer">
    <div class="container">
      <p>&copy; {{ currentYear }} ProjectTrack Enterprise - For Demonstration Purposes Only</p>
      <p>Enterprise project management solution for teams of all sizes.</p>
      <p>This is a demo application and should not be used in production environments.</p>
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
.app-footer {
  background-color: #333;
  color: white;
  padding: 1rem 0;
  margin-top: 2rem;
  text-align: center;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 15px;
}
</style>
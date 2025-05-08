<template>
  <footer class="app-footer">
    <div class="container">
      <p>&copy; {{ currentYear }} Vulnerable Demo App - For Educational Purposes Only</p>
      <p>This application intentionally contains security vulnerabilities to demonstrate common web security issues.</p>
      <p>Do not use this code in production environments.</p>
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
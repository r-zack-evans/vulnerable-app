<template>
  <footer class="app-footer">
    <div class="container">
      <div class="footer-content">
        <div class="copyright">
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
.app-footer {
  background-color: white;
  color: #333;
  padding: 1rem 0;
  margin-top: 2rem;
  border-top: 1px solid #eaeaea;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 15px;
}

.footer-content {
  display: flex;
  justify-content: center;
  font-size: 0.9rem;
}

.copyright {
  color: #666;
}
</style>
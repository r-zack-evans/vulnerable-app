<template>
  <div class="auth-links">
    <slot></slot>
  </div>
</template>

<script>
export default {
  name: 'AuthLinks'
}
</script>

<style scoped>
.auth-links {
  display: flex;
  justify-content: space-between;
  margin-top: 1.5rem;
  font-size: 0.9rem;
}

.auth-links a {
  color: #007bff;
  text-decoration: none;
}

.auth-links a:hover {
  text-decoration: underline;
}
</style>
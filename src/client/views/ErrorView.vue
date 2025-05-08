<template>
  <BaseLayout>
    <section class="error-content">
      <h1>Error</h1>
      
      <AlertMessage type="danger" :message="message" />
      
      <div v-if="errorDetails" class="error-details">
        <h3>Error Details</h3>
        <!-- Safely display error stack -->
        <pre>{{ errorDetails }}</pre>
      </div>
      
      <div class="actions">
        <Button @click="$router.push('/')" text="Back to Home" />
      </div>
    </section>
  </BaseLayout>
</template>

<script>
import BaseLayout from '../components/BaseLayout.vue'
import AlertMessage from '../components/AlertMessage.vue'
import Button from '../components/Button.vue'

export default {
  name: 'ErrorView',
  components: {
    BaseLayout,
    AlertMessage,
    Button
  },
  props: {
    message: {
      type: String,
      default: 'An error occurred'
    },
    errorDetails: {
      type: String,
      default: null
    }
  }
}
</script>

<style scoped>
.error-content {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

.alert-danger {
  background-color: #f8d7da;
  color: #721c24;
  padding: 15px;
  border-radius: 4px;
  margin-bottom: 20px;
}

.error-details {
  background-color: #f8f9fa;
  padding: 15px;
  border-radius: 4px;
  margin-bottom: 20px;
  overflow-x: auto;
}

.actions {
  margin-top: 20px;
}

.btn {
  display: inline-block;
  padding: 8px 16px;
  background-color: #007bff;
  color: white;
  text-decoration: none;
  border-radius: 4px;
}
</style>
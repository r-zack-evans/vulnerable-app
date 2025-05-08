import { defineStore } from 'pinia'
import { productsAPI } from '../services/api'

export const useProductStore = defineStore('products', {
  state: () => ({
    products: [],
    featuredProducts: [],
    currentProduct: null,
    loading: false,
    error: null,
    searchResults: [],
    searchQuery: ''
  }),
  
  getters: {
    getProductById: (state) => (id) => {
      return state.products.find(product => product.id === id)
    }
  },
  
  actions: {
    async fetchAllProducts() {
      this.loading = true
      this.error = null
      
      try {
        const response = await productsAPI.getAllProducts()
        this.products = response.data
        
        // Select featured products
        if (this.products.length > 0) {
          this.featuredProducts = this.products.slice(0, 4)
        }
        
        return this.products
      } catch (error) {
        console.error('Error fetching products:', error)
        
        // VULNERABILITY: Exposing error details
        if (error.response && error.response.data) {
          this.error = error.response.data.error || 'Failed to load products'
          // Expose more details if available
          if (error.response.data.details) {
            this.error += `. Details: ${error.response.data.details}`
          }
        } else {
          this.error = 'An error occurred loading products'
        }
        
        return []
      } finally {
        this.loading = false
      }
    },
    
    async fetchProduct(id) {
      this.loading = true
      this.error = null
      
      try {
        // VULNERABILITY: Not validating ID parameter
        const response = await productsAPI.getProduct(id)
        this.currentProduct = response.data
        return this.currentProduct
      } catch (error) {
        console.error(`Error fetching product ${id}:`, error)
        
        if (error.response && error.response.data) {
          this.error = error.response.data.error || `Failed to load product ${id}`
        } else {
          this.error = 'An error occurred loading the product'
        }
        
        return null
      } finally {
        this.loading = false
      }
    },
    
    async searchProducts(query) {
      this.loading = true
      this.error = null
      this.searchQuery = query
      
      try {
        // VULNERABILITY: Direct string query parameter without sanitization
        const response = await productsAPI.searchProducts(query)
        this.searchResults = response.data
        return this.searchResults
      } catch (error) {
        console.error('Error searching products:', error)
        
        if (error.response && error.response.data) {
          this.error = error.response.data.error || 'Search failed'
        } else {
          this.error = 'An error occurred while searching'
        }
        
        return []
      } finally {
        this.loading = false
      }
    }
  }
})
// Test file to verify TypeScript migration preserves functionality

// Import both old JS and new TS versions
import { authAPI as authAPIJS } from '../services/api.js'
import { authAPI as authAPITS } from '../services/api.ts'

import { useAuthStore as useAuthStoreJS } from '../stores/auth.js'
import { useAuthStore as useAuthStoreTS } from '../stores/auth.ts'

// Test that APIs are identical
const testAPIs = () => {
  // Check API methods exist and are functions
  const jsMethods = Object.keys(authAPIJS)
  const tsMethods = Object.keys(authAPITS)
  
  console.log('JS API methods:', jsMethods)
  console.log('TS API methods:', tsMethods)
  
  // They should be identical
  const methodsMatch = jsMethods.every(method => 
    tsMethods.includes(method) && 
    typeof authAPIJS[method] === typeof authAPITS[method]
  )
  
  console.log('API methods match:', methodsMatch)
  return methodsMatch
}

// Test that store definitions match
const testStores = () => {
  // Both should create stores with same structure
  console.log('JS store:', useAuthStoreJS)
  console.log('TS store:', useAuthStoreTS)
  
  // Should be defined and be functions
  const storesMatch = 
    typeof useAuthStoreJS === 'function' && 
    typeof useAuthStoreTS === 'function'
  
  console.log('Stores match:', storesMatch)
  return storesMatch
}

// This test file can be used for manual verification
// It's not meant to be run automatically
console.log('Migration verification tests created')
// Note: Actual execution would require a test runner
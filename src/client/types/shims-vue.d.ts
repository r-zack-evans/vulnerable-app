declare module '*.vue' {
  import { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}

interface Window {
  localStorage: Storage;
}

// Ensure localStorage is available in TypeScript
declare var localStorage: Storage;
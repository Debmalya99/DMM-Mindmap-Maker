import { createApp } from 'vue'
import App from './App.vue'
import * as Neutralino from '@neutralinojs/lib'

try {
  Neutralino.init()
} catch (err) {
  console.log('Neutralino initialization skipped (running in browser mode).', err)
}

createApp(App).mount('#app')

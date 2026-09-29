import { createApp } from 'vue'
import App from './App.vue'
import * as Neutralino from '@neutralinojs/lib'

try {
  if (typeof NL_PORT !== 'undefined') {
    Neutralino.init()
  } else {
    console.log('Running in browser mode.')
  }
} catch (err) {
  console.log('Neutralino initialization skipped (running in browser mode).', err)
}

createApp(App).mount('#app')

import { createApp } from 'vue'
import axios from 'axios'
import './style.less'
import App from './App.vue'

axios.defaults.baseURL = import.meta.env.VITE_SERVER_ORIGIN

createApp(App).mount('#app')

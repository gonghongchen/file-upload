import { createApp } from 'vue'
import axios from 'axios'
import 'element-plus/es/components/message/style/css'
import 'element-plus/es/components/message-box/style/css'
import './style.less'
import App from './App.vue'

axios.defaults.baseURL = import.meta.env.VITE_SERVER_ORIGIN

createApp(App).mount('#app')

import { createRouter, createWebHistory } from 'vue-router'
import Login from '../components/Login.vue'
import Dashboard from '../components/Dashboard.vue'
import Remedios from '../components/Remedios.vue'
import Alarme from '../components/Alarme.vue'
import CadastrarRemedio from '../components/CadastrarRemedio.vue'

const routes = [
  { 
    path: '/', 
    name: 'Login',
    component: Login 
  },
  { 
    path: '/dashboard', 
    name: 'dashboard',
    component: Dashboard 
  },
  { 
    path: '/remedios', 
    name: 'remedios',
    component: Remedios 
  },
  { 
    path: '/alarme', 
    name: 'alarme',
    component: Alarme
  },
  { 
    path: '/cadastrarremedio', 
    name: 'cadastrarremedio',
    component: CadastrarRemedio
  },
  
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
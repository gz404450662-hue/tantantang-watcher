import { createRouter, createWebHistory } from 'vue-router'
import ActivityList from '../views/ActivityList.vue'
import ActivityDetail from '../views/ActivityDetail.vue'
import MonitorList from '../views/MonitorList.vue'
import MonitorCreate from '../views/MonitorCreate.vue'
import MonitorDetail from '../views/MonitorDetail.vue'

const routes = [
  {
    path: '/',
    name: 'ActivityList',
    component: ActivityList,
  },
  {
    path: '/detail/:id',
    name: 'ActivityDetail',
    component: ActivityDetail,
  },
  {
    path: '/monitor/list',
    name: 'MonitorList',
    component: MonitorList,
  },
  {
    path: '/monitor/create',
    name: 'MonitorCreate',
    component: MonitorCreate,
  },
  {
    path: '/monitor/:id',
    name: 'MonitorDetail',
    component: MonitorDetail,
  },
]

const router = createRouter({
  history: createWebHistory('/tantantang/'),
  routes,
})

export default router

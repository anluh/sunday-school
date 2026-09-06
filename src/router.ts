import { createRouter, createWebHashHistory } from 'vue-router'
import ChildHome from './pages/ChildHome.vue'
import Thanks from './pages/Thanks.vue'
import AdminLogin from './pages/AdminLogin.vue'
import AdminDashboard from './pages/AdminDashboard.vue'
import AdminSessions from './pages/AdminSessions.vue'
import AdminReview from './pages/AdminReview.vue'
import AdminLeaderboard from './pages/AdminLeaderboard.vue'
import { authState, initAuthListener, isTeacherUser } from './stores/auth'
import { isFirebaseConfigured } from './firebase'

export const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', component: ChildHome },
    { path: '/thanks', component: Thanks },
    { path: '/admin/login', component: AdminLogin },
    { path: '/admin', component: AdminDashboard, meta: { requiresAuth: true } },
    { path: '/admin/sessions', component: AdminSessions, meta: { requiresAuth: true } },
    { path: '/admin/review', component: AdminReview, meta: { requiresAuth: true } },
    { path: '/admin/leaderboard', component: AdminLeaderboard, meta: { requiresAuth: true } },
  ],
})

router.beforeEach(async (to) => {
  initAuthListener()
  if (!to.meta.requiresAuth || !isFirebaseConfigured) return true
  if (!authState.ready) {
    await new Promise<void>((resolve) => {
      const timer = setInterval(() => {
        if (authState.ready) {
          clearInterval(timer)
          resolve()
        }
      }, 25)
    })
  }
  if (!isTeacherUser(authState.user)) return '/admin/login'
  return true
})

/**
 * api/client.js — Axios instance + API wrappers pour Stream-It.
 *
 * Interceptors:
 *   - Request:  attache le Bearer token depuis localStorage
 *   - Response: normalise les erreurs, gère l'expiration de session
 *
 * Les fonctions wrappers retournent directement response.data pour
 * éviter le .data.data dans les composants.
 */
import axios from 'axios'

// ─── Axios instance ────────────────────────────────────────────
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 30_000,  // 30s timeout
})

// ─── Request interceptor ───────────────────────────────────────
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('sit_token')
    if (token) config.headers.Authorization = `Bearer ${token}`
    return config
  },
  (err) => Promise.reject(err)
)

// ─── Response interceptor ─────────────────────────────────────
api.interceptors.response.use(
  (response) => response,
  (err) => {
    const status  = err.response?.status
    const hasToken = !!localStorage.getItem('sit_token')

    // Session expirée → logout silencieux + event
    if (status === 401 && hasToken) {
      localStorage.removeItem('sit_token')
      localStorage.removeItem('sit_user')
      window.dispatchEvent(new CustomEvent('auth:logout', {
        detail: { reason: 'session_expired' },
      }))
    }

    // Timeout réseau
    if (err.code === 'ECONNABORTED' || err.code === 'ERR_NETWORK') {
      err._isNetworkError = true
    }

    return Promise.reject(err)
  }
)

// ─── Auth ──────────────────────────────────────────────────────
export const Auth = {
  login:          (data) => api.post('/auth/login', data),
  register:       (fd)   => api.post('/auth/register', fd),
  me:             ()     => api.get('/auth/me'),
  updateMe:       (fd)   => api.put('/auth/me', fd),
  changePassword: (data) => api.put('/auth/me/password', data),
  forgotPassword: (data) => api.post('/auth/forgot-password', data),
  resetPassword:  (data) => api.post('/auth/reset-password', data),

  // OTP flows
  registerRequestOtp: (data) => api.post('/auth/register/request-otp', data),
  registerVerifyOtp:  (data) => api.post('/auth/register/verify-otp', data),
  passwordRequestOtp: (data) => api.post('/auth/me/password/request-otp', data),
  emailRequestOtp:    (data) => api.post('/auth/me/email/request-otp', data),
  changeEmail:        (data) => api.put('/auth/me/email', data),
  googleOAuth:        (data) => api.post('/auth/oauth/google', data),
}

// ─── Products ──────────────────────────────────────────────────
export const Products = {
  getAll:        (q = '') => api.get(`/products${q}`),
  getById:       (id)     => api.get(`/products/${id}`),
  getCategories: ()       => api.get('/products/categories'),
  create:        (fd)     => api.post('/products', fd),
  update:        (id, fd) => api.put(`/products/${id}`, fd),
  remove:        (id)     => api.delete(`/products/${id}`),
}

// ─── Orders ────────────────────────────────────────────────────
export const Orders = {
  create:       (data)  => api.post('/orders', data),
  mine:         ()      => api.get('/orders'),
  all:          (q = '') => api.get(`/admin/orders${q}`),
  updateStatus: (id, s) => api.put(`/admin/orders/${id}/status`, { status: s }),
}

// ─── Transactions ──────────────────────────────────────────────
export const Transactions = {
  create:       (data)  => api.post('/transactions', data),
  mine:         ()      => api.get('/transactions'),
  all:          (q = '') => api.get(`/admin/transactions${q}`),
  updateStatus: (id, s) => api.put(`/admin/transactions/${id}/status`, { status: s }),
}

// ─── Subscriptions ────────────────────────────────────────────
export const Subscriptions = {
  create:       (data)  => api.post('/subscriptions', data),
  mine:         (q = '') => api.get(`/subscriptions${q}`),
  all:          (q = '') => api.get(`/admin/subscriptions${q}`),
  updateStatus: (id, s) => api.patch(`/subscriptions/${id}/status`, { status: s }),
  expireOld:    ()      => api.post('/subscriptions/expire-old'),
  getById:      (id)    => api.get(`/subscriptions/${id}`),
}

// ─── Service Accounts ─────────────────────────────────────────
export const ServiceAccounts = {
  getAll:       (q = '') => api.get(`/admin/accounts${q}`),
  availability: ()       => api.get('/admin/accounts/availability'),
  create:       (data)   => api.post('/admin/accounts', data),
  update:       (id, d)  => api.put(`/admin/accounts/${id}`, d),
  assign:       (sub_id) => api.post('/admin/accounts/assign', { subscription_id: sub_id }),
}

// ─── Users ────────────────────────────────────────────────────
export const Users = {
  getAll:       (q = '')     => api.get(`/users${q}`),
  getById:      (id)         => api.get(`/users/${id}`),
  toggleActive: (id)         => api.put(`/users/${id}/status`),
  changeRole:   (id, r)      => api.put(`/users/${id}/role`, { role: r }),
  adjustWallet: (id, data)   => api.post(`/users/${id}/wallet`, data),
  delete:       (id)         => api.delete(`/users/${id}`),
}

// ─── Payment (Soleas Pay) ─────────────────────────────────────
// pay({ order_id, amount, wallet, service })
//   wallet  – numéro de téléphone Mobile Money (ex: "699000000")
//   service – ID opérateur Soleas Pay (1=MTN CM, 2=Orange CM, 5=Express Union)
export const Payment = {
  pay:    (data)    => api.post('/payment/pay', data),
  verify: (orderId) => api.get(`/payment/verify?orderId=${orderId}`),
}

// ─── Wallet ───────────────────────────────────────────────────
export const Wallet = {
  getBalance: ()     => api.get('/wallet'),
  recharge:   (data) => api.post('/wallet/recharge', data),
  pay:        (data) => api.post('/wallet/pay', data),
}

// ─── Admin Emails ───────────────────────────────────────────
export const EmailLogs = {
  getAll: (q = '') => api.get(`/admin/emails${q}`),
}

export default api

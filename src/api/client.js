import axios from 'axios'

const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || '/api' })

api.interceptors.request.use(cfg => {
  const token = localStorage.getItem('sit_token')
  if (token) cfg.headers.Authorization = `Bearer ${token}`
  return cfg
})

api.interceptors.response.use(
  r => r,
  err => {
    if (err.response?.status === 401 && localStorage.getItem('sit_token')) {
      localStorage.removeItem('sit_token')
      localStorage.removeItem('sit_user')
      window.dispatchEvent(new Event('auth:logout'))
    }
    return Promise.reject(err)
  }
)

export const Auth = {
  login:          (data) => api.post('/auth/login', data),
  register:       (fd)   => api.post('/auth/register', fd),
  me:             ()     => api.get('/auth/me'),
  updateMe:       (fd)   => api.put('/auth/me', fd),
  changePassword: (data) => api.put('/auth/me/password', data),
  forgotPassword: (data) => api.post('/auth/forgot-password', data),
  resetPassword:  (data) => api.post('/auth/reset-password', data),
}
export const Products = {
  getAll:       (q='')  => api.get(`/products${q}`),
  getById:      (id)    => api.get(`/products/${id}`),
  getCategories:()      => api.get('/products/categories'),
  create:       (fd)    => api.post('/products', fd),
  update:       (id,fd) => api.put(`/products/${id}`, fd),
  remove:       (id)    => api.delete(`/products/${id}`),
}
export const Orders = {
  create:       (data)   => api.post('/orders', data),
  mine:         ()       => api.get('/orders'),
  all:          (q='')   => api.get(`/admin/orders${q}`),
  updateStatus: (id, s)  => api.put(`/admin/orders/${id}/status`, { status: s }),
}
export const Transactions = {
  create:       (data)  => api.post('/transactions', data),
  mine:         ()      => api.get('/transactions'),
  all:          (q='')  => api.get(`/admin/transactions${q}`),
  updateStatus: (id, s) => api.put(`/admin/transactions/${id}/status`, { status: s }),
}
export const Subscriptions = {
  create:       (data)  => api.post('/subscriptions', data),
  mine:         (q='')  => api.get(`/subscriptions${q}`),
  all:          (q='')  => api.get(`/admin/subscriptions${q}`),
  updateStatus: (id, s) => api.patch(`/subscriptions/${id}/status`, { status: s }),
  expireOld:    ()      => api.post('/subscriptions/expire-old'),
  getById:      (id)    => api.get(`/subscriptions/${id}`),
}
export const ServiceAccounts = {
  getAll:       (q='')  => api.get(`/admin/accounts${q}`),
  availability: ()      => api.get('/admin/accounts/availability'),
  create:       (data)  => api.post('/admin/accounts', data),
  update:       (id,d)  => api.put(`/admin/accounts/${id}`, d),
  assign:       (sub_id)=> api.post('/admin/accounts/assign', { subscription_id: sub_id }),
}
export const Users = {
  getAll:        (q='')        => api.get(`/users${q}`),
  getById:       (id)          => api.get(`/users/${id}`),
  toggleActive:  (id)          => api.patch(`/users/${id}/toggle-active`),
  changeRole:    (id, r)       => api.patch(`/users/${id}/role`, { role: r }),
  adjustWallet:  (id, data)    => api.post(`/users/${id}/wallet`, data),
}
export const Payment = {
  pay:    (data) => api.post('/payment/pay', data),
  verify: (orderId, payId) => api.get(`/payment/verify?orderId=${orderId}${payId ? '&payId='+payId : ''}`),
}
export const Wallet = {
  getBalance: () => api.get('/wallet'),
  pay: (data)  => api.post('/wallet/pay', data),
}
export default api

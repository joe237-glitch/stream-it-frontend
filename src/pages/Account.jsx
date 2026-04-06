import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../components/Toast'
import { Subscriptions, Orders, Transactions, Auth, Wallet } from '../api/client'
import PaymentModal from '../components/PaymentModal'
import SEO from '../components/SEO'

const TABS = [
  { id: 'subscriptions', label: '📱 Abonnements' },
  { id: 'orders',        label: '📦 Commandes' },
  { id: 'transactions',  label: '💳 Paiements' },
  { id: 'wallet',        label: '💰 Portefeuille' },
  { id: 'profile',       label: '⚙️ Profil' },
]

function StatusBadge({ status }) {
  const map = {
    active:    'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
    pending:   'bg-yellow-500/15 text-yellow-400 border-yellow-500/20',
    expired:   'bg-slate-500/15 text-slate-400 border-slate-500/20',
    cancelled: 'bg-slate-500/15 text-slate-400 border-slate-500/20',
    paid:      'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
    success:   'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
    failed:    'bg-red-500/15 text-red-400 border-red-500/20',
    completed: 'bg-blue-500/15 text-blue-400 border-blue-500/20',
  }
  const labels = { active:'Actif', pending:'En attente', expired:'Expiré', cancelled:'Annulé', paid:'Payé', success:'Succès', failed:'Échoué', completed:'Complété' }
  return <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${map[status] || 'bg-slate-500/15 text-slate-400 border-slate-500/20'}`}>{labels[status] || status}</span>
}

function formatDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('fr-FR', { day:'2-digit', month:'short', year:'numeric' })
}
function formatAmount(n) {
  return `${parseFloat(n).toLocaleString('fr-FR')} XAF`
}

const VALID_TABS = ['subscriptions', 'orders', 'transactions', 'wallet', 'profile']

export default function Account() {
  const { user, logout, login, isAdmin } = useAuth()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const toast = useToast()

  // Admin should go to /admin, not /account
  useEffect(() => {
    if (isAdmin()) navigate('/admin', { replace: true })
  }, [isAdmin, navigate])

  const initialTab = VALID_TABS.includes(searchParams.get('tab')) ? searchParams.get('tab') : 'subscriptions'
  const [tab, setTab] = useState(initialTab)
  const tabsContainerRef = useRef(null)

  const handleTabChange = (id) => {
    setTab(id)
    setSearchParams({ tab: id }, { replace: true })
  }
  const [subs, setSubs] = useState([])
  const [orders, setOrders] = useState([])
  const [txns, setTxns] = useState([])
  const [loading, setLoading] = useState({ subs: true, orders: true, txns: true })
  const [credModal, setCredModal] = useState(null)
  const [rechargeModal, setRechargeModal] = useState(false)
  const [walletBalance, setWalletBalance] = useState(null)
  const [meData, setMeData] = useState(user)
  const [profile, setProfile] = useState({ first_name: user?.first_name || '', last_name: user?.last_name || '' })
  const [newPhoto, setNewPhoto] = useState(null)
  const [newPhotoPreview, setNewPhotoPreview] = useState(null)
  const [pwdForm, setPwdForm] = useState({ old: '', new: '', confirm: '' })
  const [pwdOtp, setPwdOtp] = useState(['', '', '', '', '', ''])
  const [pwdStep, setPwdStep] = useState(1) // 1=form, 2=otp
  const [profileMsg, setProfileMsg] = useState(null)
  const [pwdMsg, setPwdMsg] = useState(null)
  const [emailForm, setEmailForm] = useState({ new_email: '', password: '' })
  const [emailOtp, setEmailOtp] = useState(['', '', '', '', '', ''])
  const [emailStep, setEmailStep] = useState(0) // 0=hidden, 1=form, 2=otp
  const [emailMsg, setEmailMsg] = useState(null)
  const [otpCountdown, setOtpCountdown] = useState(0)
  const [otpLoading, setOtpLoading] = useState(false)

  useEffect(() => {
    // Fetch fresh user data
    Auth.me().then(r => {
      const u = r.data.data
      setMeData(u)
      setProfile({ first_name: u.first_name || '', last_name: u.last_name || '' })
      login(localStorage.getItem('sit_token'), u)
    }).catch(() => {})

    Subscriptions.mine().then(r => { setSubs(r.data.data || []); setLoading(p => ({...p, subs: false})) }).catch(() => setLoading(p => ({...p, subs: false})))
    Orders.mine().then(r => { setOrders(r.data.data || []); setLoading(p => ({...p, orders: false})) }).catch(() => setLoading(p => ({...p, orders: false})))
    Transactions.mine().then(r => { setTxns(r.data.data || []); setLoading(p => ({...p, txns: false})) }).catch(() => setLoading(p => ({...p, txns: false})))
    Wallet.getBalance().then(r => setWalletBalance(r.data.data?.balance ?? 0)).catch(() => {})
  }, [])

  // Auto-scroll active tab into view on mobile
  useEffect(() => {
    if (tabsContainerRef.current) {
      const activeBtn = tabsContainerRef.current.querySelector(`[data-tab="${tab}"]`)
      if (activeBtn) activeBtn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
    }
  }, [tab])

  const saveProfile = async () => {
    try {
      const fd = new FormData()
      fd.append('first_name', profile.first_name)
      fd.append('last_name', profile.last_name)
      if (newPhoto) fd.append('profile_photo', newPhoto)
      const r = await Auth.updateMe(fd)
      login(localStorage.getItem('sit_token'), { ...user, ...r.data.data })
      setNewPhoto(null)
      setNewPhotoPreview(null)
      setProfileMsg({ ok: true, msg: '✅ Profil mis à jour' })
    } catch (err) {
      setProfileMsg({ ok: false, msg: err.response?.data?.message || 'Erreur' })
    }
  }

  const handlePhotoChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setNewPhoto(file)
    setNewPhotoPreview(URL.createObjectURL(file))
  }

  // ─── OTP countdown ──────────────────────────────────────────
  useEffect(() => {
    if (otpCountdown <= 0) return
    const t = setTimeout(() => setOtpCountdown(c => c - 1), 1000)
    return () => clearTimeout(t)
  }, [otpCountdown])

  // ─── Password change: Step 1 → request OTP ────────────────
  const requestPwdOtp = async () => {
    if (pwdForm.new !== pwdForm.confirm) return setPwdMsg({ ok: false, msg: 'Les mots de passe ne correspondent pas' })
    if (pwdForm.new.length < 6) return setPwdMsg({ ok: false, msg: 'Minimum 6 caractères' })
    setPwdMsg(null)
    setOtpLoading(true)
    try {
      await Auth.passwordRequestOtp({ old_password: pwdForm.old })
      setPwdStep(2)
      setOtpCountdown(60)
      setPwdMsg({ ok: true, msg: 'Code envoyé à votre email' })
    } catch (err) {
      setPwdMsg({ ok: false, msg: err.response?.data?.message || 'Erreur' })
    } finally { setOtpLoading(false) }
  }

  // ─── Password change: Step 2 → verify OTP + change ────────
  const verifyPwdOtp = async (code) => {
    setPwdMsg(null)
    setOtpLoading(true)
    try {
      await Auth.changePassword({ old_password: pwdForm.old, new_password: pwdForm.new, otp_code: code })
      setPwdMsg({ ok: true, msg: '✅ Mot de passe mis à jour !' })
      setPwdForm({ old: '', new: '', confirm: '' })
      setPwdOtp(['', '', '', '', '', ''])
      setPwdStep(1)
      toast('Mot de passe modifié !', 'success')
    } catch (err) {
      setPwdMsg({ ok: false, msg: err.response?.data?.message || 'Code invalide' })
      setPwdOtp(['', '', '', '', '', ''])
    } finally { setOtpLoading(false) }
  }

  // ─── Email change: Step 1 → request OTP ───────────────────
  const requestEmailOtp = async () => {
    if (!emailForm.new_email || !emailForm.password) return setEmailMsg({ ok: false, msg: 'Remplissez tous les champs' })
    setEmailMsg(null)
    setOtpLoading(true)
    try {
      await Auth.emailRequestOtp({ new_email: emailForm.new_email, password: emailForm.password })
      setEmailStep(2)
      setOtpCountdown(60)
      setEmailMsg({ ok: true, msg: `Code envoyé à ${emailForm.new_email}` })
    } catch (err) {
      setEmailMsg({ ok: false, msg: err.response?.data?.message || 'Erreur' })
    } finally { setOtpLoading(false) }
  }

  // ─── Email change: Step 2 → verify OTP ────────────────────
  const verifyEmailOtp = async (code) => {
    setEmailMsg(null)
    setOtpLoading(true)
    try {
      const r = await Auth.changeEmail({ new_email: emailForm.new_email, otp_code: code })
      login(r.data.data.token, r.data.data.user)
      setMeData(prev => ({ ...prev, email: emailForm.new_email }))
      setEmailForm({ new_email: '', password: '' })
      setEmailOtp(['', '', '', '', '', ''])
      setEmailStep(0)
      toast('Email modifié !', 'success')
    } catch (err) {
      setEmailMsg({ ok: false, msg: err.response?.data?.message || 'Code invalide' })
      setEmailOtp(['', '', '', '', '', ''])
    } finally { setOtpLoading(false) }
  }

  // ─── Shared OTP input handler ─────────────────────────────
  const makeOtpHandler = (otp, setOtp, onComplete) => ({
    onChange: (idx, val) => {
      if (val && !/^\d$/.test(val)) return
      const next = [...otp]
      next[idx] = val
      setOtp(next)
      if (val && idx < 5) document.getElementById(`otp-${onComplete.name}-${idx + 1}`)?.focus()
      if (val && idx === 5 && next.every(d => d)) onComplete(next.join(''))
    },
    onKeyDown: (idx, e) => {
      if (e.key === 'Backspace' && !otp[idx] && idx > 0) document.getElementById(`otp-${onComplete.name}-${idx - 1}`)?.focus()
    },
    onPaste: (e) => {
      const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
      if (text.length === 6) { e.preventDefault(); setOtp(text.split('')); onComplete(text) }
    },
  })

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <SEO title="Mon compte" />
      {/* Header */}
      <div className="card rounded-2xl p-5 mb-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl overflow-hidden flex-shrink-0 bg-gradient-to-br from-indigo-600 to-violet-600">
            {meData?.profile_photo
              ? <img src={meData.profile_photo} alt="avatar" className="w-full h-full object-cover" />
              : <div className="w-full h-full flex items-center justify-center text-xl font-black">{meData?.first_name?.[0]}{meData?.last_name?.[0]}</div>
            }
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-base sm:text-xl font-extrabold truncate">
              {meData?.first_name || meData?.last_name ? `${meData?.first_name} ${meData?.last_name}` : meData?.email}
            </h1>
            <p className="text-slate-500 text-xs sm:text-sm truncate">{meData?.email}</p>
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${meData?.role === 'admin' ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30' : 'bg-white/5 text-slate-500 border border-white/10'}`}>
                {meData?.role === 'admin' ? '⭐ Admin' : 'Client'}
              </span>
              <span className="text-xs text-slate-600 bg-white/5 border border-white/10 px-2.5 py-1 rounded-full font-mono">
                ID #{meData?.id}
              </span>
            </div>
          </div>
          <Link to="/" className="hidden sm:flex btn-secondary text-sm py-2 px-4 flex-shrink-0">🛒 Boutique</Link>
        </div>
        {/* Solde — visible sur tous les écrans */}
        {walletBalance !== null && (
          <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between gap-3">
            <div>
              <p className="text-xs text-slate-500">💰 Solde disponible</p>
              <p className="text-xl font-extrabold text-emerald-400">{walletBalance.toLocaleString()} XAF</p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <Link to="/" className="sm:hidden text-xs text-slate-400 hover:text-white transition-colors px-3 py-2 rounded-xl hover:bg-white/5">🛒 Boutique</Link>
              <button onClick={() => setRechargeModal(true)} className="btn-primary text-xs py-2 px-4">+ Recharger</button>
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div ref={tabsContainerRef} className="flex gap-1 border-b border-white/5 mb-6 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {TABS.map(t => (
          <button key={t.id} data-tab={t.id} onClick={() => handleTabChange(t.id)}
            className={`px-4 py-3 text-sm font-semibold whitespace-nowrap border-b-2 transition-all -mb-px flex-shrink-0 ${tab === t.id ? 'border-indigo-500 text-white' : 'border-transparent text-slate-500 hover:text-slate-300'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* SUBSCRIPTIONS */}
      {tab === 'subscriptions' && (
        <div>
          {loading.subs ? <div className="text-center py-12 text-slate-600">Chargement...</div>
          : subs.length === 0 ? (
            <div className="text-center py-16 text-slate-600">
              <p className="text-5xl mb-3">📭</p>
              <p className="font-semibold mb-4">Aucun abonnement</p>
              <Link to="/" className="btn-primary inline-block text-sm">Découvrir les offres</Link>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {subs.map(s => (
                <div key={s.id} className="card rounded-2xl p-5 space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-900/50 to-violet-900/50 flex items-center justify-center text-xl flex-shrink-0">
                      {s.image_url ? <img src={s.image_url} className="w-full h-full rounded-xl object-cover" alt="" /> : '📦'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm truncate">{s.product_name}</p>
                      <p className="text-slate-500 text-xs">{s.product_category}</p>
                      <div className="mt-1"><StatusBadge status={s.status} /></div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs text-slate-500">
                    <div>📅 Début : <span className="text-slate-300">{formatDate(s.start_date)}</span></div>
                    <div>⌛ Fin : <span className="text-slate-300">{formatDate(s.end_date)}</span></div>
                  </div>
                  {s.status === 'cancelled' ? (
                    <div className="text-center text-xs text-red-400 py-2">❌ Abonnement annulé</div>
                  ) : s.status === 'expired' ? (
                    <div className="text-center text-xs text-slate-500 py-2">⌛ Abonnement expiré</div>
                  ) : (s.login_email || s.activation_code) ? (
                    <button onClick={() => setCredModal(s)}
                      className="w-full py-2.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-xs font-bold hover:bg-emerald-500/20 transition-colors">
                      {s.delivery_type === 'gift_card' ? '🎁 Voir mon code d\'activation' : s.delivery_type === 'invite_link' ? '🔗 Voir mon invitation' : '🔑 Voir mes identifiants'}
                    </button>
                  ) : (
                    <div className="text-center text-xs text-slate-600 py-2">⏳ Attribution en cours...</div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ORDERS */}
      {tab === 'orders' && (
        <div className="space-y-3">
          {loading.orders ? <div className="text-center py-12 text-slate-600">Chargement...</div>
          : orders.length === 0 ? <div className="text-center py-16 text-slate-600"><p className="text-5xl mb-3">🛒</p><p className="font-semibold">Aucune commande</p></div>
          : orders.map(o => (
            <div key={o.id} className="card rounded-2xl p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="font-bold text-sm">Commande #{o.id}</p>
                  <p className="text-slate-500 text-xs">{formatDate(o.created_at)}</p>
                </div>
                <div className="text-right">
                  <p className="font-extrabold">{formatAmount(o.total_amount)}</p>
                  <div className="mt-1"><StatusBadge status={o.status} /></div>
                </div>
              </div>
              {(o.items || []).map((item, i) => (
                <div key={i} className="flex justify-between text-xs text-slate-500 border-t border-white/5 pt-2 mt-2">
                  <span>{item.product_name} × {item.quantity}</span>
                  <span className="text-slate-300">{formatAmount(item.total_price)}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {/* TRANSACTIONS */}
      {tab === 'transactions' && (
        <div className="card rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-white/5">
                <tr className="text-slate-500 text-xs uppercase">
                  {['Référence','Méthode','Montant','Statut','Date'].map(h => (
                    <th key={h} className="text-left px-5 py-3 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading.txns ? (
                  <tr><td colSpan={5} className="text-center py-12 text-slate-600">Chargement...</td></tr>
                ) : txns.length === 0 ? (
                  <tr><td colSpan={5} className="text-center py-12 text-slate-600">Aucune transaction</td></tr>
                ) : txns.map(t => (
                  <tr key={t.id} className="border-t border-white/5 hover:bg-white/2 transition-colors">
                    <td className="px-5 py-3 text-xs text-slate-400 font-mono">{t.external_reference || `#${t.id}`}</td>
                    <td className="px-5 py-3">{t.payment_provider || t.payment_method || '—'}</td>
                    <td className="px-5 py-3 font-bold">{formatAmount(t.amount)}</td>
                    <td className="px-5 py-3"><StatusBadge status={t.status} /></td>
                    <td className="px-5 py-3 text-xs text-slate-500 whitespace-nowrap">{formatDate(t.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* WALLET */}
      {tab === 'wallet' && (
        <div className="max-w-lg space-y-4">
          {/* Balance card */}
          <div className="card rounded-2xl p-6 text-center space-y-3">
            <p className="text-slate-500 text-sm">Solde disponible</p>
            <p className="text-5xl font-black text-emerald-400">
              {walletBalance !== null ? walletBalance.toLocaleString() : '—'} <span className="text-2xl text-emerald-600">XAF</span>
            </p>
            <p className="text-xs text-slate-600">
              ≈ {walletBalance !== null ? (walletBalance / 656).toFixed(2) : '—'} USD
            </p>
            <button
              onClick={() => setRechargeModal(true)}
              className="btn-primary py-3 px-8 text-sm mx-auto"
            >
              💳 Recharger mon solde
            </button>
          </div>

          {/* Wallet transactions */}
          <div className="card rounded-2xl overflow-hidden">
            <div className="px-5 py-3 border-b border-white/5">
              <h3 className="font-bold text-sm">Historique du portefeuille</h3>
            </div>
            <div className="divide-y divide-white/5">
              {txns.filter(t => t.type === 'wallet_credit' || t.type === 'wallet_debit' || t.type === 'refund' || t.payment_method === 'wallet').length === 0 ? (
                <p className="text-center text-slate-600 py-8 text-sm">Aucune opération</p>
              ) : txns.filter(t => t.type === 'wallet_credit' || t.type === 'wallet_debit' || t.type === 'refund' || t.payment_method === 'wallet').map(t => {
                const isCredit = t.type === 'wallet_credit'
                const isRefund = t.type === 'refund'
                const isFailed = t.status === 'failed'
                const label = isRefund
                  ? '↩ Remboursement'
                  : isCredit
                    ? (isFailed ? '✗ Recharge échouée' : '+ Recharge')
                    : '− Achat wallet'
                return (
                  <div key={t.id} className="flex items-center justify-between px-5 py-3">
                    <div>
                      <p className="text-sm font-semibold">{label}</p>
                      <p className="text-xs text-slate-500">{formatDate(t.created_at)}</p>
                    </div>
                    <div className="text-right">
                      <p className={`font-extrabold ${isFailed ? 'text-slate-500 line-through' : (isCredit || isRefund) ? 'text-emerald-400' : 'text-red-400'}`}>
                        {(isCredit || isRefund) ? '+' : '−'}{formatAmount(t.amount)}
                      </p>
                      <StatusBadge status={t.status} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* PROFILE */}
      {tab === 'profile' && (
        <div className="max-w-lg space-y-4">
          <div className="card rounded-2xl p-6 space-y-4">
            <h3 className="font-bold">Modifier mon profil</h3>
            {profileMsg && <div className={`p-3 rounded-xl text-sm font-semibold ${profileMsg.ok ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>{profileMsg.msg}</div>}

            {/* Photo de profil */}
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-2xl overflow-hidden bg-gradient-to-br from-indigo-600 to-violet-600 flex-shrink-0">
                {newPhotoPreview
                  ? <img src={newPhotoPreview} className="w-full h-full object-cover" alt="preview" />
                  : user?.profile_photo
                    ? <img src={user.profile_photo} className="w-full h-full object-cover" alt="avatar" />
                    : <div className="w-full h-full flex items-center justify-center text-2xl font-black">{user?.first_name?.[0]}{user?.last_name?.[0]}</div>
                }
              </div>
              <div>
                <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-sm text-slate-300 transition-colors">
                  📸 Changer la photo
                  <input type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
                </label>
                {newPhotoPreview && (
                  <button onClick={() => { setNewPhoto(null); setNewPhotoPreview(null) }} className="ml-2 text-xs text-red-400 hover:text-red-300">Annuler</button>
                )}
                <p className="text-xs text-slate-600 mt-1.5">JPG, PNG, WebP — max 5 Mo</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-slate-500 mb-1.5">Prénom</label>
                <input value={profile.first_name} onChange={e => setProfile(p => ({...p, first_name: e.target.value}))} className="input-field" />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1.5">Nom</label>
                <input value={profile.last_name} onChange={e => setProfile(p => ({...p, last_name: e.target.value}))} className="input-field" />
              </div>
            </div>
            <div className="flex gap-2">
              <input value={meData?.email} disabled className="input-field opacity-40 cursor-not-allowed flex-1" />
              <button onClick={() => { setEmailStep(emailStep === 0 ? 1 : 0); setEmailMsg(null) }}
                className="btn-secondary py-2 px-4 text-xs whitespace-nowrap">
                {emailStep === 0 ? '✏️ Changer' : '✕ Annuler'}
              </button>
            </div>

            {/* Email change form */}
            {emailStep >= 1 && (
              <div className="bg-indigo-500/5 border border-indigo-500/20 rounded-xl p-4 space-y-3">
                {emailMsg && <div className={`p-2 rounded-lg text-xs font-semibold ${emailMsg.ok ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>{emailMsg.msg}</div>}

                {emailStep === 1 && (
                  <>
                    <input value={emailForm.new_email} onChange={e => setEmailForm(p => ({...p, new_email: e.target.value}))}
                      type="email" placeholder="Nouvel email" className="input-field text-sm" />
                    <input value={emailForm.password} onChange={e => setEmailForm(p => ({...p, password: e.target.value}))}
                      type="password" placeholder="Votre mot de passe actuel" className="input-field text-sm" />
                    <button onClick={requestEmailOtp} disabled={otpLoading}
                      className="w-full btn-primary py-2.5 text-xs disabled:opacity-50">
                      {otpLoading ? '⏳ Envoi...' : 'Envoyer le code de vérification'}
                    </button>
                  </>
                )}

                {emailStep === 2 && (() => {
                  const h = makeOtpHandler(emailOtp, setEmailOtp, verifyEmailOtp)
                  return (
                    <div className="space-y-3">
                      <p className="text-xs text-slate-400 text-center">Code envoyé à <b className="text-indigo-400">{emailForm.new_email}</b></p>
                      <div className="flex justify-center gap-2" onPaste={h.onPaste}>
                        {emailOtp.map((d, i) => (
                          <input key={i} id={`otp-verifyEmailOtp-${i}`} type="text" inputMode="numeric" maxLength={1}
                            value={d} onChange={e => h.onChange(i, e.target.value)} onKeyDown={e => h.onKeyDown(i, e)}
                            disabled={otpLoading}
                            className="w-10 h-12 text-center text-lg font-bold bg-white/5 border border-white/10 rounded-lg focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 outline-none text-white disabled:opacity-50" />
                        ))}
                      </div>
                      {otpCountdown > 0
                        ? <p className="text-xs text-slate-600 text-center">Renvoyer dans {otpCountdown}s</p>
                        : <button onClick={requestEmailOtp} className="text-xs text-indigo-400 hover:text-indigo-300 w-full text-center">Renvoyer le code</button>
                      }
                    </div>
                  )
                })()}
              </div>
            )}

            <button onClick={saveProfile} className="w-full btn-primary py-3 text-sm">Sauvegarder</button>
          </div>

          {/* PASSWORD CHANGE WITH OTP */}
          <div className="card rounded-2xl p-6 space-y-4">
            <h3 className="font-bold">Changer le mot de passe</h3>
            {pwdMsg && <div className={`p-3 rounded-xl text-sm font-semibold ${pwdMsg.ok ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>{pwdMsg.msg}</div>}

            {pwdStep === 1 && (
              <>
                <input value={pwdForm.old} onChange={e => setPwdForm(p => ({...p, old: e.target.value}))} type="password" placeholder="Ancien mot de passe" className="input-field" />
                <input value={pwdForm.new} onChange={e => setPwdForm(p => ({...p, new: e.target.value}))} type="password" placeholder="Nouveau mot de passe" className="input-field" />
                <input value={pwdForm.confirm} onChange={e => setPwdForm(p => ({...p, confirm: e.target.value}))} type="password" placeholder="Confirmer le nouveau" className="input-field" />
                <button onClick={requestPwdOtp} disabled={otpLoading} className="w-full btn-secondary py-3 text-sm disabled:opacity-50">
                  {otpLoading ? '⏳ Envoi du code...' : '🔐 Changer le mot de passe'}
                </button>
              </>
            )}

            {pwdStep === 2 && (() => {
              const h = makeOtpHandler(pwdOtp, setPwdOtp, verifyPwdOtp)
              return (
                <div className="space-y-4">
                  <p className="text-sm text-slate-400 text-center">Entrez le code à 6 chiffres envoyé à votre email</p>
                  <div className="flex justify-center gap-2" onPaste={h.onPaste}>
                    {pwdOtp.map((d, i) => (
                      <input key={i} id={`otp-verifyPwdOtp-${i}`} type="text" inputMode="numeric" maxLength={1}
                        value={d} onChange={e => h.onChange(i, e.target.value)} onKeyDown={e => h.onKeyDown(i, e)}
                        disabled={otpLoading}
                        className="w-11 h-13 text-center text-xl font-bold bg-white/5 border border-white/10 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none text-white disabled:opacity-50" />
                    ))}
                  </div>
                  <div className="text-center">
                    {otpCountdown > 0
                      ? <p className="text-xs text-slate-600">Renvoyer dans <span className="text-indigo-400">{otpCountdown}s</span></p>
                      : <button onClick={requestPwdOtp} className="text-xs text-indigo-400 hover:text-indigo-300">Renvoyer le code</button>
                    }
                  </div>
                  <button onClick={() => { setPwdStep(1); setPwdOtp(['','','','','','']); setPwdMsg(null) }}
                    className="text-xs text-slate-500 hover:text-slate-400 w-full text-center">← Retour</button>
                </div>
              )
            })()}
          </div>

          <button onClick={() => { logout(); window.location.href = '/' }}
            className="w-full py-3 rounded-xl border border-red-500/20 text-red-400 hover:bg-red-500/10 text-sm font-semibold transition-colors">
            Se déconnecter
          </button>
        </div>
      )}

      {/* Recharge Modal */}
      {rechargeModal && (
        <PaymentModal
          recharge
          onClose={() => setRechargeModal(false)}
          onSuccess={() => {
            setRechargeModal(false)
            Wallet.getBalance().then(r => setWalletBalance(r.data.data?.balance ?? 0)).catch(() => {})
            Transactions.mine().then(r => setTxns(r.data.data || [])).catch(() => {})
          }}
        />
      )}

      {/* Credentials Modal */}
      {credModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={() => setCredModal(null)}>
          <div className="card rounded-2xl p-6 w-full max-w-sm shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-extrabold">
                {credModal.delivery_type === 'gift_card'   ? '🎁 Code d\'activation'
                 : credModal.delivery_type === 'invite_link' ? '🔗 Votre invitation'
                 : '🔑 Vos identifiants'}
              </h3>
              <button onClick={() => setCredModal(null)} className="text-slate-500 hover:text-white w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">✕</button>
            </div>

            <div className="space-y-3">

              {/* 🎁 GIFT CARD */}
              {credModal.delivery_type === 'gift_card' && (
                <>
                  <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 text-center">
                    <p className="text-xs text-amber-400/70 mb-2 font-semibold uppercase tracking-wide">Code d'activation</p>
                    <p className="font-black text-lg text-amber-400 break-all font-mono tracking-widest">{credModal.activation_code}</p>
                  </div>
                  <button onClick={() => { navigator.clipboard.writeText(credModal.activation_code || ''); toast('Code copié !', 'success') }}
                    className="w-full py-2.5 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-400 text-sm font-bold hover:bg-amber-500/20 transition-colors">
                    📋 Copier le code
                  </button>
                  <div className="bg-white/5 rounded-xl p-3 text-xs text-slate-500 space-y-1">
                    <p className="font-semibold text-slate-400">Comment utiliser :</p>
                    <p>1. Ouvrez le site / app officiel du service</p>
                    <p>2. Accédez à "Cartes cadeaux" ou "Ajouter des fonds"</p>
                    <p>3. Entrez le code ci-dessus et validez</p>
                  </div>
                </>
              )}

              {/* 🔗 INVITE LINK */}
              {credModal.delivery_type === 'invite_link' && (
                <>
                  <div className="bg-violet-500/10 border border-violet-500/20 rounded-xl p-4">
                    <p className="text-xs text-violet-400/70 mb-2 font-semibold uppercase tracking-wide">Invitation envoyée depuis</p>
                    <p className="font-bold text-sm text-violet-300 break-all">{credModal.login_email || '—'}</p>
                  </div>
                  <div className="bg-white/5 rounded-xl p-3 text-xs text-slate-500 space-y-1">
                    <p className="font-semibold text-slate-400">Comment rejoindre :</p>
                    <p>1. Vérifiez votre boîte email pour l'invitation</p>
                    <p>2. Cliquez sur "Rejoindre" dans l'email reçu</p>
                    <p>3. Créez votre compte ou connectez-vous</p>
                    <p className="text-slate-600 pt-1">Si vous ne trouvez pas l'email, vérifiez vos spams.</p>
                  </div>
                </>
              )}

              {/* 👥 SHARED ACCOUNT */}
              {(credModal.delivery_type === 'shared_account' || !credModal.delivery_type) && (
                <>
                  {credModal.profile_slot && (
                    <div className="bg-white/5 rounded-xl p-3">
                      <p className="text-xs text-slate-500 mb-1">👤 Profil / Slot</p>
                      <p className="font-black text-base text-indigo-400">{credModal.profile_slot}</p>
                    </div>
                  )}
                  {[['📧 Email de connexion', credModal.login_email], ['🔒 Mot de passe', credModal.login_password]].map(([label, val]) => val ? (
                    <div key={label} className="bg-white/5 rounded-xl p-3">
                      <p className="text-xs text-slate-500 mb-1">{label}</p>
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-sm flex-1 break-all font-mono">{val}</p>
                        <button onClick={() => { navigator.clipboard.writeText(val); toast('Copié !', 'success') }}
                          className="text-slate-500 hover:text-white text-xs bg-white/10 px-2 py-1 rounded-lg flex-shrink-0">📋</button>
                      </div>
                    </div>
                  ) : null)}
                </>
              )}

              {/* 🔑 DIRECT CREDENTIALS */}
              {credModal.delivery_type === 'direct_credentials' && (
                <>
                  {[['📧 Email de connexion', credModal.login_email], ['🔒 Mot de passe', credModal.login_password]].map(([label, val]) => val ? (
                    <div key={label} className="bg-white/5 rounded-xl p-3">
                      <p className="text-xs text-slate-500 mb-1">{label}</p>
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-sm flex-1 break-all font-mono">{val}</p>
                        <button onClick={() => { navigator.clipboard.writeText(val); toast('Copié !', 'success') }}
                          className="text-slate-500 hover:text-white text-xs bg-white/10 px-2 py-1 rounded-lg flex-shrink-0">📋</button>
                      </div>
                    </div>
                  ) : null)}
                </>
              )}

            </div>
            <p className="text-xs text-slate-600 mt-4">⚠️ Ne partagez jamais ces informations avec quiconque.</p>
          </div>
        </div>
      )}
    </div>
  )
}

import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../components/Toast'
import { Subscriptions, Orders, Transactions, Auth, Wallet } from '../api/client'
import PaymentModal from '../components/PaymentModal'

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

export default function Account() {
  const { user, logout, login } = useAuth()
  const toast = useToast()
  const [tab, setTab] = useState('subscriptions')
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
  const [profileMsg, setProfileMsg] = useState(null)
  const [pwdMsg, setPwdMsg] = useState(null)

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

  const changePassword = async () => {
    if (pwdForm.new !== pwdForm.confirm) return setPwdMsg({ ok: false, msg: 'Les mots de passe ne correspondent pas' })
    try {
      await Auth.changePassword({ old_password: pwdForm.old, new_password: pwdForm.new })
      setPwdMsg({ ok: true, msg: '✅ Mot de passe mis à jour' })
      setPwdForm({ old: '', new: '', confirm: '' })
    } catch (err) {
      setPwdMsg({ ok: false, msg: err.response?.data?.message || 'Erreur' })
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="card rounded-2xl p-6 mb-6 flex items-center gap-5">
        <div className="w-16 h-16 rounded-2xl overflow-hidden flex-shrink-0 bg-gradient-to-br from-indigo-600 to-violet-600">
          {meData?.profile_photo
            ? <img src={meData.profile_photo} alt="avatar" className="w-full h-full object-cover" />
            : <div className="w-full h-full flex items-center justify-center text-2xl font-black">{meData?.first_name?.[0]}{meData?.last_name?.[0]}</div>
          }
        </div>
        <div className="flex-1">
          <h1 className="text-xl font-extrabold">
            {meData?.first_name || meData?.last_name ? `${meData?.first_name} ${meData?.last_name}` : meData?.email}
          </h1>
          <p className="text-slate-500 text-sm">{meData?.email}</p>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${meData?.role === 'admin' ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30' : 'bg-white/5 text-slate-500 border border-white/10'}`}>
              {meData?.role === 'admin' ? '⭐ Admin' : 'Client'}
            </span>
            <span className="text-xs text-slate-600 bg-white/5 border border-white/10 px-2.5 py-1 rounded-full font-mono">
              ID #{meData?.id}
            </span>
          </div>
        </div>
        <div className="hidden sm:flex flex-col items-end gap-2">
          {walletBalance !== null && (
            <div className="text-right">
              <p className="text-xs text-slate-500">Solde</p>
              <p className="font-extrabold text-emerald-400">{walletBalance.toLocaleString()} XAF</p>
            </div>
          )}
          <Link to="/" className="btn-secondary text-sm py-2 px-4">🛒 Boutique</Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-white/5 mb-6 overflow-x-auto">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-4 py-3 text-sm font-semibold whitespace-nowrap border-b-2 transition-all -mb-px ${tab === t.id ? 'border-indigo-500 text-white' : 'border-transparent text-slate-500 hover:text-slate-300'}`}>
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
                  ) : s.login_email ? (
                    <button onClick={() => setCredModal(s)}
                      className="w-full py-2.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-xs font-bold hover:bg-emerald-500/20 transition-colors">
                      🔑 Voir mes identifiants
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
              ≈ {walletBalance !== null ? (walletBalance / 655).toFixed(2) : '—'} $
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
            <input value={user?.email} disabled className="input-field opacity-40 cursor-not-allowed" />
            <button onClick={saveProfile} className="w-full btn-primary py-3 text-sm">Sauvegarder</button>
          </div>

          <div className="card rounded-2xl p-6 space-y-4">
            <h3 className="font-bold">Changer le mot de passe</h3>
            {pwdMsg && <div className={`p-3 rounded-xl text-sm font-semibold ${pwdMsg.ok ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>{pwdMsg.msg}</div>}
            <input value={pwdForm.old} onChange={e => setPwdForm(p => ({...p, old: e.target.value}))} type="password" placeholder="Ancien mot de passe" className="input-field" />
            <input value={pwdForm.new} onChange={e => setPwdForm(p => ({...p, new: e.target.value}))} type="password" placeholder="Nouveau mot de passe" className="input-field" />
            <input value={pwdForm.confirm} onChange={e => setPwdForm(p => ({...p, confirm: e.target.value}))} type="password" placeholder="Confirmer le nouveau" className="input-field" />
            <button onClick={changePassword} className="w-full btn-secondary py-3 text-sm">Changer le mot de passe</button>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="card rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-extrabold">🔑 Vos identifiants</h3>
              <button onClick={() => setCredModal(null)} className="text-slate-500 hover:text-white w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">✕</button>
            </div>
            <div className="space-y-3">
              {credModal.profile_slot && (
                <div className="bg-white/5 rounded-xl p-3">
                  <p className="text-xs text-slate-500 mb-1">Profil / Slot</p>
                  <p className="font-bold text-sm">{credModal.profile_slot}</p>
                </div>
              )}
              {[['Email de connexion', credModal.login_email], ['Mot de passe', credModal.login_password]].map(([label, val]) => (
                <div key={label} className="bg-white/5 rounded-xl p-3">
                  <p className="text-xs text-slate-500 mb-1">{label}</p>
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-sm flex-1 break-all">{val}</p>
                    <button onClick={() => { navigator.clipboard.writeText(val || ''); toast('Copié !', 'success') }}
                      className="text-slate-500 hover:text-white text-xs bg-white/10 px-2 py-1 rounded-lg flex-shrink-0">📋</button>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs text-slate-600 mt-4">⚠️ Ne partagez jamais ces identifiants.</p>
          </div>
        </div>
      )}
    </div>
  )
}

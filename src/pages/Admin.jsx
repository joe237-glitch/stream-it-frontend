import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { Products, Orders, Subscriptions, Transactions, Users, ServiceAccounts, EmailLogs } from '../api/client'
import { useToast } from '../components/Toast'

// ─── Shared Helpers ────────────────────────────────────────────────────────────

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
    inactive:  'bg-red-500/15 text-red-400 border-red-500/20',
    available: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
    assigned:  'bg-blue-500/15 text-blue-400 border-blue-500/20',
  }
  const labels = {
    active:'Actif', pending:'En attente', expired:'Expiré', cancelled:'Annulé',
    paid:'Payé', success:'Succès', failed:'Échoué', completed:'Complété',
    inactive:'Inactif', available:'Disponible', assigned:'Assigné',
  }
  return (
    <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${map[status] || 'bg-slate-500/15 text-slate-400 border-slate-500/20'}`}>
      {labels[status] || status}
    </span>
  )
}

function formatDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('fr-FR', { day:'2-digit', month:'short', year:'numeric' })
}
function formatAmount(n) {
  if (n === undefined || n === null) return '—'
  return `${parseFloat(n).toLocaleString('fr-FR')} XAF`
}

function StatCard({ icon, label, value, sub, color = 'from-indigo-600 to-violet-600' }) {
  return (
    <div className="card rounded-2xl p-5">
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center text-lg`}>{icon}</div>
      </div>
      <p className="text-2xl font-black">{value ?? '—'}</p>
      <p className="text-sm font-semibold text-slate-300 mt-0.5">{label}</p>
      {sub && <p className="text-xs text-slate-600 mt-1">{sub}</p>}
    </div>
  )
}

function Modal({ title, onClose, children }) {
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="w-full max-w-lg bg-[#0f0f18] border border-white/10 rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 sticky top-0 bg-[#0f0f18] z-10">
          <h3 className="font-extrabold text-lg">{title}</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-colors">✕</button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  )
}

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-xs text-slate-500 mb-1.5 font-semibold uppercase tracking-wide">{label}</label>
      {children}
    </div>
  )
}

// ─── TABS ──────────────────────────────────────────────────────────────────────

const ADMIN_TABS = [
  { id: 'dashboard',        label: '📊 Dashboard' },
  { id: 'products',         label: '📦 Produits' },
  { id: 'service-accounts', label: '🔑 Comptes' },
  { id: 'orders',           label: '🛒 Commandes' },
  { id: 'subscriptions',    label: '📱 Abonnements' },
  { id: 'transactions',     label: '💳 Transactions' },
  { id: 'users',            label: '👥 Utilisateurs' },
  { id: 'emails',           label: '📧 Emails' },
]

// ─── DASHBOARD ─────────────────────────────────────────────────────────────────

function Dashboard() {
  const toast = useToast()
  const [stats, setStats] = useState(null)
  const [recentOrders, setRecentOrders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const safe = p => p.catch(() => null)
    Promise.all([
      safe(Orders.all('?limit=5')),
      safe(Subscriptions.all('?status=active&limit=1')),
      safe(ServiceAccounts.availability()),
      safe(Users.getAll('?limit=1')),
      safe(Transactions.all('?status=success&limit=1')),
    ]).then(([ordersRes, subsRes, availRes, usersRes, txnsRes]) => {
      setRecentOrders(ordersRes?.data.data || [])
      setStats({
        totalOrders:       ordersRes?.data.pagination?.total ?? (ordersRes?.data.data || []).length ?? 0,
        activeSubs:        subsRes?.data.pagination?.total ?? 0,
        availableAccounts: availRes?.data.available ?? 0,
        totalUsers:        usersRes?.data.pagination?.total ?? 0,
        successTxns:       txnsRes?.data.pagination?.total ?? 0,
      })
    }).finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="text-center py-16 text-slate-600 text-sm">Chargement...</div>

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon="🛒" label="Commandes totales" value={stats?.totalOrders} color="from-indigo-600 to-violet-600" />
        <StatCard icon="📱" label="Abonnements actifs" value={stats?.activeSubs} color="from-emerald-600 to-teal-600" />
        <StatCard icon="🔑" label="Comptes disponibles" value={stats?.availableAccounts} color="from-yellow-600 to-orange-600" />
        <StatCard icon="👥" label="Utilisateurs" value={stats?.totalUsers} color="from-violet-600 to-pink-600" />
      </div>

      <div className="card rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
          <h3 className="font-bold">Commandes récentes</h3>
          <span className="text-xs text-slate-500">5 dernières</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-white/5">
              <tr className="text-slate-500 text-xs uppercase">
                {['#','Client','Montant','Statut','Date'].map(h => (
                  <th key={h} className="text-left px-5 py-3 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recentOrders.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-8 text-slate-600">Aucune commande</td></tr>
              ) : recentOrders.map(o => (
                <tr key={o.id} className="border-t border-white/5 hover:bg-white/2 transition-colors">
                  <td className="px-5 py-3 font-mono text-xs text-slate-400">#{o.id}</td>
                  <td className="px-5 py-3 text-sm">{o.user_name || o.user_email || '—'}</td>
                  <td className="px-5 py-3 font-bold">{formatAmount(o.total_amount)}</td>
                  <td className="px-5 py-3"><StatusBadge status={o.status} /></td>
                  <td className="px-5 py-3 text-xs text-slate-500 whitespace-nowrap">{formatDate(o.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

// ─── PRODUCTS ──────────────────────────────────────────────────────────────────

const PRODUCT_CATEGORIES = ['Netflix', 'Spotify', 'Amazon Prime', 'IPTV', 'Disney+', 'Gaming', 'Abonnements Gaming', 'Cartes Cadeaux', 'Autres']

function ProductsTab() {
  const toast = useToast()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null) // null | { mode: 'create'|'edit', data?: {} }

  const load = useCallback(() => {
    setLoading(true)
    Products.getAll('?limit=200')
      .then(r => setItems(r.data.data || []))
      .catch(() => toast('Erreur de chargement', 'error'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  const toggleActive = async (id, current) => {
    try {
      await Products.update(id, { is_active: !current })
      toast(!current ? 'Produit activé' : 'Produit désactivé', 'success')
      load()
    } catch { toast('Erreur', 'error') }
  }

  const remove = async (id) => {
    if (!window.confirm('Supprimer ce produit ?')) return
    try {
      await Products.remove(id)
      toast('Produit supprimé', 'success')
      load()
    } catch { toast('Erreur lors de la suppression', 'error') }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-lg">Produits ({items.length})</h2>
        <button onClick={() => setModal({ mode: 'create', data: {} })} className="btn-primary text-sm py-2 px-4">+ Nouveau produit</button>
      </div>

      <div className="card rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-white/5">
              <tr className="text-slate-500 text-xs uppercase">
                {['Produit','Catégorie','Prix','Durée','Stock','Livraison','Statut','Actions'].map(h => (
                  <th key={h} className="text-left px-4 py-3 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="text-center py-12 text-slate-600">Chargement...</td></tr>
              ) : items.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-12 text-slate-600">Aucun produit</td></tr>
              ) : items.map(p => (
                <tr key={p.id} className="border-t border-white/5 hover:bg-white/2 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-900/50 to-violet-900/50 flex items-center justify-center text-sm flex-shrink-0">
                        {p.image_url ? <img src={p.image_url} className="w-8 h-8 rounded-lg object-cover" alt="" /> : '📦'}
                      </div>
                      <span className="font-semibold text-sm">{p.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-400 text-xs">{p.category}</td>
                  <td className="px-4 py-3 font-bold text-sm">{formatAmount(Math.round(p.price))}</td>
                  <td className="px-4 py-3 text-slate-400 text-xs">{p.duration_label || `${p.duration_days}j`}</td>
                  <td className="px-4 py-3 text-xs">{p.stock === -1 ? '∞' : p.stock ?? '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${p.delivery_type === 'manual' ? 'bg-amber-500/15 text-amber-400 border-amber-500/20' : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20'}`}>
                      {p.delivery_type === 'manual' ? '🖐 Manuel' : '⚡ Auto'}
                    </span>
                  </td>
                  <td className="px-4 py-3"><StatusBadge status={p.is_active ? 'active' : 'inactive'} /></td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button onClick={() => setModal({ mode: 'edit', data: p })}
                        className="text-xs bg-white/5 hover:bg-indigo-500/20 text-slate-400 hover:text-indigo-400 px-2.5 py-1.5 rounded-lg transition-colors">✏️</button>
                      <button onClick={() => toggleActive(p.id, p.is_active)}
                        className={`text-xs px-2.5 py-1.5 rounded-lg transition-colors ${p.is_active ? 'bg-yellow-500/10 text-yellow-400 hover:bg-yellow-500/20' : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'}`}>
                        {p.is_active ? '⏸' : '▶️'}
                      </button>
                      <button onClick={() => remove(p.id)}
                        className="text-xs bg-red-500/10 hover:bg-red-500/20 text-red-400 px-2.5 py-1.5 rounded-lg transition-colors">🗑</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {modal && (
        <ProductModal
          mode={modal.mode}
          initial={modal.data}
          onClose={() => setModal(null)}
          onSaved={() => { setModal(null); load() }}
        />
      )}
    </div>
  )
}

function ProductModal({ mode, initial, onClose, onSaved }) {
  const toast = useToast()
  const [form, setForm] = useState({
    name: initial?.name || '',
    category: initial?.category || 'Netflix',
    price: initial?.price || '',
    original_price: initial?.original_price || '',
    duration_days: initial?.duration_days || '',
    duration_label: initial?.duration_label || '',
    stock: initial?.stock ?? -1,
    delivery_type: initial?.delivery_type || 'auto',
    description: initial?.description || '',
    image_url: initial?.image_url || '',
    is_active: initial?.is_active ?? true,
  })
  const [loading, setLoading] = useState(false)

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const submit = async e => {
    e.preventDefault()
    setLoading(true)
    try {
      const payload = {
        ...form,
        price: Number(form.price),
        original_price: form.original_price ? Number(form.original_price) : null,
        duration_days: Number(form.duration_days),
        stock: Number(form.stock),
      }
      if (mode === 'create') await Products.create(payload)
      else await Products.update(initial.id, payload)
      toast(mode === 'create' ? 'Produit créé !' : 'Produit mis à jour !', 'success')
      onSaved()
    } catch (err) {
      toast(err.response?.data?.message || 'Erreur', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal title={mode === 'create' ? 'Nouveau produit' : 'Modifier le produit'} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <Field label="Nom du produit">
          <input value={form.name} onChange={e => set('name', e.target.value)} required className="input-field" placeholder="Ex: Netflix 1 mois" />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Catégorie">
            <select value={form.category} onChange={e => set('category', e.target.value)} className="input-field">
              {PRODUCT_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </Field>
          <Field label="Durée (jours)">
            <input value={form.duration_days} onChange={e => set('duration_days', e.target.value)} type="number" required className="input-field" placeholder="30" />
          </Field>
        </div>
        <Field label="Label durée (ex: 1 mois)">
          <input value={form.duration_label} onChange={e => set('duration_label', e.target.value)} className="input-field" placeholder="1 mois" />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Prix (XAF)">
            <input value={form.price} onChange={e => set('price', e.target.value)} type="number" required className="input-field" placeholder="2500" />
          </Field>
          <Field label="Prix barré (XAF)">
            <input value={form.original_price} onChange={e => set('original_price', e.target.value)} type="number" className="input-field" placeholder="5000" />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Stock (-1 = illimité)">
            <input value={form.stock} onChange={e => set('stock', e.target.value)} type="number" className="input-field" />
          </Field>
          <Field label="Mode de livraison">
            <select value={form.delivery_type} onChange={e => set('delivery_type', e.target.value)} className="input-field">
              <option value="auto">⚡ Auto (stock)</option>
              <option value="manual">🖐 Manuel (admin)</option>
            </select>
          </Field>
        </div>
        <Field label="URL image">
          <input value={form.image_url} onChange={e => set('image_url', e.target.value)} className="input-field" placeholder="https://..." />
        </Field>
        <Field label="Description">
          <textarea value={form.description} onChange={e => set('description', e.target.value)} className="input-field h-20 resize-none" />
        </Field>
        <Field label="Statut">
          <select value={form.is_active ? 'true' : 'false'} onChange={e => set('is_active', e.target.value === 'true')} className="input-field">
            <option value="true">Actif</option>
            <option value="false">Inactif</option>
          </select>
        </Field>
        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose} className="flex-1 btn-secondary py-3 text-sm">Annuler</button>
          <button type="submit" disabled={loading} className="flex-1 btn-primary py-3 text-sm disabled:opacity-50">
            {loading ? '⏳...' : mode === 'create' ? 'Créer' : 'Sauvegarder'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

// ─── SERVICE ACCOUNTS ──────────────────────────────────────────────────────────

// Mapping produit → type de livraison
const DELIVERY_TYPE_MAP = {
  // 👥 shared_account — email + mot de passe + profil/slot (compte partagé multi-profils)
  'Netflix':            'shared_account',
  'Disney+':            'shared_account',
  'Crunchyroll':        'shared_account',
  'Amazon Prime Video': 'shared_account',
  'Max (HBO)':          'shared_account',
  // 🔑 direct_credentials — email + mot de passe (accès solo complet)
  'Spotify (Solo)':     'direct_credentials',
  'Deezer (Solo)':      'direct_credentials',
  'CapCut Pro':         'direct_credentials',
  'ChatGPT Plus':       'direct_credentials',
  'IPTV':               'direct_credentials',
  'YouTube Premium':    'direct_credentials',
  'Canva Pro (Solo)':   'direct_credentials',
  'Amazon Prime':       'direct_credentials',
  // 🔗 invite_link — invitation envoyée au client depuis le compte principal
  'Spotify (Family)':   'invite_link',
  'Spotify (Duo)':      'invite_link',
  'Apple Music':        'invite_link',
  'Canva Pro (Team)':   'invite_link',
  'Deezer (Family)':    'invite_link',
  'YouTube Family':     'invite_link',
  // 🎁 gift_card — code d'activation uniquement
  'Steam':              'gift_card',
  'PSN (EUR)':          'gift_card',
  'PSN (USD)':          'gift_card',
  'Xbox / Game Pass':   'gift_card',
  'Nintendo eShop':     'gift_card',
  'Roblox':             'gift_card',
  'Fortnite V-Bucks':   'gift_card',
  'Valorant Points':    'gift_card',
  'TikTok Coins':       'gift_card',
  'Amazon Gift Card':   'gift_card',
  'Binance Gift Card':  'gift_card',
  'Blizzard Balance':   'gift_card',
  'Apex Legends':       'gift_card',
  'Free Fire Diamonds': 'gift_card',
  'PUBG UC':            'gift_card',
}

const DT_LABELS = {
  shared_account:     '👥 Partagé',
  direct_credentials: '🔑 Direct',
  invite_link:        '🔗 Invitation',
  gift_card:          '🎁 Carte/Code',
}

const DT_COLORS = {
  shared_account:     'bg-blue-500/15 text-blue-400 border-blue-500/20',
  direct_credentials: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/20',
  invite_link:        'bg-violet-500/15 text-violet-400 border-violet-500/20',
  gift_card:          'bg-amber-500/15 text-amber-400 border-amber-500/20',
}

function DeliveryBadge({ type }) {
  return (
    <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${DT_COLORS[type] || 'bg-slate-500/15 text-slate-400 border-slate-500/20'}`}>
      {DT_LABELS[type] || type || '—'}
    </span>
  )
}

function ServiceAccountsTab() {
  const toast = useToast()
  const [items, setItems]         = useState([])
  const [loading, setLoading]     = useState(true)
  const [modal, setModal]         = useState(null)
  const [filterStatus, setFStatus]= useState('')
  const [filterType, setFType]    = useState('')

  const load = useCallback(() => {
    setLoading(true)
    ServiceAccounts.getAll()
      .then(r => setItems(r.data.data || []))
      .catch(() => toast('Erreur de chargement', 'error'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  const filtered = items.filter(sa => {
    if (filterStatus && sa.status !== filterStatus) return false
    if (filterType  && sa.delivery_type !== filterType) return false
    return true
  })

  const stats = {
    total:     items.length,
    available: items.filter(s => s.status === 'available').length,
    assigned:  items.filter(s => s.status === 'assigned').length,
    codes:     items.filter(s => s.delivery_type === 'gift_card').length,
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-lg">Comptes de service ({items.length})</h2>
        <button onClick={() => setModal({ mode: 'create', data: {} })} className="btn-primary text-sm py-2 px-4">+ Nouveau</button>
      </div>

      {/* Mini stats */}
      <div className="grid grid-cols-4 gap-3">
        {[
          ['Total', stats.total, 'text-slate-300'],
          ['Disponibles', stats.available, 'text-emerald-400'],
          ['Assignés', stats.assigned, 'text-blue-400'],
          ['Codes/Cartes', stats.codes, 'text-amber-400'],
        ].map(([label, val, color]) => (
          <div key={label} className="card rounded-xl p-3 text-center">
            <p className={`text-xl font-black ${color}`}>{val}</p>
            <p className="text-xs text-slate-600 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Filtres */}
      <div className="flex flex-wrap gap-2">
        <select value={filterStatus} onChange={e => setFStatus(e.target.value)} className="input-field py-1.5 text-xs w-auto">
          <option value="">Tous statuts</option>
          {['available','assigned','expired','disabled'].map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={filterType} onChange={e => setFType(e.target.value)} className="input-field py-1.5 text-xs w-auto">
          <option value="">Tous types</option>
          {Object.entries(DT_LABELS).map(([t, l]) => <option key={t} value={t}>{l}</option>)}
        </select>
      </div>

      <div className="card rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-white/5">
              <tr className="text-slate-500 text-xs uppercase">
                {['#','Produit','Type','Identifiants / Code','Statut','Actions'].map(h => (
                  <th key={h} className="text-left px-4 py-3 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="text-center py-12 text-slate-600">Chargement...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-12 text-slate-600">Aucun compte</td></tr>
              ) : filtered.map(sa => (
                <tr key={sa.id} className="border-t border-white/5 hover:bg-white/2 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs text-slate-500">#{sa.id}</td>
                  <td className="px-4 py-3 text-xs font-medium text-slate-300 max-w-[140px] truncate">{sa.product_name || '—'}</td>
                  <td className="px-4 py-3"><DeliveryBadge type={sa.delivery_type} /></td>
                  <td className="px-4 py-3 text-xs font-mono">
                    {sa.delivery_type === 'gift_card'
                      ? <span className="text-amber-400 font-bold">{sa.activation_code ? `${sa.activation_code.substring(0,16)}…` : '—'}</span>
                      : sa.delivery_type === 'invite_link'
                      ? <span className="text-violet-400">{sa.login_email || '—'}</span>
                      : <span>{sa.login_email || '—'}{sa.profile_slot && <span className="text-slate-600"> · {sa.profile_slot}</span>}</span>
                    }
                  </td>
                  <td className="px-4 py-3"><StatusBadge status={sa.status || 'available'} /></td>
                  <td className="px-4 py-3">
                    <button onClick={() => setModal({ mode: 'edit', data: sa })}
                      className="text-xs bg-white/5 hover:bg-indigo-500/20 text-slate-400 hover:text-indigo-400 px-2.5 py-1.5 rounded-lg transition-colors">✏️</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {modal && (
        <ServiceAccountModal
          mode={modal.mode}
          initial={modal.data}
          onClose={() => setModal(null)}
          onSaved={() => { setModal(null); load() }}
        />
      )}
    </div>
  )
}

function ServiceAccountModal({ mode, initial, onClose, onSaved }) {
  const toast = useToast()

  const initialType = initial?.delivery_type || 'shared_account'

  const [form, setForm] = useState({
    product_id:      initial?.product_id      || '',
    delivery_type:   initialType,
    login_email:     initial?.login_email     || '',
    login_password:  initial?.login_password  || '',
    profile_slot:    initial?.profile_slot    || '',
    activation_code: initial?.activation_code || '',
    notes:           initial?.notes           || '',
    status:          initial?.status          || 'available',
  })
  const [allProducts, setAllProducts] = useState([])
  const [loading, setLoading] = useState(false)
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  useEffect(() => {
    Products.getAll('?limit=200&page=1').then(r => setAllProducts(r.data.data || [])).catch(() => {})
  }, [])

  // Auto-détection du type quand on choisit un produit
  const handleProductChange = (productId) => {
    set('product_id', productId)
    const product = allProducts.find(p => String(p.id) === String(productId))
    if (product) {
      const matched = Object.keys(DELIVERY_TYPE_MAP).find(s =>
        product.name.toLowerCase().includes(s.toLowerCase())
      )
      if (matched) set('delivery_type', DELIVERY_TYPE_MAP[matched])
    }
  }

  const dt = form.delivery_type

  const submit = async e => {
    e.preventDefault()
    setLoading(true)
    try {
      // On nettoie les champs inutiles selon le type
      const payload = { ...form }
      if (dt === 'gift_card') {
        payload.login_email = ''; payload.login_password = ''; payload.profile_slot = ''
      } else if (dt === 'direct_credentials') {
        payload.profile_slot = ''; payload.activation_code = ''
      } else if (dt === 'invite_link') {
        payload.login_password = ''; payload.profile_slot = ''; payload.activation_code = ''
      } else {
        payload.activation_code = '' // shared_account
      }
      if (mode === 'create') await ServiceAccounts.create(payload)
      else await ServiceAccounts.update(initial.id, payload)
      toast(mode === 'create' ? 'Compte créé !' : 'Compte mis à jour !', 'success')
      onSaved()
    } catch (err) {
      toast(err.response?.data?.message || 'Erreur', 'error')
    } finally { setLoading(false) }
  }

  return (
    <Modal title={mode === 'create' ? '➕ Nouveau compte service' : '✏️ Modifier le compte'} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">

        {/* Produit */}
        <Field label="Produit">
          {mode === 'edit' && initial?.product_name ? (
            <p className="input-field opacity-60 text-sm cursor-not-allowed">{initial.product_name}</p>
          ) : (
            <select value={form.product_id} onChange={e => handleProductChange(e.target.value)} className="input-field" required>
              <option value="">Sélectionner un produit…</option>
              {allProducts.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          )}
        </Field>

        {/* Type de livraison */}
        <Field label="Type de livraison">
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(DT_LABELS).map(([type, label]) => (
              <button key={type} type="button" onClick={() => set('delivery_type', type)}
                className={`p-3 rounded-xl border text-xs font-semibold text-left transition-all ${
                  form.delivery_type === type
                    ? 'border-indigo-500 bg-indigo-500/15 text-indigo-300'
                    : 'border-white/10 text-slate-500 hover:border-white/20 hover:text-slate-300'
                }`}>
                <span>{label}</span>
                <p className="text-slate-600 font-normal mt-0.5 leading-tight text-[10px]">
                  {type === 'shared_account'     && 'Email + Mdp + Profil'}
                  {type === 'direct_credentials' && 'Email + Mdp (accès solo)'}
                  {type === 'invite_link'         && 'Invitation famille/duo'}
                  {type === 'gift_card'           && 'Code d\'activation uniquement'}
                </p>
              </button>
            ))}
          </div>
        </Field>

        {/* 🎁 GIFT CARD : code uniquement */}
        {dt === 'gift_card' && (
          <Field label="🎁 Code d'activation *">
            <textarea
              value={form.activation_code}
              onChange={e => set('activation_code', e.target.value)}
              required
              className="input-field h-20 resize-none font-mono text-sm tracking-widest"
              placeholder="XXXX-XXXX-XXXX-XXXX"
            />
          </Field>
        )}

        {/* EMAIL (shared, direct, invite) */}
        {(dt === 'shared_account' || dt === 'direct_credentials' || dt === 'invite_link') && (
          <Field label={dt === 'invite_link' ? '📧 Email du compte principal' : '📧 Email de connexion *'}>
            <input
              value={form.login_email}
              onChange={e => set('login_email', e.target.value)}
              type="email"
              required={dt !== 'invite_link'}
              className="input-field"
              placeholder="compte@service.com"
            />
          </Field>
        )}

        {/* MOT DE PASSE (shared, direct) */}
        {(dt === 'shared_account' || dt === 'direct_credentials') && (
          <Field label="🔒 Mot de passe *">
            <input
              value={form.login_password}
              onChange={e => set('login_password', e.target.value)}
              required
              className="input-field font-mono"
              placeholder="Mot de passe du compte"
            />
          </Field>
        )}

        {/* PROFIL / SLOT (shared seulement) */}
        {dt === 'shared_account' && (
          <Field label="👤 Profil / Slot">
            <input
              value={form.profile_slot}
              onChange={e => set('profile_slot', e.target.value)}
              className="input-field"
              placeholder="Ex: Profil 2, Slot B…"
            />
          </Field>
        )}

        {/* Info invitation */}
        {dt === 'invite_link' && (
          <div className="bg-violet-500/5 border border-violet-500/20 rounded-xl p-3 text-xs text-violet-300">
            💡 L'invitation sera envoyée à l'email du client depuis ce compte principal.
            Assurez-vous que le compte a des slots disponibles.
          </div>
        )}

        {/* Statut */}
        <Field label="Statut">
          <select value={form.status} onChange={e => set('status', e.target.value)} className="input-field">
            <option value="available">✅ Disponible</option>
            <option value="assigned">🔵 Assigné</option>
            <option value="expired">⌛ Expiré</option>
            <option value="disabled">🚫 Désactivé</option>
          </select>
        </Field>

        {/* Notes */}
        <Field label="Notes internes">
          <textarea value={form.notes} onChange={e => set('notes', e.target.value)}
            className="input-field h-16 resize-none text-sm" placeholder="Remarques optionnelles…" />
        </Field>

        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose} className="flex-1 btn-secondary py-3 text-sm">Annuler</button>
          <button type="submit" disabled={loading} className="flex-1 btn-primary py-3 text-sm disabled:opacity-50">
            {loading ? '⏳...' : mode === 'create' ? 'Créer' : 'Sauvegarder'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

// ─── ORDERS ────────────────────────────────────────────────────────────────────

const ORDER_STATUSES = ['pending', 'paid', 'completed', 'cancelled', 'failed']

function OrdersTab() {
  const toast = useToast()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(() => {
    setLoading(true)
    Orders.all()
      .then(r => setItems(r.data.data || []))
      .catch(() => toast('Erreur de chargement', 'error'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  const updateStatus = async (id, status) => {
    try {
      await Orders.updateStatus(id, status)
      toast('Statut mis à jour', 'success')
      load()
    } catch { toast('Erreur', 'error') }
  }

  return (
    <div className="space-y-4">
      <h2 className="font-bold text-lg">Commandes ({items.length})</h2>
      <div className="card rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-white/5">
              <tr className="text-slate-500 text-xs uppercase">
                {['#','Client','Total','Statut','Date','Actions'].map(h => (
                  <th key={h} className="text-left px-4 py-3 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="text-center py-12 text-slate-600">Chargement...</td></tr>
              ) : items.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-12 text-slate-600">Aucune commande</td></tr>
              ) : items.map(o => (
                <tr key={o.id} className="border-t border-white/5 hover:bg-white/2 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs text-slate-500">#{o.id}</td>
                  <td className="px-4 py-3">
                    <p className="text-sm font-semibold">{o.user_name || o.user_email || '—'}</p>
                    {o.user_email && o.user_name && <p className="text-xs text-slate-500">{o.user_email}</p>}
                  </td>
                  <td className="px-4 py-3 font-bold">{formatAmount(o.total_amount)}</td>
                  <td className="px-4 py-3"><StatusBadge status={o.status} /></td>
                  <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">{formatDate(o.created_at)}</td>
                  <td className="px-4 py-3">
                    <select
                      value={o.status}
                      onChange={e => updateStatus(o.id, e.target.value)}
                      className="text-xs bg-white/5 border border-white/10 text-white rounded-lg px-2 py-1.5 focus:outline-none focus:border-indigo-500 cursor-pointer"
                    >
                      {ORDER_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

// ─── SUBSCRIPTIONS ─────────────────────────────────────────────────────────────

const SUB_STATUSES = ['pending', 'active', 'expired', 'cancelled']

function SubscriptionsTab() {
  const toast = useToast()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(() => {
    setLoading(true)
    Subscriptions.all()
      .then(r => setItems(r.data.data || []))
      .catch(() => toast('Erreur de chargement', 'error'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  const updateStatus = async (id, status) => {
    try {
      await Subscriptions.updateStatus(id, status)
      toast('Statut mis à jour', 'success')
      load()
    } catch { toast('Erreur', 'error') }
  }

  const assign = async (id) => {
    try {
      await ServiceAccounts.assign(id)
      toast('Compte assigné !', 'success')
      load()
    } catch (err) {
      toast(err.response?.data?.message || 'Aucun compte disponible', 'error')
    }
  }

  const expireOld = async () => {
    try {
      await Subscriptions.expireOld()
      toast('Abonnements expirés mis à jour', 'success')
      load()
    } catch { toast('Erreur', 'error') }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-lg">Abonnements ({items.length})</h2>
        <button onClick={expireOld} className="btn-secondary text-xs py-2 px-3">⏰ Expirer les anciens</button>
      </div>
      <div className="card rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-white/5">
              <tr className="text-slate-500 text-xs uppercase">
                {['#','Client','Produit','Compte assigné','Statut','Fin','Actions'].map(h => (
                  <th key={h} className="text-left px-4 py-3 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="text-center py-12 text-slate-600">Chargement...</td></tr>
              ) : items.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-12 text-slate-600">Aucun abonnement</td></tr>
              ) : items.map(s => (
                <tr key={s.id} className="border-t border-white/5 hover:bg-white/2 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs text-slate-500">#{s.id}</td>
                  <td className="px-4 py-3 text-sm">{s.user_name || s.user_email || '—'}</td>
                  <td className="px-4 py-3 text-xs text-slate-400 max-w-[140px] truncate">{s.product_name || '—'}</td>
                  <td className="px-4 py-3 text-xs">
                    {s.login_email ? (
                      <span className="text-emerald-400 font-mono">{s.login_email}</span>
                    ) : (
                      <span className="text-slate-600">Non assigné</span>
                    )}
                  </td>
                  <td className="px-4 py-3"><StatusBadge status={s.status} /></td>
                  <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">{formatDate(s.end_date)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {!s.login_email && (s.status === 'active' || s.status === 'pending') && (
                        <button onClick={() => assign(s.id)}
                          className="text-xs bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 px-2.5 py-1.5 rounded-lg transition-colors whitespace-nowrap">
                          🔑 Assigner
                        </button>
                      )}
                      <select
                        value={s.status}
                        onChange={e => updateStatus(s.id, e.target.value)}
                        className="text-xs bg-white/5 border border-white/10 text-white rounded-lg px-2 py-1.5 focus:outline-none focus:border-indigo-500 cursor-pointer"
                      >
                        {SUB_STATUSES.map(st => <option key={st} value={st}>{st}</option>)}
                      </select>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

// ─── TRANSACTIONS ──────────────────────────────────────────────────────────────

const TXN_STATUSES = ['pending', 'success', 'failed', 'cancelled']

function TransactionsTab() {
  const toast = useToast()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(() => {
    setLoading(true)
    Transactions.all()
      .then(r => setItems(r.data.data || []))
      .catch(() => toast('Erreur de chargement', 'error'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  const updateStatus = async (id, status) => {
    try {
      await Transactions.updateStatus(id, status)
      toast('Statut mis à jour', 'success')
      load()
    } catch { toast('Erreur', 'error') }
  }

  return (
    <div className="space-y-4">
      <h2 className="font-bold text-lg">Transactions ({items.length})</h2>
      <div className="card rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-white/5">
              <tr className="text-slate-500 text-xs uppercase">
                {['Référence','Client','Méthode','Montant','Statut','Date','Actions'].map(h => (
                  <th key={h} className="text-left px-4 py-3 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="text-center py-12 text-slate-600">Chargement...</td></tr>
              ) : items.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-12 text-slate-600">Aucune transaction</td></tr>
              ) : items.map(t => (
                <tr key={t.id} className="border-t border-white/5 hover:bg-white/2 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs text-slate-400">{t.external_reference || `#${t.id}`}</td>
                  <td className="px-4 py-3 text-sm">{t.user_name || t.user_email || '—'}</td>
                  <td className="px-4 py-3 text-xs text-slate-400">{t.payment_provider || t.payment_method || '—'}</td>
                  <td className="px-4 py-3 font-bold">{formatAmount(t.amount)}</td>
                  <td className="px-4 py-3"><StatusBadge status={t.status} /></td>
                  <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">{formatDate(t.created_at)}</td>
                  <td className="px-4 py-3">
                    <select
                      value={t.status}
                      onChange={e => updateStatus(t.id, e.target.value)}
                      className="text-xs bg-white/5 border border-white/10 text-white rounded-lg px-2 py-1.5 focus:outline-none focus:border-indigo-500 cursor-pointer"
                    >
                      {TXN_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

// ─── USERS ─────────────────────────────────────────────────────────────────────

function WalletModal({ user, onClose, onDone }) {
  const toast = useToast()
  const [type, setType] = useState('credit')
  const [amount, setAmount] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async () => {
    const amt = parseInt(amount)
    if (!amt || amt <= 0) return toast('Montant invalide', 'error')
    setLoading(true)
    try {
      const r = await Users.adjustWallet(user.id, { amount: amt, type })
      toast(r.data.message, 'success')
      onDone()
      onClose()
    } catch (err) {
      toast(err.response?.data?.message || 'Erreur', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal title={`💰 Solde — ${user.first_name} ${user.last_name}`} onClose={onClose}>
      <div className="space-y-4">
        <div className="bg-white/5 rounded-xl p-4 text-center">
          <p className="text-xs text-slate-500 mb-1">Solde actuel</p>
          <p className="text-2xl font-black text-emerald-400">{(user.wallet_balance ?? 0).toLocaleString()} XAF</p>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {[['credit','➕ Créditer','from-emerald-600 to-emerald-500'],['debit','➖ Débiter','from-red-600 to-red-500']].map(([v,label,grad]) => (
            <button key={v} onClick={() => setType(v)}
              className={`py-2.5 rounded-xl text-sm font-bold transition-all border ${type === v ? `border-transparent bg-gradient-to-r ${grad} text-white` : 'border-white/10 bg-white/5 text-slate-400 hover:border-white/20'}`}>
              {label}
            </button>
          ))}
        </div>
        <div>
          <label className="block text-xs text-slate-500 mb-1.5">Montant (XAF)</label>
          <input value={amount} onChange={e => setAmount(e.target.value.replace(/\D/g,''))}
            placeholder="Ex: 5000" inputMode="numeric"
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 text-lg font-bold" />
        </div>
        <p className="text-xs text-slate-600">Un email de notification sera envoyé au client.</p>
        <button onClick={submit} disabled={loading || !amount}
          className={`w-full py-3 rounded-xl font-bold text-sm transition-all disabled:opacity-50 ${type === 'credit' ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-red-600 hover:bg-red-500'} text-white`}>
          {loading ? 'Traitement...' : type === 'credit' ? `➕ Créditer ${parseInt(amount)||0} XAF` : `➖ Débiter ${parseInt(amount)||0} XAF`}
        </button>
      </div>
    </Modal>
  )
}

function UsersTab() {
  const toast = useToast()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [walletUser, setWalletUser] = useState(null)

  const load = useCallback(() => {
    setLoading(true)
    Users.getAll('?limit=100')
      .then(r => setItems(r.data.data || []))
      .catch(() => toast('Erreur de chargement', 'error'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  const toggleActive = async (id) => {
    try { await Users.toggleActive(id); toast('Statut mis à jour', 'success'); load() }
    catch { toast('Erreur', 'error') }
  }

  const changeRole = async (id, role) => {
    try { await Users.changeRole(id, role); toast('Rôle mis à jour', 'success'); load() }
    catch { toast('Erreur', 'error') }
  }

  const deleteUser = async (u) => {
    if (!window.confirm(`Supprimer definitivement le compte de ${u.first_name} ${u.last_name} (${u.email}) ?\n\nToutes ses commandes, abonnements et transactions seront supprimees.`)) return
    try { await Users.delete(u.id); toast(`Compte de ${u.first_name} supprime`, 'success'); load() }
    catch (err) { toast(err.response?.data?.message || 'Erreur de suppression', 'error') }
  }

  return (
    <div className="space-y-4">
      <h2 className="font-bold text-lg">Utilisateurs ({items.length})</h2>
      <div className="card rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-white/5">
              <tr className="text-slate-500 text-xs uppercase">
                {['Utilisateur','Email','Solde','Rôle','Statut','Inscrit','Actions'].map(h => (
                  <th key={h} className="text-left px-4 py-3 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="text-center py-12 text-slate-600">Chargement...</td></tr>
              ) : items.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-12 text-slate-600">Aucun utilisateur</td></tr>
              ) : items.map(u => (
                <tr key={u.id} className="border-t border-white/5 hover:bg-white/2 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center text-xs font-bold flex-shrink-0">
                        {u.first_name?.[0]}{u.last_name?.[0]}
                      </div>
                      <span className="font-semibold text-sm">{u.first_name} {u.last_name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-400">{u.email}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => setWalletUser(u)}
                      className="flex items-center gap-1.5 font-bold text-emerald-400 hover:text-emerald-300 transition-colors group">
                      <span>{(u.wallet_balance ?? 0).toLocaleString()} XAF</span>
                      <span className="text-xs text-slate-600 group-hover:text-slate-400 transition-colors">✏️</span>
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <select value={u.role} onChange={e => changeRole(u.id, e.target.value)}
                      className="text-xs bg-white/5 border border-white/10 text-white rounded-lg px-2 py-1.5 focus:outline-none focus:border-indigo-500 cursor-pointer">
                      <option value="customer">Client</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                  <td className="px-4 py-3"><StatusBadge status={u.is_active === false ? 'inactive' : 'active'} /></td>
                  <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">{formatDate(u.created_at)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button onClick={() => setWalletUser(u)}
                        className="text-xs px-2.5 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors">
                        💰 Solde
                      </button>
                      <button onClick={() => toggleActive(u.id)}
                        className={`text-xs px-2.5 py-1.5 rounded-lg transition-colors ${u.is_active !== false ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20' : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'}`}>
                        {u.is_active !== false ? '🚫' : '✅'}
                      </button>
                      {u.role !== 'admin' && (
                        <button onClick={() => deleteUser(u)}
                          className="text-xs px-2.5 py-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors">
                          🗑
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {walletUser && <WalletModal user={walletUser} onClose={() => setWalletUser(null)} onDone={load} />}
    </div>
  )
}

// ─── MAIN ADMIN PAGE ────────────────────────────────────────────────────────────

export default function Admin() {
  const [tab, setTab] = useState('dashboard')

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black">Panel Admin</h1>
          <p className="text-slate-500 text-sm mt-0.5">Stream-It · Gestion</p>
        </div>
        <Link to="/" className="btn-secondary text-sm py-2 px-4">← Voir le site</Link>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-white/5 mb-6 overflow-x-auto pb-0">
        {ADMIN_TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-4 py-3 text-sm font-semibold whitespace-nowrap border-b-2 transition-all -mb-px ${tab === t.id ? 'border-indigo-500 text-white' : 'border-transparent text-slate-500 hover:text-slate-300'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 'dashboard'        && <Dashboard />}
      {tab === 'products'         && <ProductsTab />}
      {tab === 'service-accounts' && <ServiceAccountsTab />}
      {tab === 'orders'           && <OrdersTab />}
      {tab === 'subscriptions'    && <SubscriptionsTab />}
      {tab === 'transactions'     && <TransactionsTab />}
      {tab === 'users'            && <UsersTab />}
      {tab === 'emails'           && <EmailsTab />}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════
// EMAILS TAB
// ═══════════════════════════════════════════════════════════════════

function EmailsTab() {
  const [emails, setEmails] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState({})
  const [filter, setFilter] = useState({ type: '', status: '' })

  const fetchEmails = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page, limit: 30 })
      if (filter.type) params.set('type', filter.type)
      if (filter.status) params.set('status', filter.status)
      const r = await EmailLogs.getAll(`?${params}`)
      setEmails(r.data.data || [])
      setPagination(r.data.pagination || {})
    } catch { setEmails([]) }
    setLoading(false)
  }, [page, filter])

  useEffect(() => { fetchEmails() }, [fetchEmails])

  const typeColors = {
    'OTP': 'text-indigo-400',
    'WELCOME': 'text-emerald-400',
    'CREDENTIALS': 'text-blue-400',
    'PURCHASE': 'text-violet-400',
    'RECHARGE': 'text-emerald-400',
    'REFUND': 'text-yellow-400',
    'PASSWORD_CHANGED': 'text-orange-400',
    'EMAIL_CHANGED': 'text-orange-400',
    'PASSWORD_RESET': 'text-red-400',
    'EXPIRATION_WARNING': 'text-yellow-400',
    'ACCOUNT_DEACTIVATED': 'text-red-400',
    'WALLET': 'text-emerald-400',
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <select value={filter.type} onChange={e => { setFilter(p => ({...p, type: e.target.value})); setPage(1) }}
          className="input-field text-sm w-auto">
          <option value="">Tous les types</option>
          {['OTP', 'WELCOME', 'CREDENTIALS', 'PURCHASE', 'RECHARGE', 'REFUND', 'WALLET', 'PASSWORD_CHANGED', 'PASSWORD_RESET', 'EXPIRATION_WARNING', 'ACCOUNT_DEACTIVATED'].map(t => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
        <select value={filter.status} onChange={e => { setFilter(p => ({...p, status: e.target.value})); setPage(1) }}
          className="input-field text-sm w-auto">
          <option value="">Tous les statuts</option>
          <option value="sent">Envoyé</option>
          <option value="failed">Échoué</option>
        </select>
      </div>

      {/* Table */}
      <div className="card rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-white/5">
              <tr className="text-slate-500 text-xs uppercase">
                {['Destinataire', 'Type', 'Sujet', 'Statut', 'Date'].map(h => (
                  <th key={h} className="text-left px-4 py-3 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="text-center py-12 text-slate-600">Chargement...</td></tr>
              ) : emails.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-12 text-slate-600">Aucun email</td></tr>
              ) : emails.map(e => (
                <tr key={e.id} className="border-t border-white/5 hover:bg-white/2 transition-colors">
                  <td className="px-4 py-3">
                    <p className="text-sm">{e.to_email}</p>
                    {e.first_name && <p className="text-xs text-slate-600">{e.first_name} {e.last_name}</p>}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-bold ${typeColors[e.type] || 'text-slate-400'}`}>{e.type}</span>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-400 max-w-[250px] truncate">{e.subject}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${e.status === 'sent' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-400'}`}>
                      {e.status === 'sent' ? '✓ Envoyé' : '✗ Échoué'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">{formatDate(e.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {pagination.total_pages > 1 && (
        <div className="flex justify-center gap-2">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}
            className="btn-secondary text-xs py-2 px-4 disabled:opacity-30">← Précédent</button>
          <span className="text-sm text-slate-500 py-2">Page {page} / {pagination.total_pages}</span>
          <button onClick={() => setPage(p => Math.min(pagination.total_pages, p + 1))} disabled={page >= pagination.total_pages}
            className="btn-secondary text-xs py-2 px-4 disabled:opacity-30">Suivant →</button>
        </div>
      )}
    </div>
  )
}

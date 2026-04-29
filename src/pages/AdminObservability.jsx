import { useEffect, useRef, useState } from 'react'
import { Observability } from '../api/client'

/**
 * /admin/observability — admin-only payment health snapshot.
 *
 * Renders the JSON returned by GET /api/admin/observability/snapshot and
 * highlights any computed alerts. Auto-refreshes every 30 s; a manual
 * "Rafraîchir" button forces an immediate fetch.
 *
 * No mutation, no side effect — pure read of the staging payment subsystem.
 */
export default function AdminObservability() {
  const [data, setData]     = useState(null)
  const [error, setError]   = useState('')
  const [loading, setLoading] = useState(true)
  const [auto, setAuto]     = useState(true)
  const intervalRef         = useRef(null)

  const fetchSnapshot = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await Observability.snapshot()
      setData(res.data?.data || null)
    } catch (err) {
      const status = err.response?.status
      const msg = err.response?.data?.message || err.message
      setError(`HTTP ${status || '?'} — ${msg}`)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchSnapshot() }, [])

  useEffect(() => {
    if (!auto) return
    intervalRef.current = setInterval(fetchSnapshot, 30_000)
    return () => clearInterval(intervalRef.current)
  }, [auto])

  return (
    <div className="max-w-5xl mx-auto px-4 py-10 space-y-6">
      <header className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-white">Observabilité staging</h1>
          <p className="text-slate-500 text-sm mt-1">
            Snapshot lecture seule du sous-système de paiement. Auth admin requise.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer">
            <input
              type="checkbox"
              checked={auto}
              onChange={e => setAuto(e.target.checked)}
              className="accent-indigo-500"
            />
            Auto-refresh 30s
          </label>
          <button
            onClick={fetchSnapshot}
            disabled={loading}
            className="btn-primary text-xs py-2 px-3"
          >
            {loading ? '…' : 'Rafraîchir'}
          </button>
        </div>
      </header>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-300 rounded-xl p-4 text-sm">
          {error}
        </div>
      )}

      {data?.alerts?.length > 0 && (
        <section className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
          <p className="font-bold text-amber-300 mb-2">⚠️ {data.alerts.length} alerte{data.alerts.length > 1 ? 's' : ''}</p>
          <ul className="space-y-1.5 text-sm">
            {data.alerts.map((a, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
                  a.severity === 'error' ? 'bg-red-500/20 text-red-300' : 'bg-amber-500/20 text-amber-300'
                }`}>
                  {a.severity}
                </span>
                <div>
                  <p className="text-slate-200">{a.message}</p>
                  <p className="text-slate-500 text-xs">{a.code}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {data?.alerts?.length === 0 && (
        <section className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 text-emerald-300 text-sm">
          ✓ Aucune alerte. Tout est nominal.
        </section>
      )}

      {data && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card title="Coverage" rows={data.coverage} />
          <Card title="Cron réconciliation"  rows={data.cron_reconciliation} />
          <Card title="Paiements pending"    rows={data.payments_pending} />
          <Card title="Transactions 24h"     rows={data.transactions_24h} />
          <Card title="Webhooks 24h" rows={{
            received_total: data.webhooks_24h?.received_total,
            by_provider:    JSON.stringify(data.webhooks_24h?.by_provider || {}),
            by_status:      JSON.stringify(data.webhooks_24h?.by_status   || {}),
          }} />
          <Card title="Snapshot" rows={{ ts: data.ts }} />
        </div>
      )}

      {data && (
        <details className="bg-[#0f0f18] border border-white/10 rounded-xl p-4 text-xs">
          <summary className="cursor-pointer text-slate-400">Voir le JSON brut</summary>
          <pre className="mt-3 text-slate-200 overflow-x-auto">{JSON.stringify(data, null, 2)}</pre>
        </details>
      )}
    </div>
  )
}

function Card({ title, rows }) {
  if (!rows || typeof rows !== 'object') return null
  return (
    <div className="bg-[#0f0f18] border border-white/10 rounded-xl p-4">
      <p className="text-xs uppercase tracking-wide text-slate-500 mb-2">{title}</p>
      <dl className="space-y-1 text-sm">
        {Object.entries(rows).map(([k, v]) => (
          <div key={k} className="flex justify-between gap-3 border-b border-white/5 pb-1 last:border-0">
            <dt className="text-slate-400">{k}</dt>
            <dd className="text-slate-200 font-mono text-xs text-right break-all">
              {v == null ? '—' : String(v)}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  )
}

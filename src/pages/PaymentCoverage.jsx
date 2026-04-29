import { useMemo, useState } from 'react'
import { usePaymentCoverage, getVisibleCountries } from '../hooks/usePaymentCoverage'
import CountryCard from '../components/coverage/CountryCard'

/**
 * /payment-coverage — public page listing the payment coverage.
 *
 * Lists every country with `visible: true`. Sorted by enabled (true first),
 * then alphabetically. Filter by name + payment-type facets.
 *
 * No auth required.
 */
export default function PaymentCoverage() {
  const { data, loading, error } = usePaymentCoverage()
  const [search, setSearch]      = useState('')
  const [typeFilter, setType]    = useState('all') // all | mobile_money | card

  const sorted = useMemo(() => {
    const list = getVisibleCountries(data)
    return [...list].sort((a, b) => {
      if (a.enabled !== b.enabled) return a.enabled ? -1 : 1
      return a.country_name.localeCompare(b.country_name)
    })
  }, [data])

  const filtered = useMemo(() => {
    return sorted.filter(c => {
      if (search && !c.country_name.toLowerCase().includes(search.toLowerCase())) return false
      if (typeFilter !== 'all') {
        // For not-yet-enabled countries, payment_types is empty: hide them when a specific
        // type is requested (the user is looking for a real choice, not future promises).
        if (!c.payment_types?.includes(typeFilter)) return false
      }
      return true
    })
  }, [sorted, search, typeFilter])

  if (loading && !data) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-slate-400">
        Chargement des moyens de paiement…
      </div>
    )
  }

  return (
    <main className="max-w-5xl mx-auto px-4 py-12">
      <header className="text-center mb-10 space-y-2">
        <h1 className="text-3xl md:text-4xl font-bold">Modes de paiement disponibles</h1>
        <p className="text-slate-500 max-w-xl mx-auto">
          Choisissez votre pays et découvrez les moyens de paiement disponibles avec Stream-It.
        </p>
      </header>

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Rechercher un pays…"
          className="input-field w-full sm:w-72 text-sm"
        />
        <div className="flex gap-2 text-xs">
          {[
            { key: 'all',          label: 'Tout' },
            { key: 'mobile_money', label: 'Mobile Money' },
            { key: 'card',         label: 'Carte' },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setType(key)}
              className={`px-3 py-1.5 rounded-full transition-colors ${
                typeFilter === key
                  ? 'bg-indigo-500 text-white'
                  : 'bg-white/5 text-slate-300 hover:bg-white/10'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {error && !data && (
        <p className="text-amber-400 text-sm bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 mb-6">
          Impossible de charger la couverture pour le moment. Réessayez dans un instant.
        </p>
      )}

      {filtered.length === 0 ? (
        <p className="text-slate-500 text-center py-12">Aucun pays ne correspond à votre recherche.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(c => (
            <CountryCard key={c.country_code} country={c} />
          ))}
        </div>
      )}

      {data?.version && (
        <p className="mt-12 text-center text-[11px] text-slate-600">
          Couverture v{data.version}
        </p>
      )}
    </main>
  )
}

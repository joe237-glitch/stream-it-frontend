/**
 * CountryCard — used on the public /payment-coverage page.
 *
 * Two visual states driven by `country.enabled`:
 *  - Disponible    → green badge, full opacity, all operators chipped.
 *  - Bientôt disponible → amber badge, dimmed, may have empty operators.
 */
export default function CountryCard({ country }) {
  const isEnabled = country.enabled

  return (
    <div
      className={`bg-[#0f0f18] border border-white/10 rounded-2xl p-5 transition-all ${
        isEnabled ? 'hover:border-indigo-500/40' : 'opacity-70'
      }`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <span className="text-3xl leading-none" aria-hidden="true">{country.flag_emoji}</span>
          <div>
            <p className="font-bold text-base">{country.country_name}</p>
            <p className="text-xs text-slate-500">{country.currency}</p>
          </div>
        </div>
        <span
          className={`text-[10px] uppercase tracking-wide font-bold px-2 py-1 rounded-md ${
            isEnabled
              ? 'bg-emerald-500/15 text-emerald-300'
              : 'bg-amber-500/15 text-amber-300'
          }`}
        >
          {isEnabled ? 'Disponible' : 'Bientôt disponible'}
        </span>
      </div>

      {country.operators?.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {country.operators.map(op => (
            <span
              key={op.code}
              className="text-xs px-2 py-1 rounded-md bg-white/5 border border-white/5 text-slate-300"
            >
              {op.name}
            </span>
          ))}
        </div>
      ) : (
        <p className="text-xs text-slate-500 italic">
          {country.notes || 'Disponibilité en cours.'}
        </p>
      )}
    </div>
  )
}

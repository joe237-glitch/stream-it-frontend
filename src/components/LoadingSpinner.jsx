/**
 * LoadingSpinner — Composant de chargement réutilisable.
 *
 * Variants:
 *   <LoadingSpinner />                  // spinner seul, centré
 *   <LoadingSpinner label="Chargement des produits..." />
 *   <LoadingSpinner size="sm" />        // sm | md (défaut) | lg
 *   <LoadingSpinner fullPage />         // occupe toute la hauteur de page
 *
 * Skeleton inline (pour les listes):
 *   <LoadingSpinner skeleton count={5} />
 */
export default function LoadingSpinner({
  label    = '',
  size     = 'md',
  fullPage = false,
  skeleton = false,
  count    = 3,
}) {
  // ─── Skeleton cards ────────────────────────────────────────
  if (skeleton) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="aspect-square bg-slate-800 rounded-xl mb-3" />
            <div className="h-3 bg-slate-800 rounded w-3/4 mb-2" />
            <div className="h-3 bg-slate-800 rounded w-1/2" />
          </div>
        ))}
      </div>
    )
  }

  // ─── Spinner sizes ─────────────────────────────────────────
  const sizes = {
    sm: 'h-5 w-5 border-2',
    md: 'h-9 w-9 border-2',
    lg: 'h-14 w-14 border-[3px]',
  }

  const spinner = (
    <div className="flex flex-col items-center gap-3">
      <div
        className={`
          ${sizes[size] || sizes.md}
          rounded-full
          border-slate-700
          border-t-indigo-500
          animate-spin
        `}
      />
      {label && (
        <p className="text-sm text-slate-400 animate-pulse">{label}</p>
      )}
    </div>
  )

  if (fullPage) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        {spinner}
      </div>
    )
  }

  return (
    <div className="flex justify-center py-10">
      {spinner}
    </div>
  )
}

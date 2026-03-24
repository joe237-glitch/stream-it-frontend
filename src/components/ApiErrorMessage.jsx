/**
 * ApiErrorMessage — Composant d'affichage d'erreur API standardisé.
 *
 * Usage:
 *   <ApiErrorMessage error={err} />
 *   <ApiErrorMessage error={err} onRetry={() => fetchData()} />
 *   <ApiErrorMessage message="Impossible de charger les produits." onRetry={fetchProducts} />
 *
 * Tailles:
 *   <ApiErrorMessage error={err} size="sm" />   // inline compact
 *   <ApiErrorMessage error={err} size="md" />   // défaut
 *   <ApiErrorMessage error={err} size="lg" />   // plein écran
 */
import { getErrorMessage } from '../utils/errors'

export default function ApiErrorMessage({
  error    = null,
  message  = null,
  onRetry  = null,
  size     = 'md',
}) {
  const text = message || (error ? getErrorMessage(error) : 'Une erreur est survenue.')

  // ─── Compact (inline, dans un formulaire, etc.) ────────────
  if (size === 'sm') {
    return (
      <div className="flex items-start gap-2 bg-red-900/20 border border-red-500/30 rounded-lg px-3 py-2 text-sm text-red-400">
        <span className="flex-shrink-0 mt-0.5">⚠️</span>
        <span>{text}</span>
      </div>
    )
  }

  // ─── Full page ─────────────────────────────────────────────
  if (size === 'lg') {
    return (
      <div className="min-h-[50vh] flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <div className="text-5xl mb-4">😞</div>
          <h3 className="text-lg font-semibold text-white mb-2">
            Impossible de charger les données
          </h3>
          <p className="text-slate-400 text-sm mb-6">{text}</p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-xl transition-colors"
            >
              🔄 Réessayer
            </button>
          )}
        </div>
      </div>
    )
  }

  // ─── Default (md) ─────────────────────────────────────────
  return (
    <div className="rounded-xl bg-red-900/20 border border-red-500/30 p-5 text-center">
      <p className="text-red-400 font-medium mb-1">⚠️ {text}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-3 text-sm text-indigo-400 hover:text-indigo-300 underline transition-colors"
        >
          Réessayer
        </button>
      )}
    </div>
  )
}

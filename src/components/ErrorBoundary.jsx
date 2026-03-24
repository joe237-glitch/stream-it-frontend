import { Component } from 'react'

/**
 * ErrorBoundary — Composant de fallback React.
 *
 * Attrape toutes les erreurs JavaScript non gérées dans l'arbre de composants
 * et affiche un écran de récupération propre au lieu de casser silencieusement.
 *
 * Usage:
 *   <ErrorBoundary>
 *     <App />
 *   </ErrorBoundary>
 *
 *   // Avec fallback personnalisé:
 *   <ErrorBoundary fallback={<p>Quelque chose s'est mal passé</p>}>
 *     <MonComposant />
 *   </ErrorBoundary>
 */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    // Log l'erreur pour le debug
    console.error('[ErrorBoundary] Uncaught error:', error, errorInfo)
    this.setState({ errorInfo })
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null })
    // Reload la page pour repartir sur un état propre
    window.location.href = '/'
  }

  render() {
    const { hasError, error } = this.state
    const { fallback, children } = this.props

    if (!hasError) return children

    // Fallback personnalisé fourni par le parent
    if (fallback) return fallback

    // Fallback par défaut
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          {/* Icon */}
          <div className="text-6xl mb-6">⚠️</div>

          {/* Title */}
          <h1 className="text-2xl font-bold text-white mb-3">
            Une erreur inattendue est survenue
          </h1>

          {/* Message */}
          <p className="text-slate-400 mb-8 leading-relaxed">
            L'application a rencontré un problème. Vos données sont en sécurité.
            <br />
            Rechargez la page pour continuer.
          </p>

          {/* Dev: afficher l'erreur */}
          {import.meta.env.DEV && error && (
            <details className="mb-6 text-left">
              <summary className="cursor-pointer text-sm text-red-400 hover:text-red-300 mb-2">
                Détails de l'erreur (dev)
              </summary>
              <pre className="bg-red-900/20 border border-red-500/20 rounded-lg p-4 text-xs text-red-300 overflow-auto">
                {error.message}
                {'\n'}
                {error.stack}
              </pre>
            </details>
          )}

          {/* Actions */}
          <div className="flex gap-3 justify-center">
            <button
              onClick={this.handleReset}
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl transition-colors"
            >
              🔄 Recharger l'application
            </button>
          </div>
        </div>
      </div>
    )
  }
}

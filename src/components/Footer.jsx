import { Link } from 'react-router-dom'
import { useTheme } from '../context/ThemeContext'

export default function Footer() {
  const { theme } = useTheme()
  const year = new Date().getFullYear()

  return (
    <footer className="border-t border-white/5 bg-[#080810] mt-20">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">

          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <span className={`block ${theme === 'light' ? 'bg-slate-900 px-2.5 py-1 rounded-xl' : ''}`}>
                <img src="/img/logo.png" alt="Stream-It" className="h-7" />
              </span>
            </div>
            <p className="text-slate-500 text-sm leading-relaxed">
              Abonnements digitaux premium livrés instantanément. Netflix, Spotify, gaming et plus — payez via Mobile Money.
            </p>
          </div>

          {/* Navigation */}
          <div>
            <p className="text-white font-bold text-sm mb-4 uppercase tracking-widest">Navigation</p>
            <ul className="space-y-2 text-sm text-slate-500">
              <li><Link to="/" className="hover:text-indigo-400 transition-colors">Accueil</Link></li>
              <li><Link to="/login" className="hover:text-indigo-400 transition-colors">Connexion</Link></li>
              <li><Link to="/register" className="hover:text-indigo-400 transition-colors">Créer un compte</Link></li>
              <li><Link to="/account" className="hover:text-indigo-400 transition-colors">Mon compte</Link></li>
            </ul>
          </div>

          {/* About */}
          <div>
            <p className="text-white font-bold text-sm mb-4 uppercase tracking-widest">À propos</p>
            <ul className="space-y-2 text-sm text-slate-500">
              <li><Link to="/info/about" className="hover:text-indigo-400 transition-colors">Qui sommes-nous</Link></li>
              <li><Link to="/info/how-it-works" className="hover:text-indigo-400 transition-colors">Comment ça marche</Link></li>
              <li><Link to="/payment-coverage" className="hover:text-indigo-400 transition-colors">Modes de paiement disponibles</Link></li>
              <li><Link to="/info/payments" className="hover:text-indigo-400 transition-colors">Paiements acceptés</Link></li>
              <li><Link to="/info/refunds" className="hover:text-indigo-400 transition-colors">Politique de remboursement</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <p className="text-white font-bold text-sm mb-4 uppercase tracking-widest">Contact</p>
            <ul className="space-y-3 text-sm text-slate-500">
              <li className="flex items-center gap-2">
                <span>📧</span>
                <a href="mailto:support@stream-it.shop" className="hover:text-indigo-400 transition-colors">
                  support@stream-it.shop
                </a>
              </li>
              <li className="flex items-center gap-2">
                <span>💬</span>
                <a href="https://wa.me/237655521445" target="_blank" rel="noopener noreferrer" className="hover:text-indigo-400 transition-colors">
                  WhatsApp Support
                </a>
              </li>
              <li className="flex items-start gap-2">
                <span>🕐</span>
                <span>24/7 · Disponible tous les jours</span>
              </li>
            </ul>

            {/* Payment badges */}
            <div className="flex gap-2 mt-5 flex-wrap">
              {['MTN MoMo', 'Orange Money'].map(m => (
                <span key={m} className="text-xs bg-white/5 border border-white/10 text-slate-400 px-2.5 py-1 rounded-full">
                  {m}
                </span>
              ))}
            </div>

            {/* Countries */}
            <div className="flex gap-1.5 mt-4 flex-wrap">
              {['🇨🇲 Cameroun', '🇨🇮 Côte d\'Ivoire', '🇧🇫 Burkina Faso', '🇧🇯 Bénin', '🇹🇬 Togo', '🇨🇩 RD Congo', '🇨🇬 Congo', '🇬🇦 Gabon', '🇺🇬 Ouganda'].map(c => (
                <span key={c} className="text-[10px] bg-white/5 border border-white/10 text-slate-500 px-2 py-0.5 rounded-full">
                  {c}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-10 pt-6 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
          <p>© {year} Stream-It. Tous droits réservés.</p>
          <div className="flex gap-5">
            <Link to="/info/terms" className="hover:text-slate-400 transition-colors">Conditions d'utilisation</Link>
            <Link to="/info/privacy" className="hover:text-slate-400 transition-colors">Confidentialité</Link>
            <Link to="/info/legal" className="hover:text-slate-400 transition-colors">Mentions légales</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}

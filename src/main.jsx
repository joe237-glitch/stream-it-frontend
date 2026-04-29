import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ClerkProvider } from '@clerk/clerk-react'
import './i18n'
import './index.css'
import App from './App.jsx'
import { ThemeProvider } from './context/ThemeContext'

const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

/**
 * Safe wrapper : si la clé publique Clerk est absente OU manifestement un
 * placeholder de dev (préfixe `pk_test_` + chaîne reconnaissable), on monte
 * l'app SANS ClerkProvider. Ça permet :
 *  - aux preview Vercel sans secret de booter (auth désactivée, mais le reste
 *    de l'app — y compris /3d-store — reste utilisable),
 *  - aux dev locaux qui n'ont pas la dev key Clerk de tester sans crasher,
 *  - de ne PAS dépendre d'un placeholder commité comme "vraie" clé.
 *
 * Production / staging réel → la vraie clé est injectée par les Env Vars
 * Vercel et ClerkProvider monte normalement.
 */
const looksLikePlaceholder = (k) =>
  !k ||
  k === 'undefined' ||
  k.includes('placeholder') ||
  k === 'pk_test_Y2xlcmsuZGV2LWxvY2FsLXBsYWNlaG9sZGVyLmRldiQ'

const Root = () => (
  <ThemeProvider>
    <App />
  </ThemeProvider>
)

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {looksLikePlaceholder(clerkPubKey) ? (
      <Root />
    ) : (
      <ClerkProvider publishableKey={clerkPubKey}>
        <Root />
      </ClerkProvider>
    )}
  </StrictMode>,
)

// Register service worker for PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js'))
}

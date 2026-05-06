import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useSession, useUser } from '@clerk/clerk-react'
import { Auth } from '../api/client'

export default function OAuthCallback() {
  const { login } = useAuth()
  const { session, isLoaded: sessionLoaded } = useSession()
  const { user: clerkUser, isLoaded: userLoaded } = useUser()
  const navigate = useNavigate()
  const [error, setError] = useState('')
  const [processing, setProcessing] = useState(true)

  useEffect(() => {
    if (!sessionLoaded || !userLoaded) return
    if (!session || !clerkUser) {
      setError('Authentification Google echouee')
      setProcessing(false)
      return
    }

    const syncWithBackend = async () => {
      try {
        // Get Clerk session token
        const clerkToken = await session.getToken()

        // Send to our backend to create/find user
        const res = await Auth.googleOAuth({ clerk_token: clerkToken })
        const { token, user } = res.data.data

        // Login with our JWT
        login(token, user)

        // Sign out of Clerk (we use our own JWT from now on)
        try { await session.end() } catch { /* ignore */ }

        // Redirect based on role
        navigate(user.role === 'admin' ? '/admin' : '/account', { replace: true })
      } catch (err) {
        setError(err.response?.data?.message || 'Erreur lors de la connexion Google')
        setProcessing(false)
      }
    }

    syncWithBackend()
  }, [sessionLoaded, userLoaded, session, clerkUser])

  if (error) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-4">
        <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-4">
          <span className="text-3xl text-red-400">!</span>
        </div>
        <p className="text-red-400 font-semibold mb-2">Erreur</p>
        <p className="text-slate-500 text-sm mb-6">{error}</p>
        <button onClick={() => navigate('/login')} className="btn-primary py-2.5 px-6">
          Retour a la connexion
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center p-4">
      <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-6" />
      <p className="text-slate-400">Connexion avec Google en cours...</p>
    </div>
  )
}

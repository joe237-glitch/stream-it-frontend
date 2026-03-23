import { useState, createContext, useContext, useCallback } from 'react'

const ToastContext = createContext(null)

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const toast = useCallback((msg, type = 'success') => {
    const id = Date.now()
    setToasts(p => [...p, { id, msg, type }])
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 3500)
  }, [])

  const icons = { success: '✅', error: '❌', info: 'ℹ️', warn: '⚠️' }
  const colors = {
    success: 'border-emerald-500/50 bg-emerald-500/10 text-emerald-300',
    error:   'border-red-500/50 bg-red-500/10 text-red-300',
    info:    'border-indigo-500/50 bg-indigo-500/10 text-indigo-300',
    warn:    'border-yellow-500/50 bg-yellow-500/10 text-yellow-300',
  }

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="fixed top-5 right-5 z-[9999] flex flex-col gap-2 pointer-events-none">
        {toasts.map(t => (
          <div key={t.id} className={`flex items-center gap-3 px-4 py-3 rounded-xl border backdrop-blur-md text-sm font-semibold shadow-2xl ${colors[t.type]}`}>
            <span>{icons[t.type]}</span>
            <span>{t.msg}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export const useToast = () => useContext(ToastContext)

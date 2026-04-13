import { useState, useRef, useEffect } from 'react'
import api from '../api/client'

const WELCOME = "Bonjour ! Je suis l'assistant Stream-It 👋\nComment puis-je vous aider ?"

export default function ChatBot() {
  const [open, setOpen]       = useState(false)
  const [messages, setMessages] = useState([{ role: 'assistant', content: WELCOME }])
  const [input, setInput]     = useState('')
  const [loading, setLoading] = useState(false)
  const [unread, setUnread]   = useState(0)
  const bottomRef             = useRef(null)
  const inputRef              = useRef(null)

  // Scroll en bas à chaque nouveau message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, open])

  // Focus l'input quand on ouvre
  useEffect(() => {
    if (open) {
      setUnread(0)
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [open])

  const send = async () => {
    const text = input.trim()
    if (!text || loading) return

    const newMessages = [...messages, { role: 'user', content: text }]
    setMessages(newMessages)
    setInput('')
    setLoading(true)

    try {
      const res = await api.post('/chat', { messages: newMessages })
      const reply = res.data.reply || "Désolé, je n'ai pas pu répondre."
      setMessages(prev => [...prev, { role: 'assistant', content: reply }])
      if (!open) setUnread(n => n + 1)
    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: "Une erreur s'est produite. Contactez support@stream-it.shop",
      }])
    } finally {
      setLoading(false)
    }
  }

  const onKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() }
  }

  return (
    <>
      {/* Bulle flottante */}
      <button
        onClick={() => setOpen(o => !o)}
        className="fixed bottom-5 right-5 z-50 w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-transform hover:scale-110 active:scale-95"
        style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
        aria-label="Ouvrir l'assistant"
      >
        {open ? (
          <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2v10z" />
          </svg>
        )}
        {!open && unread > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
            {unread}
          </span>
        )}
      </button>

      {/* Fenêtre de chat */}
      {open && (
        <div
          className="fixed bottom-24 right-5 z-50 flex flex-col rounded-2xl shadow-2xl overflow-hidden"
          style={{
            width: 'min(360px, calc(100vw - 24px))',
            height: 'min(500px, calc(100vh - 140px))',
            background: 'var(--bg-surface)',
            border: '1px solid var(--border)',
          }}
        >
          {/* Header */}
          <div
            className="flex items-center gap-3 px-4 py-3 shrink-0"
            style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
          >
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-lg">🤖</div>
            <div>
              <p className="text-white font-semibold text-sm leading-tight">Assistant Stream-It</p>
              <p className="text-white/70 text-xs">Répond en quelques secondes</p>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="ml-auto text-white/70 hover:text-white transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className="max-w-[80%] px-3 py-2 rounded-2xl text-sm whitespace-pre-wrap leading-relaxed"
                  style={msg.role === 'user' ? {
                    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                    color: 'white',
                    borderBottomRightRadius: '4px',
                  } : {
                    background: 'var(--bg-surface2)',
                    color: 'var(--text-1)',
                    border: '1px solid var(--border)',
                    borderBottomLeftRadius: '4px',
                  }}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div
                  className="px-4 py-3 rounded-2xl"
                  style={{ background: 'var(--bg-surface2)', border: '1px solid var(--border)', borderBottomLeftRadius: '4px' }}
                >
                  <span className="flex gap-1">
                    {[0, 1, 2].map(n => (
                      <span key={n} className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce"
                        style={{ animationDelay: `${n * 0.15}s` }} />
                    ))}
                  </span>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div
            className="flex items-end gap-2 px-3 py-3 shrink-0"
            style={{ borderTop: '1px solid var(--border)', background: 'var(--bg-surface)' }}
          >
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={onKey}
              placeholder="Posez votre question…"
              rows={1}
              disabled={loading}
              className="flex-1 resize-none rounded-xl px-3 py-2 text-sm outline-none transition-all"
              style={{
                background: 'var(--bg-surface2)',
                border: '1px solid var(--border)',
                color: 'var(--text-1)',
                maxHeight: '80px',
                lineHeight: '1.4',
              }}
            />
            <button
              onClick={send}
              disabled={loading || !input.trim()}
              className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-all hover:scale-105 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-white rotate-90" fill="currentColor" viewBox="0 0 24 24">
                <path d="M2 21l21-9L2 3v7l15 2-15 2z" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </>
  )
}

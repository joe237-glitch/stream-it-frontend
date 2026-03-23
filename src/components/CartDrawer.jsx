import { useState, useEffect } from 'react'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import { useToast } from './Toast'
import { Wallet } from '../api/client'
import PaymentModal from './PaymentModal'

export default function CartDrawer() {
  const { items, removeItem, updateQty, clearCart, cartTotal, isOpen, setIsOpen } = useCart()
  const { isLoggedIn } = useAuth()
  const toast = useToast()
  const [balance, setBalance] = useState(null)
  const [showPayment, setShowPayment] = useState(false)
  const [walletLoading, setWalletLoading] = useState(false)

  useEffect(() => {
    if (isOpen && isLoggedIn) {
      Wallet.getBalance().then(r => setBalance(r.data.data?.balance ?? 0)).catch(() => {})
    }
  }, [isOpen, isLoggedIn])

  const handleWalletPay = async () => {
    setWalletLoading(true)
    try {
      const products = items.map(i => ({ productId: i.product.id, quantity: i.quantity }))
      await Wallet.pay({ products })
      toast('Paiement effectué ! 🎉', 'success')
      clearCart()
      setIsOpen(false)
    } catch (err) {
      toast(err.response?.data?.message || 'Erreur de paiement', 'error')
    } finally {
      setWalletLoading(false)
    }
  }

  if (!isOpen) return null

  const canWallet = isLoggedIn && balance !== null && balance >= cartTotal

  return (
    <>
      <div className="fixed inset-0 z-[90] bg-black/60 backdrop-blur-sm" onClick={() => setIsOpen(false)} />

      <div className="fixed right-0 top-0 h-full z-[95] w-full max-w-sm bg-[#0f0f18] border-l border-white/10 flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
          <h2 className="font-extrabold text-lg">🛒 Panier {items.length > 0 && `(${items.reduce((s,i)=>s+i.quantity,0)})`}</h2>
          <div className="flex items-center gap-3">
            {items.length > 0 && (
              <button onClick={clearCart} className="text-xs text-slate-500 hover:text-red-400 transition-colors">Vider</button>
            )}
            <button onClick={() => setIsOpen(false)} className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white">✕</button>
          </div>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {items.length === 0 ? (
            <div className="text-center py-16 text-slate-600">
              <p className="text-5xl mb-3">🛒</p>
              <p className="font-semibold">Votre panier est vide</p>
              <p className="text-xs mt-2">Ajoutez des produits depuis la boutique</p>
            </div>
          ) : items.map(({ product, quantity }) => (
            <div key={product.id} className="flex items-center gap-3 bg-white/5 rounded-2xl p-3">
              <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 bg-gradient-to-br from-indigo-900/50 to-violet-900/50">
                {product.image_url
                  ? <img src={product.image_url} className="w-full h-full object-cover" alt="" />
                  : <div className="w-full h-full flex items-center justify-center text-xl">📦</div>
                }
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold truncate">{product.name.split(' – ')[0]}</p>
                <p className="text-xs text-slate-500 truncate">{product.name.split(' – ').slice(1).join(' – ')}</p>
                <p className="text-xs text-indigo-400 font-semibold mt-0.5">
                  {Math.round(product.price * 655 / 100).toLocaleString()} XAF × {quantity}
                </p>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <button onClick={() => updateQty(product.id, quantity - 1)} className="w-6 h-6 rounded-lg bg-white/10 hover:bg-white/20 text-xs flex items-center justify-center font-black">−</button>
                <span className="text-sm font-bold w-5 text-center">{quantity}</span>
                <button onClick={() => updateQty(product.id, quantity + 1)} className="w-6 h-6 rounded-lg bg-white/10 hover:bg-white/20 text-xs flex items-center justify-center font-black">+</button>
                <button onClick={() => removeItem(product.id)} className="w-6 h-6 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs flex items-center justify-center ml-1">✕</button>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t border-white/5 p-4 space-y-3">
            <div className="flex items-center justify-between font-extrabold text-lg">
              <span>Total</span>
              <span>{cartTotal.toLocaleString()} XAF</span>
            </div>

            {isLoggedIn && balance !== null && (
              <p className="text-xs text-right">
                💰 Solde : <span className={balance >= cartTotal ? 'text-emerald-400 font-bold' : 'text-red-400 font-bold'}>{balance.toLocaleString()} XAF</span>
              </p>
            )}

            <button onClick={() => setShowPayment(true)} className="w-full btn-primary py-3 text-sm">
              📱 Payer par Mobile Money
            </button>

            {isLoggedIn && (
              <button
                onClick={handleWalletPay}
                disabled={!canWallet || walletLoading}
                className={`w-full py-3 rounded-xl text-sm font-bold transition-all ${canWallet ? 'bg-emerald-600 hover:bg-emerald-500 text-white' : 'bg-white/5 text-slate-600 cursor-not-allowed'}`}
              >
                {walletLoading ? 'Traitement...' : canWallet ? '💰 Payer avec mon solde' : '💰 Solde insuffisant'}
              </button>
            )}
          </div>
        )}
      </div>

      {showPayment && (
        <PaymentModal
          cart={items}
          onClose={() => setShowPayment(false)}
          onSuccess={() => { clearCart(); setIsOpen(false) }}
        />
      )}
    </>
  )
}

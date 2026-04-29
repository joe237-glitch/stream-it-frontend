import { useStore3DSession } from '../hooks/useStore3DSession'
import { useCart } from '../../../context/CartContext'
import { useToast } from '../../../components/Toast'

/**
 * ProductDrawer — panneau latéral droit qui s'ouvre quand un ProductCard3D est
 * cliqué. Slide-in 240 ms. Affiche détails + CTA "Ajouter au panier".
 *
 * Utilise CartContext (addItem) et Toast existants — aucun backend touché.
 */
export default function ProductDrawer() {
  const product = useStore3DSession((s) => s.activeProduct)
  const close = useStore3DSession((s) => s.closeProduct)
  const { addItem, setIsOpen: setCartOpen } = useCart()
  const toast = useToast()
  const isOpen = !!product

  const handleAdd = () => {
    if (!product) return
    // CartContext attend { product: { id, name, price, ... } }
    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      currency: product.currency,
      _source: 'store3d',
    })
    toast(`${product.name} ajouté au panier`, 'success')
    close()
    setCartOpen(true)
  }

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={close}
        aria-hidden="true"
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 60,
          background: isOpen
            ? 'rgba(2, 2, 8, 0.55)'
            : 'rgba(2, 2, 8, 0)',
          backdropFilter: isOpen ? 'blur(2px)' : 'none',
          pointerEvents: isOpen ? 'auto' : 'none',
          transition: 'background 220ms ease, backdrop-filter 220ms ease',
        }}
      />

      {/* Drawer */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="store3d-drawer-title"
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          height: '100vh',
          width: 'min(420px, 100vw)',
          zIndex: 61,
          background:
            'linear-gradient(180deg, rgba(20,16,42,0.96) 0%, rgba(8,8,18,0.96) 100%)',
          borderLeft: '1px solid rgba(124, 58, 237, 0.35)',
          boxShadow: '-30px 0 60px -20px rgba(124, 58, 237, 0.35)',
          color: 'white',
          padding: 24,
          transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 240ms cubic-bezier(0.22, 1, 0.36, 1)',
          display: 'flex',
          flexDirection: 'column',
          gap: 18,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span
            style={{
              fontSize: 11,
              letterSpacing: 1.5,
              textTransform: 'uppercase',
              color: '#9aa0c0',
              fontWeight: 600,
            }}
          >
            {product?.category}
          </span>
          <button
            type="button"
            onClick={close}
            aria-label="Fermer"
            style={{
              border: 'none',
              background: 'transparent',
              color: '#9aa0c0',
              fontSize: 22,
              cursor: 'pointer',
              padding: 4,
            }}
          >
            ✕
          </button>
        </div>

        <h2
          id="store3d-drawer-title"
          style={{
            fontSize: 24,
            fontWeight: 700,
            margin: 0,
            lineHeight: 1.2,
          }}
        >
          {product?.name}
        </h2>

        <div
          style={{
            display: 'inline-flex',
            alignSelf: 'flex-start',
            padding: '4px 10px',
            borderRadius: 999,
            background: `${product?.accent || '#7c3aed'}22`,
            border: `1px solid ${product?.accent || '#7c3aed'}66`,
            color: product?.accent || '#a78bfa',
            fontSize: 12,
            fontWeight: 600,
          }}
        >
          {product?.duration_label}
        </div>

        <p style={{ color: '#cdd0e4', fontSize: 14, lineHeight: 1.55, margin: 0 }}>
          {product?.description}
        </p>

        <div
          style={{
            marginTop: 'auto',
            paddingTop: 18,
            borderTop: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 14 }}>
            <span style={{ color: '#9aa0c0', fontSize: 13 }}>Prix</span>
            <span style={{ fontSize: 26, fontWeight: 700 }}>
              {product ? new Intl.NumberFormat('fr-FR').format(product.price) : '—'}{' '}
              <span style={{ fontSize: 14, color: '#9aa0c0' }}>{product?.currency}</span>
            </span>
          </div>
          <button
            type="button"
            onClick={handleAdd}
            disabled={!product}
            style={{
              width: '100%',
              padding: '12px 18px',
              borderRadius: 12,
              border: 'none',
              background:
                'linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%)',
              color: 'white',
              fontWeight: 700,
              fontSize: 14,
              cursor: product ? 'pointer' : 'not-allowed',
              boxShadow: '0 12px 30px -10px rgba(124, 58, 237, 0.7)',
            }}
          >
            Ajouter au panier
          </button>
          <p style={{ marginTop: 10, fontSize: 11, color: '#6b6f8a', textAlign: 'center' }}>
            Prototype interne · paiement non actif sur ce périmètre
          </p>
        </div>
      </aside>
    </>
  )
}

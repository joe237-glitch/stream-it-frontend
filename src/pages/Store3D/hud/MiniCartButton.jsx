import { useCart } from '../../../context/CartContext'

export default function MiniCartButton() {
  const { cartCount, setIsOpen } = useCart()

  return (
    <button
      type="button"
      className="store3d-pill store3d-pill-strong"
      onClick={() => setIsOpen(true)}
      aria-label="Ouvrir le panier"
      style={{ position: 'relative', minWidth: 44 }}
    >
      <span style={{ fontSize: 16 }}>🛒</span>
      {cartCount > 0 && (
        <span
          style={{
            position: 'absolute',
            top: -6,
            right: -6,
            minWidth: 18,
            height: 18,
            padding: '0 5px',
            borderRadius: 999,
            background: '#7c3aed',
            color: 'white',
            fontSize: 10,
            fontWeight: 700,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 14px -2px #7c3aed',
          }}
        >
          {cartCount}
        </span>
      )}
    </button>
  )
}

import { STORE3D_CATEGORIES, STORE3D_PRODUCTS } from '../data/mockProducts'
import { useCart } from '../../../context/CartContext'
import { useToast } from '../../../components/Toast'

/**
 * Fallback2D — rendu 2D pur quand la 3D n'est pas viable :
 *   - DeviceProbe → 'fallback'
 *   - prefers-reduced-motion
 *   - PM force le mode 2D via Mode2DToggle
 *   - WebGL non disponible
 *
 * Mise en page : grille de cartes statiques par catégorie. Pas de Three.js
 * chargé dans cette branche, les chunks 3D ne sont pas requis quand l'utilisateur
 * arrive ici directement (sauf si il a déjà été en 3D et toggle vers 2D — auquel
 * cas le chunk 3D est déjà téléchargé mais simplement non monté).
 *
 * Le rendu reprend l'esthétique violet/cyan du moodboard pour rester cohérent
 * (gradient haut + cartes glassmorphism CSS).
 */
export default function Fallback2D({ reason }) {
  const { addItem, setIsOpen } = useCart()
  const toast = useToast()

  const handleAdd = (p) => {
    addItem({ id: p.id, name: p.name, price: p.price, currency: p.currency, _source: 'store3d_fb' })
    toast(`${p.name} ajouté au panier`, 'success')
    setIsOpen(true)
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background:
          'radial-gradient(ellipse at top, rgba(124,58,237,0.18) 0%, rgba(6,6,13,1) 60%)',
        color: 'white',
        padding: '40px 24px 80px',
      }}
    >
      <header style={{ maxWidth: 1100, margin: '0 auto 32px' }}>
        <a
          href="/"
          style={{
            display: 'inline-block',
            marginBottom: 18,
            fontSize: 13,
            color: '#9aa0c0',
            textDecoration: 'none',
          }}
        >
          ← Site classique
        </a>
        <h1
          style={{
            fontSize: 36,
            fontWeight: 800,
            margin: '0 0 6px',
            background: 'linear-gradient(120deg, #f4f0ff 0%, #a78bfa 60%, #22d3ee 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          Boutique Stream-It
        </h1>
        <p style={{ color: '#9aa0c0', fontSize: 14, margin: 0, maxWidth: 620 }}>
          Mode immersif désactivé pour cet appareil
          {reason ? ` (${reason})` : ''}. Vous accédez à la version classique de
          la boutique avec le même catalogue.
        </p>
      </header>

      <main style={{ maxWidth: 1100, margin: '0 auto' }}>
        {STORE3D_CATEGORIES.map((cat) => {
          const products = STORE3D_PRODUCTS.filter((p) => p.category === cat.key)
          return (
            <section key={cat.key} style={{ marginBottom: 40 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 14 }}>
                <span
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: 999,
                    background: cat.accent,
                    boxShadow: `0 0 12px ${cat.accent}`,
                  }}
                />
                <h2 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>{cat.label}</h2>
                <span style={{ color: '#6b6f8a', fontSize: 13 }}>{cat.description}</span>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
                  gap: 16,
                }}
              >
                {products.map((p) => (
                  <article
                    key={p.id}
                    style={{
                      padding: 18,
                      borderRadius: 16,
                      background:
                        'linear-gradient(160deg, rgba(20,16,42,0.85) 0%, rgba(8,8,18,0.85) 100%)',
                      border: `1px solid ${p.accent}33`,
                      boxShadow: `0 14px 40px -20px ${p.accent}55`,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 10,
                    }}
                  >
                    <span
                      style={{
                        alignSelf: 'flex-start',
                        padding: '3px 10px',
                        borderRadius: 999,
                        background: `${p.accent}22`,
                        color: p.accent,
                        fontSize: 11,
                        fontWeight: 600,
                      }}
                    >
                      {p.duration_label}
                    </span>
                    <h3 style={{ fontSize: 17, fontWeight: 700, margin: 0 }}>{p.name}</h3>
                    <p style={{ fontSize: 13, color: '#cdd0e4', margin: 0, flex: 1 }}>
                      {p.description}
                    </p>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                      <span style={{ fontSize: 22, fontWeight: 700 }}>
                        {new Intl.NumberFormat('fr-FR').format(p.price)}{' '}
                        <span style={{ fontSize: 12, color: '#9aa0c0' }}>{p.currency}</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => handleAdd(p)}
                        style={{
                          padding: '8px 14px',
                          borderRadius: 10,
                          border: 'none',
                          background:
                            'linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%)',
                          color: 'white',
                          fontWeight: 700,
                          fontSize: 13,
                          cursor: 'pointer',
                        }}
                      >
                        Ajouter
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          )
        })}
      </main>
    </div>
  )
}

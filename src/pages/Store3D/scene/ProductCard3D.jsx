import { useState } from 'react'
import { Html, Float } from '@react-three/drei'
import { useStore3DSession } from '../hooks/useStore3DSession'

/**
 * ProductCard3D — carte produit flottante.
 * - mesh = panneau glass (BoxGeometry fine + matériau semi-transparent)
 * - label HTML (drei <Html>) = nom + prix (lisibilité texte garantie quelle
 *   que soit la résolution écran)
 * - clic → ouvre le drawer 2D côté HUD (gérée par useStore3DSession)
 */
export default function ProductCard3D({ product, position, accent = '#7c3aed' }) {
  const [hovered, setHovered] = useState(false)
  const selectProduct = useStore3DSession(s => s.selectProduct)

  return (
    <Float speed={1.2} rotationIntensity={0.15} floatIntensity={0.25}>
      <group
        position={position}
        onPointerOver={(e) => { e.stopPropagation(); setHovered(true); document.body.style.cursor = 'pointer' }}
        onPointerOut={() => { setHovered(false); document.body.style.cursor = 'default' }}
        onClick={(e) => { e.stopPropagation(); selectProduct(product) }}
        scale={hovered ? 1.07 : 1}
      >
        {/* Panneau verre */}
        <mesh>
          <boxGeometry args={[1.4, 1.9, 0.06]} />
          <meshPhysicalMaterial
            color={hovered ? '#1f1f3a' : '#13132a'}
            metalness={0.3}
            roughness={0.2}
            transparent
            opacity={0.92}
            emissive={accent}
            emissiveIntensity={hovered ? 0.55 : 0.22}
          />
        </mesh>

        {/* Glow accent en dessous */}
        <mesh position={[0, -1.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.55, 0.85, 32]} />
          <meshBasicMaterial color={accent} transparent opacity={hovered ? 0.65 : 0.30} />
        </mesh>

        {/* Label produit en HTML (drei) */}
        <Html
          transform
          distanceFactor={1.5}
          position={[0, 0, 0.04]}
          style={{
            width: 220,
            pointerEvents: 'none',
            color: 'white',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            textAlign: 'center',
            userSelect: 'none',
          }}
        >
          <div style={{ padding: '0.5rem' }}>
            <div style={{ fontSize: 14, fontWeight: 700, lineHeight: 1.2, marginBottom: 8 }}>
              {product.name}
            </div>
            <div
              style={{
                fontSize: 16,
                fontWeight: 800,
                color: accent,
                marginTop: 6,
              }}
            >
              {product.price.toLocaleString('fr-FR')} {product.currency}
            </div>
            <div
              style={{
                fontSize: 10,
                color: '#94a3b8',
                marginTop: 14,
                opacity: hovered ? 1 : 0.6,
                transition: 'opacity 0.2s',
              }}
            >
              Cliquez pour ouvrir
            </div>
          </div>
        </Html>
      </group>
    </Float>
  )
}

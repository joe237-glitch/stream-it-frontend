import { useState } from 'react'
import { Float, Text } from '@react-three/drei'
import ProductCard3D from './ProductCard3D'
import { MOCK_PRODUCTS_BY_CATEGORY } from '../data/mockProducts'
import { useStore3DSession } from '../hooks/useStore3DSession'

/**
 * CategoryStand — pilier holographique + label catégorie + produits autour.
 *
 * Layout : 2 à 4 cartes produits disposées en arc de cercle devant le pilier.
 * Le pilier sert d'ancre visuelle et de cible caméra (CameraRig se rapproche
 * quand la catégorie devient active).
 */
export default function CategoryStand({ code, name, position, accent }) {
  const [hovered, setHovered] = useState(false)
  const setActiveCategory = useStore3DSession(s => s.setActiveCategory)
  const activeCategory    = useStore3DSession(s => s.activeCategory)
  const isActive = activeCategory === code

  const products = MOCK_PRODUCTS_BY_CATEGORY[code] || []

  return (
    <group position={position}>
      {/* Pilier holographique */}
      <mesh
        position={[0, 0.9, 0]}
        onPointerOver={(e) => { e.stopPropagation(); setHovered(true); document.body.style.cursor = 'pointer' }}
        onPointerOut={() => { setHovered(false); document.body.style.cursor = 'default' }}
        onClick={(e) => { e.stopPropagation(); setActiveCategory(isActive ? null : code) }}
      >
        <cylinderGeometry args={[0.45, 0.55, 1.8, 24, 1, true]} />
        <meshPhysicalMaterial
          color={accent}
          metalness={0.4}
          roughness={0.15}
          transparent
          opacity={hovered || isActive ? 0.55 : 0.3}
          emissive={accent}
          emissiveIntensity={hovered || isActive ? 1.2 : 0.6}
          side={2}
        />
      </mesh>

      {/* Anneau de base (glow au sol) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <ringGeometry args={[0.55, 0.85, 32]} />
        <meshBasicMaterial color={accent} transparent opacity={isActive ? 0.7 : 0.35} />
      </mesh>

      {/* Label flottant */}
      <Float speed={1.5} rotationIntensity={0} floatIntensity={0.25}>
        <Text
          position={[0, 2.2, 0]}
          fontSize={0.32}
          color="#ffffff"
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.008}
          outlineColor={accent}
        >
          {name}
        </Text>
        <Text
          position={[0, 1.85, 0]}
          fontSize={0.11}
          color={accent}
          anchorX="center"
          anchorY="middle"
        >
          {products.length} PRODUITS · CLIQUEZ POUR EXPLORER
        </Text>
      </Float>

      {/* Cartes produit en arc devant le pilier (visibles seulement si active OU hover) */}
      {(isActive || hovered) && products.map((product, i) => {
        const total = products.length
        // Arc de cercle frontal : -60° à +60°
        const a = (-Math.PI / 3) + (i / Math.max(total - 1, 1)) * (2 * Math.PI / 3)
        const r = 1.8
        const x = Math.sin(a) * r
        const z = Math.cos(a) * r * 0.8
        return (
          <ProductCard3D
            key={product.id}
            product={product}
            position={[x, 1.4, z]}
            accent={accent}
          />
        )
      })}
    </group>
  )
}

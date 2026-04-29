import { useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { Edges, Float, Text } from '@react-three/drei'
import * as THREE from 'three'

/**
 * ProductCard3D — carte produit signature Stream-It (référence : moodboard P6.V2/V4).
 *
 * Implémentation premium :
 * - Géométrie : box arrondie 1.4 × 2.0 × 0.08 (ratio carte fidélité)
 * - Matériau : meshPhysicalMaterial avec transmission 0.6 (verre semi-translucide),
 *   thickness 0.25, roughness 0.18, clearcoat 1.0, ior 1.42, attenuationColor
 *   par produit (couleur emissive de l'accent).
 * - Bordure : drei <Edges /> couleur accent pour l'effet "carte holographique"
 * - Float drei : oscillation légère pour vie sans rotation continue
 * - Hover : intensité emissive × 2.4, scale × 1.04, easeOutCubic 220 ms
 * - Click : déclenche openProduct dans le store session (HUD ouvre le drawer)
 *
 * Sur tier 'light' : on dégrade en meshStandardMaterial sans transmission
 * (transmission est ~5x plus coûteux). Le rendu reste premium grâce aux Edges
 * et à la lumière scène.
 */

const W = 1.4
const H = 2.0
const D = 0.08

export default function ProductCard3D({
  product,
  position = [0, 1.4, 0],
  onClick,
  tier = 'full',
}) {
  const meshRef = useRef()
  const [hovered, setHovered] = useState(false)
  const targetEmissive = hovered ? 2.4 : 0.85
  const targetScale = hovered ? 1.04 : 1.0
  const accentColor = new THREE.Color(product.accent || '#7c3aed')

  useFrame((_, delta) => {
    if (!meshRef.current) return
    const m = meshRef.current
    const k = Math.min(1, delta * 8) // easing
    m.scale.x += (targetScale - m.scale.x) * k
    m.scale.y += (targetScale - m.scale.y) * k
    m.scale.z += (targetScale - m.scale.z) * k
    if (m.material && m.material.emissiveIntensity != null) {
      m.material.emissiveIntensity +=
        (targetEmissive - m.material.emissiveIntensity) * k
    }
  })

  const handleClick = (e) => {
    e.stopPropagation()
    onClick && onClick(product)
  }

  const handleEnter = (e) => {
    e.stopPropagation()
    setHovered(true)
    document.body.style.cursor = 'pointer'
  }

  const handleLeave = (e) => {
    e.stopPropagation()
    setHovered(false)
    document.body.style.cursor = 'default'
  }

  // Tier light : standard material light + emissive accent
  const material =
    tier === 'light' ? (
      <meshStandardMaterial
        color="#1a1730"
        metalness={0.6}
        roughness={0.35}
        emissive={accentColor}
        emissiveIntensity={0.85}
      />
    ) : (
      <meshPhysicalMaterial
        color="#0e0c1c"
        metalness={0.35}
        roughness={0.2}
        transmission={0.55}
        thickness={0.25}
        ior={1.42}
        clearcoat={1}
        clearcoatRoughness={0.08}
        attenuationColor={accentColor}
        attenuationDistance={2.5}
        emissive={accentColor}
        emissiveIntensity={0.85}
      />
    )

  const card = (
    <group position={position}>
      <mesh
        ref={meshRef}
        onClick={handleClick}
        onPointerOver={handleEnter}
        onPointerOut={handleLeave}
        castShadow
      >
        <boxGeometry args={[W, H, D]} />
        {material}
        <Edges threshold={15} color={accentColor} scale={1.001} />
      </mesh>

      {/* Title */}
      <Text
        position={[0, 0.35, D / 2 + 0.005]}
        fontSize={0.11}
        color="#f4f0ff"
        anchorX="center"
        anchorY="middle"
        maxWidth={W * 0.85}
        textAlign="center"
        outlineWidth={0}
      >
        {product.name}
      </Text>

      {/* Duration badge */}
      <Text
        position={[0, 0.14, D / 2 + 0.005]}
        fontSize={0.07}
        color={'#' + accentColor.getHexString()}
        anchorX="center"
        anchorY="middle"
      >
        {product.duration_label}
      </Text>

      {/* Price */}
      <Text
        position={[0, -0.55, D / 2 + 0.005]}
        fontSize={0.16}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
        outlineWidth={0}
      >
        {formatPrice(product.price)} {product.currency}
      </Text>

      {/* Subtle CTA hint */}
      <Text
        position={[0, -0.85, D / 2 + 0.005]}
        fontSize={0.055}
        color="#9aa0c0"
        anchorX="center"
        anchorY="middle"
      >
        Cliquer pour voir
      </Text>
    </group>
  )

  if (tier === 'light') return card

  return (
    <Float speed={1.2} rotationIntensity={0.18} floatIntensity={0.22}>
      {card}
    </Float>
  )
}

function formatPrice(n) {
  return new Intl.NumberFormat('fr-FR').format(Math.round(n))
}

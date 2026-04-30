import { useMemo, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { Float, MeshTransmissionMaterial, RoundedBox, Text } from '@react-three/drei'
import * as THREE from 'three'

/**
 * ProductCard3D V2 — premium glass card avec MeshTransmissionMaterial drei.
 *
 * Améliorations vs V0 :
 * - `MeshTransmissionMaterial` (drei) → vraie transmission optique avec
 *   dispersion chromatique subtile, IOR 1.45, anisotropy.
 * - `<RoundedBox>` drei avec radius 0.06 + smoothness 6 = bords arrondis
 *   premium (vs box dur du v0). RoundedBox EST un mesh, on lui attache
 *   directement les handlers + le ref.
 * - Edge accent via 4 plans fins violets/cyan placés sur le pourtour
 *   (frame "néon discret") — plus stable que <Edges> sur RoundedBox
 * - Edge tracer animé : un point lumineux parcourt le périmètre en boucle
 * - Glyphe catégorique abstrait (▶/⌘/◆) extrudé en arrière-plan
 * - Hover : tilt vers la caméra + scale 1.06 + boost emissive + uplift Y 0.08
 *
 * Tier 'light' : `meshStandardMaterial` premium roughness 0.18 + même frame
 * néon. Économe RT pass.
 */

const W = 1.5
const H = 2.1
const D = 0.1

const CATEGORY_GLYPHS = {
  streaming: '▶',
  iptv: '⌘',
  gaming: '◆',
}

export default function ProductCard3D({
  product,
  position = [0, 1.4, 0],
  onClick,
  tier = 'full',
}) {
  const cardRef = useRef()
  const groupRef = useRef()
  const tracerRef = useRef()
  const [hovered, setHovered] = useState(false)
  const accentColor = useMemo(
    () => new THREE.Color(product.accent || '#7c3aed'),
    [product.accent],
  )
  const lightAccent = useMemo(
    () => accentColor.clone().lerp(new THREE.Color('#ffffff'), 0.5),
    [accentColor],
  )

  const targetEmissive = hovered ? 1.6 : 0.55
  const targetScale = hovered ? 1.06 : 1.0
  const targetTilt = hovered ? 0.18 : 0
  const targetLift = hovered ? 0.08 : 0

  useFrame((state, delta) => {
    const k = Math.min(1, delta * 9)
    const c = cardRef.current
    const g = groupRef.current
    if (!c || !g) return

    c.scale.x += (targetScale - c.scale.x) * k
    c.scale.y += (targetScale - c.scale.y) * k
    c.scale.z += (targetScale - c.scale.z) * k
    g.rotation.x += (-targetTilt - g.rotation.x) * k
    g.position.y += (position[1] + targetLift - g.position.y) * k

    // Boost emissive du material si meshStandardMaterial (light tier)
    if (c.material && c.material.emissiveIntensity != null) {
      c.material.emissiveIntensity += (targetEmissive - c.material.emissiveIntensity) * k
    }

    // Edge tracer
    if (tracerRef.current) {
      const t = state.clock.elapsedTime * 0.5 + (product.id?.length || 0) * 0.2
      const u = (t % 1)
      const halfW = W * 0.5
      const halfH = H * 0.5
      const perim = 2 * (W + H)
      const d = u * perim
      let x, y
      if (d < W) { x = -halfW + d; y = halfH }
      else if (d < W + H) { x = halfW; y = halfH - (d - W) }
      else if (d < 2 * W + H) { x = halfW - (d - W - H); y = -halfH }
      else { x = -halfW; y = -halfH + (d - 2 * W - H) }
      tracerRef.current.position.set(x, y, D / 2 + 0.012)
      tracerRef.current.material.opacity = hovered ? 1 : 0.7
    }
  })

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
  const handleClick = (e) => {
    e.stopPropagation()
    onClick && onClick(product)
  }

  const useTransmission = tier === 'full'
  const glyph = CATEGORY_GLYPHS[product.category] || '◆'

  // Frame néon : 4 plans fins le long des bords pour un look "carte holographique"
  const frameOpacity = hovered ? 1 : 0.55

  const cardBody = (
    <group ref={groupRef} position={position}>
      <RoundedBox
        ref={cardRef}
        args={[W, H, D]}
        radius={0.06}
        smoothness={6}
        onClick={handleClick}
        onPointerOver={handleEnter}
        onPointerOut={handleLeave}
        castShadow
      >
        {useTransmission ? (
          <MeshTransmissionMaterial
            backside={false}
            samples={6}
            resolution={256}
            transmission={1}
            roughness={0.12}
            thickness={0.5}
            ior={1.45}
            chromaticAberration={0.06}
            anisotropy={0.3}
            distortion={0.1}
            distortionScale={0.4}
            temporalDistortion={0.05}
            clearcoat={1}
            attenuationColor={accentColor}
            attenuationDistance={1.6}
            color="#0d0c1c"
          />
        ) : (
          <meshStandardMaterial
            color="#0e0c1c"
            metalness={0.55}
            roughness={0.18}
            emissive={accentColor}
            emissiveIntensity={0.55}
          />
        )}
      </RoundedBox>

      {/* Frame néon (4 plans fins) — bord top */}
      <mesh position={[0, H / 2 - 0.005, D / 2 + 0.001]}>
        <planeGeometry args={[W * 0.94, 0.014]} />
        <meshBasicMaterial color={lightAccent} transparent opacity={frameOpacity} toneMapped={false} />
      </mesh>
      {/* bord bottom */}
      <mesh position={[0, -H / 2 + 0.005, D / 2 + 0.001]}>
        <planeGeometry args={[W * 0.94, 0.014]} />
        <meshBasicMaterial color={lightAccent} transparent opacity={frameOpacity} toneMapped={false} />
      </mesh>
      {/* bord left */}
      <mesh position={[-W / 2 + 0.005, 0, D / 2 + 0.001]}>
        <planeGeometry args={[0.014, H * 0.94]} />
        <meshBasicMaterial color={lightAccent} transparent opacity={frameOpacity} toneMapped={false} />
      </mesh>
      {/* bord right */}
      <mesh position={[W / 2 - 0.005, 0, D / 2 + 0.001]}>
        <planeGeometry args={[0.014, H * 0.94]} />
        <meshBasicMaterial color={lightAccent} transparent opacity={frameOpacity} toneMapped={false} />
      </mesh>

      {/* Edge tracer : point lumineux qui circule */}
      <mesh ref={tracerRef}>
        <sphereGeometry args={[0.025, 12, 12]} />
        <meshBasicMaterial color={lightAccent} transparent opacity={0.85} toneMapped={false} />
      </mesh>

      {/* Glyph catégorique grand format en arrière-plan */}
      <Text
        position={[0, 0.55, D / 2 + 0.005]}
        fontSize={0.5}
        color={accentColor}
        anchorX="center"
        anchorY="middle"
        fillOpacity={0.55}
        outlineWidth={0}
      >
        {glyph}
      </Text>

      {/* Title */}
      <Text
        position={[0, 0.05, D / 2 + 0.005]}
        fontSize={0.115}
        color="#f4f0ff"
        anchorX="center"
        anchorY="middle"
        maxWidth={W * 0.86}
        textAlign="center"
        outlineWidth={0}
        letterSpacing={-0.01}
      >
        {product.name}
      </Text>

      {/* Duration badge */}
      <mesh position={[0, -0.18, D / 2 + 0.003]}>
        <planeGeometry args={[0.55, 0.13]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.35} toneMapped={false} />
      </mesh>
      <Text
        position={[0, -0.18, D / 2 + 0.005]}
        fontSize={0.07}
        color={lightAccent}
        anchorX="center"
        anchorY="middle"
        outlineWidth={0}
        letterSpacing={0.06}
      >
        {(product.duration_label || '').toUpperCase()}
      </Text>

      {/* Price */}
      <Text
        position={[0, -0.55, D / 2 + 0.005]}
        fontSize={0.18}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
        outlineWidth={0}
        letterSpacing={-0.02}
      >
        {formatPrice(product.price)}
      </Text>
      <Text
        position={[0, -0.74, D / 2 + 0.005]}
        fontSize={0.055}
        color="#9aa0c0"
        anchorX="center"
        anchorY="middle"
        letterSpacing={0.1}
      >
        {product.currency} · DÉTAILS
      </Text>
    </group>
  )

  if (tier === 'light') return cardBody

  return (
    <Float speed={1.05} rotationIntensity={0.12} floatIntensity={0.18}>
      {cardBody}
    </Float>
  )
}

function formatPrice(n) {
  return new Intl.NumberFormat('fr-FR').format(Math.round(n))
}

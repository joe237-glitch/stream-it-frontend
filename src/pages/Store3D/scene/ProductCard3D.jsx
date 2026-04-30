import { useMemo, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { Float, MeshTransmissionMaterial, RoundedBox, Text } from '@react-three/drei'
import * as THREE from 'three'
import { FONT_INTER_BOLD, FONT_INTER_MEDIUM } from './fonts'

/**
 * ProductCard3D V3 — biseau code-first multi-couches.
 *
 * Approche bevel sans GLB : on empile 3 RoundedBox concentriques :
 * 1. Bevel ring (extérieur) — RoundedBox métal poli légèrement plus grand,
 *    visible sur les bords seulement (effet "bord biseauté éclairé")
 * 2. Glass body — RoundedBox transmission au centre (vrai verre)
 * 3. Front face — Plane légèrement avancé pour ancrer le contenu (titre,
 *    prix, glyph) sans la distorsion du verre
 *
 * Avantages vs V2 :
 * - Bord métallique cohérent avec moodboard P6.V2 (le bord brille)
 * - Lecture du titre/prix non déformée (face plane séparée du verre)
 * - Profondeur visuelle (3 couches) sans coût perf significatif
 * - Hover boost emissive sur le bevel ring → effet "carte holographique active"
 *
 * Tier 'light' : 1 seul RoundedBox standard material avec emissive accent.
 * Économe RT pass.
 */

const W = 1.55
const H = 2.15
const D = 0.12

const BEVEL = 0.04 // épaisseur du bord biseauté

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
  const groupRef = useRef()
  const cardRef = useRef()
  const bevelRef = useRef()
  const tracerRef = useRef()
  const [hovered, setHovered] = useState(false)

  const accentColor = useMemo(
    () => new THREE.Color(product.accent || '#7c3aed'),
    [product.accent],
  )
  const lightAccent = useMemo(
    () => accentColor.clone().lerp(new THREE.Color('#ffffff'), 0.55),
    [accentColor],
  )

  const targetEmissive = hovered ? 1.8 : 0.55
  const targetScale = hovered ? 1.05 : 1.0
  const targetTilt = hovered ? 0.16 : 0
  const targetLift = hovered ? 0.08 : 0

  useFrame((state, delta) => {
    const k = Math.min(1, delta * 9)
    const c = cardRef.current
    const g = groupRef.current
    const b = bevelRef.current
    if (!c || !g) return

    const sx = c.scale.x + (targetScale - c.scale.x) * k
    const sy = c.scale.y + (targetScale - c.scale.y) * k
    const sz = c.scale.z + (targetScale - c.scale.z) * k
    c.scale.set(sx, sy, sz)
    if (b) b.scale.set(sx, sy, sz)

    g.rotation.x += (-targetTilt - g.rotation.x) * k
    g.position.y += (position[1] + targetLift - g.position.y) * k

    if (b && b.material && b.material.emissiveIntensity != null) {
      b.material.emissiveIntensity += (targetEmissive - b.material.emissiveIntensity) * k
    }
    if (c.material && c.material.emissiveIntensity != null) {
      c.material.emissiveIntensity += (targetEmissive * 0.4 - c.material.emissiveIntensity) * k
    }

    // Edge tracer
    if (tracerRef.current) {
      const t = state.clock.elapsedTime * 0.5 + (product.id?.length || 0) * 0.2
      const u = (t % 1)
      const halfW = (W - 0.04) * 0.5
      const halfH = (H - 0.04) * 0.5
      const innerW = W - 0.04
      const innerH = H - 0.04
      const perim = 2 * (innerW + innerH)
      const d = u * perim
      let x, y
      if (d < innerW) { x = -halfW + d; y = halfH }
      else if (d < innerW + innerH) { x = halfW; y = halfH - (d - innerW) }
      else if (d < 2 * innerW + innerH) { x = halfW - (d - innerW - innerH); y = -halfH }
      else { x = -halfW; y = -halfH + (d - 2 * innerW - innerH) }
      tracerRef.current.position.set(x, y, D / 2 + 0.02)
      tracerRef.current.material.opacity = hovered ? 1 : 0.78
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

  const cardBody = (
    <group ref={groupRef} position={position}>
      {/* Layer 1 : bevel ring (métal poli, légèrement plus grand) */}
      <RoundedBox
        ref={bevelRef}
        args={[W + BEVEL, H + BEVEL, D - 0.01]}
        radius={0.07}
        smoothness={6}
      >
        <meshStandardMaterial
          color="#1a1530"
          metalness={1}
          roughness={0.15}
          emissive={lightAccent}
          emissiveIntensity={0.55}
        />
      </RoundedBox>

      {/* Layer 2 : glass body au centre */}
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
            transmission={0.98}
            roughness={0.12}
            thickness={0.45}
            ior={1.45}
            chromaticAberration={0.05}
            anisotropy={0.25}
            distortion={0.08}
            distortionScale={0.35}
            temporalDistortion={0.04}
            clearcoat={1}
            attenuationColor={accentColor}
            attenuationDistance={1.8}
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

      {/* Layer 3 : face plane avancée — ancre le contenu lisible */}
      <mesh position={[0, 0, D / 2 + 0.001]}>
        <planeGeometry args={[W * 0.94, H * 0.94]} />
        <meshBasicMaterial
          color="#0a0816"
          transparent
          opacity={0.18}
          toneMapped={false}
        />
      </mesh>

      {/* Frame néon discret sur les 4 bords (front face) */}
      <mesh position={[0, H * 0.47, D / 2 + 0.002]}>
        <planeGeometry args={[W * 0.92, 0.012]} />
        <meshBasicMaterial color={lightAccent} transparent opacity={0.7} toneMapped={false} />
      </mesh>
      <mesh position={[0, -H * 0.47, D / 2 + 0.002]}>
        <planeGeometry args={[W * 0.92, 0.012]} />
        <meshBasicMaterial color={lightAccent} transparent opacity={0.7} toneMapped={false} />
      </mesh>

      {/* Edge tracer animé */}
      <mesh ref={tracerRef}>
        <sphereGeometry args={[0.026, 14, 14]} />
        <meshBasicMaterial color={lightAccent} transparent opacity={0.85} toneMapped={false} />
      </mesh>

      {/* Glyph catégorique grand format en arrière-plan */}
      <Text
        position={[0, 0.55, D / 2 + 0.004]}
        fontSize={0.5}
        color={accentColor}
        anchorX="center"
        anchorY="middle"
        fillOpacity={0.42}
        outlineWidth={0}
      >
        {glyph}
      </Text>

      {/* Title */}
      <Text
        position={[0, 0.06, D / 2 + 0.005]}
        fontSize={0.115}
        color="#f8f6ff"
        anchorX="center"
        anchorY="middle"
        maxWidth={W * 0.84}
        textAlign="center"
        outlineWidth={0}
        letterSpacing={-0.015}
      >
        {product.name}
      </Text>

      {/* Duration badge */}
      <mesh position={[0, -0.18, D / 2 + 0.004]}>
        <planeGeometry args={[0.6, 0.135]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.45} toneMapped={false} />
      </mesh>
      <Text
        position={[0, -0.18, D / 2 + 0.005]}
        fontSize={0.072}
        color={lightAccent}
        anchorX="center"
        anchorY="middle"
        outlineWidth={0}
        letterSpacing={0.08}
      >
        {(product.duration_label || '').toUpperCase()}
      </Text>

      {/* Price */}
      <Text
        position={[0, -0.55, D / 2 + 0.005]}
        fontSize={0.19}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
        outlineWidth={0}
        letterSpacing={-0.03}
      >
        {formatPrice(product.price)}
      </Text>
      <Text
        position={[0, -0.75, D / 2 + 0.005]}
        fontSize={0.058}
        color="#9aa0c0"
        anchorX="center"
        anchorY="middle"
        letterSpacing={0.14}
      >
        {product.currency} · DÉTAILS
      </Text>
    </group>
  )

  if (tier === 'light') return cardBody

  return (
    <Float speed={1.0} rotationIntensity={0.1} floatIntensity={0.16}>
      {cardBody}
    </Float>
  )
}

function formatPrice(n) {
  return new Intl.NumberFormat('fr-FR').format(Math.round(n))
}

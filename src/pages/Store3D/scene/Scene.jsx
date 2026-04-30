import { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import {
  AdaptiveDpr,
  AdaptiveEvents,
  Environment,
  PerformanceMonitor,
  Preload,
  SoftShadows,
} from '@react-three/drei'
import {
  Bloom,
  ChromaticAberration,
  DepthOfField,
  EffectComposer,
  Noise,
  Vignette,
} from '@react-three/postprocessing'
import { BlendFunction } from 'postprocessing'
import * as THREE from 'three'

import { STORE3D_CATEGORIES } from '../data/mockProducts'
import { useStore3DSession } from '../hooks/useStore3DSession'
import Lights from './Lights'
import Floor from './Floor'
import Hall from './Hall'
import CategoryStand from './CategoryStand'
import CameraRig from './CameraRig'

/**
 * Scene V2 — Canvas R3F principal du Stream-It 3D Store premium.
 *
 * Améliorations vs V0 :
 * - HDRI Environment preset 'apartment' (chargement ~150 KB) pour reflets
 *   réalistes sur les MeshTransmissionMaterial des cartes
 * - SoftShadows drei pour ombres naturelles (full tier seulement)
 * - Pile post-process complète : Bloom selective + DoF + ChromaticAberration
 *   + Vignette + Noise très subtil = look "investor-ready"
 * - Hall component remplace l'ancien Floor+Particles : architecture immersive
 *   (podium + arche + pylônes + Stars + Sparkles)
 * - PerformanceMonitor avec hysteresis 35-58 fps pour bascule auto tier light
 *
 * Tier 'light' : pas de transmission cards, pas de bloom, pas de stars,
 * pas de god rays. Garde l'architecture mais en standard material.
 */
export default function Scene() {
  const tier = useStore3DSession((s) => s.tier) || 'full'
  const setTier = useStore3DSession((s) => s.setTier)
  const openProduct = useStore3DSession((s) => s.openProduct)

  const isFull = tier === 'full'

  return (
    <Canvas
      shadows={isFull}
      camera={{ position: [0, 1.7, 6.5], fov: 56, near: 0.1, far: 80 }}
      gl={{
        antialias: isFull,
        powerPreference: 'high-performance',
        alpha: false,
        stencil: false,
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 1.05,
        outputColorSpace: THREE.SRGBColorSpace,
      }}
      dpr={isFull ? [1, 1.6] : [1, 1.0]}
    >
      <color attach="background" args={['#05050d']} />
      <fog attach="fog" args={['#08081a', 7, 32]} />

      <PerformanceMonitor
        bounds={() => [35, 58]}
        flipflops={3}
        onDecline={() => {
          if (tier === 'full') setTier('light')
        }}
      />

      <Suspense fallback={null}>
        <Environment preset={isFull ? 'apartment' : 'city'} background={false} />
        {isFull && <SoftShadows samples={10} size={6} focus={0.6} />}
        <Lights tier={tier} />
        <Floor tier={tier} />
        <Hall tier={tier} />

        {STORE3D_CATEGORIES.map((cat) => (
          <CategoryStand
            key={cat.key}
            category={cat}
            position={cat.position}
            onProductClick={openProduct}
            tier={tier}
          />
        ))}

        <CameraRig />

        <Preload all />
      </Suspense>

      {isFull && (
        <EffectComposer multisampling={2} disableNormalPass>
          <Bloom
            intensity={0.55}
            luminanceThreshold={0.4}
            luminanceSmoothing={0.85}
            mipmapBlur
          />
          <DepthOfField focusDistance={0.045} focalLength={0.06} bokehScale={1.8} />
          <ChromaticAberration
            offset={[0.0008, 0.0008]}
            blendFunction={BlendFunction.NORMAL}
          />
          <Vignette eskil={false} offset={0.18} darkness={0.6} />
          <Noise
            premultiply
            blendFunction={BlendFunction.SOFT_LIGHT}
            opacity={0.18}
          />
        </EffectComposer>
      )}

      <AdaptiveDpr pixelated />
      <AdaptiveEvents />
    </Canvas>
  )
}

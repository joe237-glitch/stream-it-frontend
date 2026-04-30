import { Suspense, useEffect } from 'react'
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
import CameraIntro from './CameraIntro'

/**
 * Scene V3 — Canvas R3F principal du Stream-It 3D Store premium V3.
 *
 * Améliorations vs V2 :
 * - Caméra FOV élargi 60° (vs 56°) pour ne plus couper les cartes en vue
 *   d'ensemble desktop
 * - Mode mobile : si isPortrait, on n'affiche que le stand actif (focus
 *   catégorie par défaut = streaming), camera.fov plus serrée
 * - Hall sans pylônes (V3 Hall.jsx) → composition aérée
 * - Tier light renforcé : downgrade à 32 fps (vs 35) pour éviter flickering
 *
 * Détection mobile via window.innerWidth < 768.
 */
export default function Scene({ isPortrait = false, mobileFocusKey = null }) {
  const tier = useStore3DSession((s) => s.tier) || 'full'
  const setTier = useStore3DSession((s) => s.setTier)
  const openProduct = useStore3DSession((s) => s.openProduct)
  const setFocusCategory = useStore3DSession((s) => s.setFocusCategory)

  const isFull = tier === 'full'

  // Sur mobile portrait, on force le focus sur la catégorie active
  useEffect(() => {
    if (isPortrait && mobileFocusKey) {
      setFocusCategory(mobileFocusKey)
    }
  }, [isPortrait, mobileFocusKey, setFocusCategory])

  // Mobile : on ne rend qu'un stand pour économiser draws + perf
  const visibleCategories = isPortrait && mobileFocusKey
    ? STORE3D_CATEGORIES.filter((c) => c.key === mobileFocusKey)
    : STORE3D_CATEGORIES

  const cameraInitial = isPortrait
    ? { position: [0, 1.6, 5.5], fov: 64 }
    : { position: [0, 1.75, 7.0], fov: 60 }

  return (
    <Canvas
      shadows={isFull && !isPortrait}
      camera={{ ...cameraInitial, near: 0.1, far: 80 }}
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
        bounds={() => [32, 58]}
        flipflops={3}
        onDecline={() => {
          if (tier === 'full') setTier('light')
        }}
      />

      <Suspense fallback={null}>
        <Environment preset={isFull ? 'apartment' : 'city'} background={false} />
        {isFull && !isPortrait && <SoftShadows samples={10} size={6} focus={0.6} />}
        <Lights tier={tier} />
        <Floor tier={tier} />
        <Hall tier={tier} />

        {visibleCategories.map((cat) => (
          <CategoryStand
            key={cat.key}
            category={cat}
            position={isPortrait ? [0, 0, -3.5] : cat.position}
            onProductClick={openProduct}
            tier={tier}
          />
        ))}

        {!isPortrait && <CameraIntro isPortrait={isPortrait} />}
        <CameraRig isPortrait={isPortrait} />

        <Preload all />
      </Suspense>

      {isFull && (
        <EffectComposer multisampling={2} disableNormalPass>
          <Bloom
            intensity={0.5}
            luminanceThreshold={0.42}
            luminanceSmoothing={0.85}
            mipmapBlur
          />
          <DepthOfField focusDistance={0.045} focalLength={0.06} bokehScale={1.6} />
          <ChromaticAberration
            offset={[0.0007, 0.0007]}
            blendFunction={BlendFunction.NORMAL}
          />
          <Vignette eskil={false} offset={0.18} darkness={0.6} />
          <Noise
            premultiply
            blendFunction={BlendFunction.SOFT_LIGHT}
            opacity={0.16}
          />
        </EffectComposer>
      )}

      <AdaptiveDpr pixelated />
      <AdaptiveEvents />
    </Canvas>
  )
}

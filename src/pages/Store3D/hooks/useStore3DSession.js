import { create } from 'zustand'

/**
 * Store3D session — état UI/scène partagé entre Scene 3D et HUD 2D.
 *
 * Ne contient pas le panier (CartContext reste source de vérité). Ne persiste
 * volontairement rien : à chaque ouverture de /3d-store la session repart à zéro
 * (caméra position de départ, drawer fermé). Tier perf est rebadgé par la Scene
 * via PerformanceMonitor + DeviceProbe.
 */
export const useStore3DSession = create((set, get) => ({
  // Tier perf : 'fallback' | 'light' | 'full'. null tant que DeviceProbe n'a pas répondu.
  tier: null,
  setTier: (tier) => set({ tier }),

  // Catégorie focus actuelle ('streaming'|'iptv'|'gaming'|null)
  focusCategory: null,
  setFocusCategory: (focusCategory) => set({ focusCategory }),

  // Produit ouvert dans le drawer (objet ou null)
  activeProduct: null,
  openProduct: (product) => set({ activeProduct: product }),
  closeProduct: () => set({ activeProduct: null }),

  // Mode dégradé (PM peut switcher manuellement vers 2D)
  forceFallback: false,
  toggleForceFallback: () =>
    set((s) => ({ forceFallback: !s.forceFallback })),

  // Compteur de frames pour debug perf (incrémenté par Scene)
  frameCount: 0,
  bumpFrame: () => set((s) => ({ frameCount: s.frameCount + 1 })),
}))

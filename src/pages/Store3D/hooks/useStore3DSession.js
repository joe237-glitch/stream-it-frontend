/**
 * useStore3DSession.js — Zustand store local à la route /3d-store.
 *
 * Stocke uniquement de l'état 3D-spécifique (caméra cible, scène active,
 * produit hovered/sélectionné). Aucune logique métier ici — le panier
 * vit dans CartContext, l'auth dans AuthContext.
 */

import { create } from 'zustand'

export const useStore3DSession = create((set) => ({
  /** Catégorie active : null = vue hall ; 'streaming' | 'iptv' | 'gaming' */
  activeCategory: null,
  setActiveCategory: (code) => set({ activeCategory: code }),
  goHome: () => set({ activeCategory: null, selectedProduct: null }),

  /** Produit cliqué (ouvre le drawer 2D côté HUD). null = drawer fermé. */
  selectedProduct: null,
  selectProduct:   (product) => set({ selectedProduct: product }),
  closeProduct:    () => set({ selectedProduct: null }),

  /** Tier device résolu une fois au mount (cf. DeviceProbe). */
  tier: 'full',
  setTier: (tier) => set({ tier }),
}))

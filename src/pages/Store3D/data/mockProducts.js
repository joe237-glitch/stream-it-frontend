/**
 * Produits mockés Stream-It 3D Store — Phase 1 prototype premium.
 *
 * 9 produits, 3 par catégorie (Streaming, IPTV, Gaming/Cartes). Champs alignés
 * sur la forme attendue par CartContext (id, name, price). `accent` est utilisé
 * par la 3D pour driver l'emissive de la ProductCard3D.
 *
 * Aucune référence à des marques tierces : noms génériques "Premium HD",
 * "World Pass", etc. Les logos seraient ajoutés plus tard côté DA, hors prototype.
 */

export const STORE3D_PRODUCTS = [
  // — Streaming —
  {
    id: 'mock-streaming-1',
    name: 'Stream Premium 1 mois',
    category: 'streaming',
    description: 'Accès illimité multi-écrans, qualité 4K HDR, sans engagement.',
    price: 4990,
    currency: 'XAF',
    accent: '#7c3aed',
    duration_label: '1 mois',
  },
  {
    id: 'mock-streaming-2',
    name: 'Stream Family 3 mois',
    category: 'streaming',
    description: '4 profils, qualité Full HD, économie 15 % vs mensuel.',
    price: 12900,
    currency: 'XAF',
    accent: '#a78bfa',
    duration_label: '3 mois',
  },
  {
    id: 'mock-streaming-3',
    name: 'Stream Pro 12 mois',
    category: 'streaming',
    description: 'Engagement annuel, 4K HDR + Atmos, économie 30 %.',
    price: 39900,
    currency: 'XAF',
    accent: '#22d3ee',
    duration_label: '12 mois',
  },

  // — IPTV —
  {
    id: 'mock-iptv-1',
    name: 'IPTV World Pass',
    category: 'iptv',
    description: '12 000+ chaînes internationales, EPG, multi-device.',
    price: 8900,
    currency: 'XAF',
    accent: '#22d3ee',
    duration_label: '1 mois',
  },
  {
    id: 'mock-iptv-2',
    name: 'IPTV Sports Premium',
    category: 'iptv',
    description: 'Tous les championnats majeurs, 1080p stable.',
    price: 14900,
    currency: 'XAF',
    accent: '#7c3aed',
    duration_label: '1 mois',
  },
  {
    id: 'mock-iptv-3',
    name: 'IPTV Max 6 mois',
    category: 'iptv',
    description: 'Pack complet, support prioritaire, économie 25 %.',
    price: 44900,
    currency: 'XAF',
    accent: '#a78bfa',
    duration_label: '6 mois',
  },

  // — Gaming + Cartes —
  {
    id: 'mock-gaming-1',
    name: 'Carte cadeau 25€',
    category: 'gaming',
    description: 'Code utilisable sur les principales boutiques gaming.',
    price: 16500,
    currency: 'XAF',
    accent: '#f5b942',
    duration_label: 'unique',
  },
  {
    id: 'mock-gaming-2',
    name: 'Game Pass 3 mois',
    category: 'gaming',
    description: 'Accès catalogue 400+ jeux, console + PC.',
    price: 19900,
    currency: 'XAF',
    accent: '#22d3ee',
    duration_label: '3 mois',
  },
  {
    id: 'mock-gaming-3',
    name: 'Carte cadeau 50€',
    category: 'gaming',
    description: 'Code utilisable sur les principales boutiques gaming.',
    price: 32900,
    currency: 'XAF',
    accent: '#7c3aed',
    duration_label: 'unique',
  },
]

export function productsByCategory(category) {
  return STORE3D_PRODUCTS.filter((p) => p.category === category)
}

export const STORE3D_CATEGORIES = [
  {
    key: 'streaming',
    label: 'Streaming',
    description: 'Plateformes premium, multi-écrans, 4K HDR.',
    accent: '#7c3aed',
    position: [-5.4, 0, -3.5],
    rotation: [0, Math.PI / 8, 0],
  },
  {
    key: 'iptv',
    label: 'IPTV',
    description: 'Chaînes internationales, sports, lounge premium.',
    accent: '#22d3ee',
    position: [0, 0, -5.5],
    rotation: [0, 0, 0],
  },
  {
    key: 'gaming',
    label: 'Gaming · Cartes',
    description: 'Game Pass, codes & cartes cadeaux instantanées.',
    accent: '#f5b942',
    position: [5.4, 0, -3.5],
    rotation: [0, -Math.PI / 8, 0],
  },
]

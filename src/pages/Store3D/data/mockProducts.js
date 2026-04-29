/**
 * mockProducts.js — 9 produits factices Phase 1, cohérents avec le catalogue réel
 * Stream-It mais marqués `mock_` pour éviter toute collision avec les vrais ids.
 *
 * Ces produits sont consommés par le panier existant (CartContext.addItem).
 * Le paiement n'est PAS branché en Phase 1 — l'ajout au panier sert juste à
 * démontrer le tunnel UX.
 */

export const CATEGORIES = [
  { code: 'streaming',  name: 'Streaming',         accent: '#7c3aed' },
  { code: 'iptv',       name: 'IPTV',              accent: '#06b6d4' },
  { code: 'gaming',     name: 'Gaming & Cartes',   accent: '#f59e0b' },
]

export const MOCK_PRODUCTS_BY_CATEGORY = {
  streaming: [
    {
      id: 'mock_netflix_premium',
      name: 'Netflix Premium',
      price: 4500,
      currency: 'XAF',
      description: 'Accès 4K UHD · 4 écrans simultanés · catalogue complet.',
      category: 'streaming',
    },
    {
      id: 'mock_spotify_premium',
      name: 'Spotify Premium',
      price: 1800,
      currency: 'XAF',
      description: 'Musique sans pub · téléchargements offline · qualité Hi-Fi.',
      category: 'streaming',
    },
    {
      id: 'mock_prime_video',
      name: 'Prime Video',
      price: 1500,
      currency: 'XAF',
      description: 'Films, séries Amazon Originals · 3 écrans simultanés.',
      category: 'streaming',
    },
    {
      id: 'mock_disney_plus',
      name: 'Disney+',
      price: 2000,
      currency: 'XAF',
      description: 'Disney · Marvel · Star Wars · Pixar · National Geographic.',
      category: 'streaming',
    },
  ],
  iptv: [
    {
      id: 'mock_iptv_premium',
      name: 'IPTV Premium',
      price: 2500,
      currency: 'XAF',
      description: '+8 000 chaînes · qualité 4K · VOD · multi-écrans.',
      category: 'iptv',
    },
    {
      id: 'mock_iptv_sport',
      name: 'IPTV Sport',
      price: 3000,
      currency: 'XAF',
      description: 'Tous les sports · CAN · UEFA · NBA · streaming HD.',
      category: 'iptv',
    },
  ],
  gaming: [
    {
      id: 'mock_psn_giftcard',
      name: 'PlayStation Gift Card',
      price: 5000,
      currency: 'XAF',
      description: 'Carte cadeau PSN · jeux, DLC, abonnements PS Plus.',
      category: 'gaming',
    },
    {
      id: 'mock_xbox_gamepass',
      name: 'Xbox Game Pass',
      price: 4000,
      currency: 'XAF',
      description: '+100 jeux · Xbox · PC · cloud gaming inclus.',
      category: 'gaming',
    },
    {
      id: 'mock_steam_giftcard',
      name: 'Steam Gift Card',
      price: 5000,
      currency: 'XAF',
      description: 'Crédit Steam · plus de 50 000 jeux PC disponibles.',
      category: 'gaming',
    },
  ],
}

export const ALL_MOCK_PRODUCTS = Object.values(MOCK_PRODUCTS_BY_CATEGORY).flat()

/**
 * errors.js — Frontend error utilities for Stream-It.
 *
 * Centralise l'extraction et la traduction des messages d'erreur API
 * pour éviter les `err.response?.data?.message || 'Erreur inconnue'`
 * éparpillés dans tous les composants.
 */

// ─── Error type → message utilisateur ─────────────────────────
const ERROR_MESSAGES = {
  // Auth
  auth:       'Votre session a expiré. Veuillez vous reconnecter.',
  forbidden:  'Vous n\'avez pas les droits pour effectuer cette action.',

  // Validation
  validation: 'Les données saisies sont invalides.',

  // Not found
  not_found:  'La ressource demandée est introuvable.',

  // Conflict
  conflict:   'Cette valeur est déjà utilisée.',

  // Business
  business:   'Cette action n\'est pas possible pour le moment.',

  // Network
  network:    'Impossible de contacter le serveur. Vérifiez votre connexion.',

  // Server
  server:     'Une erreur interne est survenue. Veuillez réessayer.',

  // Default
  unknown:    'Une erreur est survenue. Veuillez réessayer.',
};

/**
 * Extract a user-friendly message from an Axios error.
 *
 * Priority order:
 *  1. err.response.data.error.message  (new structured format)
 *  2. err.response.data.message        (legacy format)
 *  3. Type-based fallback from ERROR_MESSAGES
 *  4. Generic fallback
 *
 * @param {import('axios').AxiosError} err
 * @param {string} [fallback]  Custom fallback message
 * @returns {string}
 */
export function getErrorMessage(err, fallback) {
  // Network error (no response from server)
  if (!err.response) {
    return ERROR_MESSAGES.network;
  }

  const data = err.response?.data;

  // New structured format: { success: false, error: { type, message } }
  if (data?.error?.message) {
    return data.error.message;
  }

  // Legacy format: { success: false, message: '...' }
  if (data?.message) {
    return data.message;
  }

  // Type-based fallback
  const type = data?.error?.type;
  if (type && ERROR_MESSAGES[type]) {
    return ERROR_MESSAGES[type];
  }

  // HTTP status fallback
  const status = err.response?.status;
  if (status === 401) return ERROR_MESSAGES.auth;
  if (status === 403) return ERROR_MESSAGES.forbidden;
  if (status === 404) return ERROR_MESSAGES.not_found;
  if (status === 409) return ERROR_MESSAGES.conflict;
  if (status === 422) return ERROR_MESSAGES.business;
  if (status >= 500)  return ERROR_MESSAGES.server;

  return fallback || ERROR_MESSAGES.unknown;
}

/**
 * Check if an error is an authentication failure (session expired).
 * @param {import('axios').AxiosError} err
 * @returns {boolean}
 */
export function isAuthError(err) {
  return err.response?.status === 401;
}

/**
 * Check if an error is a network/connectivity issue.
 * @param {import('axios').AxiosError} err
 * @returns {boolean}
 */
export function isNetworkError(err) {
  return !err.response;
}

/**
 * Check if an error is a validation error (400/422).
 * @param {import('axios').AxiosError} err
 * @returns {boolean}
 */
export function isValidationError(err) {
  const status = err.response?.status;
  return status === 400 || status === 422;
}

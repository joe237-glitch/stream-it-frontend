import { useEffect, useRef, useState } from 'react'
import { Payments } from '../api/client'

const CACHE_KEY = 'sit_coverage_v1'
const ETAG_KEY  = 'sit_coverage_etag'

/**
 * usePaymentCoverage — fetch /api/payments/coverage with localStorage cache + ETag.
 *
 * Behaviour:
 *  - Returns cached data immediately if present (instant render).
 *  - Revalidates against the backend with If-None-Match. On 304 we keep the
 *    cached value untouched. On 200 we update the cache + the new ETag.
 *  - On hard failure (network down, 5xx, payload not success) we surface a
 *    `error` but keep whatever cached `data` we already had so the caller can
 *    still degrade gracefully.
 */
export function usePaymentCoverage() {
  const [data, setData]       = useState(() => {
    try {
      const cached = localStorage.getItem(CACHE_KEY)
      return cached ? JSON.parse(cached) : null
    } catch { return null }
  })
  const [loading, setLoading] = useState(!data)
  const [error, setError]     = useState(null)
  const fetchedOnce           = useRef(false)

  useEffect(() => {
    if (fetchedOnce.current) return
    fetchedOnce.current = true

    let cancelled = false
    const previousEtag = (() => {
      try { return localStorage.getItem(ETAG_KEY) || '' } catch { return '' }
    })()

    Payments.coverage(previousEtag)
      .then((res) => {
        if (cancelled) return

        // 304 Not Modified: cached data still valid.
        if (res.status === 304) {
          setLoading(false)
          return
        }

        const json = res.data
        if (!json || json.success !== true || !json.data) {
          throw new Error('coverage payload invalid')
        }

        const fresh = json.data
        const etag  = res.headers?.etag || ''
        try {
          localStorage.setItem(CACHE_KEY, JSON.stringify(fresh))
          if (etag) localStorage.setItem(ETAG_KEY, etag)
        } catch { /* quota — ignore */ }

        setData(fresh)
        setLoading(false)
        setError(null)
      })
      .catch((err) => {
        if (cancelled) return
        setError(err)
        setLoading(false)
      })

    return () => { cancelled = true }
  }, [])

  return { data, loading, error }
}

/** Helper: filter only countries that are sellable (visible AND enabled). */
export function getSellableCountries(coverage) {
  if (!coverage?.countries) return []
  return coverage.countries.filter(c => c.visible && c.enabled)
}

/** Helper: filter the visible countries (regardless of enabled). */
export function getVisibleCountries(coverage) {
  if (!coverage?.countries) return []
  return coverage.countries.filter(c => c.visible)
}

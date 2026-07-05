/*
 * useRecentSearches.js — keeps a short, deduped list of recent route searches
 * in localStorage so the user can re-run a previous query with one tap.
 *
 * WHY THIS EXISTS
 *   Campus users repeat the same few trips (dorm → cafeteria, library →
 *   restroom) on different days. A "最近搜索" rail gives them a one-tap
 *   shortcut instead of having to re-speak or re-pick from the dropdowns.
 *   This is especially important for users with motor impairments, who pay a
 *   higher cost for every extra tap.
 *
 * BEHAVIOR
 *   - Each entry is `{ origin, destination, at: ISO-string }`.
 *   - The most recent search is unshifted to the front.
 *   - Duplicate (origin, destination) pairs are removed from older positions
 *     so the list never contains the same trip twice.
 *   - The list is capped at MAX_ITEMS (5) — beyond that older entries drop
 *     off the end. Five is enough to cover a typical day's trips without
 *     overwhelming a screen-reader user with a long list.
 *
 * A11Y
 *   This hook is presentation-agnostic. The component that renders the list
 *   is responsible for the appropriate aria-label / role. Persistence uses
 *   localStorage, which is synchronously readable on first render so there
 *   is no flash of "no recent searches".
 */
import { useCallback, useState } from 'react'

const STORAGE_KEY = 'acn-recent-searches'
const MAX_ITEMS = 5

function readStore() {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter(
      (e) => e && typeof e.origin === 'string' && typeof e.destination === 'string'
    )
  } catch (_) {
    return []
  }
}

function writeStore(entries) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries))
  } catch (_) {
    // QuotaExceeded or disabled storage — fail silently. The in-memory list
    // still works for the current session; we just don't persist.
  }
}

export function useRecentSearches() {
  const [recent, setRecent] = useState(readStore)

  const addRecent = useCallback((origin, destination) => {
    if (!origin || !destination) return
    if (origin.toLowerCase() === destination.toLowerCase()) return
    const entry = { origin, destination, at: new Date().toISOString() }
    setRecent((prev) => {
      const filtered = prev.filter(
        (e) =>
          !(
            e.origin.toLowerCase() === origin.toLowerCase() &&
            e.destination.toLowerCase() === destination.toLowerCase()
          )
      )
      const next = [entry, ...filtered].slice(0, MAX_ITEMS)
      writeStore(next)
      return next
    })
  }, [])

  const clearRecent = useCallback(() => {
    setRecent([])
    writeStore([])
  }, [])

  return { recent, addRecent, clearRecent }
}

/*
 * RecentSearches.jsx — a rail of recently-searched (origin → destination)
 * pairs, persisted in localStorage via useRecentSearches.
 *
 * UX
 *   Each entry renders as a compact "transit tag" chip showing
 *   "起点 → 终点". Clicking it immediately re-runs that search.
 *   A "清空" (clear) button wipes the list. The whole panel only renders
 *   when there is at least one entry — it never shows an empty state, the
 *   empty placeholder in RouteFinder already covers that.
 *
 * A11Y DECISIONS
 *   - The chip rail is a <ul role="list">. We use role="list" because
 *     Tailwind's reset removes list semantics from <ul>; the explicit role
 *     restores it so screen readers announce "list, N items".
 *   - Each chip button has a descriptive aria-label of the form
 *     "重新搜索:从 X 到 Y" so AT users hear the action, not just the label.
 *   - The clear button is a separate sibling so AT users can find it without
 *     tabbing through the whole chip list first.
 *   - The section has aria-labelledby pointing at its heading so it is a
 *     labelled landmark region in the results stream.
 */
export default function RecentSearches({ recent, onRetry, onClear }) {
  if (!recent || recent.length === 0) return null

  return (
    <section
      aria-labelledby="recent-searches-heading"
      className="ticket-window p-4 sm:p-5"
    >
      <div className="flex items-baseline justify-between gap-3 mb-3">
        <p className="station-code" id="recent-searches-heading">
          最近搜索 · RECENT
        </p>
        <button
          type="button"
          onClick={onClear}
          className="mono text-xs text-ink-muted hover:text-rust underline underline-offset-2 transition-colors touch-target px-1"
          aria-label="清空最近搜索记录"
        >
          清空
        </button>
      </div>

      <ul
        className="flex flex-wrap gap-2"
        role="list"
        aria-label="最近搜索的路线"
      >
        {recent.map((entry, i) => (
          <li key={`${entry.origin}-${entry.destination}-${i}`}>
            <button
              type="button"
              onClick={() => onRetry(entry.origin, entry.destination)}
              className="recent-chip touch-target"
              aria-label={`重新搜索:从 ${entry.origin} 到 ${entry.destination}`}
              title={`${entry.origin} → ${entry.destination}`}
            >
              <span className="font-display font-600 text-ink">{entry.origin}</span>
              <span className="text-rust mx-1.5" aria-hidden="true">→</span>
              <span className="font-display font-600 text-ink">{entry.destination}</span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}

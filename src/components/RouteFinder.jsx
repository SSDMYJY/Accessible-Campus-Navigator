/*
 * RouteFinder.jsx — the routing interface section.
 *
 * INTERACTION MODEL (v3 — voice-first)
 *   The section now contains THREE blocks, in priority order:
 *     1. VoiceInput — the PRIMARY entry. A prominent mic button. The user
 *        speaks, the app parses intent, and auto-searches.
 *     2. Manual form — a SECONDARY fallback, collapsed inside a <details>
 *        element. Still fully functional for users whose browser lacks
 *        SpeechRecognition, who can't speak, or whose speech wasn't
 *        recognized. <details>/<summary> is a native disclosure widget that
 *        is keyboard-accessible and screen-reader-friendly out of the box
 *        (no custom ARIA needed).
 *     3. Results stream — the matched route tickets.
 *
 * SEMANTIC STRUCTURE — unchanged
 *   <section aria-labelledby="route-finder-heading">
 *     <VoiceInput/>                       primary voice entry
 *     <details>                           collapsible manual fallback
 *       <form> ...
 *     <div role="region" aria-live>       results
 */
import { useState } from 'react'
import RouteCard from './RouteCard.jsx'
import VoiceInput from './VoiceInput.jsx'

export default function RouteFinder({
  routes,
  matchedRoutes,
  onSearch,
  onSelectRoute,
  onAnnounceRoute,
  activeRouteId,
  places,
  voice,
  manualOpen,
  onManualOpenChange,
}) {
  // Manual form state — only used when the user opens the collapsible fallback.
  const [origin, setOrigin] = useState('')
  const [destination, setDestination] = useState('')

  const samePlace =
    origin && destination && origin.toLowerCase() === destination.toLowerCase()

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!origin || !destination || samePlace) return
    onSearch(origin, destination)
  }

  return (
    <section aria-labelledby="voice-input-heading" className="space-y-8">
      {/* ── PRIMARY: Voice input ───────────────────────────────────────── */}
      <VoiceInput
        supported={voice.supported}
        listening={voice.listening}
        interim={voice.interim}
        error={voice.error}
        lastTranscript={voice.lastTranscript}
        onStart={voice.onStart}
        onStop={voice.onStop}
        places={places}
      />

      {/* ── SECONDARY: Manual form (collapsible fallback) ──────────────── */}
      {/*
        <details> is a native disclosure widget: keyboard-accessible (Enter
        toggles), exposed to AT as a disclosure with appropriate role/state.
        It is CONTROLLED here (open + onToggle) so that opening it also reveals
        the top Header (see App.jsx). This couples the manual-fallback intent
        with the chrome-reveal, giving the user the full masthead exactly when
        they've opted into manual mode.
      */}
      <details
        className="group"
        open={manualOpen}
        onToggle={(e) => onManualOpenChange(e.currentTarget.open)}
      >
        <summary
          className="cursor-pointer select-none list-none flex items-center gap-2 text-ink-soft hover:text-rust transition-colors py-2"
        >
          <span className="station-code">手动选择地点 · MANUAL FALLBACK</span>
          <span
            className="decorative-only mono text-xs transition-transform group-open:rotate-90"
            aria-hidden="true"
          >
            ▶
          </span>
        </summary>

        <form
          onSubmit={handleSubmit}
          aria-describedby="form-helper"
          className="ticket-window p-5 sm:p-6 mt-3"
        >
          <p id="form-helper" className="font-serif text-ink-soft text-sm leading-relaxed mb-5">
            如果语音不可用或未被识别,可在此手动选择起点和终点。
          </p>

          <div className="grid sm:grid-cols-2 gap-4">
            {/* Origin */}
            <div className="space-y-1.5">
              <label htmlFor="origin" className="block font-display font-600 text-ink text-base">
                起点
                <span className="station-code ml-2">FROM</span>
              </label>
              <select
                id="origin"
                value={origin}
                onChange={(e) => setOrigin(e.target.value)}
                required
                aria-describedby="origin-helper"
                className="field-select"
              >
                <option value="">请选择起点…</option>
                {places.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
              <p id="origin-helper" className="font-serif text-xs text-ink-muted italic">
                您当前所在位置或出发地点。
              </p>
            </div>

            {/* Destination */}
            <div className="space-y-1.5">
              <label htmlFor="destination" className="block font-display font-600 text-ink text-base">
                终点
                <span className="station-code ml-2">TO</span>
              </label>
              <select
                id="destination"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                required
                aria-describedby="destination-helper"
                className="field-select"
              >
                <option value="">请选择终点…</option>
                {places.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
              <p id="destination-helper" className="font-serif text-xs text-ink-muted italic">
                您要前往的目的地。
              </p>
            </div>
          </div>

          {samePlace && (
            <p role="alert" className="mt-4 font-serif text-sm text-rust font-600 border-l-2 border-rust pl-3">
              起点和终点不能相同。
            </p>
          )}

          <button
            type="submit"
            disabled={!origin || !destination || samePlace}
            className="badge-button badge-button--primary touch-target w-full sm:w-auto mt-5 justify-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span aria-hidden="true">↗</span>
            查找无障碍路线
          </button>
        </form>
      </details>

      {/* ── Results stream ─────────────────────────────────────────────── */}
      <div
        role="region"
        aria-live="polite"
        aria-label="路线结果"
        className="space-y-5"
      >
        <div className="flex items-baseline justify-between gap-3 pb-2 border-b border-hairline">
          <p className="station-code">§ 02 · 路线结果</p>
          {matchedRoutes.length > 0 && (
            <p className="mono text-xs text-ink-muted">
              共 {matchedRoutes.length} 条
            </p>
          )}
        </div>

        {matchedRoutes.length === 0 ? (
          <div className="border-2 border-dashed border-hairline p-8 sm:p-10 text-center">
            <div className="decorative-only text-ink-muted/40 mb-3" aria-hidden="true">
              <svg width="48" height="48" viewBox="0 0 48 48" fill="none" className="mx-auto">
                <circle cx="24" cy="20" r="8" stroke="currentColor" strokeWidth="1.5" />
                <path d="M24 28 L24 40 M18 34 L30 34" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </div>
            <p className="font-display font-600 text-ink text-lg">暂无路线显示</p>
            <p className="font-serif text-sm text-ink-muted mt-1 max-w-sm mx-auto">
              点击上方麦克风说出你的目的地,例如「从宿舍楼到第一食堂」。
            </p>
          </div>
        ) : (
          matchedRoutes.map((route) => (
            <RouteCard
              key={route.id}
              route={route}
              active={route.id === activeRouteId}
              onSelect={() => onSelectRoute(route)}
              onAnnounce={() => onAnnounceRoute(route)}
            />
          ))
        )}
      </div>
    </section>
  )
}

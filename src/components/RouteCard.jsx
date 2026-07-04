/*
 * RouteCard.jsx — a single route rendered as a vintage transit ticket.
 *
 * AESTHETIC
 *   The card looks like a paper transit ticket: cream stock, ink border with
 *   a hard drop-shadow (like a printed form laid on a desk). A perforated
 *   divider separates the route header (origin → destination, distance, ETA,
 *   feature stamps) from the step-by-step directions. The steps are numbered
 *   "stamps" connected by a dashed rust line, like stops on a transit map.
 *   When the user selects the route, a rotated red "已选" seal stamps into
 *   the corner with a press animation.
 *
 * SEMANTIC STRUCTURE — UNCHANGED
 *   <article aria-labelledby={headingId}>   self-contained compositional unit
 *     <h3 id={headingId}>                   route name (origin → destination)
 *     <p>                                   summary (distance, time)
 *     <ul>                                  accessibility feature badges
 *     <ol>                                  step-by-step directions (ORDERED)
 *     <p role="note">                       optional safety note
 *     actions: Select / Announce
 *
 * A11Y DECISIONS — UNCHANGED
 *   - <article> (not <div>) signals a self-contained piece for AT navigation.
 *   - The h3 id is unique per route so aria-labelledby resolves correctly.
 *   - Steps are in an <ol>: screen readers announce "第 1 步,共 5 步".
 *   - Feature badges use <ul> (unordered) since they are a set, not a sequence.
 *   - "Selected" state is conveyed via aria-pressed on the Select button AND
 *     visually via the ticket's rust border + the decorative seal. The seal
 *     is aria-hidden (decorative) — the authoritative state is the button.
 *   - The decorative dashed route line and step-stamp circles are marked
 *     aria-hidden so AT only reads the step text, not "circle 1, line, circle 2".
 */
export default function RouteCard({ route, active, onSelect, onAnnounce }) {
  const headingId = `route-heading-${route.id}`
  const listId = `route-steps-${route.id}`

  return (
    <article
      aria-labelledby={headingId}
      data-selected={active ? 'true' : 'false'}
      className="route-ticket p-5 sm:p-7"
    >
      {/* Decorative "VALIDATED" seal when selected. aria-hidden because the
          authoritative state is the Select button's aria-pressed + label. */}
      {active && (
        <div className="selected-seal decorative-only" aria-hidden="true">
          已选
        </div>
      )}

      {/* ── Ticket header: route name + summary + features ─────────────── */}
      <header>
        <div className="flex items-baseline justify-between gap-3 mb-2">
          <p className="station-code">路线 · ROUTE</p>
          <p className="mono text-xs text-ink-muted">
            #{route.id.toUpperCase()}
          </p>
        </div>

        <h3
          id={headingId}
          className="font-display font-700 text-ink leading-tight"
          style={{
            fontSize: 'clamp(1.25rem, 1rem + 1vw, 1.625rem)',
            fontVariationSettings: "'opsz' 72",
            letterSpacing: '-0.02em',
          }}
        >
          {route.origin}
          <span className="text-rust mx-2 font-400" aria-hidden="true">→</span>
          {route.destination}
        </h3>

        {/* Summary line — mono numerics feel like map coordinate notation */}
        <p className="mt-2 mono text-sm text-ink-soft tracking-tight">
          <span className="text-ink font-500">{route.distanceMeters}</span>
          <span className="text-ink-muted"> 米</span>
          <span className="text-ink-muted mx-2">·</span>
          <span className="text-ink font-500">{route.estMinutes}</span>
          <span className="text-ink-muted"> 分钟</span>
        </p>

        {/* Accessibility-feature stamps */}
        <ul
          className="mt-3 flex flex-wrap gap-1.5"
          role="list"
          aria-label="无障碍设施"
        >
          {route.features.map((f) => (
            <li key={f} className="feature-stamp">{f}</li>
          ))}
        </ul>
      </header>

      {/* Perforated divider between ticket header and directions */}
      <div className="perforation decorative-only" aria-hidden="true" />

      {/* ── Step-by-step directions ────────────────────────────────────── */}
      <section aria-labelledby={`${listId}-label`}>
        <h4
          id={`${listId}-label`}
          className="station-code mb-3"
        >
          导航步骤 · DIRECTIONS
        </h4>

        {/*
          The ordered list. Each <li> is a flex row: a numbered step stamp on
          the left, the step text on the right. The dashed route line is a
          decorative SVG positioned absolutely behind the stamps (aria-hidden).
        */}
        <ol id={listId} className="relative space-y-3">
          {/* Decorative dashed route line connecting the stamps */}
          <svg
            className="decorative-only absolute left-[1.125rem] top-3 bottom-3 w-0.5"
            aria-hidden="true"
            preserveAspectRatio="none"
            viewBox="0 0 2 100"
          >
            <line x1="1" y1="0" x2="1" y2="100" className="route-line" />
          </svg>

          {route.steps.map((step, i) => (
            <li key={i} className="relative flex items-start gap-3 pl-0">
              <span className="step-stamp decorative-only" aria-hidden="true">
                {String(i + 1).padStart(2, '0')}
              </span>
              <span className="font-serif text-ink text-base leading-relaxed pt-1.5">
                {step}
              </span>
            </li>
          ))}
        </ol>
      </section>

      {/* Safety note — feels like a stamped advisory on the ticket */}
      {route.safetyNote && (
        <p
          role="note"
          className="mt-4 flex gap-2 items-start font-serif text-sm text-ink-soft bg-paper-deep/60 border-l-2 border-rust px-3 py-2.5"
        >
          <span className="font-display font-700 text-rust whitespace-nowrap">⚠ 安全提示</span>
          <span className="leading-relaxed">{route.safetyNote}</span>
        </p>
      )}

      {/* ── Per-card actions ───────────────────────────────────────────── */}
      <div className="mt-5 flex flex-wrap gap-2 pt-4 border-t border-hairline">
        <button
          type="button"
          onClick={onSelect}
          aria-pressed={active}
          className="badge-button touch-target"
        >
          <span aria-hidden="true">{active ? '✓' : '○'}</span>
          {active ? '已选择此路线' : '选择此路线'}
        </button>
        <button
          type="button"
          onClick={onAnnounce}
          className="badge-button badge-button--primary touch-target"
        >
          <span aria-hidden="true">🔊</span>
          播报此路线
        </button>
      </div>
    </article>
  )
}

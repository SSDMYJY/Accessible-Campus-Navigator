/*
 * AccessibilityScore.jsx — renders a 1–5 dot rating for a route's
 * accessibility, plus a short text label.
 *
 * A11Y DECISIONS
 *   - The dots are decorative: the authoritative representation is the
 *     aria-label, which screen readers announce as
 *     "无障碍评分 5 星,共 5 星,极佳".
 *   - The container is a <span role="img" aria-label="…"> so it is exposed
 *     to AT as a single image-like unit (rather than five separate dots).
 *   - Empty dots are filled with the hairline color, so they are visible
 *     but clearly "off" — the visual matches the semantic.
 */
import { getAccessibilityScore, describeAccessibilityScore } from '../data/accessibilityScore.js'

export default function AccessibilityScore({ route }) {
  const { score, max, label } = getAccessibilityScore(route)
  const ariaLabel = describeAccessibilityScore(route)

  return (
    <span
      className="inline-flex items-center gap-1.5 align-middle"
      role="img"
      aria-label={ariaLabel}
      title={ariaLabel}
    >
      {/* Dots — purely decorative. The aria-label above is authoritative. */}
      <span className="flex items-center gap-0.5" aria-hidden="true">
        {Array.from({ length: max }).map((_, i) => {
          const filled = i < score
          return (
            <span
              key={i}
              className={filled ? 'score-dot score-dot--filled' : 'score-dot score-dot--empty'}
            />
          )
        })}
      </span>
      <span className="mono text-xs text-ink-soft tracking-tight">
        <span className="text-ink font-500">{score}</span>
        <span className="text-ink-muted">/{max}</span>
      </span>
      <span className="font-serif text-xs text-ink-muted italic">{label}</span>
    </span>
  )
}

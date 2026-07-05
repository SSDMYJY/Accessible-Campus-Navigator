/*
 * accessibilityScore.js — derive a 1–5 "accessibility score" for a route.
 *
 * WHY A SCORE
 *   When a search returns multiple routes between the same pair, users (and
 *   especially screen-reader users listening to a list) benefit from a quick
 *   at-a-glance rating rather than having to parse a wall of feature badges
 *   for every option. The score is also surfaced as an `aria-label` so AT
 *   users hear "无障碍评分 5 星,共 5 星" instead of having to count badges.
 *
 * SCORING RUBRIC (transparent, deterministic)
 *   Weights reflect what matters most to wheelchair users first (no steps =
 *   non-negotiable), then to low-vision / blind users (tactile paving,
 *   elevators with braille buttons).
 *
 *     base                                  1  (any route at all is at least 1)
 *     accessible.stepFree                   +1  (most important — wheels)
 *     accessible.ramp                       +1  (slope, not stairs)
 *     accessible.elevator                   +1  (vertical traversal without stairs)
 *     accessible.tactilePaving              +1  (blind users)
 *
 *   Max possible = 5. Routes without stepFree can never reach 5; the rubric
 *   intentionally makes "step-free" the gating factor for the top tier.
 *
 * NOTE
 *   This is a heuristic, not an engineering spec. The number is a UI affordance
 *   for picking among options, not a certification.
 */

/**
 * @param {object} route  A route object from data/routes.js.
 * @returns {{ score: number, max: number, label: string }}
 *   score  integer 1..5
 *   max    always 5 (so the UI can render "x / 5" consistently)
 *   label  a short Chinese description for aria-label / tooltips
 */
export function getAccessibilityScore(route) {
  if (!route || !route.accessible) return { score: 1, max: 5, label: '未知' }

  let score = 1
  const a = route.accessible
  if (a.stepFree) score += 1
  if (a.ramp) score += 1
  if (a.elevator) score += 1
  if (a.tactilePaving) score += 1

  // Clamp to [1, 5] defensively — never trust arithmetic to stay in range.
  score = Math.max(1, Math.min(5, Math.round(score)))

  const label =
    score >= 5 ? '极佳' :
    score === 4 ? '良好' :
    score === 3 ? '中等' :
    score === 2 ? '有限' :
    '受限'

  return { score, max: 5, label }
}

/**
 * Build a screen-reader-friendly description of the score for use in
 * aria-labels. Examples:
 *   "无障碍评分 5 星,共 5 星,极佳"
 *   "无障碍评分 3 星,共 5 星,中等"
 */
export function describeAccessibilityScore(route) {
  const { score, max, label } = getAccessibilityScore(route)
  return `无障碍评分 ${score} 星,共 ${max} 星,${label}`
}

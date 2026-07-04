/*
 * Header.jsx — top-level banner: masthead + primary nav + global controls.
 *
 * AESTHETIC
 *   Dark ink "masthead" bar with a cream rule, like the nameplate of a
 *   vintage newspaper. The h1 uses Fraunces at its display optical size for
 *   that hand-drawn map-lettering character. The two control buttons render
 *   as cream "transit badges" that press inward on click (3D shadow).
 *
 * VISIBILITY (v4)
 *   This Header is conditionally rendered by App.jsx — it is HIDDEN on the
 *   default voice page and only mounts when the user opens the manual
 *   fallback. Because it mounts fresh each time, the High-Contrast state is
 *   passed in as props (from App's single source of truth) rather than read
 *   from the hook here — otherwise the Header and the footer toggle would
 *   each hold an independent copy of the state and fall out of sync.
 *
 * SEMANTIC STRUCTURE — UNCHANGED
 *   <header> landmark (banner)
 *     <nav aria-label="Primary"> landmark (navigation)
 *       <h1> page title (one h1 per page — WCAG 1.3.1)
 *       <ul> list of controls
 *
 * A11Y NOTES PER CONTROL — UNCHANGED
 *   - High-Contrast toggle uses aria-pressed so AT announces "pressed"/"not
 *     pressed". The label text also changes ("已开启"/"已关闭") so sighted
 *     users get the state without relying on color.
 *   - Voice button uses aria-disabled (not `disabled`) so it stays in the tab
 *     order; the title explains why it is inactive.
 *   - Both buttons meet the 48dp minimum (via .touch-target + .badge-button).
 */
export default function Header({ onAnnounce, speech, highContrast, onToggleHighContrast }) {
  const canAnnounce = Boolean(onAnnounce) && speech.supported

  return (
    <header className="bg-ink text-paper relative">
      {/* Top hairline rule — decorative cream line for masthead feel */}
      <div className="decorative-only h-1 bg-paper/15" aria-hidden="true" />

      <nav
        aria-label="Primary"
        className="max-w-6xl mx-auto px-4 sm:px-8 py-4 sm:py-5 flex flex-wrap items-baseline gap-x-6 gap-y-3"
      >
        {/* Masthead title block */}
        <div className="flex-1 min-w-[16rem]">
          <p className="station-code text-paper/60">ACN · EST. 2026</p>
          <h1
            className="font-display font-700 leading-none mt-1 text-paper"
            style={{
              fontSize: 'clamp(1.5rem, 1rem + 2.2vw, 2.5rem)',
              fontVariationSettings: "'opsz' 144",
              letterSpacing: '-0.03em',
            }}
          >
            无障碍校园导航
            <span
              className="font-400 italic text-rust ml-2"
              style={{ fontVariationSettings: "'opsz' 144" }}
            >
              Campus Navigator
            </span>
          </h1>
        </div>

        {/* Control badges */}
        <ul className="flex items-center gap-2 sm:gap-3" role="list">
          <li>
            <button
              type="button"
              onClick={onToggleHighContrast}
              aria-pressed={highContrast}
              aria-label="切换高对比度模式"
              title="切换高对比度模式"
              className="badge-button touch-target"
            >
              <span aria-hidden="true" className="text-base leading-none">{highContrast ? '◐' : '◑'}</span>
              <span>{highContrast ? '高对比度:已开启' : '高对比度:已关闭'}</span>
            </button>
          </li>

          <li>
            <button
              type="button"
              onClick={canAnnounce ? onAnnounce : undefined}
              aria-disabled={!canAnnounce}
              aria-label="语音播报所选路线"
              title={
                !speech.supported
                  ? '当前浏览器不支持语音播报。'
                  : !onAnnounce
                  ? '请先选择一条路线,然后再进行语音播报。'
                  : '使用语音合成播报所选路线。'
              }
              className="badge-button badge-button--primary touch-target"
            >
              <span aria-hidden="true" className="text-base leading-none">🔊</span>
              <span>{speech.speaking ? '播报中…' : '语音播报路线'}</span>
            </button>
          </li>
        </ul>
      </nav>

      {/* Bottom double-rule for masthead weight */}
      <div className="decorative-only border-t border-paper/25" aria-hidden="true" />
    </header>
  )
}

/*
 * AriaLiveRegion.jsx — two visually-hidden live regions for status + errors.
 *
 * WHY TWO REGIONS?
 *   - Polite region: status updates ("3 routes found", "Announcing route…").
 *     AT announces these when the user pauses — non-interrupting.
 *   - Assertive region (role="alert"): critical errors ("No routes found").
 *     AT interrupts immediately.
 *   Splitting them prevents an assertive error from being silently swallowed
 *   because a polite message is mid-announcement.
 *
 * WHY aria-atomic="true"?
 *   Without it, AT may read only the *changed* text node. With it, AT reads
 *   the whole region content each time, so the user always hears a complete
 *   sentence rather than a fragment.
 *
 * VISUALLY HIDDEN, NOT display:none
 *   display:none / aria-hidden would also hide the region from AT, defeating
 *   the purpose. The .visually-hidden class in a11y.css keeps it in the
 *   accessibility tree while removing it from the visual layout.
 */
export default function AriaLiveRegion({ status, error }) {
  return (
    <>
      <div
        id="status-live"
        aria-live="polite"
        aria-atomic="true"
        className="visually-hidden"
      >
        {status}
      </div>

      <div
        id="error-live"
        aria-live="assertive"
        aria-atomic="true"
        role="alert"
        className="visually-hidden"
      >
        {error}
      </div>
    </>
  )
}

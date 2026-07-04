/*
 * CompassRose.jsx — a purely decorative vintage compass rose SVG.
 *
 * Rendered with aria-hidden="true" so screen readers skip it entirely (it
 * conveys no information). It rotates slowly via the .compass-rose animation
 * in a11y.css. Hidden entirely in high-contrast mode (see .high-contrast
 * .compass-rose { display: none }).
 *
 * The compass is the central motif of the "Editorial Cartographer" theme —
 * it signals wayfinding at a glance.
 */
export default function CompassRose({ className = '', size = 200 }) {
  return (
    <svg
      className={`compass-rose decorative-only ${className}`}
      width={size}
      height={size}
      viewBox="0 0 200 200"
      aria-hidden="true"
      focusable="false"
    >
      {/* Outer ring */}
      <circle cx="100" cy="100" r="92" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.4" />
      <circle cx="100" cy="100" r="80" fill="none" stroke="currentColor" strokeWidth="0.6" opacity="0.3" />

      {/* Tick marks around the ring */}
      <g stroke="currentColor" strokeWidth="0.8" opacity="0.5">
        {Array.from({ length: 32 }).map((_, i) => {
          const angle = (i * 360) / 32
          const isMajor = i % 8 === 0
          const inner = isMajor ? 70 : 76
          const outer = 80
          const rad = (angle * Math.PI) / 180
          const x1 = 100 + inner * Math.cos(rad)
          const y1 = 100 + inner * Math.sin(rad)
          const x2 = 100 + outer * Math.cos(rad)
          const y2 = 100 + outer * Math.sin(rad)
          return (
            <line
              key={i}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              strokeWidth={isMajor ? 1.4 : 0.6}
            />
          )
        })}
      </g>

      {/* Eight-point star — two overlapping squares rotated 45° */}
      <g opacity="0.18" fill="currentColor">
        <polygon points="100,18 108,100 100,182 92,100" />
        <polygon points="18,100 100,92 182,100 100,108" />
        <polygon points="42,42 100,96 158,158 100,104" opacity="0.6" />
        <polygon points="158,42 104,100 42,158 96,100" opacity="0.6" />
      </g>

      {/* Main N-S-E-W pointers (the bold star) */}
      <g>
        <polygon points="100,28 110,100 100,100" fill="currentColor" opacity="0.85" />
        <polygon points="100,28 90,100 100,100" fill="currentColor" opacity="0.55" />
        <polygon points="100,172 110,100 100,100" fill="currentColor" opacity="0.45" />
        <polygon points="100,172 90,100 100,100" fill="currentColor" opacity="0.3" />
        <polygon points="28,100 100,90 100,100" fill="currentColor" opacity="0.55" />
        <polygon points="28,100 100,110 100,100" fill="currentColor" opacity="0.3" />
        <polygon points="172,100 100,90 100,100" fill="currentColor" opacity="0.3" />
        <polygon points="172,100 100,110 100,100" fill="currentColor" opacity="0.55" />
      </g>

      {/* Cardinal letters */}
      <g
        fill="currentColor"
        fontFamily="Fraunces, serif"
        fontWeight="700"
        textAnchor="middle"
      >
        <text x="100" y="20" fontSize="11">N</text>
        <text x="100" y="190" fontSize="11">S</text>
        <text x="13" y="104" fontSize="11">W</text>
        <text x="187" y="104" fontSize="11">E</text>
      </g>

      {/* Center hub */}
      <circle cx="100" cy="100" r="6" fill="none" stroke="currentColor" strokeWidth="1.2" />
      <circle cx="100" cy="100" r="2" fill="currentColor" />
    </svg>
  )
}

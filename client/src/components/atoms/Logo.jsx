// CrocheTa's logo: a smiling ball of yarn with a crochet hook through it and a
// loose tail of thread. An original drawing. `animated` draws the thread in,
// used by the opening splash screen.
export default function Logo({ size = 48, animated = false, title = 'CrocheTa' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" role={title ? "img" : "presentation"} aria-label={title || undefined}
      className={animated ? 'logo-animated' : undefined}>
      {/* loose thread tail */}
      <path className="logo-tail" d="M30 92 C 14 104, 10 84, 22 82 S 34 96, 18 108"
        fill="none" stroke="#E88FA4" strokeWidth="4" strokeLinecap="round" />
      {/* the hook, behind the ball */}
      <g transform="rotate(38 60 60)">
        <rect x="54" y="2" width="12" height="70" rx="6" fill="#F4B3A8" />
        <path d="M54 12 q0 -10 9 -10 q9 0 9 8 q0 5 -5 5 l-3 0 q2 -4 -1 -5 q-4 0 -4 4 z" fill="#F4B3A8" />
        <rect x="54" y="30" width="12" height="7" fill="#E5968A" />
      </g>
      {/* the ball */}
      <circle cx="58" cy="66" r="38" fill="#E88FA4" />
      <g className="logo-wraps" fill="none" stroke="#fff" strokeOpacity="0.55" strokeWidth="3" strokeLinecap="round">
        <path d="M28 46 C 46 36, 72 36, 90 48" />
        <path d="M26 84 C 46 74, 74 76, 90 88" />
        <path d="M44 30 C 34 50, 36 82, 50 102" />
      </g>
      {/* face */}
      <circle cx="47" cy="66" r="4.2" fill="#4A4445" />
      <circle cx="69" cy="66" r="4.2" fill="#4A4445" />
      <circle cx="48.3" cy="64.6" r="1.4" fill="#fff" />
      <circle cx="70.3" cy="64.6" r="1.4" fill="#fff" />
      <ellipse cx="40" cy="76" rx="5" ry="3" fill="#F8C7D2" />
      <ellipse cx="76" cy="76" rx="5" ry="3" fill="#F8C7D2" />
      <path d="M52 76 Q58 82 64 76" fill="none" stroke="#4A4445" strokeWidth="3" strokeLinecap="round" />
    </svg>
  )
}

// CrocheTa's frog mascot, drawn from simple shapes (an original drawing).
export default function Frog({ size = 64, mood = 'happy', title }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" role={title ? 'img' : 'presentation'} aria-label={title}>
      <ellipse cx="32" cy="40" rx="24" ry="18" fill="#8ED0D6" stroke="#4A4445" strokeWidth="2.5" />
      <circle cx="19" cy="22" r="9" fill="#8ED0D6" stroke="#4A4445" strokeWidth="2.5" />
      <circle cx="45" cy="22" r="9" fill="#8ED0D6" stroke="#4A4445" strokeWidth="2.5" />
      <circle cx="19" cy="22" r="3.5" fill="#4A4445" />
      <circle cx="45" cy="22" r="3.5" fill="#4A4445" />
      <circle cx="20.3" cy="20.7" r="1.2" fill="#fff" />
      <circle cx="46.3" cy="20.7" r="1.2" fill="#fff" />
      <ellipse cx="17" cy="42" rx="4.5" ry="3" fill="#F8C7D2" opacity="0.8" />
      <ellipse cx="47" cy="42" rx="4.5" ry="3" fill="#F8C7D2" opacity="0.8" />
      {mood === 'happy'
        ? <path d="M25 41 Q32 48 39 41" fill="none" stroke="#4A4445" strokeWidth="2.5" strokeLinecap="round" />
        : <path d="M26 45 Q32 40 38 45" fill="none" stroke="#4A4445" strokeWidth="2.5" strokeLinecap="round" />}
    </svg>
  )
}

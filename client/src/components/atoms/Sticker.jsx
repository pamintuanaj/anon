import Frog from './Frog.jsx'

// The crochet sticker set. Posts and comments store only the id; the drawing
// lives here, so a sticker can never carry anything but this artwork.
export const STICKERS = [
  { id: 'yarn', label: 'Ball of yarn' },
  { id: 'hook', label: 'Crochet hook' },
  { id: 'frog', label: 'Frog' },
  { id: 'icecream', label: 'Ice cream' },
  { id: 'strawberry', label: 'Strawberry' },
  { id: 'heart', label: 'Heart' },
  { id: 'sparkle', label: 'Sparkle' },
  { id: 'rainbow', label: 'Rainbow' },
]

const INK = '#4A4445'
const line = { stroke: INK, strokeWidth: 2.5, strokeLinecap: 'round', strokeLinejoin: 'round' }

function Art({ id }) {
  switch (id) {
    case 'yarn':
      return (<>
        <circle cx="30" cy="32" r="22" fill="#F8C7D2" {...line} />
        <path d="M12 26 C 24 18, 40 20, 50 30 M10 38 C 24 30, 42 32, 52 42 M24 12 C 16 26, 18 44, 28 54" fill="none" stroke="#fff" strokeOpacity=".75" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M48 48 C 56 56, 62 50, 58 44" fill="none" {...line} stroke="#E88FA4" />
      </>)
    case 'hook':
      return (<>
        <rect x="10" y="28" width="46" height="9" rx="4.5" transform="rotate(-35 32 32)" fill="#8ED0D6" {...line} />
        <path d="M12 50 q-6 -2 -3 -8 q3 -3 6 0" fill="none" {...line} />
        <rect x="34" y="6" width="14" height="9" rx="4" transform="rotate(-35 41 10)" fill="#F4B3A8" {...line} />
      </>)
    case 'icecream':
      return (<>
        <path d="M20 34 L32 60 L44 34 Z" fill="#FBE3B8" {...line} />
        <path d="M26 40 L38 40 M29 48 L35 48" stroke={INK} strokeWidth="1.8" strokeLinecap="round" />
        <circle cx="32" cy="28" r="13" fill="#8ED0D6" {...line} />
        <circle cx="32" cy="17" r="11" fill="#F8C7D2" {...line} />
        <circle cx="32" cy="6.5" r="3" fill="#E26A85" {...line} strokeWidth="2" />
      </>)
    case 'strawberry':
      return (<>
        <path d="M32 58 C 12 46, 8 28, 16 22 C 24 16, 40 16, 48 22 C 56 28, 52 46, 32 58 Z" fill="#E88FA4" {...line} />
        <path d="M20 20 L26 12 L32 18 L38 12 L44 20 Q32 26 20 20 Z" fill="#8ED0D6" {...line} />
        <g fill="#FBE3B8"><circle cx="24" cy="32" r="1.6" /><circle cx="34" cy="30" r="1.6" /><circle cx="42" cy="36" r="1.6" /><circle cx="29" cy="42" r="1.6" /><circle cx="37" cy="46" r="1.6" /></g>
      </>)
    case 'heart':
      return <path d="M32 55 C 6 36, 12 12, 27 15 C 30 16, 31 18, 32 20 C 33 18, 34 16, 37 15 C 52 12, 58 36, 32 55 Z" fill="#E88FA4" {...line} />
    case 'sparkle':
      return (<>
        <path d="M30 6 Q32 26 52 30 Q32 34 30 54 Q28 34 8 30 Q28 26 30 6 Z" fill="#FBE3B8" {...line} />
        <path d="M50 8 Q51 14 57 15 Q51 16 50 22 Q49 16 43 15 Q49 14 50 8 Z" fill="#F8C7D2" {...line} strokeWidth="2" />
      </>)
    case 'rainbow':
      return (<>
        <path d="M6 48 A26 26 0 0 1 58 48" fill="none" stroke="#E88FA4" strokeWidth="7" strokeLinecap="round" />
        <path d="M14 48 A18 18 0 0 1 50 48" fill="none" stroke="#FBE3B8" strokeWidth="7" strokeLinecap="round" />
        <path d="M22 48 A10 10 0 0 1 42 48" fill="none" stroke="#8ED0D6" strokeWidth="7" strokeLinecap="round" />
      </>)
    default:
      return null
  }
}

export default function Sticker({ id, size = 64, title = true }) {
  const info = STICKERS.find((s) => s.id === id)
  if (!info) return null
  if (id === 'frog') return <Frog size={size} title={title ? info.label : undefined} />
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" role={title ? 'img' : 'presentation'} aria-label={title ? info.label : undefined}>
      <Art id={id} />
    </svg>
  )
}

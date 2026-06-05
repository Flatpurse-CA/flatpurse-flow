export default function Bookings() {
  return <div />
}

export function Overlay({ onClose, title, children }: {
  onClose: () => void; title?: string; children: React.ReactNode
}) {
  return <div onClick={onClose}>{title}{children}</div>
}

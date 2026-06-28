import { useSettings, DEFAULT_BG } from '../store/useSettings'

export default function PageBackground() {
  const bgSrc = useSettings((s) => s.bgSrc)

  return (
    <div
      className="pointer-events-none fixed inset-0 left-60 overflow-hidden"
      aria-hidden="true"
      style={{ zIndex: 0 }}
    >
      <img
        src={bgSrc ?? DEFAULT_BG}
        className="absolute inset-0 h-full w-full object-cover"
        style={{ opacity: 0.12 }}
        alt=""
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse at 60% 40%, rgba(20,15,31,0.2) 0%, rgba(20,15,31,0.7) 100%)',
        }}
      />
    </div>
  )
}

import { useSettings, DEFAULT_BANNER, DEFAULT_BG, DEFAULT_SIDEBAR } from '../store/useSettings'

function pickImage(onPick: (dataUrl: string) => void) {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = 'image/*'
  input.onchange = () => {
    const file = input.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => onPick(reader.result as string)
    reader.readAsDataURL(file)
  }
  input.click()
}

export default function SettingsPage() {
  const { bannerSrc, bgSrc, sidebarSrc, setBannerSrc, setBgSrc, setSidebarSrc } = useSettings()

  return (
    <div className="mx-auto max-w-2xl">
      <header className="mb-6">
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-sm text-lavender-300/60">Customize your HertaSchedule.</p>
      </header>

      <div className="glass p-5 space-y-6">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-lavender-300/60">Images</h2>

        <ImageSetting
          label="Today page banner"
          description="Wide banner shown at the top of the Today page."
          src={bannerSrc ?? DEFAULT_BANNER}
          isCustom={bannerSrc !== null}
          previewClass="h-24 w-full"
          objectFit="object-cover"
          onUpload={setBannerSrc}
          onReset={() => setBannerSrc(null)}
        />

        <ImageSetting
          label="Page background"
          description="Faint image shown behind all three pages."
          src={bgSrc ?? DEFAULT_BG}
          isCustom={bgSrc !== null}
          previewClass="h-36 w-full"
          objectFit="object-cover"
          onUpload={setBgSrc}
          onReset={() => setBgSrc(null)}
        />

        <ImageSetting
          label="Sidebar art"
          description="Image or GIF between the title and nav links."
          src={sidebarSrc ?? DEFAULT_SIDEBAR}
          isCustom={sidebarSrc !== null}
          previewClass="h-48 w-40"
          objectFit="object-contain object-top"
          onUpload={setSidebarSrc}
          onReset={() => setSidebarSrc(null)}
        />
      </div>
    </div>
  )
}

function ImageSetting({
  label,
  description,
  src,
  isCustom,
  previewClass,
  objectFit,
  onUpload,
  onReset,
}: {
  label: string
  description: string
  src: string
  isCustom: boolean
  previewClass: string
  objectFit: string
  onUpload: (url: string) => void
  onReset: () => void
}) {
  return (
    <div className="flex gap-5 border-t border-white/6 pt-5 first:border-0 first:pt-0">
      {/* Preview */}
      <div
        className={`${previewClass} shrink-0 overflow-hidden rounded-xl border border-white/10 bg-plum-900/60`}
      >
        <img src={src} className={`h-full w-full ${objectFit}`} alt={label} />
      </div>

      {/* Controls */}
      <div className="flex flex-col justify-center gap-2">
        <p className="text-sm font-semibold text-lavender-100">{label}</p>
        <p className="text-xs text-lavender-300/50">{description}</p>
        <p className="text-xs text-lavender-300/40">
          {isCustom ? 'Custom image active.' : 'Using default image.'}
        </p>
        <div className="mt-1 flex flex-wrap gap-2">
          <button className="btn-primary py-1.5 text-xs" onClick={() => pickImage(onUpload)}>
            Upload image
          </button>
          {isCustom && (
            <button className="btn-ghost py-1.5 text-xs" onClick={onReset}>
              Reset to default
            </button>
          )}
        </div>
        <p className="text-[11px] text-lavender-300/30">JPEG, PNG, GIF, WebP accepted.</p>
      </div>
    </div>
  )
}

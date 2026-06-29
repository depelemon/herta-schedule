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
    <div className="mx-auto max-w-2xl space-y-5">
      <header className="mb-6">
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="mt-0.5 text-sm text-lavender-300/60">Customize your HertaSchedule.</p>
      </header>

      <div className="glass p-5 space-y-8">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-lavender-300/50">Images</h2>

        <ImageSetting
          label="Today page banner"
          description="Wide banner shown at the top of the Today page."
          src={bannerSrc ?? DEFAULT_BANNER}
          isCustom={bannerSrc !== null}
          previewClass="w-full aspect-[5/1]"
          objectFit="object-cover"
          onUpload={setBannerSrc}
          onReset={() => setBannerSrc(null)}
        />

        <ImageSetting
          label="Page background"
          description="Faint image shown behind all three pages."
          src={bgSrc ?? DEFAULT_BG}
          isCustom={bgSrc !== null}
          previewClass="w-full aspect-video"
          objectFit="object-cover"
          onUpload={setBgSrc}
          onReset={() => setBgSrc(null)}
        />

        <ImageSetting
          label="Sidebar art"
          description="Image or GIF between the title and nav links."
          src={sidebarSrc ?? DEFAULT_SIDEBAR}
          isCustom={sidebarSrc !== null}
          previewClass="w-36 aspect-[3/4]"
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
    <div className="border-t border-white/6 pt-6 first:border-0 first:pt-0 space-y-3">
      {/* Preview */}
      <div className={`${previewClass} overflow-hidden rounded-xl bg-plum-900/60`}>
        <img src={src} className={`h-full w-full ${objectFit}`} alt={label} />
      </div>

      {/* Controls */}
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-lavender-100">{label}</p>
          <p className="mt-0.5 text-xs text-lavender-300/50">{description}</p>
          <p className="mt-0.5 text-xs text-lavender-300/40">
            {isCustom ? 'Custom image active.' : 'Using default image.'}
          </p>
          <p className="mt-1 text-[11px] text-lavender-300/30">JPEG, PNG, GIF, WebP accepted.</p>
        </div>
        <div className="flex shrink-0 flex-col gap-2">
          <button className="btn-primary py-1.5 text-xs whitespace-nowrap" onClick={() => pickImage(onUpload)}>
            Upload image
          </button>
          {isCustom && (
            <button className="btn-ghost py-1.5 text-xs whitespace-nowrap" onClick={onReset}>
              Reset to default
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type PointerEvent as ReactPointerEvent,
} from 'react'
import { Camera, Home, ImagePlus, Minus, Plus, Printer, RotateCcw, Trash2 } from 'lucide-react'
import StageLayout from '../components/StageLayout'
import { useAppStore } from '../store/useAppStore'
import { assetUrl } from '../utils/asset'
import {
  commitPrintId,
  getNextPrintId,
  makePrintFileName,
  openPrintDialog,
  savePrintFiles,
  type PrintSpec,
} from '../utils/print'

// 인화지(4x6, 2:3)와 같은 비율. 프레임 PNG도 1200×1800으로 준비되어 있다.
const CAPTURE_WIDTH = 1200
const CAPTURE_HEIGHT = 1800
const PREVIEW_WIDTH = 800
const PREVIEW_HEIGHT = 1200
// 미리보기(800×1200) 좌표 → 인화 이미지(1200×1800) 좌표 변환 배율.
const PRINT_SCALE = CAPTURE_WIDTH / PREVIEW_WIDTH
const PRINT_DPI = 300
const STICKER_BOX = 100
const STICKER_FONT = 88
const PRINT_DONE_DELAY_MS = 10_000

// 비율은 일부러 요구하지 않는다. 카메라에 2:3을 요청하면 드라이버가 잘라내는 대신
// 가로를 눌러 억지로 맞추는(늘어난) 모드를 줄 수 있어서, 원본 비율 그대로 받아
// 촬영 시 우리가 중앙을 2:3으로 잘라낸다.
// 잘라낸 뒤에도 인화 해상도를 유지하도록 세로 해상도만 크게 요청한다(ideal이라 실패하지 않음).
const CAMERA_CONSTRAINTS: MediaStreamConstraints = {
  audio: false,
  video: {
    facingMode: 'user',
    height: { ideal: 1440 },
  },
}

type CameraStatus = 'requesting' | 'ready' | 'unavailable'
type PrintStatus = 'idle' | 'working' | 'printing'
type Sticker = { id: number; symbol: string; x: number; y: number; scale: number; color: string }

const FILTERS = [
  { id: 'normal', label: '기본', css: 'none' },
  { id: 'bright', label: '화사', css: 'brightness(1.13) contrast(0.94) saturate(1.08)' },
  { id: 'warm', label: '따뜻', css: 'sepia(0.2) saturate(1.12) brightness(1.06)' },
  { id: 'cool', label: '청량', css: 'brightness(1.08) contrast(0.96) saturate(0.86)' },
  { id: 'mono', label: '흑백', css: 'grayscale(1) contrast(1.06)' },
] as const

type FrameOption = {
  id: string
  label: string
  image?: string
}

// 촬영 화면에서 실시간으로 덧씌워지는 프레임. 이미지가 없는 'none'이 프레임 미사용.
const FRAMES: FrameOption[] = [
  { id: 'none', label: '없음' },
  { id: 'birthday', label: '생일', image: assetUrl('images/photo-booth-frames/birthday-single-01.png') },
  { id: 'mbti', label: 'MBTI', image: assetUrl('images/photo-booth-frames/mbti-single-01.png') },
  { id: 'princess', label: '공주', image: assetUrl('images/photo-booth-frames/princess-single-01.png') },
]

const STICKERS = [
  { symbol: '♥', color: '#ff6f91', label: '하트' },
  { symbol: '★', color: '#ffd04d', label: '별' },
  { symbol: '✿', color: '#ff9fba', label: '꽃' },
  { symbol: '✦', color: '#8ecbff', label: '반짝이' },
] as const

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error('이미지를 불러오지 못했어요.'))
    image.src = src
  })
}

function cropToPrintRatio(source: string) {
  return new Promise<string>((resolve, reject) => {
    const image = new Image()
    image.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = CAPTURE_WIDTH
      canvas.height = CAPTURE_HEIGHT
      const context = canvas.getContext('2d')
      if (!context) {
        reject(new Error('Canvas is unavailable'))
        return
      }

      const targetRatio = CAPTURE_WIDTH / CAPTURE_HEIGHT
      const sourceRatio = image.naturalWidth / image.naturalHeight
      let sourceX = 0
      let sourceY = 0
      let sourceWidth = image.naturalWidth
      let sourceHeight = image.naturalHeight

      if (sourceRatio > targetRatio) {
        sourceWidth = sourceHeight * targetRatio
        sourceX = (image.naturalWidth - sourceWidth) / 2
      } else {
        sourceHeight = sourceWidth / targetRatio
        sourceY = (image.naturalHeight - sourceHeight) / 2
      }

      context.drawImage(
        image,
        sourceX,
        sourceY,
        sourceWidth,
        sourceHeight,
        0,
        0,
        CAPTURE_WIDTH,
        CAPTURE_HEIGHT,
      )
      resolve(canvas.toDataURL('image/jpeg', 0.94))
    }
    image.onerror = () => reject(new Error('Image could not be loaded'))
    image.src = source
  })
}

// 화면에서 겹쳐 보이던 사진·필터·프레임·장식을 인화용 한 장으로 합성한다.
async function composePhotoPrint(options: {
  photo: string
  filterCss: string
  frameImage?: string
  stickers: Sticker[]
}): Promise<Blob> {
  const canvas = document.createElement('canvas')
  canvas.width = CAPTURE_WIDTH
  canvas.height = CAPTURE_HEIGHT
  const context = canvas.getContext('2d')
  if (!context) throw new Error('인화 이미지를 만들 수 없어요.')

  context.fillStyle = '#ffffff'
  context.fillRect(0, 0, CAPTURE_WIDTH, CAPTURE_HEIGHT)

  const photo = await loadImage(options.photo)
  context.save()
  context.filter = options.filterCss
  context.drawImage(photo, 0, 0, CAPTURE_WIDTH, CAPTURE_HEIGHT)
  context.restore()

  if (options.frameImage) {
    const frame = await loadImage(options.frameImage)
    context.drawImage(frame, 0, 0, CAPTURE_WIDTH, CAPTURE_HEIGHT)
  }

  for (const sticker of options.stickers) {
    context.save()
    context.translate(
      (sticker.x + STICKER_BOX / 2) * PRINT_SCALE,
      (sticker.y + STICKER_BOX / 2) * PRINT_SCALE,
    )
    context.font = `900 ${Math.round(STICKER_FONT * sticker.scale * PRINT_SCALE)}px sans-serif`
    context.fillStyle = sticker.color
    context.textAlign = 'center'
    context.textBaseline = 'middle'
    context.shadowColor = 'rgba(0, 0, 0, 0.18)'
    context.shadowBlur = 7 * PRINT_SCALE
    context.shadowOffsetY = 3 * PRINT_SCALE
    context.fillText(sticker.symbol, 0, 0)
    context.restore()
  }

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob)
      else reject(new Error('인화 이미지를 저장할 수 없어요.'))
    }, 'image/png')
  })
}

// 웨딩 사진과 같은 print-results 규격. 예산 기반 흑백 전환은 쓰지 않는다.
function makePhotoPrintSpec(
  printId: number,
  frameId: string,
): PrintSpec & { source: string; photoFrameId: string } {
  return {
    printId,
    imageFile: makePrintFileName(printId, 'png'),
    copies: 1,
    grayscale: false,
    size: '4x6',
    sheetRatio: '2:3',
    pixelWidth: CAPTURE_WIDTH,
    pixelHeight: CAPTURE_HEIGHT,
    dpi: PRINT_DPI,
    rotationDegrees: 0,
    frameRatio: '2:3',
    source: 'photoBooth',
    photoFrameId: frameId,
  }
}

function FramePicker({
  frameId,
  onSelect,
  compact = false,
}: {
  frameId: string
  onSelect: (id: string) => void
  compact?: boolean
}) {
  const thumbClass = compact ? 'h-[66px] w-[44px]' : 'h-[96px] w-[64px]'
  return (
    <div className="flex items-center gap-3">
      {FRAMES.map((frame) => (
        <button
          key={frame.id}
          type="button"
          onClick={() => onSelect(frame.id)}
          aria-label={`${frame.label} 프레임`}
          aria-pressed={frameId === frame.id}
          title={frame.label}
          className="flex flex-col items-center gap-1"
        >
          <div
            className={`${thumbClass} flex items-center justify-center overflow-hidden rounded border-4 bg-white bg-contain bg-center bg-no-repeat ${frameId === frame.id ? 'border-pink-400' : 'border-gray-200'}`}
            style={{ backgroundImage: frame.image ? `url(${frame.image})` : undefined }}
          >
            {!frame.image && <span className="text-3xl font-black text-gray-300">✕</span>}
          </div>
          {!compact && (
            <span
              className={`text-xl font-black ${frameId === frame.id ? 'text-pink-500' : 'text-gray-500'}`}
            >
              {frame.label}
            </span>
          )}
        </button>
      ))}
    </div>
  )
}

export default function PhotoBooth() {
  const setStage = useAppStore((state) => state.setStage)
  const reset = useAppStore((state) => state.reset)
  const videoRef = useRef<HTMLVideoElement>(null)
  const stageRef = useRef<HTMLDivElement>(null)
  const uploadInputRef = useRef<HTMLInputElement>(null)
  const countdownTimerRef = useRef<number | null>(null)
  const stickerIdRef = useRef(0)
  const dragRef = useRef<{ id: number; offsetX: number; offsetY: number } | null>(null)

  const [cameraStatus, setCameraStatus] = useState<CameraStatus>('requesting')
  const [countdown, setCountdown] = useState<number | null>(null)
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null)
  const [filterId, setFilterId] = useState<(typeof FILTERS)[number]['id']>('normal')
  const [frameId, setFrameId] = useState('none')
  const [stickers, setStickers] = useState<Sticker[]>([])
  const [selectedStickerId, setSelectedStickerId] = useState<number | null>(null)
  const [printId, setPrintId] = useState(() => getNextPrintId())
  const [printStatus, setPrintStatus] = useState<PrintStatus>('idle')
  const [printError, setPrintError] = useState<string | null>(null)
  const [cameraInfo, setCameraInfo] = useState<string | null>(null)

  const selectedFilter = FILTERS.find((filter) => filter.id === filterId) ?? FILTERS[0]
  const selectedFrame = FRAMES.find((frame) => frame.id === frameId) ?? FRAMES[0]

  useEffect(() => {
    let stream: MediaStream | null = null
    let cancelled = false

    async function connectCamera() {
      if (!navigator.mediaDevices?.getUserMedia) {
        setCameraStatus('unavailable')
        return
      }
      try {
        stream = await navigator.mediaDevices.getUserMedia(CAMERA_CONSTRAINTS)
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop())
          return
        }
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          await videoRef.current.play()
        }

        // 카메라가 실제로 주는 해상도/비율. 세팅이 늘어난 화면을 만드는지 여기서 확인한다.
        const settings = stream.getVideoTracks()[0]?.getSettings()
        if (settings?.width && settings.height) {
          const ratio = (settings.width / settings.height).toFixed(3)
          console.info(`[한 컷 사진관] 카메라 ${settings.width}×${settings.height} (비율 ${ratio})`)
          setCameraInfo(`${settings.width}×${settings.height} · 비율 ${ratio}`)
        }

        setCameraStatus('ready')
      } catch {
        if (!cancelled) setCameraStatus('unavailable')
      }
    }

    void connectCamera()
    return () => {
      cancelled = true
      if (countdownTimerRef.current !== null) window.clearInterval(countdownTimerRef.current)
      stream?.getTracks().forEach((track) => track.stop())
    }
  }, [])

  // 인쇄를 시작하면 안내 화면을 보여주고 잠시 뒤 처음 화면으로 돌아간다.
  useEffect(() => {
    if (printStatus !== 'printing') return undefined
    const timer = window.setTimeout(() => reset(), PRINT_DONE_DELAY_MS)
    return () => window.clearTimeout(timer)
  }, [printStatus, reset])

  const capture = useCallback(() => {
    const video = videoRef.current
    if (!video || video.videoWidth === 0 || video.videoHeight === 0) return

    const canvas = document.createElement('canvas')
    canvas.width = CAPTURE_WIDTH
    canvas.height = CAPTURE_HEIGHT
    const context = canvas.getContext('2d')
    if (!context) return

    const targetRatio = CAPTURE_WIDTH / CAPTURE_HEIGHT
    const sourceRatio = video.videoWidth / video.videoHeight
    let sourceX = 0
    let sourceY = 0
    let sourceWidth = video.videoWidth
    let sourceHeight = video.videoHeight

    if (sourceRatio > targetRatio) {
      sourceWidth = sourceHeight * targetRatio
      sourceX = (video.videoWidth - sourceWidth) / 2
    } else {
      sourceHeight = sourceWidth / targetRatio
      sourceY = (video.videoHeight - sourceHeight) / 2
    }

    context.imageSmoothingEnabled = true
    context.imageSmoothingQuality = 'high'
    context.translate(CAPTURE_WIDTH, 0)
    context.scale(-1, 1)
    context.drawImage(video, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, CAPTURE_WIDTH, CAPTURE_HEIGHT)
    setCapturedPhoto(canvas.toDataURL('image/jpeg', 0.94))
  }, [])

  const startCountdown = () => {
    if (cameraStatus !== 'ready' || countdown !== null) return
    let value = 3
    setCountdown(value)
    countdownTimerRef.current = window.setInterval(() => {
      value -= 1
      if (value > 0) {
        setCountdown(value)
        return
      }
      if (countdownTimerRef.current !== null) {
        window.clearInterval(countdownTimerRef.current)
        countdownTimerRef.current = null
      }
      setCountdown(null)
      capture()
    }, 1000)
  }

  const resetPhoto = () => {
    if (countdownTimerRef.current !== null) {
      window.clearInterval(countdownTimerRef.current)
      countdownTimerRef.current = null
    }
    setCountdown(null)
    setCapturedPhoto(null)
    setFilterId('normal')
    setStickers([])
    setSelectedStickerId(null)
    setPrintError(null)
  }

  const useTestPhoto = async () => {
    try {
      setCapturedPhoto(await cropToPrintRatio(assetUrl('images/intro-results/intro-result-01.png')))
    } catch {
      setCapturedPhoto(assetUrl('images/intro-results/intro-result-01.png'))
    }
  }

  const uploadPhoto = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const source = URL.createObjectURL(file)
    try {
      setCapturedPhoto(await cropToPrintRatio(source))
    } finally {
      URL.revokeObjectURL(source)
      event.target.value = ''
    }
  }

  const printPhoto = async () => {
    if (!capturedPhoto || printStatus !== 'idle') return
    setPrintStatus('working')
    setPrintError(null)
    try {
      const imageBlob = await composePhotoPrint({
        photo: capturedPhoto,
        filterCss: selectedFilter.css,
        frameImage: selectedFrame.image,
        stickers,
      })

      // 폴더 보관에 실패해도 인쇄는 그대로 진행한다(저장된 경우에만 번호를 소진).
      try {
        await savePrintFiles(imageBlob, makePhotoPrintSpec(printId, frameId))
        commitPrintId(printId)
        setPrintId(printId + 1)
      } catch {
        // 저장 실패는 인쇄를 막지 않는다.
      }

      await openPrintDialog(imageBlob)
      setPrintStatus('printing')
    } catch (error) {
      setPrintError(error instanceof Error ? error.message : '인쇄 중 문제가 생겼어요.')
      setPrintStatus('idle')
    }
  }

  const addSticker = (symbol: string, color: string) => {
    stickerIdRef.current += 1
    const offset = (stickerIdRef.current % 4) * 36
    const sticker: Sticker = {
      id: stickerIdRef.current,
      symbol,
      color,
      x: 280 + offset,
      y: 500 + offset,
      scale: 1,
    }
    setStickers((current) => [...current, sticker])
    setSelectedStickerId(sticker.id)
  }

  const updateSelectedSticker = (update: (sticker: Sticker) => Sticker) => {
    if (selectedStickerId === null) return
    setStickers((current) =>
      current.map((sticker) => (sticker.id === selectedStickerId ? update(sticker) : sticker)),
    )
  }

  const deleteSelectedSticker = () => {
    if (selectedStickerId === null) return
    setStickers((current) => current.filter((sticker) => sticker.id !== selectedStickerId))
    setSelectedStickerId(null)
  }

  // KioskFrame이 화면 전체를 scale()하므로 포인터 좌표를 미리보기(800×1200) 좌표로 환산한다.
  const toStageCoordinates = (clientX: number, clientY: number) => {
    const rect = stageRef.current?.getBoundingClientRect()
    if (!rect || rect.width === 0) return { x: clientX, y: clientY }
    const scale = rect.width / PREVIEW_WIDTH
    return { x: (clientX - rect.left) / scale, y: (clientY - rect.top) / scale }
  }

  const startStickerDrag = (event: ReactPointerEvent<HTMLButtonElement>, sticker: Sticker) => {
    event.currentTarget.setPointerCapture(event.pointerId)
    const point = toStageCoordinates(event.clientX, event.clientY)
    dragRef.current = { id: sticker.id, offsetX: point.x - sticker.x, offsetY: point.y - sticker.y }
    setSelectedStickerId(sticker.id)
  }

  const moveSticker = (event: ReactPointerEvent<HTMLButtonElement>) => {
    const drag = dragRef.current
    if (!drag) return
    const point = toStageCoordinates(event.clientX, event.clientY)
    const nextX = Math.min(PREVIEW_WIDTH - STICKER_BOX, Math.max(0, point.x - drag.offsetX))
    const nextY = Math.min(PREVIEW_HEIGHT - STICKER_BOX, Math.max(0, point.y - drag.offsetY))
    setStickers((current) =>
      current.map((sticker) => (sticker.id === drag.id ? { ...sticker, x: nextX, y: nextY } : sticker)),
    )
  }

  if (printStatus === 'printing') {
    return (
      <StageLayout showReset={false}>
        <div className="flex flex-1 flex-col items-center justify-center text-center">
          <div className="w-full rounded-3xl border-4 border-pink-200 bg-white px-10 py-20 shadow-sm">
            <Printer aria-hidden="true" className="mx-auto h-24 w-24 text-pink-400" strokeWidth={1.8} />
            <p className="font-ryuryu mt-8 text-[92px] font-black text-pink-500">인쇄 중입니다</p>
            <p className="mt-10 text-4xl font-bold text-gray-800">
              사진이 바로 여기에서 나옵니다. 잠시만 기다려 주세요.
            </p>
            <p className="mt-8 text-3xl font-semibold text-gray-500">
              10초 후 처음 화면으로 돌아갑니다.
            </p>
          </div>
        </div>
      </StageLayout>
    )
  }

  return (
    <StageLayout showReset={false}>
      <div className="relative flex h-full flex-col items-center text-center">
        <input
          ref={uploadInputRef}
          type="file"
          accept="image/*"
          onChange={uploadPhoto}
          className="hidden"
        />
        <button
          type="button"
          onClick={() => setStage('intro')}
          aria-label="메인 화면으로 돌아가기"
          title="메인 화면"
          className="absolute left-5 top-5 z-30 flex h-16 w-16 items-center justify-center rounded-full bg-white text-gray-600 shadow-md active:bg-gray-100"
        >
          <Home aria-hidden="true" className="h-8 w-8" strokeWidth={2.5} />
        </button>

        <header className="shrink-0 pt-2">
          <p className="text-2xl font-black tracking-[0.22em] text-pink-400">PHOTO STUDIO</p>
          <h1 className="font-ryuryu mt-1 text-[66px] font-black leading-tight text-gray-800">한 컷 사진관</h1>
          <p className="mt-1 text-[28px] font-bold text-gray-500">
            {capturedPhoto ? '마음에 들면 인쇄해서 가져가세요' : '프레임을 고르고 화면을 보며 찍어보세요'}
          </p>
        </header>

        <main className="mt-3 flex min-h-0 w-full flex-1 flex-col items-center">
          <div
            ref={stageRef}
            className="relative shrink-0 overflow-hidden rounded-lg bg-gray-900 shadow-[0_24px_60px_rgba(55,65,81,0.25)]"
            style={{ width: PREVIEW_WIDTH, height: PREVIEW_HEIGHT }}
            onPointerDown={(event) => {
              if (event.target === event.currentTarget) setSelectedStickerId(null)
            }}
          >
            <video
              ref={videoRef}
              muted
              playsInline
              style={{ filter: selectedFilter.css }}
              className={`absolute inset-0 h-full w-full scale-x-[-1] object-cover ${capturedPhoto ? 'invisible' : 'visible'}`}
            />

            {capturedPhoto && (
              <img
                src={capturedPhoto}
                alt="촬영한 한 컷"
                draggable={false}
                style={{ filter: selectedFilter.css }}
                className="absolute inset-0 h-full w-full select-none object-cover"
              />
            )}

            {/* 촬영 전에도 그대로 덧씌워져 결과물과 같은 화면을 보여준다. */}
            {selectedFrame.image && (
              <img
                src={selectedFrame.image}
                alt=""
                draggable={false}
                className="pointer-events-none absolute inset-0 z-[5] h-full w-full select-none"
              />
            )}

            {cameraStatus !== 'ready' && !capturedPhoto && (
              <div className="absolute inset-0 z-[6] flex flex-col items-center justify-center bg-gray-800 px-16 text-white">
                <Camera aria-hidden="true" className="h-24 w-24 text-white/45" strokeWidth={1.6} />
                <p className="mt-8 text-4xl font-black">
                  {cameraStatus === 'requesting' ? '카메라를 연결하고 있어요' : '카메라를 확인해 주세요'}
                </p>
                <p className="mt-4 text-3xl font-semibold leading-relaxed text-white/65">
                  {cameraStatus === 'requesting' ? '잠시만 기다려 주세요' : '카메라 연결과 브라우저 권한을 확인해 주세요'}
                </p>
                {cameraStatus === 'unavailable' && (
                  <div className="mt-10 flex gap-5">
                    <button
                      type="button"
                      onClick={() => uploadInputRef.current?.click()}
                      className="flex h-16 items-center gap-3 rounded-lg bg-white px-7 text-[24px] font-black text-gray-700 shadow-md active:bg-gray-100"
                    >
                      <ImagePlus className="h-7 w-7" strokeWidth={2.5} />
                      사진 불러오기
                    </button>
                    <button
                      type="button"
                      onClick={() => { void useTestPhoto() }}
                      className="flex h-16 items-center gap-3 rounded-lg bg-pink-400 px-7 text-[24px] font-black text-white shadow-md active:bg-pink-500"
                    >
                      <Camera className="h-7 w-7" strokeWidth={2.5} />
                      테스트 사진 사용
                    </button>
                  </div>
                )}
              </div>
            )}

            {capturedPhoto && stickers.map((sticker) => (
              <button
                key={sticker.id}
                type="button"
                onPointerDown={(event) => startStickerDrag(event, sticker)}
                onPointerMove={moveSticker}
                onPointerUp={() => { dragRef.current = null }}
                onPointerCancel={() => { dragRef.current = null }}
                aria-label="장식 이동"
                className={`absolute z-10 flex touch-none select-none items-center justify-center rounded-full border-4 bg-transparent leading-none ${selectedStickerId === sticker.id ? 'border-white/90' : 'border-transparent'}`}
                style={{
                  left: sticker.x,
                  top: sticker.y,
                  width: STICKER_BOX,
                  height: STICKER_BOX,
                  color: sticker.color,
                  fontSize: STICKER_FONT,
                  transform: `scale(${sticker.scale})`,
                  transformOrigin: 'center',
                  textShadow: '0 3px 7px rgba(0, 0, 0, 0.18)',
                }}
              >
                {sticker.symbol}
              </button>
            ))}

            {countdown !== null && (
              <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/25">
                <span className="font-ryuryu text-[220px] font-black leading-none text-white drop-shadow-2xl">{countdown}</span>
              </div>
            )}
            {!capturedPhoto && !selectedFrame.image && (
              <div className="pointer-events-none absolute inset-7 rounded border-4 border-white/75" />
            )}
          </div>

          {capturedPhoto ? (
            <section className="mt-3 w-[800px] rounded-lg bg-white px-5 py-3 shadow-sm">
              <div className="flex items-center gap-2">
                <span className="mr-1 text-[25px] font-black text-gray-700">필터</span>
                {FILTERS.map((filter) => (
                  <button
                    key={filter.id}
                    type="button"
                    onClick={() => setFilterId(filter.id)}
                    className={`h-12 min-w-[74px] rounded px-3 text-xl font-black ${filterId === filter.id ? 'bg-pink-400 text-white' : 'bg-gray-100 text-gray-600'}`}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>

              <div className="mt-3 flex items-center gap-3 border-t border-gray-200 pt-3">
                <span className="mr-1 text-[25px] font-black text-gray-700">프레임</span>
                <FramePicker frameId={frameId} onSelect={setFrameId} compact />
              </div>

              <div className="mt-3 flex items-center justify-between gap-4 border-t border-gray-200 pt-3">
                <div className="flex items-center gap-2">
                  <span className="mr-1 text-[25px] font-black text-gray-700">장식</span>
                  {STICKERS.map((sticker) => (
                    <button
                      key={sticker.label}
                      type="button"
                      onClick={() => addSticker(sticker.symbol, sticker.color)}
                      aria-label={`${sticker.label} 추가`}
                      title={sticker.label}
                      className="flex h-12 w-14 items-center justify-center rounded bg-gray-100 text-[34px] font-black leading-none"
                      style={{ color: sticker.color }}
                    >
                      {sticker.symbol}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => updateSelectedSticker((sticker) => ({ ...sticker, scale: Math.max(0.55, sticker.scale - 0.15) }))}
                    disabled={selectedStickerId === null}
                    aria-label="선택한 장식 축소"
                    title="축소"
                    className="flex h-12 w-12 items-center justify-center rounded bg-sky-100 text-sky-600 disabled:opacity-30"
                  >
                    <Minus className="h-7 w-7" strokeWidth={3} />
                  </button>
                  <button
                    type="button"
                    onClick={() => updateSelectedSticker((sticker) => ({ ...sticker, scale: Math.min(2.2, sticker.scale + 0.15) }))}
                    disabled={selectedStickerId === null}
                    aria-label="선택한 장식 확대"
                    title="확대"
                    className="flex h-12 w-12 items-center justify-center rounded bg-sky-100 text-sky-600 disabled:opacity-30"
                  >
                    <Plus className="h-7 w-7" strokeWidth={3} />
                  </button>
                  <button
                    type="button"
                    onClick={deleteSelectedSticker}
                    disabled={selectedStickerId === null}
                    aria-label="선택한 장식 삭제"
                    title="삭제"
                    className="flex h-12 w-12 items-center justify-center rounded bg-pink-100 text-pink-500 disabled:opacity-30"
                  >
                    <Trash2 className="h-7 w-7" strokeWidth={2.6} />
                  </button>
                </div>
              </div>
            </section>
          ) : (
            <>
              <section className="mt-3 flex w-[800px] items-center justify-center gap-4 rounded-lg bg-white px-5 py-3 shadow-sm">
                <span className="text-[25px] font-black text-gray-700">프레임</span>
                <FramePicker frameId={frameId} onSelect={setFrameId} />
              </section>
              <button
                type="button"
                onClick={startCountdown}
                disabled={cameraStatus !== 'ready' || countdown !== null}
                aria-label="사진 촬영"
                title="촬영"
                className="mt-3 flex h-28 w-28 items-center justify-center rounded-full border-[10px] border-white bg-pink-400 text-white shadow-lg active:bg-pink-500 disabled:bg-gray-300"
              >
                <Camera aria-hidden="true" className="h-12 w-12" strokeWidth={2.4} />
              </button>
              {/* 카메라 세팅 확인용. 개발 모드에서만 보이고 키오스크 빌드에는 나오지 않는다. */}
              {import.meta.env.DEV && cameraInfo && (
                <p className="mt-2 text-xl font-semibold text-gray-400">카메라 {cameraInfo}</p>
              )}
            </>
          )}
        </main>

        {capturedPhoto && (
          <div className="mt-3 flex w-[800px] shrink-0 flex-col items-center gap-2">
            {printError && (
              <p className="w-full rounded-lg bg-white px-6 py-3 text-2xl font-semibold text-red-500 shadow-sm">
                {printError}
              </p>
            )}
            <div className="flex w-full items-center gap-4">
              <button
                type="button"
                onClick={resetPhoto}
                disabled={printStatus !== 'idle'}
                className="flex h-[88px] flex-1 items-center justify-center gap-3 rounded-lg bg-white text-[30px] font-black text-gray-600 shadow-md active:bg-gray-100 disabled:opacity-40"
              >
                <RotateCcw aria-hidden="true" className="h-8 w-8" strokeWidth={2.6} />
                다시 찍기
              </button>
              <button
                type="button"
                onClick={() => { void printPhoto() }}
                disabled={printStatus !== 'idle'}
                className="flex h-[88px] flex-[1.4] items-center justify-center gap-3 rounded-lg bg-pink-400 text-[30px] font-black text-white shadow-md active:bg-pink-500 disabled:bg-gray-300"
              >
                <Printer aria-hidden="true" className="h-9 w-9" strokeWidth={2.6} />
                {printStatus === 'working' ? '준비 중...' : '인쇄하기'}
              </button>
            </div>
          </div>
        )}
      </div>
    </StageLayout>
  )
}

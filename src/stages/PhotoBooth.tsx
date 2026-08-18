import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type PointerEvent as ReactPointerEvent,
} from 'react'
import { Camera, Home, ImagePlus, Printer, RotateCcw, RotateCw } from 'lucide-react'
import StageLayout from '../components/StageLayout'
import { useAppStore } from '../store/useAppStore'
import { assetUrl } from '../utils/asset'
import { findItem } from '../data/items'
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
// 미리보기(800×1200) 기준 스티커의 긴 변 길이. 원본 비율은 그대로 유지한다.
const STICKER_BASE_SIZE = 130
// 스티커가 작아도 네 모서리 손잡이를 누를 수 있도록 보장하는 최소 조작 영역.
const STICKER_MIN_CONTROL = 112
const STICKER_MIN_SCALE = 0.5
const STICKER_MAX_SCALE = 2
const PRINT_DONE_DELAY_MS = 10_000
// 촬영 버튼을 누른 뒤 셔터가 눌리기까지의 카운트다운(초).
const COUNTDOWN_SECONDS = 10
// 정지 사진 촬영이 이 시간 안에 끝나지 않으면 영상 프레임으로 되돌아간다.
const STILL_PHOTO_TIMEOUT_MS = 4_000

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
type Sticker = { id: number; image: string; width: number; height: number; x: number; y: number; scale: number; rotation: number }
type StickerRotationDrag = { id: number; centerX: number; centerY: number; lastAngle: number; rotation: number }

const FILTERS = [
  { id: 'normal', label: '기본', css: 'none' },
  // 밝고 부드럽게. 인물 사진에서 가장 무난하게 잘 나온다.
  { id: 'glow', label: '뽀샤시', css: 'brightness(1.16) contrast(0.9) saturate(1.06)' },
  // 색과 대비를 올려 또렷하게.
  { id: 'vivid', label: '선명', css: 'contrast(1.18) saturate(1.32) brightness(1.03)' },
  // 검정을 살짝 들어올린 필름 느낌.
  { id: 'film', label: '필름', css: 'sepia(0.14) contrast(0.9) brightness(1.07) saturate(1.04)' },
  // 노을빛으로 따뜻하게.
  { id: 'sunset', label: '노을', css: 'sepia(0.3) saturate(1.3) brightness(1.05) hue-rotate(-8deg)' },
  { id: 'mono', label: '흑백', css: 'grayscale(1) contrast(1.12) brightness(1.04)' },
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
  { id: 'frame01', label: 'MBTI', image: assetUrl('images/photo-booth-frames/frame01.png') },
  { id: 'frame02', label: '공주', image: assetUrl('images/photo-booth-frames/frame02.png') },
  { id: 'frame03', label: '자기소개', image: assetUrl('images/photo-booth-frames/frame03.png') },
  { id: 'frame04', label: '클로버', image: assetUrl('images/photo-booth-frames/frame04.png') },
]

// 꾸미기 단계 스티커 중 A조(sticker00~16)만 쓴다. 선 없는 파스텔 음영 계열이라
// 서로 그림체가 맞고, 사진 위에 얹어도 인물을 해치지 않는다.
const STICKER_ITEM_IDS = [
  'sticker00', 'sticker04', 'sticker02', 'sticker05', 'sticker08',
  'sticker03', 'sticker06', 'sticker01', 'sticker15', 'sticker16',
]

const STICKERS = STICKER_ITEM_IDS.flatMap((itemId) => {
  const item = findItem(itemId)
  if (!item?.image) return []
  // 원본 비율을 지키면서 긴 변을 STICKER_BASE_SIZE로 맞춘다.
  const ratio = STICKER_BASE_SIZE / Math.max(item.defaultWidth, item.defaultHeight)
  return [{
    id: itemId,
    label: item.name,
    image: item.image,
    width: Math.round(item.defaultWidth * ratio),
    height: Math.round(item.defaultHeight * ratio),
  }]
})

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error('이미지를 불러오지 못했어요.'))
    image.src = src
  })
}

// 셔터를 누르는 순간에만 쓰는 정지 사진 경로. 웹캠은 대개 영상 스트림보다 사진 해상도가
// 높고 압축 잡티도 적어서, 확대 배율이 줄어 인화 화질이 좋아진다.
// 지원하지 않거나 실패하면 null을 돌려주고 호출한 쪽이 영상 프레임으로 되돌아간다.
async function takeStillPhoto(track: MediaStreamTrack): Promise<ImageBitmap | null> {
  const ImageCaptureCtor = (window as unknown as {
    ImageCapture?: new (track: MediaStreamTrack) => {
      takePhoto: (settings?: { imageWidth?: number; imageHeight?: number }) => Promise<Blob>
      getPhotoCapabilities: () => Promise<{
        imageWidth?: { max?: number }
        imageHeight?: { max?: number }
      }>
    }
  }).ImageCapture
  if (!ImageCaptureCtor) return null

  try {
    const imageCapture = new ImageCaptureCtor(track)
    let settings: { imageWidth?: number; imageHeight?: number } | undefined
    try {
      const capabilities = await imageCapture.getPhotoCapabilities()
      const maxWidth = capabilities?.imageWidth?.max
      const maxHeight = capabilities?.imageHeight?.max
      if (maxWidth && maxHeight) settings = { imageWidth: maxWidth, imageHeight: maxHeight }
    } catch {
      // 사진 성능을 못 읽으면 카메라 기본값으로 찍는다.
    }
    // 드라이버가 응답하지 않으면 촬영 자체가 멈추므로 시간 제한을 둔다.
    const blob = await Promise.race([
      imageCapture.takePhoto(settings),
      new Promise<null>((resolve) => window.setTimeout(() => resolve(null), STILL_PHOTO_TIMEOUT_MS)),
    ])
    if (!blob) return null
    return await createImageBitmap(blob)
  } catch {
    return null
  }
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
    const image = await loadImage(sticker.image)
    const width = sticker.width * sticker.scale * PRINT_SCALE
    const height = sticker.height * sticker.scale * PRINT_SCALE
    // 화면에서는 가운데를 기준으로 확대되므로 인화에서도 중심을 맞춘다.
    const centerX = (sticker.x + sticker.width / 2) * PRINT_SCALE
    const centerY = (sticker.y + sticker.height / 2) * PRINT_SCALE

    context.save()
    context.shadowColor = 'rgba(0, 0, 0, 0.18)'
    context.shadowBlur = 7 * PRINT_SCALE
    context.shadowOffsetY = 3 * PRINT_SCALE
    // 화면과 같이 중심을 기준으로 회전시킨다.
    context.translate(centerX, centerY)
    context.rotate((sticker.rotation * Math.PI) / 180)
    context.drawImage(image, -width / 2, -height / 2, width, height)
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
  const streamRef = useRef<MediaStream | null>(null)
  const stageRef = useRef<HTMLDivElement>(null)
  const uploadInputRef = useRef<HTMLInputElement>(null)
  const countdownTimerRef = useRef<number | null>(null)
  const stickerIdRef = useRef(0)
  const dragRef = useRef<{ id: number; offsetX: number; offsetY: number } | null>(null)
  const rotationDragRef = useRef<StickerRotationDrag | null>(null)

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
        streamRef.current = stream
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
      streamRef.current = null
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

  const capture = useCallback(async () => {
    const video = videoRef.current
    if (!video || video.videoWidth === 0 || video.videoHeight === 0) return

    const videoWidth = video.videoWidth
    const videoHeight = video.videoHeight
    const videoRatio = videoWidth / videoHeight

    // 셔터 순간에는 정지 사진을 우선 사용한다(없으면 영상 프레임).
    const track = streamRef.current?.getVideoTracks()[0] ?? null
    const still = track ? await takeStillPhoto(track) : null

    let source: CanvasImageSource = video
    let sourceWidth = videoWidth
    let sourceHeight = videoHeight
    let sourceX = 0
    let sourceY = 0

    if (still && still.width > 0 && still.height > 0) {
      const stillRatio = still.width / still.height
      // 정지 사진의 화각이 미리보기와 다를 수 있으므로, 먼저 영상과 같은 비율로 가운데를
      // 잘라 화면에서 보던 구도를 그대로 맞춘다.
      let usableWidth = still.width
      let usableHeight = still.height
      if (stillRatio > videoRatio) {
        usableWidth = still.height * videoRatio
      } else if (stillRatio < videoRatio) {
        usableHeight = still.width / videoRatio
      }
      // 화소 수가 실제로 늘어날 때만 정지 사진을 쓴다.
      if (usableWidth > videoWidth) {
        source = still
        sourceWidth = usableWidth
        sourceHeight = usableHeight
        sourceX = (still.width - usableWidth) / 2
        sourceY = (still.height - usableHeight) / 2
      }
    }

    // 여기서부터는 어떤 원본이든 동일하게 가운데를 2:3으로 잘라낸다.
    const targetRatio = CAPTURE_WIDTH / CAPTURE_HEIGHT
    const currentRatio = sourceWidth / sourceHeight
    if (currentRatio > targetRatio) {
      const cropped = sourceHeight * targetRatio
      sourceX += (sourceWidth - cropped) / 2
      sourceWidth = cropped
    } else {
      const cropped = sourceWidth / targetRatio
      sourceY += (sourceHeight - cropped) / 2
      sourceHeight = cropped
    }

    const canvas = document.createElement('canvas')
    canvas.width = CAPTURE_WIDTH
    canvas.height = CAPTURE_HEIGHT
    const context = canvas.getContext('2d')
    if (!context) return

    context.imageSmoothingEnabled = true
    context.imageSmoothingQuality = 'high'
    context.translate(CAPTURE_WIDTH, 0)
    context.scale(-1, 1)
    context.drawImage(source, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, CAPTURE_WIDTH, CAPTURE_HEIGHT)
    if (still) still.close()

    // 최종 인화가 PNG이므로 중간 단계에서 JPEG로 손실을 만들지 않는다.
    setCapturedPhoto(canvas.toDataURL('image/png'))

    if (import.meta.env.DEV) {
      const usedStill = source !== video
      console.info(
        `[한 컷 사진관] 촬영 원본 ${usedStill ? '정지 사진' : '영상 프레임'} · ` +
          `잘라낸 영역 ${Math.round(sourceWidth)}×${Math.round(sourceHeight)} → ${CAPTURE_WIDTH}×${CAPTURE_HEIGHT} ` +
          `(${(CAPTURE_WIDTH / sourceWidth).toFixed(2)}배)`,
      )
    }
  }, [])

  const startCountdown = () => {
    if (cameraStatus !== 'ready' || countdown !== null) return
    let value = COUNTDOWN_SECONDS
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
      void capture()
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

      // 서버가 저장과 인쇄를 함께 처리한다. 폴더 보관에 실패해도 인쇄는 그대로 진행한다
      // (저장된 경우에만 번호를 소진).
      let printedByServer = false
      try {
        const result = await savePrintFiles(imageBlob, makePhotoPrintSpec(printId, frameId))
        printedByServer = result.printed === true
        commitPrintId(printId)
        setPrintId(printId + 1)
      } catch {
        // 저장 실패는 인쇄를 막지 않는다.
      }

      // 서버가 프린터로 직접 보냈으면 브라우저 인쇄 대화상자를 열지 않는다.
      if (!printedByServer) {
        await openPrintDialog(imageBlob)
      }
      setPrintStatus('printing')
    } catch (error) {
      setPrintError(error instanceof Error ? error.message : '인쇄 중 문제가 생겼어요.')
      setPrintStatus('idle')
    }
  }

  const addSticker = (option: (typeof STICKERS)[number]) => {
    stickerIdRef.current += 1
    const offset = (stickerIdRef.current % 4) * 36
    const sticker: Sticker = {
      id: stickerIdRef.current,
      image: option.image,
      width: option.width,
      height: option.height,
      rotation: 0,
      x: 280 + offset,
      y: 500 + offset,
      scale: 1,
    }
    setStickers((current) => [...current, sticker])
    setSelectedStickerId(sticker.id)
  }

  const updateSticker = (id: number, update: (sticker: Sticker) => Sticker) => {
    setStickers((current) => current.map((sticker) => (sticker.id === id ? update(sticker) : sticker)))
  }

  const scaleSticker = (sticker: Sticker, delta: number) => {
    const next = Math.min(STICKER_MAX_SCALE, Math.max(STICKER_MIN_SCALE, sticker.scale + delta))
    updateSticker(sticker.id, (current) => ({ ...current, scale: next }))
  }

  const deleteSticker = (id: number) => {
    setStickers((current) => current.filter((sticker) => sticker.id !== id))
    setSelectedStickerId((current) => (current === id ? null : current))
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

  const endStickerDrag = () => {
    dragRef.current = null
    rotationDragRef.current = null
  }

  const startStickerRotate = (event: ReactPointerEvent<HTMLButtonElement>, sticker: Sticker) => {
    event.preventDefault()
    event.stopPropagation()
    const point = toStageCoordinates(event.clientX, event.clientY)
    const centerX = sticker.x + sticker.width / 2
    const centerY = sticker.y + sticker.height / 2
    rotationDragRef.current = {
      id: sticker.id,
      centerX,
      centerY,
      lastAngle: (Math.atan2(point.y - centerY, point.x - centerX) * 180) / Math.PI,
      rotation: sticker.rotation,
    }
    dragRef.current = null
    setSelectedStickerId(sticker.id)
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  const moveSticker = (event: ReactPointerEvent<HTMLButtonElement>) => {
    const rotate = rotationDragRef.current
    if (rotate) {
      const point = toStageCoordinates(event.clientX, event.clientY)
      const angle = (Math.atan2(point.y - rotate.centerY, point.x - rotate.centerX) * 180) / Math.PI
      let delta = angle - rotate.lastAngle
      if (delta > 180) delta -= 360
      if (delta < -180) delta += 360
      rotate.rotation += delta
      rotate.lastAngle = angle
      updateSticker(rotate.id, (current) => ({ ...current, rotation: rotate.rotation }))
      return
    }

    const drag = dragRef.current
    if (!drag) return
    const point = toStageCoordinates(event.clientX, event.clientY)
    setStickers((current) =>
      current.map((sticker) => {
        if (sticker.id !== drag.id) return sticker
        const x = Math.min(PREVIEW_WIDTH - sticker.width, Math.max(0, point.x - drag.offsetX))
        const y = Math.min(PREVIEW_HEIGHT - sticker.height, Math.max(0, point.y - drag.offsetY))
        return { ...sticker, x, y }
      }),
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
          className="absolute right-4 top-4 z-30 flex h-16 w-16 items-center justify-center rounded-full bg-white text-gray-600 shadow-md active:bg-gray-100"
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
                onPointerUp={endStickerDrag}
                onPointerCancel={endStickerDrag}
                aria-label="장식 이동"
                className={`absolute z-10 touch-none select-none rounded ring-4 ${selectedStickerId === sticker.id ? 'ring-white/90' : 'ring-transparent'}`}
                style={{
                  left: sticker.x,
                  top: sticker.y,
                  width: sticker.width,
                  height: sticker.height,
                  transform: `scale(${sticker.scale}) rotate(${sticker.rotation}deg)`,
                  transformOrigin: 'center',
                }}
              >
                <img
                  src={sticker.image}
                  alt=""
                  draggable={false}
                  className="pointer-events-none h-full w-full select-none object-contain drop-shadow"
                />

                {/* 선택하면 네 모서리에 조작 손잡이가 붙는다(꾸미기 단계와 같은 방식). */}
                {selectedStickerId === sticker.id && (
                  <span
                    className="pointer-events-none absolute left-1/2 top-1/2"
                    style={{
                      width: Math.max(sticker.width, STICKER_MIN_CONTROL),
                      height: Math.max(sticker.height, STICKER_MIN_CONTROL),
                      transform: 'translate(-50%, -50%)',
                    }}
                  >
                    <button
                      type="button"
                      aria-label="크게"
                      title="크게"
                      disabled={sticker.scale >= STICKER_MAX_SCALE}
                      onPointerDown={(event) => {
                        event.preventDefault()
                        event.stopPropagation()
                        scaleSticker(sticker, 0.1)
                      }}
                      className="pointer-events-auto absolute -left-3 -top-3 flex h-9 w-9 items-center justify-center rounded-full bg-pink-500 text-2xl font-black text-white shadow-md disabled:bg-gray-300"
                    >
                      +
                    </button>
                    <button
                      type="button"
                      aria-label="작게"
                      title="작게"
                      disabled={sticker.scale <= STICKER_MIN_SCALE}
                      onPointerDown={(event) => {
                        event.preventDefault()
                        event.stopPropagation()
                        scaleSticker(sticker, -0.1)
                      }}
                      className="pointer-events-auto absolute -bottom-3 -left-3 flex h-9 w-9 items-center justify-center rounded-full bg-pink-500 text-2xl font-black text-white shadow-md disabled:bg-gray-300"
                    >
                      −
                    </button>
                    <button
                      type="button"
                      aria-label="자유 회전"
                      title="드래그해서 회전"
                      onPointerDown={(event) => startStickerRotate(event, sticker)}
                      onPointerMove={moveSticker}
                      onPointerUp={endStickerDrag}
                      onPointerCancel={endStickerDrag}
                      className="pointer-events-auto absolute -bottom-3 -right-3 flex h-9 w-9 items-center justify-center rounded-full bg-white text-pink-600 shadow-md ring-2 ring-pink-400"
                      style={{ transform: `rotate(${-sticker.rotation}deg)`, touchAction: 'none' }}
                    >
                      <RotateCw aria-hidden="true" className="h-5 w-5" strokeWidth={2.6} />
                    </button>
                    <button
                      type="button"
                      aria-label="삭제"
                      title="삭제"
                      onPointerDown={(event) => {
                        event.preventDefault()
                        event.stopPropagation()
                        deleteSticker(sticker.id)
                      }}
                      className="pointer-events-auto absolute -right-3 -top-3 flex h-9 w-9 items-center justify-center rounded-full bg-red-500 text-base font-bold text-white shadow-md"
                    >
                      ✕
                    </button>
                  </span>
                )}
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

              <div className="mt-3 flex items-center gap-3 border-t border-gray-200 pt-3">
                <div className="flex items-center gap-2">
                  <span className="mr-1 shrink-0 text-[25px] font-black text-gray-700">장식</span>
                  {STICKERS.map((sticker) => (
                    <button
                      key={sticker.id}
                      type="button"
                      onClick={() => addSticker(sticker)}
                      aria-label={`${sticker.label} 추가`}
                      title={sticker.label}
                      className="flex h-12 w-14 items-center justify-center rounded bg-gray-100 p-1"
                    >
                      <img
                        src={sticker.image}
                        alt=""
                        draggable={false}
                        className="h-full w-full select-none object-contain"
                      />
                    </button>
                  ))}
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

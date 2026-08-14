import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type PointerEvent as ReactPointerEvent,
} from 'react'
import { Camera, Home, ImagePlus, Minus, Plus, RotateCcw, Trash2 } from 'lucide-react'
import StageLayout from '../components/StageLayout'
import { useAppStore } from '../store/useAppStore'
import { assetUrl } from '../utils/asset'

const CAPTURE_WIDTH = 1200
const CAPTURE_HEIGHT = 1800

type CameraStatus = 'requesting' | 'ready' | 'unavailable'
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
  color: string
  image?: string
}

const FRAMES: FrameOption[] = [
  { id: 'none', label: '없음', color: 'transparent' },
  { id: 'pink', label: '핑크', color: '#ff9fba' },
  { id: 'sky', label: '하늘', color: '#8ecbff' },
  { id: 'yellow', label: '노랑', color: '#ffd966' },
  { id: 'white', label: '화이트', color: '#ffffff' },
  {
    id: 'birthday',
    label: '생일',
    color: 'transparent',
    image: assetUrl('images/photo-booth-frames/birthday-single-01.png'),
  },
  {
    id: 'mbti',
    label: 'MBTI',
    color: 'transparent',
    image: assetUrl('images/photo-booth-frames/mbti-single-01.png'),
  },
  {
    id: 'princess',
    label: '공주',
    color: 'transparent',
    image: assetUrl('images/photo-booth-frames/princess-single-01.png'),
  },
]

const STICKERS = [
  { symbol: '♥', color: '#ff6f91', label: '하트' },
  { symbol: '★', color: '#ffd04d', label: '별' },
  { symbol: '✿', color: '#ff9fba', label: '꽃' },
  { symbol: '✦', color: '#8ecbff', label: '반짝이' },
] as const

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

export default function PhotoBooth() {
  const setStage = useAppStore((state) => state.setStage)
  const videoRef = useRef<HTMLVideoElement>(null)
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
        stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 960 } },
        })
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop())
          return
        }
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          await videoRef.current.play()
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
    setFrameId('none')
    setStickers([])
    setSelectedStickerId(null)
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

  const startStickerDrag = (event: ReactPointerEvent<HTMLButtonElement>, sticker: Sticker) => {
    event.currentTarget.setPointerCapture(event.pointerId)
    dragRef.current = { id: sticker.id, offsetX: event.clientX - sticker.x, offsetY: event.clientY - sticker.y }
    setSelectedStickerId(sticker.id)
  }

  const moveSticker = (event: ReactPointerEvent<HTMLButtonElement>) => {
    const drag = dragRef.current
    if (!drag) return
    const nextX = Math.min(700, Math.max(0, event.clientX - drag.offsetX))
    const nextY = Math.min(1100, Math.max(0, event.clientY - drag.offsetY))
    setStickers((current) =>
      current.map((sticker) => (sticker.id === drag.id ? { ...sticker, x: nextX, y: nextY } : sticker)),
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
            {capturedPhoto ? '필터와 장식으로 사진을 꾸며보세요' : '마음에 드는 순간을 한 장씩 남겨보세요'}
          </p>
        </header>

        <main className="mt-4 flex min-h-0 w-full flex-1 flex-col items-center">
          <div
            className="relative h-[1200px] w-[800px] shrink-0 overflow-hidden rounded-lg bg-gray-900 shadow-[0_24px_60px_rgba(55,65,81,0.25)]"
            style={{ border: `14px solid ${selectedFrame.color}` }}
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

            {selectedFrame.image && (
              <img
                src={selectedFrame.image}
                alt=""
                draggable={false}
                className="pointer-events-none absolute inset-0 z-[5] h-full w-full select-none"
              />
            )}

            {cameraStatus !== 'ready' && !capturedPhoto && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-800 px-16 text-white">
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
                className={`absolute z-10 flex h-[100px] w-[100px] touch-none select-none items-center justify-center rounded-full border-4 bg-transparent leading-none ${selectedStickerId === sticker.id ? 'border-white/90' : 'border-transparent'}`}
                style={{
                  left: sticker.x,
                  top: sticker.y,
                  color: sticker.color,
                  fontSize: '88px',
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
            {!capturedPhoto && <div className="pointer-events-none absolute inset-7 rounded border-4 border-white/75" />}
          </div>

          {capturedPhoto ? (
            <section className="mt-4 w-[800px] rounded-lg bg-white px-5 py-4 shadow-sm">
              <div className="flex items-center gap-2">
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
              </div>

              <div className="mt-3 flex items-center gap-2 border-t border-gray-200 pt-3">
                <span className="mr-1 text-[25px] font-black text-gray-700">프레임</span>
                {FRAMES.map((frame) => (
                  <button
                    key={frame.id}
                    type="button"
                    onClick={() => setFrameId(frame.id)}
                    aria-label={`${frame.label} 프레임`}
                    title={frame.label}
                    className={`h-12 w-12 rounded border-4 bg-cover bg-center ${frameId === frame.id ? 'border-gray-700' : 'border-gray-200'}`}
                    style={{
                      backgroundColor: frame.color,
                      backgroundImage: frame.image
                        ? `url(${frame.image})`
                        : frame.id === 'none'
                          ? 'linear-gradient(135deg, #fff 45%, #ef4444 46%, #ef4444 54%, #fff 55%)'
                          : undefined,
                    }}
                  />
                ))}
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
              <section className="mt-4 flex h-[76px] w-[800px] items-center rounded-lg bg-white px-5 shadow-sm">
                <span className="mr-3 text-[25px] font-black text-gray-700">프레임</span>
                <div className="flex items-center gap-3">
                  {FRAMES.map((frame) => (
                    <button
                      key={frame.id}
                      type="button"
                      onClick={() => setFrameId(frame.id)}
                      aria-label={`${frame.label} 프레임`}
                      title={frame.label}
                      className={`h-12 w-12 rounded border-4 bg-cover bg-center ${frameId === frame.id ? 'border-gray-700' : 'border-gray-200'}`}
                      style={{
                        backgroundColor: frame.color,
                        backgroundImage: frame.image
                          ? `url(${frame.image})`
                          : frame.id === 'none'
                            ? 'linear-gradient(135deg, #fff 45%, #ef4444 46%, #ef4444 54%, #fff 55%)'
                            : undefined,
                      }}
                    />
                  ))}
                </div>
              </section>
              <button
                type="button"
                onClick={startCountdown}
                disabled={cameraStatus !== 'ready' || countdown !== null}
                aria-label="사진 촬영"
                title="촬영"
                className="mt-4 flex h-28 w-28 items-center justify-center rounded-full border-[10px] border-white bg-pink-400 text-white shadow-lg active:bg-pink-500 disabled:bg-gray-300"
              >
                <Camera aria-hidden="true" className="h-12 w-12" strokeWidth={2.4} />
              </button>
            </>
          )}
        </main>

        {capturedPhoto && (
          <button
            type="button"
            onClick={resetPhoto}
            className="mt-4 flex h-[76px] w-[360px] shrink-0 items-center justify-center gap-3 rounded-lg bg-pink-400 text-[30px] font-black text-white shadow-md active:bg-pink-500"
          >
            <RotateCcw aria-hidden="true" className="h-8 w-8" strokeWidth={2.6} />
            한 장 더 찍기
          </button>
        )}
      </div>
    </StageLayout>
  )
}

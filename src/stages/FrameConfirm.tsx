import { useEffect, useRef, useState } from 'react'
import { useAppStore, type PrintFrame, type PrintFrameRatio } from '../store/useAppStore'
import StageLayout from '../components/StageLayout'
import Button from '../components/Button'
import { renderPrintImage } from '../utils/print'
import { SCENE_HEIGHT, SCENE_WIDTH } from '../data/constants'

const FRAME_OPTIONS: { ratio: PrintFrameRatio; label: string; description: string; value: number }[] = [
  { ratio: '2:3', label: '세로 사진', description: '인화지 세로 비율', value: 2 / 3 },
  { ratio: '3:2', label: '가로 사진', description: '인화지 가로 비율', value: 3 / 2 },
]

const PREVIEW_W = 500
const PREVIEW_H = 750
const MIN_FRAME_SIZE = 90

type DragState =
  | { kind: 'move'; startX: number; startY: number; frame: PrintFrame }
  | { kind: 'resize'; corner: ResizeCorner; startX: number; startY: number; frame: PrintFrame }
type ResizeCorner = 'nw' | 'ne' | 'sw' | 'se'

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function defaultFrame(ratio: PrintFrameRatio): PrintFrame {
  const option = FRAME_OPTIONS.find((item) => item.ratio === ratio) ?? FRAME_OPTIONS[0]
  const previewRatio = PREVIEW_W / PREVIEW_H
  if (option.value > previewRatio) {
    const height = PREVIEW_W / option.value
    return { x: 0, y: PREVIEW_H - height, width: PREVIEW_W, height }
  }

  const width = PREVIEW_H * option.value
  return { x: (PREVIEW_W - width) / 2, y: 0, width, height: PREVIEW_H }
}

function constrainFrame(frame: PrintFrame): PrintFrame {
  const width = clamp(frame.width, MIN_FRAME_SIZE, PREVIEW_W)
  const height = clamp(frame.height, MIN_FRAME_SIZE, PREVIEW_H)
  const x = clamp(frame.x, 0, PREVIEW_W - width)
  const y = clamp(frame.y, 0, PREVIEW_H - height)
  return { x, y, width, height }
}

function ratioValue(ratio: PrintFrameRatio) {
  return FRAME_OPTIONS.find((item) => item.ratio === ratio)?.value ?? 2 / 3
}

function resizeFrame(frame: PrintFrame, corner: ResizeCorner, pointerX: number, pointerY: number, ratio: number): PrintFrame {
  const fixedX = corner.includes('w') ? frame.x + frame.width : frame.x
  const fixedY = corner.includes('n') ? frame.y + frame.height : frame.y
  const wantedW = Math.max(MIN_FRAME_SIZE, Math.abs(fixedX - pointerX))
  const wantedH = Math.max(MIN_FRAME_SIZE, Math.abs(fixedY - pointerY))
  const widthFromX = wantedW
  const widthFromY = wantedH * ratio
  const maxW = corner.includes('w') ? fixedX : PREVIEW_W - fixedX
  const maxH = corner.includes('n') ? fixedY : PREVIEW_H - fixedY
  const maxRatioW = Math.max(MIN_FRAME_SIZE, Math.min(maxW, maxH * ratio))
  const width = clamp(widthFromX > widthFromY ? widthFromX : widthFromY, MIN_FRAME_SIZE, maxRatioW)
  const height = width / ratio
  const x = corner.includes('w') ? fixedX - width : fixedX
  const y = corner.includes('n') ? fixedY - height : fixedY
  return constrainFrame({ x, y, width, height })
}

function toCanvasFrame(frame: PrintFrame): PrintFrame {
  return {
    x: Math.round((frame.x / PREVIEW_W) * SCENE_WIDTH),
    y: Math.round((frame.y / PREVIEW_H) * SCENE_HEIGHT),
    width: Math.round((frame.width / PREVIEW_W) * SCENE_WIDTH),
    height: Math.round((frame.height / PREVIEW_H) * SCENE_HEIGHT),
  }
}

function toPreviewFrame(frame: PrintFrame): PrintFrame {
  return constrainFrame({
    x: (frame.x / SCENE_WIDTH) * PREVIEW_W,
    y: (frame.y / SCENE_HEIGHT) * PREVIEW_H,
    width: (frame.width / SCENE_WIDTH) * PREVIEW_W,
    height: (frame.height / SCENE_HEIGHT) * PREVIEW_H,
  })
}

export default function FrameConfirm() {
  const budget = useAppStore((s) => s.budget)
  const spent = useAppStore((s) => s.spent)
  const placedItems = useAppStore((s) => s.placedItems)
  const canvasBackgroundId = useAppStore((s) => s.canvasBackgroundId)
  const characters = useAppStore((s) => s.characters)
  const printFrameRatio = useAppStore((s) => s.printFrameRatio)
  const savedPrintFrame = useAppStore((s) => s.printFrame)
  const setPrintFrameRatio = useAppStore((s) => s.setPrintFrameRatio)
  const setPrintFrame = useAppStore((s) => s.setPrintFrame)
  const setStage = useAppStore((s) => s.setStage)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [frame, setFrame] = useState<PrintFrame>(() =>
    savedPrintFrame ? toPreviewFrame(savedPrintFrame) : defaultFrame(printFrameRatio),
  )
  const previewRef = useRef<HTMLDivElement>(null)
  const dragRef = useRef<DragState | null>(null)

  useEffect(() => {
    let cancelled = false
    let objectUrl: string | null = null

    renderPrintImage({
      printId: 0,
      budget,
      spent,
      canvasBackgroundId,
      characters,
      placedItems,
    })
      .then((blob) => {
        if (cancelled) return
        objectUrl = URL.createObjectURL(blob)
        setPreviewUrl(objectUrl)
      })
      .catch(() => {
        if (!cancelled) setPreviewUrl(null)
      })

    return () => {
      cancelled = true
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [budget, canvasBackgroundId, characters, placedItems, spent])

  const updatePreset = (ratio: PrintFrameRatio) => {
    setPrintFrameRatio(ratio)
    setFrame(defaultFrame(ratio))
  }

  const toPreviewPoint = (clientX: number, clientY: number) => {
    const rect = previewRef.current?.getBoundingClientRect()
    if (!rect) return { x: clientX, y: clientY }
    return {
      x: ((clientX - rect.left) / rect.width) * PREVIEW_W,
      y: ((clientY - rect.top) / rect.height) * PREVIEW_H,
    }
  }

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current
    if (!drag) return
    const point = toPreviewPoint(e.clientX, e.clientY)
    const dx = point.x - drag.startX
    const dy = point.y - drag.startY

    if (drag.kind === 'move') {
      setFrame(constrainFrame({ ...drag.frame, x: drag.frame.x + dx, y: drag.frame.y + dy }))
      return
    }

    setFrame(resizeFrame(drag.frame, drag.corner, point.x, point.y, ratioValue(printFrameRatio)))
  }

  const startMove = (e: React.PointerEvent<HTMLDivElement>) => {
    e.stopPropagation()
    const point = toPreviewPoint(e.clientX, e.clientY)
    dragRef.current = { kind: 'move', startX: point.x, startY: point.y, frame }
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  const startResize = (corner: ResizeCorner) => (e: React.PointerEvent<HTMLButtonElement>) => {
    e.stopPropagation()
    const point = toPreviewPoint(e.clientX, e.clientY)
    dragRef.current = { kind: 'resize', corner, startX: point.x, startY: point.y, frame }
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  const stopDrag = () => {
    dragRef.current = null
  }

  const confirmFrame = () => {
    setPrintFrame(toCanvasFrame(frame))
    setStage('complete')
  }

  return (
    <StageLayout>
      <div className="flex flex-1 flex-col items-center justify-center gap-6 text-center">
        <div>
          <p className="text-5xl font-black text-gray-800">사진 프레임 확인</p>
          <p className="mt-4 text-2xl font-bold text-gray-600">
            사각형을 움직이고 모서리를 잡아 크기를 조절해 주세요.
          </p>
        </div>

        <div
          ref={previewRef}
          className="relative overflow-hidden rounded-2xl border-4 border-white bg-white shadow-sm"
          style={{ width: PREVIEW_W, height: PREVIEW_H }}
          onPointerMove={handlePointerMove}
          onPointerUp={stopDrag}
          onPointerCancel={stopDrag}
        >
          {previewUrl ? (
            <img src={previewUrl} alt="프레임 미리보기" className="h-full w-full object-cover" draggable={false} />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-lg text-gray-400">이미지를 준비하고 있어요.</div>
          )}
          <div className="pointer-events-none absolute inset-0 bg-black/45" />
          <div
            className="absolute box-border touch-none border-4 border-white shadow-[0_0_0_999px_rgba(0,0,0,0.42)]"
            style={{
              left: frame.x,
              top: frame.y,
              width: frame.width,
              height: frame.height,
            }}
            onPointerDown={startMove}
          >
            {(['nw', 'ne', 'sw', 'se'] as const).map((corner) => (
              <button
                key={corner}
                type="button"
                aria-label={`${corner} resize`}
                onPointerDown={startResize(corner)}
                className={`absolute h-12 w-12 rounded-full border-4 border-white bg-brand-500 shadow ${
                  corner.includes('n') ? '-top-7' : '-bottom-7'
                } ${corner.includes('w') ? '-left-7' : '-right-7'}`}
              />
            ))}
          </div>
        </div>

        <div className="grid w-full grid-cols-2 gap-4">
          {FRAME_OPTIONS.map((option) => (
            <button
              key={option.ratio}
              onClick={() => updatePreset(option.ratio)}
              className={`flex min-h-[170px] items-center justify-center gap-8 rounded-2xl border-4 px-8 py-7 text-left transition ${
                option.ratio === printFrameRatio
                  ? 'border-brand-500 bg-white text-gray-900 shadow-sm'
                  : 'border-brand-100 bg-white/70 text-gray-500'
              }`}
            >
              <span
                aria-hidden="true"
                className={`block shrink-0 border-[5px] border-current bg-brand-50 shadow-inner ${
                  option.ratio === '2:3' ? 'h-24 w-16' : 'h-16 w-24'
                }`}
              />
              <span className="block min-w-0">
                <span className="block text-2xl font-bold">{option.label}</span>
                <span className="mt-1 block text-lg font-semibold">{option.ratio}</span>
                <span className="mt-2 block text-base">{option.description}</span>
              </span>
            </button>
          ))}
        </div>

        <div className="flex w-full gap-3">
          <Button variant="secondary" onClick={() => setStage('decorate')} className="flex-1">
            다시 꾸미기
          </Button>
          <Button onClick={confirmFrame} className="flex-1">
            이대로 인쇄하기
          </Button>
        </div>
      </div>
    </StageLayout>
  )
}

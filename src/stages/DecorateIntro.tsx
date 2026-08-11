import { useLayoutEffect, useRef, useState } from 'react'
import { BASE_HEIGHT, BASE_WIDTH } from '../data/constants'
import Button from '../components/Button'
import Decorate from './Decorate'

type TutorialTarget = 'steps' | 'purchase-list' | 'frame-button'
type TutorialRect = { x: number; y: number; width: number; height: number }
type TutorialRects = Partial<Record<TutorialTarget, TutorialRect>>

const TARGET_PADDING: Record<TutorialTarget, { x: number; y: number }> = {
  steps: { x: 14, y: 14 },
  'purchase-list': { x: 4, y: 0 },
  'frame-button': { x: 4, y: 0 },
}

export default function DecorateIntro() {
  const previewRef = useRef<HTMLDivElement>(null)
  const [showTutorial, setShowTutorial] = useState(true)
  const [targetRects, setTargetRects] = useState<TutorialRects>({})

  useLayoutEffect(() => {
    const root = previewRef.current
    if (!root) return undefined

    let animationFrame = 0
    const updateTargets = () => {
      const rootBounds = root.getBoundingClientRect()
      const scaleX = rootBounds.width / root.offsetWidth || 1
      const scaleY = rootBounds.height / root.offsetHeight || 1
      const next: TutorialRects = {}

      ;(['steps', 'purchase-list', 'frame-button'] as TutorialTarget[]).forEach((name) => {
        const target = root.querySelector<HTMLElement>(`[data-tutorial-target="${name}"]`)
        if (!target) return
        const bounds = target.getBoundingClientRect()
        const padding = TARGET_PADDING[name]
        next[name] = {
          x: Math.max(0, (bounds.left - rootBounds.left) / scaleX - padding.x),
          y: Math.max(0, (bounds.top - rootBounds.top) / scaleY - padding.y),
          width: Math.min(BASE_WIDTH, bounds.width / scaleX + padding.x * 2),
          height: Math.min(BASE_HEIGHT, bounds.height / scaleY + padding.y * 2),
        }
      })

      setTargetRects(next)
    }

    animationFrame = window.requestAnimationFrame(updateTargets)
    const observer = new ResizeObserver(updateTargets)
    observer.observe(root)
    window.addEventListener('resize', updateTargets)
    return () => {
      window.cancelAnimationFrame(animationFrame)
      observer.disconnect()
      window.removeEventListener('resize', updateTargets)
    }
  }, [])

  const steps = targetRects.steps
  const purchaseList = targetRects['purchase-list']
  const frameButton = targetRects['frame-button']
  const textShadow = { textShadow: '0 2px 5px rgba(0, 0, 0, 0.75)' }

  return (
    <div ref={previewRef} className="relative h-full w-full overflow-hidden">
      <div
        className={`absolute inset-0 ${showTutorial ? 'pointer-events-none' : ''}`}
        aria-hidden={showTutorial ? 'true' : undefined}
      >
        <Decorate suppressTransitionGuide={showTutorial} />
      </div>

      {showTutorial && <div className="absolute inset-0 z-[40000]">
        <svg
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 h-full w-full"
          viewBox={`0 0 ${BASE_WIDTH} ${BASE_HEIGHT}`}
          preserveAspectRatio="none"
        >
          <defs>
            <mask id="decorate-tutorial-mask">
              <rect width={BASE_WIDTH} height={BASE_HEIGHT} fill="white" />
              {Object.values(targetRects).map((rect, index) => (
                <rect
                  key={index}
                  x={rect.x}
                  y={rect.y}
                  width={rect.width}
                  height={rect.height}
                  rx="18"
                  fill="black"
                />
              ))}
            </mask>
          </defs>
          <rect
            width={BASE_WIDTH}
            height={BASE_HEIGHT}
            fill="#1f2937"
            fillOpacity="0.72"
            mask="url(#decorate-tutorial-mask)"
          />
          {steps && (
            <rect
              {...steps}
              rx="18"
              fill="none"
              stroke="#5a9ef7"
              strokeWidth="9"
              vectorEffect="non-scaling-stroke"
            />
          )}
          {purchaseList && (
            <rect
              {...purchaseList}
              rx="18"
              fill="none"
              stroke="#fb7185"
              strokeWidth="9"
              vectorEffect="non-scaling-stroke"
            />
          )}
          {frameButton && (
            <rect
              {...frameButton}
              rx="16"
              fill="none"
              stroke="#34d399"
              strokeWidth="9"
              vectorEffect="non-scaling-stroke"
            />
          )}
        </svg>

        {steps && (
          <>
            <div
              className="absolute text-right text-white"
              style={{
                left: 48,
                top: steps.y + steps.height + 26,
                width: steps.x + steps.width / 2 - 60,
                ...textShadow,
              }}
            >
              <p className="text-3xl font-black" style={{ color: '#5a9ef7' }}>
                꾸미기는 세 단계예요
              </p>
              <p className="mt-2 text-2xl font-bold">
                배경, 신랑·신부, 오브젝트를 꾸며요.
              </p>
            </div>
          </>
        )}

        {frameButton && (
          <>
            <div
              className="absolute text-right text-white"
              style={{
                left: Math.max(40, frameButton.x + frameButton.width / 2 - 560),
                top: frameButton.y + frameButton.height - 8,
                width: 470,
                textAlign: 'right',
                ...textShadow,
              }}
            >
              <p className="text-3xl font-black" style={{ color: '#34d399' }}>
                프레임 조정도 가능해요
              </p>
              <p className="mt-2 text-2xl font-bold leading-relaxed">
                <span className="block">사진의 위치와 크기를 조정하고</span>
                <span className="block">가로·세로 비율도 바꿀 수 있어요.</span>
              </p>
            </div>
          </>
        )}

        {purchaseList && (
          <>
            <div
              className="absolute text-right text-white"
              style={{
                left: Math.max(40, purchaseList.x - 494),
                top: purchaseList.y + purchaseList.height * 0.52 - 126,
                width: 470,
                textAlign: 'right',
                ...textShadow,
              }}
            >
              <p className="text-3xl font-black" style={{ color: '#fb7185' }}>
                구매 목록에서 맨 앞으로
              </p>
              <p className="mt-2 text-2xl font-bold leading-relaxed">
                <span className="block">원하는 오브젝트를 누르면</span>
                <span className="block">사진 속 가장 앞으로 올라와요.</span>
              </p>
            </div>
          </>
        )}

        <div
          className="absolute"
          style={{ left: '50%', top: 'calc(50% + 50px)', transform: 'translate(-50%, -50%)' }}
        >
          <Button onClick={() => setShowTutorial(false)} className="px-24 py-6 text-3xl">
            꾸미기 시작
          </Button>
        </div>
      </div>}
    </div>
  )
}

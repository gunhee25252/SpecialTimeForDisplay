import { useLayoutEffect, useRef, useState } from 'react'
import { BASE_HEIGHT, BASE_WIDTH } from '../data/constants'
import Button from '../components/Button'
import Decorate from './Decorate'

type TutorialTarget = 'steps' | 'remaining'
type TutorialPage = 0 | 1
type TutorialRect = { x: number; y: number; width: number; height: number }
type TutorialRects = Partial<Record<TutorialTarget, TutorialRect>>

const TARGET_PADDING: Record<TutorialTarget, { x: number; y: number }> = {
  steps: { x: 14, y: 14 },
  remaining: { x: 12, y: 10 },
}

export default function DecorateIntro() {
  const previewRef = useRef<HTMLDivElement>(null)
  const [showTutorial, setShowTutorial] = useState(true)
  const [tutorialPage, setTutorialPage] = useState<TutorialPage>(0)
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

      ;(['steps', 'remaining'] as TutorialTarget[]).forEach((name) => {
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
  const remaining = targetRects.remaining
  const activeTarget = tutorialPage === 0 ? steps : remaining
  const textShadow = { textShadow: '0 2px 5px rgba(0, 0, 0, 0.75)' }

  const handleNextTutorialPage = () => {
    if (tutorialPage < 1) {
      setTutorialPage((tutorialPage + 1) as TutorialPage)
      return
    }
    setShowTutorial(false)
  }

  return (
    <div ref={previewRef} className="relative h-full w-full overflow-hidden">
      <div
        className={`absolute inset-0 ${showTutorial ? 'pointer-events-none' : ''}`}
        aria-hidden={showTutorial ? 'true' : undefined}
      >
        <Decorate suppressTransitionGuide={showTutorial} />
      </div>

      {showTutorial && <div className="font-gyeongyeong absolute inset-0 z-[40000]">
        <svg
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 h-full w-full"
          viewBox={`0 0 ${BASE_WIDTH} ${BASE_HEIGHT}`}
          preserveAspectRatio="none"
        >
          <defs>
            <mask id="decorate-tutorial-mask">
              <rect width={BASE_WIDTH} height={BASE_HEIGHT} fill="white" />
              {activeTarget && (
                <rect
                  x={activeTarget.x}
                  y={activeTarget.y}
                  width={activeTarget.width}
                  height={activeTarget.height}
                  rx="18"
                  fill="black"
                />
              )}
            </mask>
          </defs>
          <rect
            width={BASE_WIDTH}
            height={BASE_HEIGHT}
            fill="#1f2937"
            fillOpacity="0.72"
            mask="url(#decorate-tutorial-mask)"
          />
          {tutorialPage === 0 && steps && (
            <rect
              {...steps}
              rx="18"
              fill="none"
              stroke="#5a9ef7"
              strokeWidth="9"
              vectorEffect="non-scaling-stroke"
            />
          )}
          {tutorialPage === 1 && remaining && (
            <rect
              {...remaining}
              rx="18"
              fill="none"
              stroke="#fb7185"
              strokeWidth="9"
              vectorEffect="non-scaling-stroke"
            />
          )}
        </svg>

        {tutorialPage === 0 && steps && (
          <>
            <div
              className="absolute text-left text-white"
              style={{
                left: 48,
                top: steps.y + steps.height + 24,
                width: steps.x + steps.width / 2 - 60,
                ...textShadow,
              }}
            >
              <div className="flex items-center gap-5 whitespace-nowrap text-[40px] font-black">
                <span>
                  꾸미기는 <span style={{ color: '#5a9ef7' }}>네 단계</span>예요
                </span>
                {[
                  ['1', '배경'],
                  ['2', '신랑'],
                  ['3', '신부'],
                  ['4', '오브젝트'],
                ].map(([number, label]) => (
                  <span
                    key={number}
                    className="font-gothic flex items-center gap-2 text-[26px] text-white"
                  >
                    <strong className="flex h-11 w-11 items-center justify-center rounded-full bg-[#5a9ef7] text-[24px] text-white">
                      {number}
                    </strong>
                    {label}
                  </span>
                ))}
              </div>
            </div>
          </>
        )}

        {tutorialPage === 1 && remaining && (
          <div
            className="absolute text-right text-white"
            style={{
              right: 44,
              top: remaining.y + remaining.height + 24,
              width: 610,
              ...textShadow,
            }}
          >
            <p className="text-[40px] font-black leading-snug">
              지금까지 쓴 금액과
              <span className="block">
                <span style={{ color: '#fb7185' }}>남은 예산</span>을 여기에서 확인!
              </span>
            </p>
          </div>
        )}

        <div
          className="absolute"
          style={{ left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }}
        >
          <Button
            onClick={handleNextTutorialPage}
            className="font-gyeongyeong w-[480px] whitespace-nowrap px-8 py-6 text-[35px]"
          >
            다음으로
          </Button>
        </div>
      </div>}
    </div>
  )
}

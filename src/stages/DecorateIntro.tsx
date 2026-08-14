import { useLayoutEffect, useRef, useState } from 'react'
import { BASE_HEIGHT, BASE_WIDTH } from '../data/constants'
import Button from '../components/Button'
import Decorate from './Decorate'

type TutorialTarget = 'steps' | 'remaining' | 'frame-button'
type TutorialPage = 0 | 1 | 2
type TutorialRect = { x: number; y: number; width: number; height: number }
type TutorialRects = Partial<Record<TutorialTarget, TutorialRect>>

const TARGET_PADDING: Record<TutorialTarget, { x: number; y: number }> = {
  steps: { x: 14, y: 14 },
  remaining: { x: 12, y: 10 },
  'frame-button': { x: 4, y: 0 },
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

      ;(['steps', 'remaining', 'frame-button'] as TutorialTarget[]).forEach((name) => {
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
  const frameButton = targetRects['frame-button']
  const activeTarget =
    tutorialPage === 0
      ? steps
      : tutorialPage === 1
        ? remaining
        : frameButton
  const textShadow = { textShadow: '0 2px 5px rgba(0, 0, 0, 0.75)' }

  const handleNextTutorialPage = () => {
    if (tutorialPage < 2) {
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
          {tutorialPage === 2 && frameButton && (
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
              <div className="flex items-center gap-4 whitespace-nowrap text-3xl font-black">
                <span>
                  꾸미기는 <span style={{ color: '#5a9ef7' }}>세 단계</span>예요
                </span>
                {[
                  ['1', '배경'],
                  ['2', '신랑·신부'],
                  ['3', '오브젝트'],
                ].map(([number, label]) => (
                  <span key={number} className="font-gothic flex items-center gap-2 text-white">
                    <strong className="flex h-9 w-9 items-center justify-center rounded-full bg-[#5a9ef7] text-xl text-white">
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
            <p className="text-3xl font-black leading-snug">
              남은 예산 <span style={{ color: '#fb7185' }}>1,000만 원 이상</span>은{' '}
              <span
                className="inline-flex h-[38px] w-[64px] items-center justify-center rounded-md text-white shadow-sm"
                style={{
                  backgroundImage:
                    'linear-gradient(90deg, #ff5f6d 0%, #ff9f43 20%, #ffd93d 40%, #5dd39e 60%, #4dabf7 80%, #a78bfa 100%)',
                  textShadow: '0 1px 2px rgba(0, 0, 0, 0.35)',
                }}
              >
                컬러
              </span>{' '}
              인화
              <span className="block">
                <span style={{ color: '#fb7185' }}>1,000만 원 미만</span>은{' '}
                <span
                  className="isolate inline-flex h-[38px] w-[64px] items-center justify-center overflow-hidden rounded-md align-middle leading-none shadow-sm"
                  style={{ background: 'linear-gradient(90deg, #fff 0 50%, #000 50% 100%)' }}
                >
                  <span className="text-white mix-blend-difference">흑백</span>
                </span>{' '}
                인화
              </span>
            </p>
          </div>
        )}

        {tutorialPage === 2 && frameButton && (
          <>
            <div
              className="absolute text-right text-white"
              style={{
                left: Math.max(40, frameButton.x - 494),
                top: frameButton.y + frameButton.height / 2,
                width: 470,
                textAlign: 'right',
                transform: 'translateY(-50%)',
                ...textShadow,
              }}
            >
              <p className="text-3xl font-black leading-snug">
                <span style={{ color: '#34d399' }}>프레임 조정</span>으로 인화될 사진의
                <span className="block">
                  <span style={{ color: '#34d399' }}>위치·크기·비율</span> 변경
                </span>
              </p>
            </div>
          </>
        )}

        <div
          className="absolute"
          style={{ left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }}
        >
          <Button
            onClick={handleNextTutorialPage}
            className="font-gyeongyeong w-[480px] whitespace-nowrap px-8 py-6 text-3xl"
          >
            다음으로
          </Button>
        </div>
      </div>}
    </div>
  )
}

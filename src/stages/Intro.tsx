import { useAppStore } from '../store/useAppStore'
import StageLayout from '../components/StageLayout'
import Button from '../components/Button'
import { assetUrl } from '../utils/asset'
import { startBackgroundMusic } from '../hooks/useBackgroundMusic'
import { Camera } from 'lucide-react'

const INTRO_RESULTS = [
  {
    src: assetUrl('images/intro-results/intro-landscape-01.png?v=alternate-20260810'),
    className: 'left-6 top-[510px] z-30 aspect-[3/2] w-[470px] -rotate-[3deg]',
    imageClassName: 'absolute left-1/2 top-1/2 h-[150%] w-auto max-w-none -translate-x-1/2 -translate-y-1/2 -rotate-90',
  },
  {
    src: assetUrl('images/intro-results/intro-landscape-02.png?v=night-20260810'),
    className: 'right-6 top-[510px] z-30 aspect-[3/2] w-[470px] rotate-[3deg]',
    imageClassName: 'absolute inset-0 h-full w-full object-cover',
  },
  {
    src: assetUrl('images/intro-results/intro-result-02.png?v=recent-20260807'),
    className: 'left-8 top-[120px] z-10 w-[340px] -rotate-[6deg]',
    imageClassName: 'aspect-[2/3] w-full',
  },
  {
    src: assetUrl('images/intro-results/intro-result-01.png?v=recent-20260807'),
    className: 'left-1/2 top-20 z-20 w-[410px] -translate-x-1/2 rotate-[1deg]',
    imageClassName: 'aspect-[2/3] w-full',
  },
  {
    src: assetUrl('images/intro-results/intro-result-03.png?v=alternate-20260810'),
    className: 'right-8 top-[120px] z-10 w-[340px] rotate-[6deg]',
    imageClassName: 'aspect-[2/3] w-full',
  },
]

// 1) intro — 전시 타이틀 + 시작하기.
export default function Intro() {
  const setStage = useAppStore((s) => s.setStage)

  const openPhotoBooth = () => {
    setStage('photoBooth')
    startBackgroundMusic()
  }

  return (
    <StageLayout showReset={false}>
      <div className="flex flex-1 flex-col items-center text-center">
        <button
          type="button"
          onPointerDown={openPhotoBooth}
          onClick={openPhotoBooth}
          aria-label="한 컷 사진 촬영"
          title="한 컷 사진"
          className="absolute bottom-5 right-5 z-[70] flex h-16 w-16 touch-manipulation items-center justify-center rounded-full text-brand-400/60 transition-colors active:bg-white/70 active:text-brand-600"
        >
          <Camera aria-hidden="true" className="h-8 w-8" strokeWidth={2.2} />
        </button>

        <div className="mt-[300px] space-y-6">
          <h1 className="font-ryuryu text-[76px] font-bold leading-tight text-gray-800">
            나만의
            <br />
            웨딩 사진 만들기
          </h1>
          <p className="text-[34px] font-extrabold leading-relaxed text-brand-700">
            마음에 드는 장면을 고르고
            <br />
            나만의 웨딩 사진을 완성해 보세요.
          </p>
        </div>

        <div className="pointer-events-none relative mt-[10px] h-[840px] w-full" aria-hidden="true">
          {INTRO_RESULTS.map((result) => (
            <div
              key={result.src}
              className={`absolute overflow-hidden rounded-lg border-[10px] border-white bg-white shadow-[0_18px_45px_rgba(62,87,120,0.24)] ${result.className}`}
            >
              <img
                src={result.src}
                alt=""
                className={`block object-cover ${result.imageClassName}`}
                draggable={false}
              />
            </div>
          ))}
        </div>

        <Button
          onClick={() => {
            startBackgroundMusic()
            setStage('playerSelect')
          }}
          className="mb-[210px] mt-auto px-16 py-7 text-3xl"
        >
          시작하기
        </Button>
      </div>
    </StageLayout>
  )
}

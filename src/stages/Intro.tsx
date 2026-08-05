import { useAppStore } from '../store/useAppStore'
import StageLayout from '../components/StageLayout'
import Button from '../components/Button'
import { assetUrl } from '../utils/asset'

const INTRO_RESULTS = [
  {
    src: assetUrl('images/intro-results/intro-result-01.png?v=portrait-2'),
    className: 'left-3 top-[178px] z-10 w-[390px] -rotate-[7deg]',
  },
  {
    src: assetUrl('images/intro-results/intro-result-02.png?v=portrait-2'),
    className: 'left-1/2 top-[106px] z-20 w-[460px] -translate-x-1/2 rotate-[1deg]',
  },
  {
    src: assetUrl('images/intro-results/intro-result-03.png?v=portrait-2'),
    className: 'right-3 top-[178px] z-10 w-[390px] rotate-[7deg]',
  },
]

// 1) intro — 전시 타이틀 + 시작하기.
export default function Intro() {
  const setStage = useAppStore((s) => s.setStage)

  return (
    <StageLayout showReset={false}>
      <div className="flex flex-1 flex-col items-center text-center">
        <div className="mt-[270px] space-y-6">
          <h1 className="text-6xl font-bold leading-tight text-gray-800">
            나만의
            <br />
            웨딩 사진 만들기
          </h1>
          <p className="text-[27px] font-extrabold leading-relaxed text-brand-700">
            마음에 드는 장면을 고르고
            <br />
            나만의 웨딩 사진을 완성해 보세요.
          </p>
        </div>

        <div className="pointer-events-none relative mt-[10px] h-[900px] w-full" aria-hidden="true">
          {INTRO_RESULTS.map((result) => (
            <div
              key={result.src}
              className={`absolute overflow-hidden rounded-lg border-[10px] border-white bg-white shadow-[0_18px_45px_rgba(62,87,120,0.24)] ${result.className}`}
            >
              <img
                src={result.src}
                alt=""
                className="block aspect-[2/3] w-full object-cover"
                draggable={false}
              />
            </div>
          ))}
        </div>

        <Button
          onClick={() => setStage('playerSelect')}
          className="mb-[210px] mt-auto px-16 py-7 text-3xl"
        >
          시작하기
        </Button>
      </div>
    </StageLayout>
  )
}

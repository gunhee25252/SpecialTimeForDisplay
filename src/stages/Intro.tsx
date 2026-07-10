import { useAppStore } from '../store/useAppStore'
import StageLayout from '../components/StageLayout'
import Button from '../components/Button'

// 1) intro — 전시 타이틀 + 시작하기.
export default function Intro() {
  const setStage = useAppStore((s) => s.setStage)

  return (
    <StageLayout showReset={false}>
      <div className="flex flex-1 flex-col items-center justify-center gap-14 text-center">
        <div className="space-y-4">
          <p className="text-2xl text-brand-400">결혼 취향 월드컵</p>
          <h1 className="text-6xl font-bold leading-tight text-gray-800">
            나만의
            <br />
            웨딩 사진 만들기
          </h1>
        </div>

        <Button onClick={() => setStage('playerSelect')} className="px-16 py-7 text-3xl">
          시작하기
        </Button>
      </div>
    </StageLayout>
  )
}

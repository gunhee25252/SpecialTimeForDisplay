import { useAppStore } from '../store/useAppStore'
import StageLayout from '../components/StageLayout'
import Button from '../components/Button'

export default function BudgetIntro() {
  const playerCount = useAppStore((state) => state.playerCount)
  const startBudget = useAppStore((state) => state.startBudget)
  const isDuo = playerCount === 2

  return (
    <StageLayout>
      <div className="flex flex-1 flex-col items-center justify-center gap-10 text-center">
        <section className="flex w-full flex-col items-center rounded-[1.75rem] border-4 border-brand-100 bg-white px-14 py-24 shadow-sm">
          <div className="flex h-36 w-36 items-center justify-center rounded-full bg-brand-100 text-7xl font-black text-brand-500">
            ₩
          </div>

          <p className="mt-12 text-3xl font-black text-brand-500">다음 단계</p>
          <h1 className="mt-5 text-6xl font-black leading-tight text-gray-800">
            {isDuo ? '두 분의 웨딩 예산을' : '나의 웨딩 예산을'}
            <br />
            뽑아볼까요?
          </h1>

          <div className="mt-12 space-y-5 text-3xl font-semibold leading-relaxed text-gray-600">
            {isDuo ? (
              <>
                <p>두 분이 한 번씩 예산을 뽑습니다.</p>
                <p>
                  두 금액을 합친 예산으로
                  <br />
                  함께 웨딩 사진을 꾸미게 됩니다.
                </p>
              </>
            ) : (
              <>
                <p>사진을 꾸밀 수 있는 예산을 확인할 차례예요.</p>
                <p>
                  뽑힌 예산 안에서 배경과 의상, 오브젝트를 골라
                  <br />
                  나만의 웨딩 사진을 완성해 주세요.
                </p>
              </>
            )}
          </div>
        </section>

        <Button onClick={startBudget} className="px-20 py-7 text-3xl">
          예산 뽑기 시작
        </Button>
      </div>
    </StageLayout>
  )
}

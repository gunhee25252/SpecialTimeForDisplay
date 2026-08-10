import { useAppStore } from '../store/useAppStore'
import StageLayout from '../components/StageLayout'
import Button from '../components/Button'
import {
  MAX_BUDGET_AMOUNT,
  MIN_BUDGET_AMOUNT,
  SOLO_MIN_BUDGET_AMOUNT,
} from '../data/budgetTiers'
import { formatWon } from '../utils/format'

export default function BudgetIntro() {
  const playerCount = useAppStore((state) => state.playerCount)
  const startBudget = useAppStore((state) => state.startBudget)
  const isDuo = playerCount === 2
  const soloRange = `${formatWon(SOLO_MIN_BUDGET_AMOUNT)}부터 ${formatWon(MAX_BUDGET_AMOUNT)}`
  const duoIndividualRange = `${formatWon(MIN_BUDGET_AMOUNT)}부터 ${formatWon(MAX_BUDGET_AMOUNT)}`
  const duoCombinedRange = `${formatWon(MIN_BUDGET_AMOUNT * 2)}부터 ${formatWon(MAX_BUDGET_AMOUNT * 2)}`

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
                <p>
                  두 분이 <strong className="font-black text-brand-500">각자 한 번씩</strong>{' '}
                  예산을 뽑습니다.
                </p>
                <p>
                  한 사람당{' '}
                  <strong className="font-black text-brand-500">{duoIndividualRange}</strong>{' '}
                  사이의 금액이 나옵니다.
                </p>
                <p>
                  두 금액을 합치면{' '}
                  <strong className="font-black text-brand-500">{duoCombinedRange}</strong>
                  까지의 예산으로 함께 꾸밀 수 있어요.
                </p>
              </>
            ) : (
              <>
                <p>
                  <strong className="font-black text-brand-500">{soloRange}</strong>{' '}
                  사이의 예산이 나옵니다.
                </p>
                <p>
                  결과가 아쉽다면 예산을{' '}
                  <strong className="font-black text-brand-500">한 번 더</strong>{' '}
                  다시 돌릴 수 있어요.
                </p>
                <p>
                  마지막으로 뽑힌 금액으로 나만의 웨딩 사진을 꾸미게 됩니다.
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

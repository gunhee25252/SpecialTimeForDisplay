import { useAppStore } from '../store/useAppStore'
import { findTypeByCode } from '../data/types16'
import { findItem } from '../data/items'
import StageLayout from '../components/StageLayout'
import Button from '../components/Button'
import { formatWon } from '../utils/format'

// 6) complete — 유형 + 예산 + 캔버스 요약. 저장(이미지/QR)은 Phase 2. 다시 하기 → intro.
export default function Complete() {
  const resultCode = useAppStore((s) => s.resultCode)
  const playerCount = useAppStore((s) => s.playerCount)
  const budget = useAppStore((s) => s.budget)
  const spent = useAppStore((s) => s.spent)
  const placedItems = useAppStore((s) => s.placedItems)
  const reset = useAppStore((s) => s.reset)

  const type = resultCode ? findTypeByCode(resultCode) : undefined
  const isDuo = playerCount === 2

  return (
    <StageLayout>
      <div className="flex flex-1 flex-col items-center justify-center gap-8 text-center">
        <p className="text-2xl text-brand-400">완성!</p>

        <div className="w-full space-y-4 rounded-3xl border-4 border-brand-200 bg-white px-8 py-10 shadow-sm">
          <div>
            <p className="text-sm text-gray-400">{isDuo ? '합친 취향 유형' : '취향 유형'}</p>
            <p className="text-3xl font-bold text-gray-800">{type ? type.name : '유형 없음'}</p>
            <p className="font-mono text-base text-brand-500">{resultCode ?? '-'}</p>
          </div>
          <div className="border-t border-brand-100 pt-4">
            <p className="text-sm text-gray-400">{isDuo ? '합산 예산 / 사용' : '예산 / 사용'}</p>
            <p className="text-2xl font-semibold text-gray-800">
              {budget === null ? '-' : formatWon(budget)} 중 {formatWon(spent)} 사용
            </p>
          </div>
          <div className="border-t border-brand-100 pt-4">
            <p className="text-sm text-gray-400">배치한 아이템 {placedItems.length}개</p>
            <p className="text-lg text-gray-600">
              {placedItems.length === 0
                ? '없음'
                : placedItems
                    .map((p) => findItem(p.itemId)?.name)
                    .filter(Boolean)
                    .join(', ')}
            </p>
          </div>
          <p className="pt-2 text-base text-gray-300">[이미지 저장 / QR은 Phase 2]</p>
        </div>

        <Button onClick={reset} className="px-16">
          다시 하기
        </Button>
      </div>
    </StageLayout>
  )
}

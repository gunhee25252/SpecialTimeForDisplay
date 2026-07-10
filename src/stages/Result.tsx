import { useAppStore } from '../store/useAppStore'
import { findTypeByCode } from '../data/types16'
import { AXES } from '../data/axes'
import StageLayout from '../components/StageLayout'
import Button from '../components/Button'

// 3) result — 산출된 16유형 코드를 데이터에서 찾아 표시.
export default function Result() {
  const resultCode = useAppStore((s) => s.resultCode)
  const axisScores = useAppStore((s) => s.axisScores)
  const playerCount = useAppStore((s) => s.playerCount)
  const setStage = useAppStore((s) => s.setStage)

  const type = resultCode ? findTypeByCode(resultCode) : undefined
  const isDuo = playerCount === 2

  return (
    <StageLayout>
      <div className="flex flex-1 flex-col items-center justify-center gap-8 text-center">
        <p className="text-2xl text-brand-400">
          {isDuo ? '두 분의 합친 취향 유형' : '나의 취향 유형'}
        </p>

        <div className="rounded-3xl border-4 border-brand-200 bg-white px-10 py-12 shadow-sm">
          <p className="text-5xl font-bold text-gray-800">{type ? type.name : '유형 없음'}</p>
          <p className="mt-4 font-mono text-xl text-brand-500">{resultCode ?? '-'}</p>
          <p className="mt-6 text-xl text-gray-500">
            {type ? type.description : '코드에 해당하는 유형을 찾지 못했습니다.'}
          </p>
          {isDuo && (
            <p className="mt-4 text-lg font-medium text-brand-400">
              두 분의 선택 점수를 합산해 나온 유형이에요.
            </p>
          )}
        </div>

        {/* Phase 1: 축별 점수 요약(디버그 겸 placeholder) */}
        <div className="grid grid-cols-2 gap-3 text-left">
          {AXES.map((axis) => (
            <div key={axis.key} className="rounded-xl bg-brand-50 px-4 py-3">
              <p className="text-sm text-brand-400">{axis.label}</p>
              <p className="text-lg text-gray-700">
                {axis.poles
                  .map((p) => `${p.label} ${axisScores[axis.key][p.code] ?? 0}`)
                  .join(' · ')}
              </p>
            </div>
          ))}
        </div>

        <Button onClick={() => setStage('decorate')} className="mt-4">
          사진 만들러 가기
        </Button>
      </div>
    </StageLayout>
  )
}

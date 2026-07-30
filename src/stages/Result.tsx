import { useMemo } from 'react'
import { useAppStore } from '../store/useAppStore'
import { findTypeByCode } from '../data/types16'
import { AXES, type AxisKey } from '../data/axes'
import { formatWon } from '../utils/format'
import StageLayout from '../components/StageLayout'
import Button from '../components/Button'

const AXIS_NOTE: Record<AxisKey, string> = {
  space: '장소',
  tone: '빛',
  deco: '연출',
  color: '색',
}

export default function Result() {
  const resultCode = useAppStore((s) => s.resultCode)
  const axisScores = useAppStore((s) => s.axisScores)
  const playerCount = useAppStore((s) => s.playerCount)
  const totalBudget = useAppStore((s) => s.totalBudget)
  const setStage = useAppStore((s) => s.setStage)

  const type = resultCode ? findTypeByCode(resultCode) : undefined
  const isDuo = playerCount === 2
  const axisResults = useMemo(
    () =>
      AXES.map((axis) => {
        const [left, right] = axis.poles
        const leftScore = axisScores[axis.key][left.code] ?? 0
        const rightScore = axisScores[axis.key][right.code] ?? 0
        const total = Math.max(1, leftScore + rightScore)
        const leftPercent = Math.round((leftScore / total) * 100)
        const rightPercent = 100 - leftPercent
        const winner = leftScore >= rightScore ? left : right
        const winnerPercent = Math.max(leftPercent, rightPercent)
        const gap = Math.abs(leftScore - rightScore)

        return {
          axis,
          left,
          right,
          leftPercent,
          rightPercent,
          winner,
          winnerPercent,
          gap,
        }
      }),
    [axisScores],
  )

  const strongest = [...axisResults].sort((a, b) => b.gap - a.gap)[0]
  const resultTitle = isDuo ? '두 분의 합친 취향 유형' : '당신의 취향 유형'
  const descriptionLines =
    type?.description.match(/[^.]+(?:\.|$)/g)?.map((sentence) => sentence.trim()) ?? []

  return (
    <StageLayout>
      <div
        className="grid h-full min-h-0 gap-5"
        style={{ gridTemplateRows: 'minmax(0, 1fr) minmax(0, 1fr) 7rem' }}
      >
        <section
          className="flex min-h-0 flex-col overflow-hidden rounded-[1.75rem] bg-white px-10 text-center shadow-sm"
        >
          <div className="flex min-h-0 flex-1 flex-col items-center justify-center px-4">
            <p
              className="font-black leading-none text-brand-500"
              style={{ fontSize: '56px' }}
            >
              {resultTitle}
            </p>
            <h2
              className="mt-5 font-black leading-none text-gray-800"
              style={{ fontSize: '68px' }}
            >
              {type ? type.name : '유형 없음'}
            </h2>
            <p
              className="mx-auto mt-6 max-w-[900px] font-semibold leading-[1.45] text-gray-600"
              style={{ fontSize: '26px' }}
            >
              {type
                ? descriptionLines.map((sentence, index) => (
                    <span key={`${type.typeId}-${index}`} className="block">
                      {sentence}
                    </span>
                  ))
                : '코드에 해당하는 유형을 찾지 못했습니다.'}
            </p>
          </div>

          <div
            className="flex shrink-0 flex-col gap-6"
            style={{ paddingTop: '24px', paddingBottom: '40px' }}
          >
            <InfoRow
              label="결혼 예산"
              value={totalBudget != null ? formatWon(totalBudget) : '-'}
              caption=""
            />
            <InfoRow
              label="가장 뚜렷한 취향"
              value={`${strongest?.winnerPercent ?? 0}%`}
              caption={
                strongest
                  ? `${strongest.axis.label} · ${strongest.winner.label}`
                  : '분석할 선택 없음'
              }
            />
          </div>
        </section>

        <section
          className="flex min-h-0 flex-col overflow-hidden rounded-[1.75rem] border-4 border-brand-100 bg-white shadow-sm"
          style={{ padding: '24px' }}
        >
          <div className="mb-3 flex h-12 shrink-0 items-center">
            <p className="text-3xl font-black text-gray-800">취향 게이지</p>
          </div>

          <div
            className="grid min-h-0 flex-1 grid-rows-4"
            style={{ gap: '20px' }}
          >
            {axisResults.map((result) => (
              <AxisGauge key={result.axis.key} result={result} />
            ))}
          </div>
        </section>

        <div className="flex min-h-0 items-center justify-center">
          <Button onClick={() => setStage('decorate')} className="px-16 py-5">
            사진 만들러 가기
          </Button>
        </div>
      </div>
    </StageLayout>
  )
}

function InfoRow({
  label,
  value,
  caption,
}: {
  label: string
  value: string
  caption: string
}) {
  return (
    <div
      className="grid min-h-0 shrink-0 items-center rounded-[1.25rem] border-4 border-brand-100 px-7 text-center"
      style={{
        height: '96px',
        gridTemplateColumns: '16rem minmax(0, 1fr) 15rem',
      }}
    >
      <p className="font-black text-brand-500" style={{ fontSize: '27px' }}>
        {label}
      </p>
      <p
        className="truncate font-black leading-none text-gray-800"
        style={{ fontSize: '38px' }}
      >
        {value}
      </p>
      <p className="text-center font-bold text-gray-600" style={{ fontSize: '25px' }}>
        {caption}
      </p>
    </div>
  )
}

function AxisGauge({
  result,
}: {
  result: {
    axis: (typeof AXES)[number]
    left: (typeof AXES)[number]['poles'][number]
    right: (typeof AXES)[number]['poles'][number]
    leftPercent: number
    rightPercent: number
    winner: (typeof AXES)[number]['poles'][number]
    winnerPercent: number
    gap: number
  }
}) {
  const isBalanced = result.gap === 0

  return (
    <div
      className="grid h-full min-h-0 items-center gap-5 rounded-2xl bg-brand-50 px-6 py-2"
      style={{ gridTemplateColumns: '9rem minmax(0, 1fr) 8rem' }}
    >
      <div className="text-center">
        <p className="font-black leading-none text-gray-800" style={{ fontSize: '28px' }}>
          {result.axis.label}
        </p>
        <p className="mt-2 font-bold leading-none text-gray-400" style={{ fontSize: '17px' }}>
          {AXIS_NOTE[result.axis.key]}
        </p>
      </div>

      <div className="min-w-0">
        <div
          className="mb-3 flex items-center justify-between font-bold text-gray-600"
          style={{ fontSize: '21px' }}
        >
          <span>{result.left.label}</span>
          <span>{result.right.label}</span>
        </div>
        <div
          className="overflow-hidden rounded-full"
          style={{
            height: '22px',
            backgroundColor: '#ffffff',
            boxShadow: '0 0 0 2px #dbeaff',
          }}
        >
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${result.leftPercent}%`,
              backgroundColor: '#5a9ef7',
            }}
          />
        </div>
      </div>

      <div className="text-center">
        <p className="font-black leading-none text-brand-500" style={{ fontSize: '44px' }}>
          {isBalanced ? '50:50' : `${result.winnerPercent}%`}
        </p>
        <p className="mt-2 font-black leading-none text-gray-500" style={{ fontSize: '21px' }}>
          {result.winner.label}
        </p>
      </div>
    </div>
  )
}

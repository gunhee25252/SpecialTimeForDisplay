import { useMemo } from 'react'
import { useAppStore } from '../store/useAppStore'
import { findTypeByCode } from '../data/types16'
import { AXES } from '../data/axes'
import StageLayout from '../components/StageLayout'
import Button from '../components/Button'

export default function Result() {
  const resultCode = useAppStore((s) => s.resultCode)
  const axisScores = useAppStore((s) => s.axisScores)
  const playerCount = useAppStore((s) => s.playerCount)
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

  const strongestPercent = Math.max(...axisResults.map((result) => result.winnerPercent))
  const strongestResults = axisResults.filter(
    (result) => result.winnerPercent === strongestPercent,
  )
  const strongestInfo = (() => {
    if (strongestPercent === 50) {
      return {
        label: '',
        value: '모든 취향이 균형 잡혀 있어요',
        caption: '',
        centerOnly: true,
      }
    }

    if (strongestResults.length === 1) {
      const result = strongestResults[0]
      return {
        label: '가장 뚜렷한 취향',
        value: `${strongestPercent}%`,
        caption: `${result.axis.label} · ${result.winner.label}`,
        centerOnly: false,
      }
    }

    if (strongestResults.length >= 2) {
      const isAllStrongest = strongestResults.length === axisResults.length
      return {
        label: isAllStrongest
          ? '모든 취향이 뚜렷해요'
          : `${strongestResults.length}가지 공동 취향`,
        value: `${strongestPercent}%`,
        caption: strongestResults
          .map((result) => result.winner.label)
          .join(' · '),
        centerOnly: false,
      }
    }

    return {
      label: '가장 뚜렷한 취향',
      value: `${strongestPercent}%`,
      caption: '분석할 선택 없음',
      centerOnly: false,
    }
  })()
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
          className="relative flex min-h-0 flex-col overflow-hidden rounded-[1.75rem] bg-white px-10 text-center shadow-sm"
        >
          {type && (
            <>
              <img
                src={`/images/result-types/type${type.typeId}.png`}
                alt=""
                aria-hidden="true"
                className="absolute inset-0 h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-white/70" aria-hidden="true" />
            </>
          )}

          <div
            className="relative z-10 flex min-h-0 flex-1 items-center justify-center"
            style={{ transform: 'translateY(50px)' }}
          >
            <div className="w-full max-w-[880px] rounded-[1.25rem] border-4 border-brand-100 bg-white/80 px-6 py-8">
              <p
                className="font-black leading-none text-brand-500"
                style={{ fontSize: '46px' }}
              >
                {resultTitle}
              </p>
              <h2
                className="mt-5 whitespace-nowrap font-black leading-[1.08] text-gray-800"
                style={{ fontSize: '60px' }}
              >
                {type ? type.name : '유형 없음'}
              </h2>

              <p
                className="mx-auto mt-5 w-full max-w-[940px] font-semibold leading-[1.45] text-gray-600"
                style={{ fontSize: '25px' }}
              >
                {type
                  ? descriptionLines.map((sentence, index) => (
                      <span
                        key={`${type.typeId}-${index}`}
                        className="block whitespace-nowrap"
                      >
                        {sentence}
                      </span>
                    ))
                  : '코드에 해당하는 유형을 찾지 못했습니다.'}
              </p>
            </div>
          </div>

          <div
            className="relative z-10 flex shrink-0 flex-col gap-6"
            style={{ paddingTop: '24px', paddingBottom: '100px' }}
          >
            <InfoRow
              label={strongestInfo.label}
              value={strongestInfo.value}
              caption={strongestInfo.caption}
              centerOnly={strongestInfo.centerOnly}
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
          <Button onClick={() => setStage('budgetIntro')} className="px-16 py-5">
            다음으로
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
  centerOnly = false,
}: {
  label: string
  value: string
  caption: string
  centerOnly?: boolean
}) {
  return (
    <div
      className={`min-h-0 shrink-0 items-center rounded-[1.25rem] border-4 border-brand-100 bg-white/80 px-7 text-center ${
        centerOnly ? 'flex justify-center' : 'grid'
      }`}
      style={{
        height: '96px',
        gridTemplateColumns: centerOnly ? undefined : '18rem 12rem minmax(0, 1fr)',
      }}
    >
      {!centerOnly && (
        <p className="font-black text-brand-500" style={{ fontSize: '27px' }}>
          {label}
        </p>
      )}
      <p
        className="font-black leading-none text-gray-800"
        style={{ fontSize: centerOnly ? '32px' : '38px' }}
      >
        {value}
      </p>
      {!centerOnly && (
        <p className="text-center font-bold text-gray-600" style={{ fontSize: '25px' }}>
          {caption}
        </p>
      )}
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
  const isLeftWinner = result.winner.code === result.left.code

  return (
    <div
      className="grid h-full min-h-0 items-center gap-6 rounded-2xl bg-brand-50 px-6 py-2"
      style={{ gridTemplateColumns: '8.5rem minmax(0, 1fr)' }}
    >
      <div className="flex h-[72%] flex-col items-center justify-center border-r-2 border-brand-200 pr-6 text-center">
        <p className="font-black leading-none text-gray-800" style={{ fontSize: '34px' }}>
          {result.axis.label}
        </p>
      </div>

      <div className="min-w-0">
        <div
          className="mb-2 grid items-center font-bold text-gray-600"
          style={{ fontSize: '26px', gridTemplateColumns: '1fr auto 1fr' }}
        >
          <span className="flex items-center gap-2 justify-self-start" style={{ color: '#168e84' }}>
            <span className="h-4 w-4 rounded-sm bg-[#66d9cc]" aria-hidden="true" />
            {result.left.label}
          </span>
          <span
            className="px-5 font-black leading-none"
            style={{
              fontSize: '36px',
              color: isBalanced ? '#111827' : isLeftWinner ? '#168e84' : '#db5676',
            }}
          >
            {isBalanced ? '50:50' : `${result.winnerPercent}%`}
          </span>
          <span className="flex items-center gap-2 justify-self-end" style={{ color: '#db5676' }}>
            {result.right.label}
            <span className="h-4 w-4 rounded-sm bg-[#ff9eb5]" aria-hidden="true" />
          </span>
        </div>
        <div
          className="flex overflow-hidden rounded-full"
          style={{ height: '22px', backgroundColor: '#ffffff', boxShadow: '0 0 0 2px #dfe5e7' }}
        >
          <div
            className="h-full transition-all duration-500"
            style={{
              width: `${result.leftPercent}%`,
              backgroundColor: '#66d9cc',
            }}
          />
          <div
            className="h-full transition-all duration-500"
            style={{
              width: `${result.rightPercent}%`,
              backgroundColor: '#ff9eb5',
            }}
          />
        </div>
      </div>
    </div>
  )
}

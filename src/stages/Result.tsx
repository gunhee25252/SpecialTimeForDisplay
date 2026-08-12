import { useMemo } from 'react'
import { useAppStore } from '../store/useAppStore'
import { findTypeByCode } from '../data/types16'
import { AXES, type AxisKey, type PoleCode } from '../data/axes'
import StageLayout from '../components/StageLayout'
import Button from '../components/Button'

type CaptionIntensity = 'soft' | 'clear' | 'strong'

const BALANCED_CAPTIONS: Record<AxisKey, string> = {
  space: '실내의 편안함과 야외의 자유로움을 모두 좋아해요.',
  tone: '밝은 설렘과 어두운 낭만을 고르게 즐겨요.',
  deco: '꾸밀 때와 덜어낼 때를 정확히 아는 균형형이에요.',
  color: '무채색의 차분함과 유채색의 생기를 모두 즐겨요.',
}

const POLE_CAPTIONS: Record<PoleCode, Record<CaptionIntensity, string>> = {
  IN: {
    soft: '날씨 좋은 날에도 실내의 편안함이 조금 더 끌려요.',
    clear: '아늑하고 안정적인 실내에서 마음이 놓여요.',
    strong: '날씨와 변수는 문밖에 두고 싶은 완전한 실내파예요.',
  },
  OUT: {
    soft: '답답한 벽보다 탁 트인 풍경에 조금 더 마음이 가요.',
    clear: '바람과 햇살이 있는 순간에 마음이 활짝 열려요.',
    strong: '거의 밖에서 사는 완전한 야외파예요.',
  },
  LIGHT: {
    soft: '조금 더 환하고 산뜻한 장면에 눈길이 가요.',
    clear: '밝은 빛이 들어와야 설렘도 제대로 시작돼요.',
    strong: '햇빛이 많을수록 기분도 함께 환해지는 취향이에요.',
  },
  DARK: {
    soft: '은은한 그림자가 있는 장면에 조금 더 끌려요.',
    clear: '조명이 낮아질수록 분위기는 더 깊어진다고 느껴요.',
    strong: '촛불 하나만 켜도 분위기는 이미 완성돼요.',
  },
  FANCY: {
    soft: '작은 포인트 하나라도 더하면 마음이 즐거워져요.',
    clear: '볼거리와 장식이 풍성할수록 설렘도 커져요.',
    strong: '빈 공간을 보면 무엇이라도 꾸미고 싶어져요.',
  },
  SIMPLE: {
    soft: '군더더기 없이 정돈된 장면에 조금 더 끌려요.',
    clear: '꼭 필요한 것만 남긴 깔끔한 구성을 좋아해요.',
    strong: '하나를 더하기보다 덜어낼 때 마음이 편해요.',
  },
  MONO: {
    soft: '색을 덜어낸 차분한 장면에 조금 더 눈길이 가요.',
    clear: '절제된 색 안에서 분위기와 형태를 더 잘 발견해요.',
    strong: '흑백만으로도 충분히 많은 이야기를 만들어요.',
  },
  CHROMA: {
    soft: '작은 색 포인트가 들어가면 기분도 함께 살아나요.',
    clear: '다채로운 색이 모일수록 장면이 더 생생해져요.',
    strong: '색상표가 모자랄 만큼 다채로운 장면을 좋아해요.',
  },
}

function getAxisCaption(
  axis: AxisKey,
  winner: PoleCode,
  winnerPercent: number,
  isBalanced: boolean,
) {
  if (isBalanced) return BALANCED_CAPTIONS[axis]
  const intensity: CaptionIntensity =
    winnerPercent >= 90 ? 'strong' : winnerPercent >= 70 ? 'clear' : 'soft'
  return POLE_CAPTIONS[winner][intensity]
}

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
        caption: result.winner.label,
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
          .join(', '),
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
  const caption = getAxisCaption(
    result.axis.key,
    result.winner.code,
    result.winnerPercent,
    isBalanced,
  )

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
        <p className="mt-2 text-center text-lg font-semibold leading-snug text-gray-500">
          {caption}
        </p>
      </div>
    </div>
  )
}

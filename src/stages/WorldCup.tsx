import { useAppStore } from '../store/useAppStore'
import { WORLDCUP_ROUNDS, type Choice } from '../data/worldcupRounds'
import StageLayout from '../components/StageLayout'
import PlayerIndicator from '../components/PlayerIndicator'
import { PLAYER_LABELS } from '../config/players'

// 2) worldcup — A vs B 선택을 반복하며 축 점수 누적. 세로 1080×1920 기준 레이아웃.
export default function WorldCup() {
  const roundIndex = useAppStore((s) => s.roundIndex)
  const choose = useAppStore((s) => s.choose)
  const playerCount = useAppStore((s) => s.playerCount)
  const currentPlayer = useAppStore((s) => s.currentPlayer)

  const round = WORLDCUP_ROUNDS[roundIndex]
  const total = WORLDCUP_ROUNDS.length
  const isDuo = playerCount === 2

  // 방어: 라운드 데이터가 비었을 때.
  if (!round) {
    return (
      <StageLayout>
        <div className="flex flex-1 items-center justify-center text-3xl text-gray-400">
          라운드 데이터가 없습니다.
        </div>
      </StageLayout>
    )
  }

  return (
    <StageLayout>
      <div className="flex h-full flex-col">
        {/* 상단: (둘이) 플레이어 인디케이터 + 진행도 + 질문 */}
        <header className="shrink-0 pb-8 text-center">
          {isDuo && (
            <div className="mb-4">
              <PlayerIndicator />
            </div>
          )}
          <p className="text-2xl font-medium text-brand-500">
            {isDuo && <span className="text-gray-500">{PLAYER_LABELS[currentPlayer]} · </span>}
            {roundIndex + 1} <span className="text-brand-300">/ {total}</span>
          </p>
          {/* 진행 바 */}
          <div className="mx-auto mt-4 h-2 w-2/3 overflow-hidden rounded-full bg-brand-100">
            <div
              className="h-full rounded-full bg-brand-400 transition-all duration-300"
              style={{ width: `${((roundIndex + 1) / total) * 100}%` }}
            />
          </div>
          <h2 className="mt-8 text-5xl font-bold leading-snug text-gray-800">
            {round.question}
          </h2>
        </header>

        {/* 중앙~하단: A/B 카드 위·아래로 크게 */}
        <div className="flex min-h-0 flex-1 flex-col gap-6 py-2">
          <ChoiceCard side="A" choice={round.A} onPick={() => choose(round, 'A')} />
          <div className="shrink-0 text-center text-3xl font-extrabold tracking-widest text-brand-300">
            VS
          </div>
          <ChoiceCard side="B" choice={round.B} onPick={() => choose(round, 'B')} />
        </div>
      </div>
    </StageLayout>
  )
}

function ChoiceCard({
  choice,
  side,
  onPick,
}: {
  side: 'A' | 'B'
  choice: Choice
  onPick: () => void
}) {
  const hasImage = Boolean(choice.image)
  return (
    <button
      onClick={onPick}
      className="group relative flex min-h-0 flex-1 select-none flex-col items-center justify-end overflow-hidden rounded-[2rem] border-4 border-brand-200 bg-white text-center shadow-md transition-transform active:scale-[0.98] active:border-brand-400"
    >
      {/* 배경: image 있으면 배경 이미지, 없으면 placeholder */}
      {hasImage ? (
        <img
          src={choice.image}
          alt={choice.label}
          className="absolute inset-0 h-full w-full object-cover"
          draggable={false}
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-brand-50 to-brand-100">
          <span className="text-2xl font-medium text-brand-300">
            이미지 placeholder ({side})
          </span>
        </div>
      )}

      {/* 라벨 영역: 이미지 위에 가독성 확보를 위한 그라데이션 + 텍스트 */}
      <div
        className={`relative w-full px-8 py-7 ${
          hasImage
            ? 'bg-gradient-to-t from-black/65 to-transparent text-white'
            : 'text-gray-800'
        }`}
      >
        <p className="text-4xl font-bold drop-shadow-sm">{choice.label}</p>
        {choice.desc && (
          <p className={`mt-2 text-2xl ${hasImage ? 'text-white/85' : 'text-gray-400'}`}>
            {choice.desc}
          </p>
        )}
      </div>
    </button>
  )
}

import { useAppStore, type PlayerCount } from '../store/useAppStore'
import StageLayout from '../components/StageLayout'
import Button from '../components/Button'

// 1) intro — 전시 타이틀 + 인원 선택(혼자/둘이) + 시작하기.
export default function Intro() {
  const playerCount = useAppStore((s) => s.playerCount)
  const setPlayerCount = useAppStore((s) => s.setPlayerCount)
  const start = useAppStore((s) => s.start)

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

        {/* 인원 선택 */}
        <div className="w-full space-y-5">
          <p className="text-2xl font-medium text-gray-500">몇 명이 함께 하나요?</p>
          <div className="flex justify-center gap-6">
            <PlayerOption
              count={1}
              label="혼자"
              emoji="🙋"
              selected={playerCount === 1}
              onSelect={setPlayerCount}
            />
            <PlayerOption
              count={2}
              label="둘이"
              emoji="💑"
              selected={playerCount === 2}
              onSelect={setPlayerCount}
            />
          </div>
        </div>

        <Button onClick={start} className="px-16 py-7 text-3xl">
          시작하기
        </Button>
      </div>
    </StageLayout>
  )
}

function PlayerOption({
  count,
  label,
  emoji,
  selected,
  onSelect,
}: {
  count: PlayerCount
  label: string
  emoji: string
  selected: boolean
  onSelect: (count: PlayerCount) => void
}) {
  return (
    <button
      onClick={() => onSelect(count)}
      className={`flex h-44 w-44 select-none flex-col items-center justify-center gap-3 rounded-3xl border-4 text-3xl font-bold transition-colors ${
        selected
          ? 'border-brand-500 bg-brand-500 text-white'
          : 'border-brand-200 bg-white text-gray-700 active:bg-brand-50'
      }`}
    >
      <span className="text-6xl">{emoji}</span>
      {label}
    </button>
  )
}

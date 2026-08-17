import { UserRound, UsersRound } from 'lucide-react'
import { useAppStore, type PlayerCount } from '../store/useAppStore'
import StageLayout from '../components/StageLayout'

// 2) playerSelect — 시작 의사를 확인한 뒤 진행 인원을 선택.
export default function PlayerSelect() {
  const start = useAppStore((s) => s.start)

  const selectAndStart = (count: PlayerCount) => {
    start(count)
  }

  return (
    <StageLayout>
      {/* 세로 가운데 정렬 대신 위쪽 여백으로 위치를 잡아 화면 전체를 위로 올린다. */}
      <div className="flex flex-1 flex-col items-center gap-12 pt-[520px] text-center">
        <div className="space-y-4">
          <p className="text-[46px] font-semibold text-brand-400">시작하기 전에</p>
          <h1 className="font-ryuryu text-[80px] font-bold leading-tight text-gray-800">
            몇 명에서 참여할까요?
          </h1>
        </div>

        <div className="grid w-full grid-cols-2 gap-6 px-4">
          <PlayerOption count={1} title="혼자" caption="내 취향으로 진행" onSelect={selectAndStart} />
          <PlayerOption count={2} title="둘이" caption="취향과 예산을 함께 합산" onSelect={selectAndStart} />
        </div>
      </div>
    </StageLayout>
  )
}

function PlayerOption({
  count,
  title,
  caption,
  onSelect,
}: {
  count: PlayerCount
  title: string
  caption: string
  onSelect: (count: PlayerCount) => void
}) {
  const PersonIcon = count === 1 ? UserRound : UsersRound

  return (
    <button
      onClick={() => onSelect(count)}
      className="flex h-64 select-none flex-col items-center justify-center gap-4 rounded-3xl border-4 border-brand-200 bg-white px-5 text-gray-800 shadow-sm transition-colors active:border-brand-500 active:bg-brand-50"
    >
      <span className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-500 text-4xl font-extrabold tabular-nums text-white">
        {count}
      </span>
      <span className="flex items-center justify-center gap-3 text-brand-500">
        <PersonIcon aria-hidden="true" className="h-12 w-12" strokeWidth={2.4} />
        <span className="font-ryuryu text-[56px] font-bold leading-none">{title}</span>
      </span>
      <span className="text-3xl font-semibold leading-tight text-gray-500">{caption}</span>
    </button>
  )
}

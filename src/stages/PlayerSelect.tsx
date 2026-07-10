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
      <div className="flex flex-1 flex-col items-center justify-center gap-12 text-center">
        <div className="space-y-4">
          <p className="text-2xl text-brand-400">시작하기 전에</p>
          <h1 className="text-5xl font-bold leading-tight text-gray-800">
            누구와 함께
            <br />
            진행할까요?
          </h1>
        </div>

        <div className="grid w-full grid-cols-2 gap-6 px-4">
          <PlayerOption count={1} title="혼자 해볼게요" caption="내 취향으로 진행" onSelect={selectAndStart} />
          <PlayerOption count={2} title="둘이 함께할게요" caption="취향과 예산을 함께 합산" onSelect={selectAndStart} />
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
  return (
    <button
      onClick={() => onSelect(count)}
      className="flex h-56 select-none flex-col items-center justify-center gap-4 rounded-3xl border-4 border-brand-200 bg-white px-5 text-gray-800 shadow-sm transition-colors active:border-brand-500 active:bg-brand-50"
    >
      <span className="flex h-20 w-20 items-center justify-center rounded-full bg-brand-500 text-5xl font-extrabold tabular-nums text-white">
        {count}
      </span>
      <span className="text-3xl font-bold leading-tight">{title}</span>
      <span className="text-xl font-medium text-gray-400">{caption}</span>
    </button>
  )
}

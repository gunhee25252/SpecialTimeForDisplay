import { useAppStore } from '../store/useAppStore'
import { PLAYER_LABELS } from '../config/players'

// 상단 플레이어 진행 인디케이터. 둘이 모드에서만 노출(혼자면 null).
// 현재 플레이어 강조, 대기자는 흐리게, 완료자는 체크.
export default function PlayerIndicator() {
  const playerCount = useAppStore((s) => s.playerCount)
  const currentPlayer = useAppStore((s) => s.currentPlayer)

  if (playerCount !== 2) return null

  return (
    <div className="flex justify-center gap-3">
      {Array.from({ length: playerCount }).map((_, i) => {
        const done = i < currentPlayer
        const current = i === currentPlayer
        const tone = current
          ? 'bg-brand-500 text-white'
          : done
            ? 'bg-brand-100 text-brand-500'
            : 'bg-gray-100 text-gray-300'
        const badge = current
          ? 'bg-white text-brand-500'
          : done
            ? 'bg-brand-500 text-white'
            : 'bg-gray-300 text-white'
        return (
          <div
            key={i}
            className={`flex items-center gap-2 rounded-full px-4 py-2 text-lg font-semibold ${tone}`}
          >
            <span className={`flex h-7 w-7 items-center justify-center rounded-full text-base ${badge}`}>
              {done ? '✓' : i + 1}
            </span>
            {PLAYER_LABELS[i]}
          </div>
        )
      })}
    </div>
  )
}

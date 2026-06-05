import { useAppStore } from '../store/useAppStore'

// 어느 화면에서든 처음(intro)으로 되돌리는 버튼. 우상단 고정.
export default function ResetButton() {
  const reset = useAppStore((s) => s.reset)
  return (
    <button
      onClick={reset}
      className="absolute right-4 top-4 z-50 select-none rounded-full bg-black/30 px-5 py-3 text-lg font-medium text-white active:bg-black/50"
    >
      처음으로
    </button>
  )
}

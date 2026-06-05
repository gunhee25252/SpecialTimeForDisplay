import { useEffect, useRef } from 'react'
import { useAppStore } from '../store/useAppStore'
import { IDLE_TIMEOUT_MS } from '../data/constants'

// 일정 시간 무입력 시 자동으로 처음(intro)으로 리셋. 전시 운영용.
// intro 화면에서는 동작시킬 필요가 없으므로 호출부에서 stage로 enable을 제어한다.
export function useIdleReset(enabled: boolean) {
  const reset = useAppStore((s) => s.reset)
  const timerRef = useRef<number | null>(null)

  useEffect(() => {
    if (!enabled) return

    const clear = () => {
      if (timerRef.current !== null) window.clearTimeout(timerRef.current)
    }
    const schedule = () => {
      clear()
      timerRef.current = window.setTimeout(() => reset(), IDLE_TIMEOUT_MS)
    }

    // 사용자 입력이 있을 때마다 타이머 재시작.
    const events: (keyof WindowEventMap)[] = ['pointerdown', 'pointermove', 'keydown', 'touchstart']
    events.forEach((ev) => window.addEventListener(ev, schedule, { passive: true }))
    schedule()

    return () => {
      clear()
      events.forEach((ev) => window.removeEventListener(ev, schedule))
    }
  }, [enabled, reset])
}

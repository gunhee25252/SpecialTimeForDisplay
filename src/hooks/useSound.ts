import { useCallback } from 'react'
import { create } from 'zustand'
import { SOUNDS, SOUND_DEFAULT_MUTED, type SoundName } from '../config/sounds'

// 음소거 상태 전역 스토어. 기본값 mute=true.
interface SoundState {
  muted: boolean
  setMuted: (muted: boolean) => void
  toggleMuted: () => void
}

export const useSoundStore = create<SoundState>((set) => ({
  muted: SOUND_DEFAULT_MUTED,
  setMuted: (muted) => set({ muted }),
  toggleMuted: () => set((s) => ({ muted: !s.muted })),
}))

// 사운드 재생 훅. mute면 아무것도 하지 않고, placeholder 파일이 없으면 조용히 무시.
export function useSound() {
  const muted = useSoundStore((s) => s.muted)
  const play = useCallback(
    (name: SoundName) => {
      if (muted) return
      try {
        const audio = new Audio(SOUNDS[name])
        audio.volume = 0.8
        void audio.play().catch(() => {})
      } catch {
        /* placeholder 음원 없음 — 무시 */
      }
    },
    [muted],
  )
  return { play, muted }
}

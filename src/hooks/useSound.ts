import { useCallback, useEffect, useRef } from 'react'
import { create } from 'zustand'
import { EFFECT_VOLUMES, SOUNDS, SOUND_DEFAULT_MUTED, type SoundName } from '../config/sounds'

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

interface PlaySoundOptions {
  loop?: boolean
  volume?: number
}

// 사운드 재생 훅. 반복음은 이름별로 추적해 원하는 순간 정확히 멈춘다.
export function useSound() {
  const muted = useSoundStore((s) => s.muted)
  const activeRef = useRef<Partial<Record<SoundName, HTMLAudioElement>>>({})

  const stop = useCallback((name: SoundName) => {
    const audio = activeRef.current[name]
    if (!audio) return
    audio.pause()
    audio.currentTime = 0
    delete activeRef.current[name]
  }, [])

  const play = useCallback(
    (name: SoundName, options?: PlaySoundOptions) => {
      if (muted) return
      try {
        if (options?.loop) stop(name)
        const audio = new Audio(SOUNDS[name])
        audio.loop = options?.loop ?? false
        audio.volume = options?.volume ?? EFFECT_VOLUMES.default
        if (options?.loop) activeRef.current[name] = audio
        void audio.play().catch(() => {})
      } catch {
        /* placeholder 음원 없음 — 무시 */
      }
    },
    [muted, stop],
  )

  useEffect(() => {
    if (!muted) return
    Object.keys(activeRef.current).forEach((name) => stop(name as SoundName))
  }, [muted, stop])

  useEffect(
    () => () => {
      Object.keys(activeRef.current).forEach((name) => stop(name as SoundName))
    },
    [stop],
  )

  return { play, stop, muted }
}

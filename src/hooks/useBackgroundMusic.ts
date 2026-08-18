import { useEffect } from 'react'
import { BGM_FADE_OUT_MS, BGM_PATH, BGM_VOLUME } from '../config/sounds'
import type { Stage } from '../store/useAppStore'

type BackgroundMusicWindow = Window & {
  __specialTimeBackgroundMusic?: HTMLAudioElement
  __specialTimeBackgroundMusicFade?: number
}

function getBackgroundMusic() {
  const bgmWindow = window as BackgroundMusicWindow
  if (bgmWindow.__specialTimeBackgroundMusic) {
    return bgmWindow.__specialTimeBackgroundMusic
  }

  const audio = new Audio(BGM_PATH)
  audio.loop = true
  audio.preload = 'auto'
  audio.volume = BGM_VOLUME
  audio.load()
  bgmWindow.__specialTimeBackgroundMusic = audio
  return audio
}

// 진행 중인 페이드가 있으면 멈춘다. 껐다 켜기를 빠르게 반복해도 볼륨이 꼬이지 않게 한다.
function clearFade() {
  const bgmWindow = window as BackgroundMusicWindow
  if (bgmWindow.__specialTimeBackgroundMusicFade !== undefined) {
    window.clearInterval(bgmWindow.__specialTimeBackgroundMusicFade)
    bgmWindow.__specialTimeBackgroundMusicFade = undefined
  }
}

// 브라우저는 사용자가 누른 순간에만 소리를 허용하므로, 반드시 버튼 핸들러 안에서 부른다.
export function startBackgroundMusic() {
  clearFade()
  const audio = getBackgroundMusic()
  audio.volume = BGM_VOLUME
  if (!audio.paused) return
  void audio.play().catch(() => {})
}

// 시작 화면으로 돌아오면 뚝 끊지 않고 서서히 줄여서 멈춘다.
export function fadeOutBackgroundMusic(durationMs = BGM_FADE_OUT_MS) {
  const bgmWindow = window as BackgroundMusicWindow
  const audio = getBackgroundMusic()
  clearFade()
  if (audio.paused) return

  const stepMs = 50
  const step = audio.volume / Math.max(1, durationMs / stepMs)
  bgmWindow.__specialTimeBackgroundMusicFade = window.setInterval(() => {
    const next = audio.volume - step
    if (next <= 0.001) {
      clearFade()
      audio.pause()
      // 다음 체험은 곡 처음부터 시작한다.
      audio.currentTime = 0
      audio.volume = BGM_VOLUME
      return
    }
    audio.volume = next
  }, stepMs)
}

// 시작 화면에서는 음악을 끄고, 체험이 진행되는 동안만 틀어 둔다.
export function useBackgroundMusic(stage: Stage) {
  useEffect(() => {
    if (stage === 'intro') {
      fadeOutBackgroundMusic()
      return
    }
    startBackgroundMusic()
  }, [stage])
}

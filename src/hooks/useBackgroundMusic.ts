import { useEffect } from 'react'
import { BGM_PATH, BGM_VOLUME } from '../config/sounds'

type BackgroundMusicWindow = Window & {
  __specialTimeBackgroundMusic?: HTMLAudioElement
  __specialTimeBackgroundMusicUnlocked?: boolean
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

export function startBackgroundMusic() {
  const bgmWindow = window as BackgroundMusicWindow
  bgmWindow.__specialTimeBackgroundMusicUnlocked = true
  const audio = getBackgroundMusic()
  if (!audio.paused) return
  void audio.play().catch(() => {})
}

// Keep one BGM instance for the whole app and unlock it on the first interaction.
export function useBackgroundMusic() {
  useEffect(() => {
    const bgmWindow = window as BackgroundMusicWindow
    const audio = getBackgroundMusic()

    function unlock() {
      startBackgroundMusic()
    }

    function retryAfterLoad() {
      if (bgmWindow.__specialTimeBackgroundMusicUnlocked) startBackgroundMusic()
    }

    window.addEventListener('pointerdown', unlock, true)
    window.addEventListener('touchstart', unlock, { capture: true, passive: true })
    window.addEventListener('click', unlock, true)
    window.addEventListener('keydown', unlock, true)
    audio.addEventListener('canplay', retryAfterLoad)

    // Kiosk browsers configured to allow autoplay can start before the first touch.
    void audio.play().catch(() => {})

    return () => {
      window.removeEventListener('pointerdown', unlock, true)
      window.removeEventListener('touchstart', unlock, true)
      window.removeEventListener('click', unlock, true)
      window.removeEventListener('keydown', unlock, true)
      audio.removeEventListener('canplay', retryAfterLoad)
    }
  }, [])
}

import { useEffect } from 'react'
import { BGM_PATH, BGM_VOLUME } from '../config/sounds'

// 한 곡을 앱 전체에서 유지한다. 자동재생이 막히면 첫 사용자 입력에서 다시 시도한다.
export function useBackgroundMusic() {
  useEffect(() => {
    const audio = new Audio(BGM_PATH)
    audio.loop = true
    audio.preload = 'auto'
    audio.volume = BGM_VOLUME

    const removeUnlockListeners = () => {
      window.removeEventListener('pointerdown', unlock, true)
      window.removeEventListener('keydown', unlock, true)
    }

    const tryPlay = async () => {
      try {
        await audio.play()
        removeUnlockListeners()
      } catch {
        // 일반 브라우저는 사용자 입력 전 자동재생을 막을 수 있다.
      }
    }

    function unlock() {
      void tryPlay()
    }

    window.addEventListener('pointerdown', unlock, true)
    window.addEventListener('keydown', unlock, true)
    void tryPlay()

    return () => {
      removeUnlockListeners()
      audio.pause()
      audio.removeAttribute('src')
      audio.load()
    }
  }, [])
}

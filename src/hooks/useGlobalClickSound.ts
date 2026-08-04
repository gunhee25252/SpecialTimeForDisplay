import { useEffect } from 'react'
import { useSound } from './useSound'
import { EFFECT_VOLUMES } from '../config/sounds'

// 활성 버튼의 실제 클릭에만 짧은 피드백음을 낸다.
export function useGlobalClickSound() {
  const { play } = useSound()

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      const target = event.target
      if (!(target instanceof Element)) return
      const button = target.closest('button, [role="button"]')
      if (!button || button.matches(':disabled, [aria-disabled="true"]')) return
      play('click', { volume: EFFECT_VOLUMES.click })
    }

    document.addEventListener('click', handleClick)
    return () => document.removeEventListener('click', handleClick)
  }, [play])
}

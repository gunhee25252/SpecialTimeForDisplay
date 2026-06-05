import { useEffect, useRef, useState } from 'react'

// 0 → target 으로 카운트업(ease-out). active가 true가 되면 시작.
// 반환된 skip()을 호출하면 즉시 target으로 점프(긴 연출 스킵용).
export function useCountUp(target: number, durationMs: number, active: boolean) {
  const [value, setValue] = useState(0)
  const skipRef = useRef(false)

  useEffect(() => {
    if (!active) {
      setValue(0)
      return
    }
    skipRef.current = false
    let raf = 0
    const start = performance.now()
    const step = (now: number) => {
      if (skipRef.current) {
        setValue(target)
        return
      }
      const t = Math.min(1, (now - start) / durationMs)
      const eased = 1 - Math.pow(1 - t, 3)
      setValue(target * eased)
      if (t < 1) raf = requestAnimationFrame(step)
      else setValue(target)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [target, durationMs, active])

  const skip = () => {
    skipRef.current = true
    setValue(target)
  }

  return { value, skip }
}

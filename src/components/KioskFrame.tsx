import { useEffect, useState, type ReactNode } from 'react'
import { BASE_WIDTH, BASE_HEIGHT } from '../data/constants'

// 기준 해상도(1080×1920) 캔버스를 윈도우에 맞춰 비율 유지하며 스케일(레터박스).
// 내부 모든 좌표/레이아웃은 1080×1920 좌표계를 사용하면 된다.
export default function KioskFrame({ children }: { children: ReactNode }) {
  const [scale, setScale] = useState(1)

  useEffect(() => {
    const update = () => {
      const s = Math.min(window.innerWidth / BASE_WIDTH, window.innerHeight / BASE_HEIGHT)
      setScale(s)
    }
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  return (
    <div className="flex h-screen w-screen items-center justify-center overflow-hidden bg-black">
      <div
        style={{
          width: BASE_WIDTH,
          height: BASE_HEIGHT,
          transform: `scale(${scale})`,
          transformOrigin: 'center center',
        }}
        className="relative shrink-0 overflow-hidden bg-brand-50"
      >
        {children}
      </div>
    </div>
  )
}

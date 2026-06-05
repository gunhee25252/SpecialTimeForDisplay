import confetti from 'canvas-confetti'
import { CELEBRATION_COLORS } from '../config/transitions'

// result 등장 시 꽃잎/컨페티 버스트. canvas-confetti가 body에 캔버스를 깔아준다.
export function fireCelebration() {
  const colors = CELEBRATION_COLORS
  // 중앙 상단에서 한 번 크게
  confetti({ particleCount: 90, spread: 75, startVelocity: 45, origin: { y: 0.35 }, colors })
  // 양옆에서 보조 버스트
  window.setTimeout(() => {
    confetti({ particleCount: 50, angle: 60, spread: 55, origin: { x: 0, y: 0.55 }, colors })
    confetti({ particleCount: 50, angle: 120, spread: 55, origin: { x: 1, y: 0.55 }, colors })
  }, 150)
}

// 최고 티어(드림 웨딩) 전용 골드 강조 버스트.
export function fireGoldBurst() {
  const colors = ['#ffd700', '#ffe680', '#fff1b8', '#86bbff', '#ffffff']
  confetti({ particleCount: 160, spread: 110, startVelocity: 55, origin: { y: 0.4 }, colors, scalar: 1.2 })
  window.setTimeout(() => {
    confetti({ particleCount: 90, spread: 130, startVelocity: 40, origin: { y: 0.5 }, colors })
  }, 220)
}

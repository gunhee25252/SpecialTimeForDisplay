import type { Stage } from '../store/useAppStore'

// 전환 종류. (from → to) 조합으로 결정되며, 변형(variants)·오버레이 선택에 쓰인다.
// 흐름이 (혼자/둘이) 분기·반복되므로, 시그니처는 from→to가 아니라 "어디로 들어가는가"로 정한다.
export type TransitionType =
  | 'initial' // 최초 마운트(연출 없음)
  | 'base' // 그 외 기본 전환(worldcup↔budget 반복 등)
  | 'introToWorldcup'
  | 'enterResult' // → result: 취향 분석 중 + 카드 bounce + 컨페티 + 스탬프
  | 'enterDecorate' // → decorate: 예산이 우상단(잔액)으로 흡수 + 캔버스 와이프 인
  | 'decorateToComplete'
  | 'reset' // 어느 화면 → intro (처음으로)

export function getTransitionType(from: Stage | null, to: Stage): TransitionType {
  if (from === null) return 'initial'
  if (to === 'intro' && from !== 'intro') return 'reset'
  if (from === 'intro' && to === 'worldcup') return 'introToWorldcup'
  if (to === 'result') return 'enterResult'
  if (to === 'decorate') return 'enterDecorate'
  if (to === 'complete') return 'decorateToComplete'
  return 'base'
}

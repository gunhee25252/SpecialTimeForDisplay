// 예산 뽑기 연출 타이밍 상수. 슬롯/합산 속도 튜닝은 여기서만.
export const BUDGET_DRAW = {
  tickMs: 50, // 스핀 중 숫자 갱신 간격
  spinBaseMs: 1200, // 첫(최상위) 자리가 멈추는 시점
  digitStaggerMs: 350, // 자리별 멈춤 간격(차례로 멈춤)
  settlePadMs: 300, // 마지막 자리 멈춘 뒤 배너 등장까지
  sumDurationMs: 1300, // 둘이 모드 합산 카운트업 시간
} as const

// 최고 티어(드림 웨딩) — 강한 연출(골드 플래시+컨페티) 대상.
export const DREAM_TIER_ID = 'dream'

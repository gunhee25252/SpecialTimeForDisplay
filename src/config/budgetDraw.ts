// 예산 뽑기 연출 타이밍 상수. 카운트업 속도 튜닝은 여기서만.
export const BUDGET_DRAW = {
  // 뽑기 카운트업 길이(고정 → 걸리는 시간으로 금액대가 드러나지 않게).
  // 낮은 금액에서 시작해 감속하며 최종 금액에서 멈춘다.
  spinDurationMs: 2200,
  // 둘이 모드 합산 카운트업 시간.
  sumDurationMs: 1300,
} as const

// 최고 티어(드림 웨딩) — 강한 연출(골드 플래시+컨페티) 대상.
export const DREAM_TIER_ID = 'dream'

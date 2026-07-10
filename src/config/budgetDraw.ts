// 예산 뽑기 연출 타이밍 상수. 카운트업 속도 튜닝은 여기서만.
export const BUDGET_DRAW = {
  // 뽑기 자리수별 롤링 시간. 100만원대 → 1000만원대 → 1억원대 순서로
  // 같은 박자만큼 굴린 뒤, 다음 자리수로 못 올라가면 결과를 공개한다.
  rollStageDurationMs: 850,
  // 둘이 모드 합산 카운트업 시간.
  sumDurationMs: 1300,
} as const

// 최고 티어(드림 웨딩) — 강한 연출(골드 플래시+컨페티) 대상.
export const DREAM_TIER_ID = 'dream'

// 예산 티어 테이블 + 가중 추첨 로직. "극과 극으로 다양하게" 나오도록 weight로 분포 조절.
// 콘텐츠/확률 교체는 이 파일에서만. (drawBudgetResult는 순수 함수)
export interface BudgetTier {
  id: string
  label: string
  min: number // 원
  max: number // 원
  weight: number // 상대 가중치(합이 100일 필요 없음)
}

export const BUDGET_TIERS: BudgetTier[] = [
  { id: 'small', label: '알뜰 스몰웨딩', min: 1_000_000, max: 5_000_000, weight: 30 },
  { id: 'modest', label: '단란한 예식', min: 5_000_000, max: 20_000_000, weight: 30 },
  { id: 'luxury', label: '럭셔리 웨딩', min: 20_000_000, max: 60_000_000, weight: 25 },
  { id: 'premium', label: '프리미엄 호텔', min: 60_000_000, max: 100_000_000, weight: 12 },
  { id: 'dream', label: '드림 웨딩', min: 100_000_000, max: 300_000_000, weight: 3 },
]

// 뽑힌 금액 반올림 단위(10만원).
export const BUDGET_ROUND_UNIT = 100_000

// 카운트업 시작 금액(가장 낮은 티어 하한). "낮은 금액부터" 올라가며 뽑는다.
export const MIN_BUDGET_AMOUNT = Math.min(...BUDGET_TIERS.map((t) => t.min))

export interface BudgetDrawResult {
  tierId: string
  tierLabel: string
  amount: number
}

// ① weight 가중치로 티어 1개 추첨 → ② min~max 랜덤 금액 → ③ 10만원 단위 반올림.
export function drawBudgetResult(): BudgetDrawResult {
  const totalWeight = BUDGET_TIERS.reduce((sum, t) => sum + t.weight, 0)
  let r = Math.random() * totalWeight
  let tier = BUDGET_TIERS[BUDGET_TIERS.length - 1]
  for (const t of BUDGET_TIERS) {
    if (r < t.weight) {
      tier = t
      break
    }
    r -= t.weight
  }

  const raw = tier.min + Math.random() * (tier.max - tier.min)
  const rounded = Math.round(raw / BUDGET_ROUND_UNIT) * BUDGET_ROUND_UNIT
  const amount = Math.min(tier.max, Math.max(tier.min, rounded))

  return { tierId: tier.id, tierLabel: tier.label, amount }
}

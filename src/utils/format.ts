// 금액 표시 헬퍼. 원 단위 → "1,200만원" 같은 한국어 표기.
export function formatWon(amount: number): string {
  if (amount >= 10_000) {
    const man = Math.round(amount / 10_000)
    return `${man.toLocaleString('ko-KR')}만원`
  }
  return `${amount.toLocaleString('ko-KR')}원`
}

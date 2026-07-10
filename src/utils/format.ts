// 금액 표시 헬퍼. 원 단위 → "1,200만원", "2억 7,540만원" 같은 한국어 표기.
export function formatWon(amount: number): string {
  if (amount >= 100_000_000) {
    const eok = Math.floor(amount / 100_000_000)
    const man = Math.round((amount % 100_000_000) / 10_000)
    if (man === 0) return `${eok.toLocaleString('ko-KR')}억원`
    return `${eok.toLocaleString('ko-KR')}억 ${man.toLocaleString('ko-KR')}만원`
  }

  if (amount >= 10_000) {
    const man = Math.round(amount / 10_000)
    return `${man.toLocaleString('ko-KR')}만원`
  }
  return `${amount.toLocaleString('ko-KR')}원`
}

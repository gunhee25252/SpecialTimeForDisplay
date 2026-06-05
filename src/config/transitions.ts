// 화면 전환·연출의 모든 시간(초)·효과 값. 연출 튜닝은 이 파일에서만 한다.
// (각 스테이지 내부 로직/데이터와 분리된 "전환 레이어" 전용 설정)

type Bezier = [number, number, number, number]

export const TRANSITIONS = {
  // 공통 기본 전환: 이전 페이드아웃 + 새 화면 아래→위 슬라이드업 + 페이드인
  base: {
    duration: 0.6,
    slideUpPx: 48,
    ease: [0.22, 1, 0.36, 1] as Bezier,
  },
  // 화면을 한 번 쓸어주는 와이프 패널
  wipe: {
    duration: 0.7,
    ease: [0.65, 0, 0.35, 1] as Bezier,
  },
  // 시그니처 모멘트(전환별 특수 연출). 대략 1.5초 내외.
  signature: {
    bloom: { duration: 0.9, zoom: 1.06 }, // intro → worldcup: 라이트 블룸 + 살짝 줌인
    analyzing: { duration: 1.4 }, // worldcup → result: 취향 분석 중 로딩
    resultEnter: { duration: 0.9, bounce: 0.5 }, // result 카드 scale+bounce 등장
    stamp: { duration: 0.7 }, // 유형 이름 도장 효과
    gift: { duration: 1.2 }, // result → budget: 선물상자 슬라이드 인
    budgetFly: { duration: 1.3 }, // budget → decorate: 금액 우상단 흡수
    shutter: { flash: 0.45, shake: 0.5, develop: 1.1 }, // decorate → complete: 셔터/흔들림/인화
    reset: { duration: 0.5 }, // 처음으로: 화이트 페이드
  },
} as const

// 컨페티/꽃잎 색상(브랜드 톤). result 등장 시 사용.
export const CELEBRATION_COLORS = ['#86bbff', '#5a9ef7', '#ffd6e7', '#fff1b8', '#ffffff']

import type { PoleCode } from './axes'

// 한 선택지가 각 극에 주는 점수 맵. 하나의 선택지가 여러 축에 점수를 줄 수 있다.
// 예: { OUT: 1, FANCY: 2 } → 공간 OUT +1, 장식 FANCY +2
export type Weights = Partial<Record<PoleCode, number>>

// 월드컵 한 라운드의 선택지(A 또는 B).
// Phase 1: image 없음(placeholder). 나중에 image 경로만 채워 교체.
export interface Choice {
  id: string
  label: string // 카드 제목
  desc?: string // 보조 설명(선택)
  image?: string // 배경 이미지 경로(없으면 placeholder)
  weights: Weights // 이 선택지가 누적시키는 극별 점수
}

export interface Round {
  id: string
  question: string // 라운드 질문 문구(크게 표시)
  A: Choice
  B: Choice
}

// Phase 1 더미 라운드 8개. 4개 축이 고르게 누적되도록 구성.
// 콘텐츠(질문/선택지/점수)는 이 배열만 수정하면 되고, 로직은 건드리지 않는다.
export const WORLDCUP_ROUNDS: Round[] = [
  {
    id: 'r1',
    question: '둘 중 더 끌리는 결혼식 공간은?',
    A: { id: 'r1a', label: '실내 채플', desc: '아늑한 실내 공간', weights: { IN: 1 } },
    B: { id: 'r1b', label: '야외 가든', desc: '탁 트인 야외 공간', weights: { OUT: 1 } },
  },
  {
    id: 'r2',
    question: '더 좋아하는 분위기는?',
    A: { id: 'r2a', label: '환한 햇살', desc: '밝고 화사한 톤', weights: { LIGHT: 1 } },
    B: { id: 'r2b', label: '은은한 조명', desc: '차분하고 어두운 톤', weights: { DARK: 1 } },
  },
  {
    id: 'r3',
    question: '장식 스타일은?',
    A: { id: 'r3a', label: '풍성한 플라워', desc: '화려한 장식', weights: { FANCY: 1 } },
    B: { id: 'r3b', label: '미니멀 라인', desc: '심플한 장식', weights: { SIMPLE: 1 } },
  },
  {
    id: 'r4',
    question: '끌리는 색감은?',
    A: { id: 'r4a', label: '블랙 & 화이트', desc: '무채색 무드', weights: { MONO: 1 } },
    B: { id: 'r4b', label: '컬러풀 팔레트', desc: '유채색 무드', weights: { CHROMA: 1 } },
  },
  {
    id: 'r5',
    question: '더 마음이 가는 한 컷은?',
    A: { id: 'r5a', label: '실내 + 심플', desc: '정돈된 실내 한 컷', weights: { IN: 1, SIMPLE: 1 } },
    B: { id: 'r5b', label: '야외 + 화려', desc: '풍성한 야외 한 컷', weights: { OUT: 1, FANCY: 1 } },
  },
  {
    id: 'r6',
    question: '사진의 무드는?',
    A: { id: 'r6a', label: '밝은 무채색', desc: '화이트 톤', weights: { LIGHT: 1, MONO: 1 } },
    B: { id: 'r6b', label: '어두운 유채색', desc: '딥 컬러 톤', weights: { DARK: 1, CHROMA: 1 } },
  },
  {
    id: 'r7',
    question: '더 나다운 쪽은?',
    A: {
      id: 'r7a',
      label: '야외 · 밝음 · 심플',
      desc: '내추럴 무드',
      weights: { OUT: 1, LIGHT: 1, SIMPLE: 1 },
    },
    B: {
      id: 'r7b',
      label: '실내 · 어두움 · 화려',
      desc: '드라마틱 무드',
      weights: { IN: 1, DARK: 1, FANCY: 1 },
    },
  },
  {
    id: 'r8',
    question: '마지막, 어떤 컬러 무드가 좋아요?',
    A: { id: 'r8a', label: '파스텔 라이트', desc: '밝은 유채색', weights: { LIGHT: 1, CHROMA: 1 } },
    B: { id: 'r8b', label: '모던 모노', desc: '어두운 무채색', weights: { DARK: 1, MONO: 1 } },
  },
]

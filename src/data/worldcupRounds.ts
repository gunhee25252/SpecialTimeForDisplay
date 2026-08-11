import { assetUrl } from '../utils/asset'
import type { PoleCode } from './axes'

export type Weights = Partial<Record<PoleCode, number>>

export interface Choice {
  id: string
  label: string
  desc?: string
  image?: string
  // 16유형을 균등하게 판정하기 위한 점수.
  weights: Weights
  // 두 사진에서 실제로 대비되는 축만 기록하는 게이지 점수.
  gaugeWeights: Weights
}

export interface Round {
  id: string
  question: string
  A: Choice
  B: Choice
}

const wcImage = (fileName: string) => assetUrl(`images/worldcup/${fileName}`)

// 홀수 라운드는 네 축이 모두 반대인 사진을 사용한다.
// 짝수 라운드는 자연스러운 사진을 사용하고, 눈에 띄게 대비되는 축만 게이지에 기록한다.
// weights는 유형 판정 확률을 균등하게 유지하고 gaugeWeights는 선택의 강도를 표현한다.
const PLAYER_ONE_ROUNDS: Round[] = [
  {
    id: 'p1-r1',
    question: '더 마음에 드는 사진은?',
    A: {
      id: 'p1-r1a',
      label: '파스텔 글라스홀',
      desc: '밝은 실내를 다채로운 꽃으로 풍성하게 채운 공간',
      image: wcImage('worldcup24.png'),
      weights: { IN: 3 },
      gaugeWeights: { IN: 1, LIGHT: 1, FANCY: 1, CHROMA: 1 },
    },
    B: {
      id: 'p1-r1b',
      label: '밤의 언덕 예식',
      desc: '어두운 야외에 최소한의 무채색 장식만 놓인 공간',
      image: wcImage('worldcup20.png'),
      weights: { OUT: 3 },
      gaugeWeights: { OUT: 1, DARK: 1, SIMPLE: 1, MONO: 1 },
    },
  },
  {
    id: 'p1-r2',
    question: '더 마음에 드는 사진은?',
    A: {
      id: 'p1-r2a',
      label: '구름 위 일출',
      desc: '밝은 아침 하늘에 여백이 넓게 펼쳐진 풍경',
      image: wcImage('worldcup27.png'),
      weights: { LIGHT: 3 },
      gaugeWeights: { LIGHT: 1, SIMPLE: 1 },
    },
    B: {
      id: 'p1-r2b',
      label: '오로라 나이트',
      desc: '어두운 밤하늘을 여러 겹의 빛이 채우는 풍경',
      image: wcImage('worldcup28.png'),
      weights: { DARK: 3 },
      gaugeWeights: { DARK: 1, FANCY: 1 },
    },
  },
  {
    id: 'p1-r3',
    question: '더 마음에 드는 사진은?',
    A: {
      id: 'p1-r3a',
      label: '블랙 골드 볼룸',
      desc: '어두운 실내를 화려한 무채색 장식으로 채운 공간',
      image: wcImage('worldcup02.png'),
      weights: { FANCY: 3 },
      gaugeWeights: { IN: 1, DARK: 1, FANCY: 1, MONO: 1 },
    },
    B: {
      id: 'p1-r3b',
      label: '컬러 들판 예식',
      desc: '밝은 야외에 간결한 유채색 포인트를 둔 공간',
      image: wcImage('worldcup21.png'),
      weights: { SIMPLE: 3 },
      gaugeWeights: { OUT: 1, LIGHT: 1, SIMPLE: 1, CHROMA: 1 },
    },
  },
  {
    id: 'p1-r4',
    question: '더 마음에 드는 사진은?',
    A: {
      id: 'p1-r4a',
      label: '화이트 솔트 플랫',
      desc: '밝은 야외에 수평선과 무채색 여백만 남은 풍경',
      image: wcImage('worldcup38.png'),
      weights: { MONO: 3 },
      gaugeWeights: { OUT: 1, SIMPLE: 1, MONO: 1 },
    },
    B: {
      id: 'p1-r4b',
      label: '라이브러리 거실',
      desc: '밝은 실내를 책과 가구가 다채롭게 채운 공간',
      image: wcImage('worldcup25.png'),
      weights: { CHROMA: 3 },
      gaugeWeights: { IN: 1, FANCY: 1, CHROMA: 1 },
    },
  },
  {
    id: 'p1-r5',
    question: '더 마음에 드는 사진은?',
    A: {
      id: 'p1-r5a',
      label: '미니멀 나이트 갤러리',
      desc: '어두운 실내에 여백과 무채색만 남긴 공간',
      image: wcImage('worldcup45.png'),
      weights: { IN: 1 },
      gaugeWeights: { IN: 1, DARK: 1, SIMPLE: 1, MONO: 1 },
    },
    B: {
      id: 'p1-r5b',
      label: '코럴 리프',
      desc: '밝은 야외를 산호와 물고기가 다채롭게 채운 풍경',
      image: wcImage('worldcup29.png'),
      weights: { OUT: 1 },
      gaugeWeights: { OUT: 1, LIGHT: 1, FANCY: 1, CHROMA: 1 },
    },
  },
  {
    id: 'p1-r6',
    question: '더 마음에 드는 사진은?',
    A: {
      id: 'p1-r6a',
      label: '모노 피오르',
      desc: '짙은 안개와 바위가 만드는 어두운 무채색 풍경',
      image: wcImage('worldcup31.png'),
      weights: { DARK: 1 },
      gaugeWeights: { DARK: 1, SIMPLE: 1, MONO: 1 },
    },
    B: {
      id: 'p1-r6b',
      label: '선라이트 폭포',
      desc: '햇빛과 무지개가 식물을 환하게 비추는 풍경',
      image: wcImage('worldcup35.png'),
      weights: { LIGHT: 1 },
      gaugeWeights: { LIGHT: 1, FANCY: 1, CHROMA: 1 },
    },
  },
  {
    id: 'p1-r7',
    question: '더 마음에 드는 사진은?',
    A: {
      id: 'p1-r7a',
      label: '모노 그린하우스',
      desc: '밝은 실내를 풍성한 무채색 식물 장식으로 채운 공간',
      image: wcImage('worldcup41.png'),
      weights: { FANCY: 2 },
      gaugeWeights: { IN: 1, LIGHT: 1, FANCY: 1, MONO: 1 },
    },
    B: {
      id: 'p1-r7b',
      label: '컬러 나이트 비치',
      desc: '어두운 야외에 선명한 색과 여백만 남긴 해변',
      image: wcImage('worldcup46.png'),
      weights: { SIMPLE: 2 },
      gaugeWeights: { OUT: 1, DARK: 1, SIMPLE: 1, CHROMA: 1 },
    },
  },
]

const PLAYER_TWO_ROUNDS: Round[] = [
  {
    id: 'p2-r1',
    question: '더 마음에 드는 사진은?',
    A: {
      id: 'p2-r1a',
      label: '글라스하우스 카페',
      desc: '어두운 실내를 식물과 가구가 다채롭게 채운 공간',
      image: wcImage('worldcup33.png'),
      weights: { IN: 3 },
      gaugeWeights: { IN: 1, DARK: 1, FANCY: 1, CHROMA: 1 },
    },
    B: {
      id: 'p2-r1b',
      label: '화이트 설원',
      desc: '밝은 야외에 여백과 무채색만 남은 설원',
      image: wcImage('worldcup47.png'),
      weights: { OUT: 3 },
      gaugeWeights: { OUT: 1, LIGHT: 1, SIMPLE: 1, MONO: 1 },
    },
  },
  {
    id: 'p2-r2',
    question: '더 마음에 드는 사진은?',
    A: {
      id: 'p2-r2a',
      label: '가을 피오르',
      desc: '밝은 햇빛 아래 다채로운 나무와 산이 펼쳐진 풍경',
      image: wcImage('worldcup32.png'),
      weights: { LIGHT: 3 },
      gaugeWeights: { LIGHT: 1, FANCY: 1, CHROMA: 1 },
    },
    B: {
      id: 'p2-r2b',
      label: '달 표면',
      desc: '깊은 밤하늘 아래 고요한 무채색 풍경',
      image: wcImage('worldcup39.png'),
      weights: { DARK: 3 },
      gaugeWeights: { DARK: 1, SIMPLE: 1, MONO: 1 },
    },
  },
  {
    id: 'p2-r3',
    question: '더 마음에 드는 사진은?',
    A: {
      id: 'p2-r3a',
      label: '컬러 플라워 마켓',
      desc: '밝은 실내를 꽃과 소품이 다채롭게 채운 공간',
      image: wcImage('worldcup48.png'),
      weights: { FANCY: 3 },
      gaugeWeights: { IN: 1, LIGHT: 1, FANCY: 1, CHROMA: 1 },
    },
    B: {
      id: 'p2-r3b',
      label: '별빛 사막',
      desc: '어두운 야외에 모래와 별빛만 남은 무채색 풍경',
      image: wcImage('worldcup36.png'),
      weights: { SIMPLE: 3 },
      gaugeWeights: { OUT: 1, DARK: 1, SIMPLE: 1, MONO: 1 },
    },
  },
  {
    id: 'p2-r4',
    question: '더 마음에 드는 사진은?',
    A: {
      id: 'p2-r4a',
      label: '화이트 듄',
      desc: '밝은 모래와 여백이 중심이 되는 무채색 풍경',
      image: wcImage('worldcup30.png'),
      weights: { MONO: 3 },
      gaugeWeights: { LIGHT: 1, SIMPLE: 1, MONO: 1 },
    },
    B: {
      id: 'p2-r4b',
      label: '트로피컬 폭포',
      desc: '어두운 숲과 식물이 화면을 다채롭게 채우는 풍경',
      image: wcImage('worldcup37.png'),
      weights: { CHROMA: 3 },
      gaugeWeights: { DARK: 1, FANCY: 1, CHROMA: 1 },
    },
  },
  {
    id: 'p2-r5',
    question: '더 마음에 드는 사진은?',
    A: {
      id: 'p2-r5a',
      label: '화이트 온실',
      desc: '밝은 실내에 최소한의 무채색 장식만 놓인 공간',
      image: wcImage('worldcup42.png'),
      weights: { MONO: 1 },
      gaugeWeights: { IN: 1, LIGHT: 1, SIMPLE: 1, MONO: 1 },
    },
    B: {
      id: 'p2-r5b',
      label: '컬러 네뷸라',
      desc: '어두운 야외를 복잡한 색과 빛이 채우는 우주',
      image: wcImage('worldcup40.png'),
      weights: { CHROMA: 1 },
      gaugeWeights: { OUT: 1, DARK: 1, FANCY: 1, CHROMA: 1 },
    },
  },
  {
    id: 'p2-r6',
    question: '더 마음에 드는 사진은?',
    A: {
      id: 'p2-r6a',
      label: '오픈 비치',
      desc: '하늘과 수평선이 시원하게 펼쳐진 밝은 야외',
      image: wcImage('worldcup26.png'),
      weights: { SIMPLE: 1 },
      gaugeWeights: { OUT: 1, SIMPLE: 1 },
    },
    B: {
      id: 'p2-r6b',
      label: '트로피컬 플라워홀',
      desc: '꽃과 테이블 장식이 가득한 밝은 실내',
      image: wcImage('worldcup10.png'),
      weights: { FANCY: 1 },
      gaugeWeights: { IN: 1, FANCY: 1 },
    },
  },
  {
    id: 'p2-r7',
    question: '더 마음에 드는 사진은?',
    A: {
      id: 'p2-r7a',
      label: '주얼 블랙 볼룸',
      desc: '어두운 실내를 화려하고 다채로운 장식으로 채운 공간',
      image: wcImage('worldcup16.png'),
      weights: { IN: 2 },
      gaugeWeights: { IN: 1, DARK: 1, FANCY: 1, CHROMA: 1 },
    },
    B: {
      id: 'p2-r7b',
      label: '화이트 코스트',
      desc: '밝은 야외에 절벽과 바다만 남은 무채색 풍경',
      image: wcImage('worldcup49.png'),
      weights: { OUT: 2 },
      gaugeWeights: { OUT: 1, LIGHT: 1, SIMPLE: 1, MONO: 1 },
    },
  },
]

export const WORLDCUP_ROUND_SETS = [PLAYER_ONE_ROUNDS, PLAYER_TWO_ROUNDS] as const

export function getWorldCupRounds(playerIndex: number): Round[] {
  return WORLDCUP_ROUND_SETS[playerIndex === 1 ? 1 : 0]
}

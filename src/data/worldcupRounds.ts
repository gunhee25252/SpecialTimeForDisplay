import { assetUrl } from '../utils/asset'
import type { PoleCode } from './axes'

export type Weights = Partial<Record<PoleCode, number>>

export interface Choice {
  id: string
  label: string
  desc?: string
  image?: string
  weights: Weights
}

export interface Round {
  id: string
  question: string
  A: Choice
  B: Choice
}

const wcImage = (fileName: string) => assetUrl(`images/worldcup/${fileName}`)

// 앞의 4라운드는 각 축의 중심을 3점으로 결정한다.
// 뒤의 3라운드는 한 축씩만 대칭적으로 보정한다.
// 두 사람의 점수를 합쳐도 동점이 생기지 않으며, 무작위 선택 시 16가지 유형이 같은 빈도로 나온다.
const PLAYER_ONE_ROUNDS: Round[] = [
  {
    id: 'p1-r1',
    question: '더 마음에 드는 사진은?',
    A: {
      id: 'p1-r1a',
      label: '아늑한 라이브러리',
      desc: '책과 조명으로 둘러싸인 포근한 실내',
      image: wcImage('worldcup25.png'),
      weights: { IN: 3 },
    },
    B: {
      id: 'p1-r1b',
      label: '오픈 비치',
      desc: '수평선까지 시야가 열리는 넓은 해변',
      image: wcImage('worldcup26.png'),
      weights: { OUT: 3 },
    },
  },
  {
    id: 'p1-r2',
    question: '더 마음에 드는 사진은?',
    A: {
      id: 'p1-r2a',
      label: '구름 위 아침',
      desc: '구름 사이로 햇살이 번지는 밝은 아침',
      image: wcImage('worldcup27.png'),
      weights: { LIGHT: 3 },
    },
    B: {
      id: 'p1-r2b',
      label: '오로라 나이트',
      desc: '어두운 밤하늘을 물들이는 깊고 신비로운 빛',
      image: wcImage('worldcup28.png'),
      weights: { DARK: 3 },
    },
  },
  {
    id: 'p1-r3',
    question: '더 마음에 드는 사진은?',
    A: {
      id: 'p1-r3a',
      label: '코럴 리프',
      desc: '산호와 물고기가 화면을 가득 채운 풍경',
      image: wcImage('worldcup29.png'),
      weights: { FANCY: 3 },
    },
    B: {
      id: 'p1-r3b',
      label: '화이트 듄',
      desc: '선과 여백만 남은 고요한 모래 언덕',
      image: wcImage('worldcup30.png'),
      weights: { SIMPLE: 3 },
    },
  },
  {
    id: 'p1-r4',
    question: '더 마음에 드는 사진은?',
    A: {
      id: 'p1-r4a',
      label: '모노 피오르',
      desc: '안개와 바위가 만드는 절제된 무채색 풍경',
      image: wcImage('worldcup31.png'),
      weights: { MONO: 3 },
    },
    B: {
      id: 'p1-r4b',
      label: '어텀 피오르',
      desc: '가을빛이 선명하게 번지는 다채로운 풍경',
      image: wcImage('worldcup32.png'),
      weights: { CHROMA: 3 },
    },
  },
  {
    id: 'p1-r5',
    question: '더 마음에 드는 사진은?',
    A: {
      id: 'p1-r5a',
      label: '플라워 채플',
      desc: '밝은 실내를 꽃으로 풍성하게 채운 예식',
      image: wcImage('worldcup01.png'),
      weights: { IN: 1 },
    },
    B: {
      id: 'p1-r5b',
      label: '나이트 플라워 가든',
      desc: '밤하늘 아래 짙은 꽃빛이 살아나는 야외 예식',
      image: wcImage('worldcup23.png'),
      weights: { OUT: 1 },
    },
  },
  {
    id: 'p1-r6',
    question: '더 마음에 드는 사진은?',
    A: {
      id: 'p1-r6a',
      label: '문라이트 세리머니',
      desc: '달빛 아래 여백을 살린 차분한 야외 예식',
      image: wcImage('worldcup20.png'),
      weights: { DARK: 1 },
    },
    B: {
      id: 'p1-r6b',
      label: '글라스 채플',
      desc: '햇빛과 컬러 플라워가 어우러진 실내 예식',
      image: wcImage('worldcup24.png'),
      weights: { LIGHT: 1 },
    },
  },
  {
    id: 'p1-r7',
    question: '더 마음에 드는 사진은?',
    A: {
      id: 'p1-r7a',
      label: '풍성한 온실',
      desc: '꽃과 식물이 층층이 채워진 풍성한 공간',
      image: wcImage('worldcup41.png'),
      weights: { FANCY: 2 },
    },
    B: {
      id: 'p1-r7b',
      label: '여백의 온실',
      desc: '최소한의 식물만 놓인 단정한 공간',
      image: wcImage('worldcup42.png'),
      weights: { SIMPLE: 2 },
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
      desc: '유리창과 식물에 둘러싸인 아늑한 실내',
      image: wcImage('worldcup33.png'),
      weights: { IN: 3 },
    },
    B: {
      id: 'p2-r1b',
      label: '알파인 메도우',
      desc: '산과 하늘 사이로 탁 트인 초원',
      image: wcImage('worldcup34.png'),
      weights: { OUT: 3 },
    },
  },
  {
    id: 'p2-r2',
    question: '더 마음에 드는 사진은?',
    A: {
      id: 'p2-r2a',
      label: '선라이트 폭포',
      desc: '햇살과 무지개가 반짝이는 환한 폭포',
      image: wcImage('worldcup35.png'),
      weights: { LIGHT: 3 },
    },
    B: {
      id: 'p2-r2b',
      label: '밀키웨이 사막',
      desc: '어두운 사막 위로 별빛이 쏟아지는 밤',
      image: wcImage('worldcup36.png'),
      weights: { DARK: 3 },
    },
  },
  {
    id: 'p2-r3',
    question: '더 마음에 드는 사진은?',
    A: {
      id: 'p2-r3a',
      label: '트로피컬 포레스트',
      desc: '식물과 폭포가 층층이 가득한 풍경',
      image: wcImage('worldcup37.png'),
      weights: { FANCY: 3 },
    },
    B: {
      id: 'p2-r3b',
      label: '솔트 플랫',
      desc: '하늘과 수평선만 남은 단정한 풍경',
      image: wcImage('worldcup38.png'),
      weights: { SIMPLE: 3 },
    },
  },
  {
    id: 'p2-r4',
    question: '더 마음에 드는 사진은?',
    A: {
      id: 'p2-r4a',
      label: '문 스케이프',
      desc: '달 표면과 지구가 만드는 차분한 무채색',
      image: wcImage('worldcup39.png'),
      weights: { MONO: 3 },
    },
    B: {
      id: 'p2-r4b',
      label: '컬러 네뷸라',
      desc: '다양한 빛이 폭발하듯 펼쳐진 우주',
      image: wcImage('worldcup40.png'),
      weights: { CHROMA: 3 },
    },
  },
  {
    id: 'p2-r5',
    question: '더 마음에 드는 사진은?',
    A: {
      id: 'p2-r5a',
      label: '문라이트 가든',
      desc: '달빛과 짙은 꽃 장식이 어우러진 야외 예식',
      image: wcImage('worldcup17.png'),
      weights: { MONO: 1 },
    },
    B: {
      id: 'p2-r5b',
      label: '주얼 톤 볼룸',
      desc: '깊고 선명한 컬러로 채운 화려한 실내 예식',
      image: wcImage('worldcup16.png'),
      weights: { CHROMA: 1 },
    },
  },
  {
    id: 'p2-r6',
    question: '더 마음에 드는 사진은?',
    A: {
      id: 'p2-r6a',
      label: '컬러 블록 가든',
      desc: '밝은 햇빛과 선명한 포인트가 살아나는 야외 예식',
      image: wcImage('worldcup21.png'),
      weights: { SIMPLE: 1 },
    },
    B: {
      id: 'p2-r6b',
      label: '블랙 골드 볼룸',
      desc: '검정과 금빛 장식으로 밀도 있게 연출한 실내 예식',
      image: wcImage('worldcup02.png'),
      weights: { FANCY: 1 },
    },
  },
  {
    id: 'p2-r7',
    question: '더 마음에 드는 사진은?',
    A: {
      id: 'p2-r7a',
      label: '선셋 라운지',
      desc: '유리창 안에서 노을과 바다를 바라보는 실내',
      image: wcImage('worldcup43.png'),
      weights: { IN: 2 },
    },
    B: {
      id: 'p2-r7b',
      label: '선셋 테라스',
      desc: '탁 트인 야외에서 노을과 바다를 마주하는 공간',
      image: wcImage('worldcup44.png'),
      weights: { OUT: 2 },
    },
  },
]

export const WORLDCUP_ROUND_SETS = [PLAYER_ONE_ROUNDS, PLAYER_TWO_ROUNDS] as const

export function getWorldCupRounds(playerIndex: number): Round[] {
  return WORLDCUP_ROUND_SETS[playerIndex === 1 ? 1 : 0]
}

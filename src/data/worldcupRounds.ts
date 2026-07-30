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

// 첫 4라운드는 각 축을 3점으로 결정한다.
// 마지막 2라운드는 모든 축에 1점씩 더해 취향의 강도만 조정한다.
// 따라서 6번 선택을 유지하면서도 16유형이 동일한 빈도로 나올 수 있다.
const PLAYER_ONE_ROUNDS: Round[] = [
  {
    id: 'p1-r1',
    question: '어떤 공간에서의 결혼식이 더 끌리나요?',
    A: {
      id: 'p1-r1a',
      label: '파스텔 플라워 홀',
      desc: '밝고 화사한 실내 예식',
      image: wcImage('worldcup04.png'),
      weights: { IN: 3 },
    },
    B: {
      id: 'p1-r1b',
      label: '컬러 가든',
      desc: '햇살 아래 펼쳐진 야외 예식',
      image: wcImage('worldcup13.png'),
      weights: { OUT: 3 },
    },
  },
  {
    id: 'p1-r2',
    question: '더 마음에 드는 빛과 분위기는?',
    A: {
      id: 'p1-r2a',
      label: '화이트 미니멀',
      desc: '맑은 빛이 들어오는 밝은 공간',
      image: wcImage('worldcup03.png'),
      weights: { LIGHT: 3 },
    },
    B: {
      id: 'p1-r2b',
      label: '다크 미니멀',
      desc: '낮은 조명이 만드는 깊은 분위기',
      image: wcImage('worldcup14.png'),
      weights: { DARK: 3 },
    },
  },
  {
    id: 'p1-r3',
    question: '장식은 어느 쪽이 더 취향인가요?',
    A: {
      id: 'p1-r3a',
      label: '플라워 채플',
      desc: '꽃과 샹들리에가 풍성한 장식',
      image: wcImage('worldcup01.png'),
      weights: { FANCY: 3 },
    },
    B: {
      id: 'p1-r3b',
      label: '클린 스튜디오',
      desc: '여백을 살린 간결한 장식',
      image: wcImage('worldcup15.png'),
      weights: { SIMPLE: 3 },
    },
  },
  {
    id: 'p1-r4',
    question: '어떤 색감에 더 끌리나요?',
    A: {
      id: 'p1-r4a',
      label: '블랙 골드 볼룸',
      desc: '절제된 무채색과 금빛 포인트',
      image: wcImage('worldcup02.png'),
      weights: { MONO: 3 },
    },
    B: {
      id: 'p1-r4b',
      label: '주얼 톤 볼룸',
      desc: '깊고 선명한 컬러의 조합',
      image: wcImage('worldcup16.png'),
      weights: { CHROMA: 3 },
    },
  },
  {
    id: 'p1-r5',
    question: '두 장면 중 더 오래 머물고 싶은 곳은?',
    A: {
      id: 'p1-r5a',
      label: '화이트 가든',
      desc: '햇살과 흰 꽃이 가득한 야외',
      image: wcImage('worldcup05.png'),
      weights: { OUT: 1, LIGHT: 1, FANCY: 1, MONO: 1 },
    },
    B: {
      id: 'p1-r5b',
      label: '문라이트 가든',
      desc: '달빛과 흰 꽃이 만드는 야경',
      image: wcImage('worldcup17.png'),
      weights: { OUT: 1, DARK: 1, FANCY: 1, MONO: 1 },
    },
  },
  {
    id: 'p1-r6',
    question: '마지막으로 더 기억에 남는 장면은?',
    A: {
      id: 'p1-r6a',
      label: '선셋 세리머니',
      desc: '따뜻한 노을빛의 간결한 야외 예식',
      image: wcImage('worldcup06.png'),
      weights: { OUT: 1, DARK: 1, SIMPLE: 1, CHROMA: 1 },
    },
    B: {
      id: 'p1-r6b',
      label: '클래식 화이트 가든',
      desc: '밝고 풍성한 흰 꽃의 정원 예식',
      image: wcImage('worldcup18.png'),
      weights: { OUT: 1, LIGHT: 1, FANCY: 1, MONO: 1 },
    },
  },
]

const PLAYER_TWO_ROUNDS: Round[] = [
  {
    id: 'p2-r1',
    question: '어떤 공간에서의 결혼식이 더 끌리나요?',
    A: {
      id: 'p2-r1a',
      label: '파스텔 살롱',
      desc: '부드러운 꽃이 가득한 실내',
      image: wcImage('worldcup12.png'),
      weights: { IN: 3 },
    },
    B: {
      id: 'p2-r1b',
      label: '컬러 오션 가든',
      desc: '바다와 꽃이 펼쳐진 야외',
      image: wcImage('worldcup19.png'),
      weights: { OUT: 3 },
    },
  },
  {
    id: 'p2-r2',
    question: '더 마음에 드는 빛과 분위기는?',
    A: {
      id: 'p2-r2a',
      label: '브라이트 오션뷰',
      desc: '탁 트인 풍경과 맑은 햇빛',
      image: wcImage('worldcup07.png'),
      weights: { LIGHT: 3 },
    },
    B: {
      id: 'p2-r2b',
      label: '나이트 오션뷰',
      desc: '어두운 하늘과 잔잔한 촛불',
      image: wcImage('worldcup20.png'),
      weights: { DARK: 3 },
    },
  },
  {
    id: 'p2-r3',
    question: '장식은 어느 쪽이 더 취향인가요?',
    A: {
      id: 'p2-r3a',
      label: '플라워 페스티벌',
      desc: '꽃으로 가득 채운 화려한 정원',
      image: wcImage('worldcup08.png'),
      weights: { FANCY: 3 },
    },
    B: {
      id: 'p2-r3b',
      label: '컬러 피크닉',
      desc: '작은 컬러 포인트만 더한 정원',
      image: wcImage('worldcup21.png'),
      weights: { SIMPLE: 3 },
    },
  },
  {
    id: 'p2-r4',
    question: '어떤 색감에 더 끌리나요?',
    A: {
      id: 'p2-r4a',
      label: '모던 모노톤',
      desc: '검정과 흰색으로 정돈된 공간',
      image: wcImage('worldcup09.png'),
      weights: { MONO: 3 },
    },
    B: {
      id: 'p2-r4b',
      label: '딥 컬러 라운지',
      desc: '푸른색과 보라색이 선명한 공간',
      image: wcImage('worldcup22.png'),
      weights: { CHROMA: 3 },
    },
  },
  {
    id: 'p2-r5',
    question: '두 장면 중 더 오래 머물고 싶은 곳은?',
    A: {
      id: 'p2-r5a',
      label: '비비드 리셉션',
      desc: '밝고 생동감 있는 야외 파티',
      image: wcImage('worldcup10.png'),
      weights: { OUT: 1, LIGHT: 1, FANCY: 1, CHROMA: 1 },
    },
    B: {
      id: 'p2-r5b',
      label: '나이트 플라워 가든',
      desc: '밤하늘 아래 짙은 꽃의 향연',
      image: wcImage('worldcup23.png'),
      weights: { OUT: 1, DARK: 1, FANCY: 1, CHROMA: 1 },
    },
  },
  {
    id: 'p2-r6',
    question: '마지막으로 더 기억에 남는 장면은?',
    A: {
      id: 'p2-r6a',
      label: '다크 갤러리',
      desc: '고요하고 절제된 어두운 실내',
      image: wcImage('worldcup11.png'),
      weights: { IN: 1, DARK: 1, SIMPLE: 1, MONO: 1 },
    },
    B: {
      id: 'p2-r6b',
      label: '파스텔 컨서버토리',
      desc: '햇살과 파스텔 꽃이 가득한 실내',
      image: wcImage('worldcup24.png'),
      weights: { IN: 1, LIGHT: 1, FANCY: 1, CHROMA: 1 },
    },
  },
]

export const WORLDCUP_ROUND_SETS = [PLAYER_ONE_ROUNDS, PLAYER_TWO_ROUNDS] as const

export function getWorldCupRounds(playerIndex: number): Round[] {
  return WORLDCUP_ROUND_SETS[playerIndex === 1 ? 1 : 0]
}

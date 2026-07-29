import { assetUrl } from '../utils/asset'
import type { PoleCode } from './axes'

// 선택지가 각 축에 주는 점수 맵입니다.
// 예: { OUT: 1, FANCY: 2 } => 공간 OUT +1, 장식 FANCY +2
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

// 12장의 월드컵 사진을 모두 한 번씩 사용하도록 6라운드로 구성합니다.
export const WORLDCUP_ROUNDS: Round[] = [
  {
    id: 'r1',
    question: '어떤 공간에서의 결혼식이 더 끌리나요?',
    A: {
      id: 'r1a',
      label: '햇살 채플',
      desc: '밝고 우아한 실내 공간',
      image: wcImage('worldcup01.png'),
      weights: { IN: 1, LIGHT: 1, FANCY: 1, MONO: 1 },
    },
    B: {
      id: 'r1b',
      label: '가든 세리머니',
      desc: '푸른 잔디 위 야외 예식',
      image: wcImage('worldcup05.png'),
      weights: { OUT: 1, LIGHT: 1, SIMPLE: 1, CHROMA: 1 },
    },
  },
  {
    id: 'r2',
    question: '둘 중 더 마음에 드는 분위기는?',
    A: {
      id: 'r2a',
      label: '블랙 골드 홀',
      desc: '어둡고 화려한 호텔 무드',
      image: wcImage('worldcup02.png'),
      weights: { IN: 1, DARK: 1, FANCY: 1, MONO: 1 },
    },
    B: {
      id: 'r2b',
      label: '파스텔 리셉션',
      desc: '부드럽고 로맨틱한 컬러감',
      image: wcImage('worldcup12.png'),
      weights: { IN: 1, LIGHT: 1, FANCY: 1, CHROMA: 1 },
    },
  },
  {
    id: 'r3',
    question: '장식 스타일은 어느 쪽이 좋나요?',
    A: {
      id: 'r3a',
      label: '미니멀 스튜디오',
      desc: '깨끗하고 차분한 실내',
      image: wcImage('worldcup03.png'),
      weights: { IN: 1, LIGHT: 1, SIMPLE: 1, MONO: 1 },
    },
    B: {
      id: 'r3b',
      label: '플라워 버진로드',
      desc: '꽃으로 가득한 화사함',
      image: wcImage('worldcup04.png'),
      weights: { IN: 1, LIGHT: 1, FANCY: 1, CHROMA: 1 },
    },
  },
  {
    id: 'r4',
    question: '야외 예식이라면 어느 장면이 더 좋나요?',
    A: {
      id: 'r4a',
      label: '선셋 아치',
      desc: '노을빛이 감도는 야외 예식',
      image: wcImage('worldcup06.png'),
      weights: { OUT: 1, DARK: 1, SIMPLE: 1, CHROMA: 1 },
    },
    B: {
      id: 'r4b',
      label: '심플 오션뷰',
      desc: '탁 트인 풍경과 간결한 장식',
      image: wcImage('worldcup07.png'),
      weights: { OUT: 1, LIGHT: 1, SIMPLE: 1, MONO: 1 },
    },
  },
  {
    id: 'r5',
    question: '컬러감은 어느 쪽이 더 취향인가요?',
    A: {
      id: 'r5a',
      label: '컬러풀 가든',
      desc: '생동감 있는 꽃길',
      image: wcImage('worldcup08.png'),
      weights: { OUT: 1, LIGHT: 1, FANCY: 1, CHROMA: 1 },
    },
    B: {
      id: 'r5b',
      label: '모던 모노톤',
      desc: '블랙 앤 화이트 리셉션',
      image: wcImage('worldcup09.png'),
      weights: { IN: 1, DARK: 1, SIMPLE: 1, MONO: 1 },
    },
  },
  {
    id: 'r6',
    question: '마지막으로 더 오래 보고 싶은 장면은?',
    A: {
      id: 'r6a',
      label: '비비드 리셉션',
      desc: '밝고 즐거운 컬러 장식',
      image: wcImage('worldcup10.png'),
      weights: { OUT: 1, LIGHT: 1, FANCY: 1, CHROMA: 1 },
    },
    B: {
      id: 'r6b',
      label: '다크 미니멀',
      desc: '조용하고 깊이 있는 무드',
      image: wcImage('worldcup11.png'),
      weights: { IN: 1, DARK: 1, SIMPLE: 1, MONO: 1 },
    },
  },
]

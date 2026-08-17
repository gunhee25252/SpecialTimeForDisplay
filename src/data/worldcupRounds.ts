import { assetUrl } from '../utils/asset'
import type { PoleCode } from './axes'

export type Weights = Partial<Record<PoleCode, number>>

export interface Choice {
  id: string
  label: string
  desc?: string
  image?: string
  // 선택한 사진이 대표하는 네 극에 1점씩. 한 번의 선택이 네 축을 동시에 가리킨다.
  weights: Weights
}

export interface Round {
  id: string
  question: string
  A: Choice
  B: Choice
}

const wcImage = (fileName: string) => assetUrl(`images/worldcup/${fileName}`)

// 모든 라운드는 "완전 반대 쌍"이다. 두 사진은 네 축이 전부 반대이고, 어느 쪽을 고르든
// 그 사진의 네 극에 1점씩 들어간다. 한 축을 라운드 하나로 결정하는 대신,
// 라운드마다 네 축을 조금씩 재고 7라운드에 걸쳐 누적한다.
//
// 핵심은 "어떤 극끼리 묶여 있는지"를 라운드마다 바꾸는 것. 예를 들어 P2에서는 실내가
// 화려함과 한 편이지만 P7에서는 실내가 심플함과 한 편이다. 이 묶임이 뒤바뀌기 때문에
// "실내를 좋아하는가"와 "화려함을 좋아하는가"가 응답 패턴에서 분리된다.
// 서로 다른 7개 쌍을 쓰면 16유형이 정확히 균등하게 나오고, 라운드 수가 홀수라 동점이 없다.
//
//   P1 #01 IN-LIGHT-FANCY-MONO    ↔ #16 OUT-DARK-SIMPLE-CHROMA
//   P2 #02 IN-LIGHT-FANCY-CHROMA  ↔ #15 OUT-DARK-SIMPLE-MONO
//   P3 #03 IN-LIGHT-SIMPLE-MONO   ↔ #14 OUT-DARK-FANCY-CHROMA
//   P4 #04 IN-LIGHT-SIMPLE-CHROMA ↔ #13 OUT-DARK-FANCY-MONO
//   P5 #05 IN-DARK-FANCY-MONO     ↔ #12 OUT-LIGHT-SIMPLE-CHROMA
//   P6 #06 IN-DARK-FANCY-CHROMA   ↔ #11 OUT-LIGHT-SIMPLE-MONO
//   P7 #07 IN-DARK-SIMPLE-MONO    ↔ #10 OUT-LIGHT-FANCY-CHROMA
//   P8 #08 IN-DARK-SIMPLE-CHROMA  ↔ #09 OUT-LIGHT-FANCY-MONO  ← 2인 모드 보너스 전용

interface ChoiceSeed {
  label: string
  desc: string
  file: string
  code: string // 16유형 코드. 이 코드에서 가중치를 그대로 만든다.
}

function toChoice(id: string, seed: ChoiceSeed): Choice {
  const weights: Weights = {}
  for (const pole of seed.code.split('-') as PoleCode[]) weights[pole] = 1
  return {
    id,
    label: seed.label,
    desc: seed.desc,
    image: wcImage(seed.file),
    weights,
  }
}

function makeRound(id: string, a: ChoiceSeed, b: ChoiceSeed): Round {
  return {
    id,
    question: '더 마음에 드는 사진은?',
    A: toChoice(`${id}a`, a),
    B: toChoice(`${id}b`, b),
  }
}

// 위쪽 카드만 계속 누르는 사람에게 한쪽 극이 몰리지 않도록 A/B 자리를 라운드마다 뒤집는다.
const SET_A: Round[] = [
  makeRound(
    's1-r1', // P2
    {
      label: '파스텔 글라스홀',
      desc: '밝은 실내를 다채로운 꽃으로 풍성하게 채운 공간',
      file: 'worldcup24.png',
      code: 'IN-LIGHT-FANCY-CHROMA',
    },
    {
      label: '밤의 언덕 예식',
      desc: '어두운 야외에 최소한의 무채색 장식만 놓인 공간',
      file: 'worldcup20.png',
      code: 'OUT-DARK-SIMPLE-MONO',
    },
  ),
  makeRound(
    's1-r2', // P5
    {
      label: '컬러 들판 예식',
      desc: '밝은 야외에 간결한 유채색 포인트를 둔 공간',
      file: 'worldcup21.png',
      code: 'OUT-LIGHT-SIMPLE-CHROMA',
    },
    {
      label: '블랙 골드 볼룸',
      desc: '어두운 실내를 화려한 무채색 장식으로 채운 공간',
      file: 'worldcup02.png',
      code: 'IN-DARK-FANCY-MONO',
    },
  ),
  makeRound(
    's1-r3', // P7
    {
      label: '미니멀 나이트 갤러리',
      desc: '어두운 실내에 여백과 무채색만 남긴 공간',
      file: 'worldcup45.png',
      code: 'IN-DARK-SIMPLE-MONO',
    },
    {
      label: '트로피컬 가든',
      desc: '밝은 야외를 다채로운 꽃 아치로 채운 정원',
      file: 'worldcup13.png',
      code: 'OUT-LIGHT-FANCY-CHROMA',
    },
  ),
  makeRound(
    's1-r4', // P1
    {
      label: '노을 테라스',
      desc: '어두워지는 야외에 간결한 노을빛만 남은 테라스',
      file: 'worldcup44.png',
      code: 'OUT-DARK-SIMPLE-CHROMA',
    },
    {
      label: '화이트 채플',
      desc: '밝은 실내를 흰 꽃으로 우아하게 채운 예식장',
      file: 'worldcup01.png',
      code: 'IN-LIGHT-FANCY-MONO',
    },
  ),
  makeRound(
    's1-r5', // P4
    {
      label: '블루 홀',
      desc: '밝은 실내를 선명한 파랑 하나로 간결하게 채운 공간',
      file: 'worldcup50.png',
      code: 'IN-LIGHT-SIMPLE-CHROMA',
    },
    {
      label: '문라이트 가든',
      desc: '어두운 야외를 흰 꽃으로 화려하게 채운 달빛 정원',
      file: 'worldcup17.png',
      code: 'OUT-DARK-FANCY-MONO',
    },
  ),
  makeRound(
    's1-r6', // P6
    {
      label: '화이트 설원',
      desc: '밝은 야외에 여백과 무채색만 남은 설원',
      file: 'worldcup47.png',
      code: 'OUT-LIGHT-SIMPLE-MONO',
    },
    {
      label: '글라스하우스 카페',
      desc: '어두운 실내를 식물과 가구가 다채롭게 채운 공간',
      file: 'worldcup33.png',
      code: 'IN-DARK-FANCY-CHROMA',
    },
  ),
  makeRound(
    's1-r7', // P3
    {
      label: '화이트 온실',
      desc: '밝은 실내에 최소한의 무채색 장식만 놓인 공간',
      file: 'worldcup42.png',
      code: 'IN-LIGHT-SIMPLE-MONO',
    },
    {
      label: '밤의 레드 가든',
      desc: '어두운 야외를 붉고 다채로운 꽃으로 가득 채운 정원',
      file: 'worldcup23.png',
      code: 'OUT-DARK-FANCY-CHROMA',
    },
  ),
]

const SET_B: Round[] = [
  makeRound(
    's2-r1', // P6
    {
      label: '딥블루 다이닝',
      desc: '어두운 실내를 짙은 파랑 꽃으로 채운 만찬장',
      file: 'worldcup22.png',
      code: 'IN-DARK-FANCY-CHROMA',
    },
    {
      label: '오션뷰 미니멀',
      desc: '밝은 야외에 호수와 흰 의자만 놓인 공간',
      file: 'worldcup07.png',
      code: 'OUT-LIGHT-SIMPLE-MONO',
    },
  ),
  makeRound(
    's2-r2', // P3
    {
      label: '컬러 네뷸라',
      desc: '어두운 야외를 복잡한 색과 빛이 채우는 우주',
      file: 'worldcup40.png',
      code: 'OUT-DARK-FANCY-CHROMA',
    },
    {
      label: '화이트 스튜디오',
      desc: '밝은 실내에 흰 벽과 여백만 남긴 공간',
      file: 'worldcup15.png',
      code: 'IN-LIGHT-SIMPLE-MONO',
    },
  ),
  makeRound(
    's2-r3', // P1
    {
      label: '모노 그린하우스',
      desc: '밝은 실내를 풍성한 무채색 식물 장식으로 채운 공간',
      file: 'worldcup41.png',
      code: 'IN-LIGHT-FANCY-MONO',
    },
    {
      label: '컬러 나이트 비치',
      desc: '어두운 야외에 선명한 색과 여백만 남긴 해변',
      file: 'worldcup46.png',
      code: 'OUT-DARK-SIMPLE-CHROMA',
    },
  ),
  makeRound(
    's2-r4', // P7
    {
      label: '컬러 오션 아치',
      desc: '밝은 야외를 선명한 색 꽃으로 채운 바다 앞 공간',
      file: 'worldcup19.png',
      code: 'OUT-LIGHT-FANCY-CHROMA',
    },
    {
      label: '브랜치 갤러리',
      desc: '어두운 실내에 흰 가지와 촛불만 남긴 공간',
      file: 'worldcup14.png',
      code: 'IN-DARK-SIMPLE-MONO',
    },
  ),
  makeRound(
    's2-r5', // P4
    {
      label: '옐로우 로프트',
      desc: '밝은 실내를 노랑과 주황으로 간결하게 물들인 공간',
      file: 'worldcup51.png',
      code: 'IN-LIGHT-SIMPLE-CHROMA',
    },
    {
      label: '대리석 테라스',
      desc: '어두운 야외를 흰 꽃과 촛불로 화려하게 채운 테라스',
      file: 'worldcup52.png',
      code: 'OUT-DARK-FANCY-MONO',
    },
  ),
  makeRound(
    's2-r6', // P2
    {
      label: '별빛 사막',
      desc: '어두운 야외에 모래와 별빛만 남은 무채색 풍경',
      file: 'worldcup36.png',
      code: 'OUT-DARK-SIMPLE-MONO',
    },
    {
      label: '컬러 플라워 마켓',
      desc: '밝은 실내를 꽃과 소품이 다채롭게 채운 공간',
      file: 'worldcup48.png',
      code: 'IN-LIGHT-FANCY-CHROMA',
    },
  ),
  makeRound(
    's2-r7', // P5
    {
      label: '다크 콘크리트 홀',
      desc: '어두운 실내를 흰 꽃 장식으로 채운 콘크리트 공간',
      file: 'worldcup11.png',
      code: 'IN-DARK-FANCY-MONO',
    },
    {
      label: '알파인 초원',
      desc: '밝은 야외에 초원과 설산만 펼쳐진 풍경',
      file: 'worldcup34.png',
      code: 'OUT-LIGHT-SIMPLE-CHROMA',
    },
  ),
]

// 두 사람이 함께할 때만 나오는 8번째 문항. 두 세트가 쓰지 않는 마지막 반대 쌍(P8)이라
// 합산 점수의 라운드 수가 15(홀수)가 되어 2인 결과에서도 동점이 생기지 않는다.
const BONUS_ROUND: Round = makeRound(
  'bonus', // P8
  {
    label: '선셋 라운지',
    desc: '어두워지는 실내에 노을빛만 들어오는 라운지',
    file: 'worldcup43.png',
    code: 'IN-DARK-SIMPLE-CHROMA',
  },
  {
    label: '화이트 가든',
    desc: '밝은 야외를 흰 꽃으로 풍성하게 채운 정원',
    file: 'worldcup18.png',
    code: 'OUT-LIGHT-FANCY-MONO',
  },
)

export const WORLDCUP_ROUND_SETS = [SET_A, SET_B] as const

// 보너스 문항은 2인 모드의 두 번째 사람에게만 붙는다.
export function hasBonusRound(playerCount: number, playerIndex: number): boolean {
  return playerCount === 2 && playerIndex === 1
}

export function getWorldCupRounds(setIndex: number, withBonus = false): Round[] {
  const base = WORLDCUP_ROUND_SETS[setIndex === 1 ? 1 : 0]
  return withBonus ? [...base, BONUS_ROUND] : [...base]
}

// 설계가 성립하려면 (1) 두 사진이 네 축 모두 반대여야 하고 (2) 한 세트 안에서 같은 쌍이
// 반복되지 않아야 한다. 데이터를 손볼 때 조용히 깨지지 않도록 개발 모드에서만 검사한다.
if (import.meta.env.DEV) {
  const OPPOSITE: Record<string, string> = {
    IN: 'OUT', OUT: 'IN', LIGHT: 'DARK', DARK: 'LIGHT',
    FANCY: 'SIMPLE', SIMPLE: 'FANCY', MONO: 'CHROMA', CHROMA: 'MONO',
  }
  const polesOf = (choice: Choice) => Object.keys(choice.weights) as PoleCode[]

  for (const [index, rounds] of [...WORLDCUP_ROUND_SETS, [BONUS_ROUND]].entries()) {
    const seen = new Set<string>()
    for (const round of rounds) {
      const a = polesOf(round.A)
      const b = polesOf(round.B)
      if (a.length !== 4 || b.length !== 4) {
        console.error(`[worldcup] ${round.id}: 네 축을 모두 지정해야 합니다.`, a, b)
      }
      if (!a.every((pole) => b.includes(OPPOSITE[pole] as PoleCode))) {
        console.error(`[worldcup] ${round.id}: 두 사진이 완전 반대가 아닙니다.`, a, b)
      }
      const key = [...a].sort().join('-')
      if (seen.has(key)) {
        console.error(`[worldcup] 세트 ${index}에 같은 반대 쌍이 중복됩니다: ${round.id}`)
      }
      seen.add(key)
    }
  }
}

import { create } from 'zustand'
import {
  AXES,
  POLE_TO_AXIS,
  TIE_BREAK_POLE,
  type AxisKey,
  type PoleCode,
} from '../data/axes'
import { WORLDCUP_ROUNDS, type Round } from '../data/worldcupRounds'
import { findTypeByCode } from '../data/types16'
import { drawBudgetResult } from '../data/budgetTiers'
import { findItem } from '../data/items'
import {
  DEFAULT_EXPR_ID,
  DEFAULT_HAIR_COLOR_ID,
  DEFAULT_HAIR_ID,
  DEFAULT_OUTFIT_ID,
  exprPrice,
  hairColorPrice,
  hairPrice,
  outfitPrice,
  type CharacterKey,
} from '../data/characters'

export type Stage = 'intro' | 'playerSelect' | 'worldcup' | 'result' | 'budget' | 'decorate' | 'complete'

export type PlayerCount = 1 | 2

// 축별 두 극의 점수 누적. 키는 PoleCode.
export type AxisScores = Record<AxisKey, Record<string, number>>

// 플레이어 1명의 결과(취향 유형 + 뽑은 예산).
export interface PlayerResult {
  resultTypeId: string | null
  resultCode: string | null
  axisScores: AxisScores | null
  budget: number | null
  tierId: string | null
  tierLabel: string | null
}

// 캔버스에 배치된 아이템 인스턴스. 같은 아이템을 여러 번 배치할 수 있어 instanceId로 구분.
export interface PlacedItem {
  instanceId: string
  itemId: string
  x: number
  y: number
  z: number // 순서(쌓임)
}

// 고정 등장 인물의 상태(표정/헤어/의상 + 위치). 삭제/교체는 불가, 위치는 드래그로 이동 가능.
// x/y는 캔버스 내부 좌표(px). null이면 Decorate 진입 시 기본 위치로 초기화.
export type CharacterState = {
  exprId: string
  hairId: string
  hairColorId: string
  outfitId: string
  x: number | null
  y: number | null
}
export type CharactersState = Record<CharacterKey, CharacterState>

function makeCharacters(): CharactersState {
  return {
    groom: {
      exprId: DEFAULT_EXPR_ID,
      hairId: DEFAULT_HAIR_ID,
      hairColorId: DEFAULT_HAIR_COLOR_ID,
      outfitId: DEFAULT_OUTFIT_ID,
      x: null,
      y: null,
    },
    bride: {
      exprId: DEFAULT_EXPR_ID,
      hairId: DEFAULT_HAIR_ID,
      hairColorId: DEFAULT_HAIR_COLOR_ID,
      outfitId: DEFAULT_OUTFIT_ID,
      x: null,
      y: null,
    },
  }
}

interface AppState {
  stage: Stage

  // 인원/진행
  playerCount: PlayerCount
  currentPlayer: number // 0-based
  players: PlayerResult[]

  // 현재 플레이어의 월드컵 진행
  roundIndex: number
  axisScores: AxisScores

  // 표시용 미러(다른 스테이지가 그대로 읽음): 가장 최근 산출 유형 + 꾸미기 예산(=합계)
  resultTypeId: string | null
  resultCode: string | null
  totalBudget: number | null
  budget: number | null // decorate/complete가 쓰는 사용 한도(= totalBudget)

  placedItems: PlacedItem[]
  spent: number
  canvasBackgroundId: string | null // decorate 캔버스 배경(배경 아이템 id)
  characters: CharactersState // 고정 배치되는 신랑·신부

  // actions
  setStage: (stage: Stage) => void
  setPlayerCount: (count: PlayerCount) => void
  start: (count?: PlayerCount) => void // 인원 확정 → worldcup (P1부터)
  choose: (round: Round, side: 'A' | 'B') => void // 선택 → 점수 누적 → (마지막이면) budget으로
  computeResult: () => void // 현재 플레이어 유형 산출 → players에 기록
  drawBudget: () => void // 현재 플레이어 예산 1회 확정(티어 가중 추첨)
  nextAfterBudget: () => void // 예산 확정 후 흐름 진행(다음 사람 / 결과)
  placeItem: (itemId: string, x: number, y: number) => boolean // 예산 초과면 false
  moveItem: (instanceId: string, x: number, y: number) => void
  removeItem: (instanceId: string) => void
  setCharacterExpr: (who: CharacterKey, exprId: string) => boolean // 표정 교체(가격차 반영, 초과면 false)
  setCharacterHair: (who: CharacterKey, hairId: string) => boolean // 헤어 교체(가격차 반영, 초과면 false)
  setCharacterHairColor: (who: CharacterKey, hairColorId: string) => boolean // 헤어 염색(가격차 반영, 초과면 false)
  setCharacterOutfit: (who: CharacterKey, outfitId: string) => boolean // 의상 교체(가격차 반영, 초과면 false)
  moveCharacter: (who: CharacterKey, x: number, y: number) => void // 인물 위치 이동
  setCanvasBackground: (itemId: string | null) => void // 배경 선택(예산 무관)
  reset: () => void
}

// 모든 축/극을 0으로 초기화한 점수표 생성.
function emptyAxisScores(): AxisScores {
  const scores = {} as AxisScores
  for (const axis of AXES) {
    scores[axis.key] = {}
    for (const pole of axis.poles) {
      scores[axis.key][pole.code] = 0
    }
  }
  return scores
}

function cloneAxisScores(axisScores: AxisScores): AxisScores {
  return Object.fromEntries(
    Object.entries(axisScores).map(([key, value]) => [key, { ...value }]),
  ) as AxisScores
}

function combineAxisScores(scoresList: (AxisScores | null)[]): AxisScores {
  const combined = emptyAxisScores()
  for (const scores of scoresList) {
    if (!scores) continue
    for (const axis of AXES) {
      for (const pole of axis.poles) {
        combined[axis.key][pole.code] += scores[axis.key]?.[pole.code] ?? 0
      }
    }
  }
  return combined
}

function emptyPlayer(): PlayerResult {
  return {
    resultTypeId: null,
    resultCode: null,
    axisScores: null,
    budget: null,
    tierId: null,
    tierLabel: null,
  }
}

function makePlayers(count: number): PlayerResult[] {
  return Array.from({ length: count }, emptyPlayer)
}

// 현재 axisScores로 16유형 코드 산출(동점은 TIE_BREAK_POLE 우선).
function computeCode(axisScores: AxisScores): string {
  const codeParts: PoleCode[] = []
  for (const axis of AXES) {
    const [first, second] = axis.poles
    const firstScore = axisScores[axis.key][first.code] ?? 0
    const secondScore = axisScores[axis.key][second.code] ?? 0
    let winner: PoleCode
    if (firstScore > secondScore) winner = first.code
    else if (secondScore > firstScore) winner = second.code
    else winner = TIE_BREAK_POLE[axis.key]
    codeParts.push(winner)
  }
  return codeParts.join('-')
}

// 다음 배치 z값과 고유 instanceId 생성을 위한 단조 증가 카운터.
let placeCounter = 0

const initialState = {
  stage: 'intro' as Stage,
  playerCount: 1 as PlayerCount,
  currentPlayer: 0,
  players: [] as PlayerResult[],
  roundIndex: 0,
  axisScores: emptyAxisScores(),
  resultTypeId: null as string | null,
  resultCode: null as string | null,
  totalBudget: null as number | null,
  budget: null as number | null,
  placedItems: [] as PlacedItem[],
  spent: 0,
  canvasBackgroundId: null as string | null,
  characters: makeCharacters(),
}

export const useAppStore = create<AppState>((set, get) => ({
  ...initialState,

  setStage: (stage) => set({ stage }),

  setPlayerCount: (count) => set({ playerCount: count }),

  start: (count) =>
    set((state) => ({
      stage: 'worldcup',
      playerCount: count ?? state.playerCount,
      currentPlayer: 0,
      players: makePlayers(count ?? state.playerCount),
      roundIndex: 0,
      axisScores: emptyAxisScores(),
      resultTypeId: null,
      resultCode: null,
      totalBudget: null,
      budget: null,
      placedItems: [],
      spent: 0,
      canvasBackgroundId: null,
      characters: makeCharacters(),
    })),

  choose: (round, side) => {
    const choice = side === 'A' ? round.A : round.B
    set((state) => {
      // 불변 업데이트: weights 맵의 극마다 소속 축 점수에 누적.
      const axisScores: AxisScores = {
        ...state.axisScores,
        ...Object.fromEntries(
          Object.entries(state.axisScores).map(([k, v]) => [k, { ...v }]),
        ),
      } as AxisScores
      for (const [pole, score] of Object.entries(choice.weights)) {
        const axis = POLE_TO_AXIS[pole as PoleCode]
        if (!axis || !score) continue
        axisScores[axis][pole] = (axisScores[axis][pole] ?? 0) + score
      }
      return { axisScores }
    })

    // 다음 라운드로, 마지막이면 현재 플레이어 유형 산출 후 예산 뽑기로.
    const nextIndex = get().roundIndex + 1
    if (nextIndex >= WORLDCUP_ROUNDS.length) {
      get().computeResult()
      set({ stage: 'budget' })
    } else {
      set({ roundIndex: nextIndex })
    }
  },

  computeResult: () => {
    const { axisScores, currentPlayer, players } = get()
    const code = computeCode(axisScores)
    const type = findTypeByCode(code)
    const typeId = type ? type.typeId : null
    const updated = players.map((p, i) =>
      i === currentPlayer
        ? { ...p, resultCode: code, resultTypeId: typeId, axisScores: cloneAxisScores(axisScores) }
        : p,
    )
    // 미러도 갱신(다른 스테이지 표시용).
    set({ players: updated, resultCode: code, resultTypeId: typeId })
  },

  drawBudget: () => {
    const { currentPlayer, players } = get()
    // 플레이어당 1회 확정 — 이미 뽑았으면 무시(다시 뽑기 없음).
    if (players[currentPlayer]?.budget != null) return
    const { tierId, tierLabel, amount } = drawBudgetResult()
    const updated = players.map((p, i) =>
      i === currentPlayer ? { ...p, budget: amount, tierId, tierLabel } : p,
    )
    set({ players: updated })
  },

  nextAfterBudget: () => {
    const { playerCount, currentPlayer, players } = get()
    if (playerCount === 2 && currentPlayer === 0) {
      // 다음 사람(P2) 월드컵 시작 — 점수/라운드 초기화.
      set({
        currentPlayer: 1,
        roundIndex: 0,
        axisScores: emptyAxisScores(),
        stage: 'worldcup',
      })
    } else {
      // 마지막 플레이어까지 끝 — 예산 합계와 둘이 모드의 합산 취향을 확정 후 결과로.
      const total = players.reduce((sum, p) => sum + (p.budget ?? 0), 0)
      if (playerCount === 2) {
        const combinedScores = combineAxisScores(players.map((p) => p.axisScores))
        const code = computeCode(combinedScores)
        const type = findTypeByCode(code)
        set({
          totalBudget: total,
          budget: total,
          axisScores: combinedScores,
          resultCode: code,
          resultTypeId: type ? type.typeId : null,
          stage: 'result',
        })
      } else {
        set({ totalBudget: total, budget: total, stage: 'result' })
      }
    }
  },

  placeItem: (itemId, x, y) => {
    const item = findItem(itemId)
    if (!item) return false
    const { spent, budget, placedItems } = get()
    // 예산 한도 반영: 합계가 예산을 넘으면 배치하지 않음.
    if (budget !== null && spent + item.price > budget) return false
    placeCounter += 1
    const placed: PlacedItem = {
      instanceId: `p${placeCounter}`,
      itemId,
      x,
      y,
      z: placeCounter,
    }
    set({ placedItems: [...placedItems, placed], spent: spent + item.price })
    return true
  },

  moveItem: (instanceId, x, y) =>
    set((state) => ({
      placedItems: state.placedItems.map((p) =>
        p.instanceId === instanceId ? { ...p, x, y } : p,
      ),
    })),

  setCharacterExpr: (who, exprId) => {
    const { characters, spent, budget } = get()
    const cur = characters[who]?.exprId
    // 표정 교체 = 가격차만큼 예산 반영(기본표정=0, 되돌리면 환불).
    const delta = exprPrice(exprId) - exprPrice(cur)
    if (budget !== null && spent + delta > budget) return false
    set({
      characters: { ...characters, [who]: { ...characters[who], exprId } },
      spent: Math.max(0, spent + delta),
    })
    return true
  },

  setCharacterHair: (who, hairId) => {
    const { characters, spent, budget } = get()
    const cur = characters[who]?.hairId
    const delta = hairPrice(who, hairId) - hairPrice(who, cur)
    if (budget !== null && spent + delta > budget) return false
    set({
      characters: { ...characters, [who]: { ...characters[who], hairId } },
      spent: Math.max(0, spent + delta),
    })
    return true
  },

  setCharacterHairColor: (who, hairColorId) => {
    const { characters, spent, budget } = get()
    const cur = characters[who]?.hairColorId
    const delta = hairColorPrice(hairColorId) - hairColorPrice(cur)
    if (budget !== null && spent + delta > budget) return false
    set({
      characters: { ...characters, [who]: { ...characters[who], hairColorId } },
      spent: Math.max(0, spent + delta),
    })
    return true
  },

  setCharacterOutfit: (who, outfitId) => {
    const { characters, spent, budget } = get()
    const cur = characters[who]?.outfitId
    const delta = outfitPrice(who, outfitId) - outfitPrice(who, cur)
    if (budget !== null && spent + delta > budget) return false
    set({
      characters: { ...characters, [who]: { ...characters[who], outfitId } },
      spent: Math.max(0, spent + delta),
    })
    return true
  },

  moveCharacter: (who, x, y) =>
    set((state) => ({
      characters: { ...state.characters, [who]: { ...state.characters[who], x, y } },
    })),

  removeItem: (instanceId) =>
    set((state) => {
      const target = state.placedItems.find((p) => p.instanceId === instanceId)
      const item = target ? findItem(target.itemId) : undefined
      const refund = item ? item.price : 0
      return {
        placedItems: state.placedItems.filter((p) => p.instanceId !== instanceId),
        spent: Math.max(0, state.spent - refund),
      }
    }),

  setCanvasBackground: (itemId) => set({ canvasBackgroundId: itemId }),

  reset: () => {
    placeCounter = 0
    set({
      ...initialState,
      axisScores: emptyAxisScores(),
      players: [],
      placedItems: [],
      characters: makeCharacters(),
    })
  },
}))

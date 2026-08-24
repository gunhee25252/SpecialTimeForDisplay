import { create } from 'zustand'
import {
  AXES,
  POLE_TO_AXIS,
  TIE_BREAK_POLE,
  type AxisKey,
  type PoleCode,
} from '../data/axes'
import {
  WORLDCUP_ROUND_SETS,
  getWorldCupRounds,
  hasBonusRound,
  type Round,
  type Weights,
} from '../data/worldcupRounds'
import { findTypeByCode } from '../data/types16'
import {
  drawBudgetResult,
  MIN_BUDGET_AMOUNT,
  SOLO_MIN_BUDGET_AMOUNT,
} from '../data/budgetTiers'
import {
  CHARACTER_FIGURE_HEIGHT,
  CHARACTER_FIGURE_WIDTH,
  MAX_CHARACTER_SCALE,
  MIN_CHARACTER_SCALE,
} from '../data/constants'
import { findItem } from '../data/items'
import {
  DEFAULT_EXPR_ID,
  DEFAULT_GLASSES_ID,
  DEFAULT_HAIR_COLOR_ID,
  DEFAULT_HAIR_ID,
  DEFAULT_OUTFIT_ID,
  exprPrice,
  glassesPrice,
  hairColorPrice,
  hairPrice,
  outfitPrice,
  type CharacterKey,
} from '../data/characters'

export type Stage = 'intro' | 'photoBooth' | 'playerSelect' | 'worldcup' | 'result' | 'budgetIntro' | 'budget' | 'decorateIntro' | 'decorate' | 'frameConfirm' | 'complete'

export type PlayerCount = 1 | 2
export type PrintFrameRatio = '2:3' | '3:2'
export type DecorateStep = 'background' | 'groom' | 'bride' | 'objects'
export type ItemScaleAnchor = 'center' | 'top-left' | 'bottom-left'
export const DEFAULT_ACCESSORY_SCALE = 0.9
export interface PrintFrame {
  x: number
  y: number
  width: number
  height: number
}

// 축별 두 극의 점수 누적. 키는 PoleCode.
export type AxisScores = Record<AxisKey, Record<string, number>>

// 플레이어 1명의 결과(취향 유형 + 뽑은 예산).
export interface PlayerResult {
  resultTypeId: string | null
  resultCode: string | null
  typeAxisScores: AxisScores | null
  axisScores: AxisScores | null
  budget: number | null
  tierId: string | null
  tierLabel: string | null
}

// 캔버스에 배치된 아이템 인스턴스. 같은 아이템을 여러 번 배치할 수 있어 instanceId로 구분.
export interface PlacedItem {
  instanceId: string
  itemId: string
  scale: number
  rotation: number
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
  glassesId: string
  scale: number
  x: number | null
  y: number | null
  z: number
}
export type CharactersState = Record<CharacterKey, CharacterState>

function makeCharacters(): CharactersState {
  return {
    groom: {
      exprId: DEFAULT_EXPR_ID,
      hairId: DEFAULT_HAIR_ID,
      hairColorId: DEFAULT_HAIR_COLOR_ID,
      outfitId: DEFAULT_OUTFIT_ID,
      glassesId: DEFAULT_GLASSES_ID,
      scale: 1,
      x: null,
      y: null,
      z: 1,
    },
    bride: {
      exprId: DEFAULT_EXPR_ID,
      hairId: DEFAULT_HAIR_ID,
      hairColorId: DEFAULT_HAIR_COLOR_ID,
      outfitId: DEFAULT_OUTFIT_ID,
      glassesId: DEFAULT_GLASSES_ID,
      scale: 1,
      x: null,
      y: null,
      z: 2,
    },
  }
}

interface AppState {
  stage: Stage

  // 인원/진행
  playerCount: PlayerCount
  currentPlayer: number // 0-based
  roundSetIndex: number // 현재 플레이어에게 보여줄 사진 세트
  nextRoundSetIndex: number // 다음 사람이 받을 사진 세트(혼자·둘이 공용 로테이션)
  players: PlayerResult[]

  // 현재 플레이어의 월드컵 진행
  roundIndex: number
  typeAxisScores: AxisScores
  axisScores: AxisScores

  // 표시용 미러(다른 스테이지가 그대로 읽음): 가장 최근 산출 유형 + 꾸미기 예산(=합계)
  resultTypeId: string | null
  resultCode: string | null
  totalBudget: number | null
  budget: number | null // decorate/complete가 쓰는 사용 한도(= totalBudget)
  soloBudgetRerollUsed: boolean

  placedItems: PlacedItem[]
  spent: number
  canvasBackgroundId: string | null // decorate 캔버스 배경(배경 아이템 id)
  characters: CharactersState // 고정 배치되는 신랑·신부
  decorateStep: DecorateStep
  seenDecorateGuides: Record<DecorateStep, boolean>
  lowBudgetAlertShown: boolean
  printFrameRatio: PrintFrameRatio
  printFrame: PrintFrame | null

  // actions
  setStage: (stage: Stage) => void
  setPlayerCount: (count: PlayerCount) => void
  start: (count?: PlayerCount) => void // 인원 확정 → worldcup (P1부터)
  choose: (round: Round, side: 'A' | 'B') => void // 선택 → 점수 누적 → (마지막이면) 취향 결과로
  computeResult: () => void // 현재 플레이어 유형 산출 → players에 기록
  startBudget: () => void // 취향 결과 확인 후 첫 번째 플레이어 예산 뽑기 시작
  drawBudget: (reroll?: boolean) => boolean // 현재 플레이어 예산 확정, 혼자 모드는 1회 재추첨 가능
  nextAfterBudget: () => void // 예산 확정 후 흐름 진행(다음 사람 / 꾸미기)
  placeItem: (itemId: string, x: number, y: number) => string | null // 예산 초과면 null
  moveItem: (instanceId: string, x: number, y: number) => void
  setItemScale: (instanceId: string, scale: number, anchor?: ItemScaleAnchor) => void
  setItemRotation: (instanceId: string, rotation: number) => void
  bringItemToFront: (instanceId: string) => void
  removeItem: (instanceId: string) => void
  setCharacterExpr: (who: CharacterKey, exprId: string) => boolean // 표정 교체(가격차 반영, 초과면 false)
  setCharacterHair: (who: CharacterKey, hairId: string) => boolean // 헤어 교체(가격차 반영, 초과면 false)
  setCharacterHairColor: (who: CharacterKey, hairColorId: string) => boolean // 헤어 염색(가격차 반영, 초과면 false)
  setCharacterOutfit: (who: CharacterKey, outfitId: string) => boolean // 의상 교체(가격차 반영, 초과면 false)
  setCharacterGlasses: (who: CharacterKey, glassesId: string) => boolean // 안경 교체(가격차 반영, 초과면 false)
  setCharacterScale: (who: CharacterKey, scale: number) => void // 인물 크기 조절(발밑 가운데 고정)
  moveCharacter: (who: CharacterKey, x: number, y: number) => void // 인물 위치 이동
  bringCharacterToFront: (who: CharacterKey) => void
  setCanvasBackground: (itemId: string | null) => boolean
  setDecorateStep: (step: DecorateStep) => void
  markDecorateGuideSeen: (step: DecorateStep) => void
  markLowBudgetAlertShown: () => void
  setPrintFrameRatio: (ratio: PrintFrameRatio) => void
  setPrintFrame: (frame: PrintFrame) => void
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

function addWeights(axisScores: AxisScores, weights: Weights): AxisScores {
  const updated = cloneAxisScores(axisScores)
  for (const [pole, score] of Object.entries(weights)) {
    const axis = POLE_TO_AXIS[pole as PoleCode]
    if (!axis || !score) continue
    updated[axis][pole] = (updated[axis][pole] ?? 0) + score
  }
  return updated
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
    typeAxisScores: null,
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

// 유형 방향은 판정 점수로 고정하고, 게이지 강도는 실제로 대비되는 사진 선택만으로 계산한다.
// 비교 근거가 적은 축은 100%까지 올라가지 않도록 근거 수에 따라 상한을 둔다.
function alignGaugeScores(gaugeScores: AxisScores, resultCode: string): AxisScores {
  const aligned = emptyAxisScores()
  const resultPoles = resultCode.split('-') as PoleCode[]

  AXES.forEach((axis, index) => {
    const [left, right] = axis.poles
    const winner = resultPoles[index]
    const total =
      (gaugeScores[axis.key][left.code] ?? 0) +
      (gaugeScores[axis.key][right.code] ?? 0)
    const support = gaugeScores[axis.key][winner] ?? 0
    const evidenceCap = 50 + Math.min(total, 5) * 10
    const supportPercent = total === 0 ? 50 : Math.round((support / total) * 100)
    const winnerPercent = Math.max(50, Math.min(evidenceCap, supportPercent))

    aligned[axis.key][left.code] = winner === left.code ? winnerPercent : 100 - winnerPercent
    aligned[axis.key][right.code] = winner === right.code ? winnerPercent : 100 - winnerPercent
  })

  return aligned
}

// 다음 배치 z값과 고유 instanceId 생성을 위한 단조 증가 카운터.
let placeCounter = 0
const MIN_ITEM_SCALE = 0.5
const MAX_ITEM_SCALE = 2

function clampItemScale(scale: number): number {
  return Math.min(MAX_ITEM_SCALE, Math.max(MIN_ITEM_SCALE, Math.round(scale * 10) / 10))
}

function normalizeItemRotation(rotation: number): number {
  const normalized = ((rotation + 180) % 360 + 360) % 360 - 180
  return Math.round(normalized * 10) / 10
}

function nextZ(placedItems: PlacedItem[], characters: CharactersState): number {
  const itemZ = placedItems.map((p) => p.z)
  const characterZ = Object.values(characters).map((c) => c.z ?? 0)
  return Math.max(0, ...itemZ, ...characterZ) + 1
}

const initialState = {
  stage: 'intro' as Stage,
  playerCount: 1 as PlayerCount,
  currentPlayer: 0,
  roundSetIndex: 0,
  nextRoundSetIndex: 0,
  players: [] as PlayerResult[],
  roundIndex: 0,
  typeAxisScores: emptyAxisScores(),
  axisScores: emptyAxisScores(),
  resultTypeId: null as string | null,
  resultCode: null as string | null,
  totalBudget: null as number | null,
  budget: null as number | null,
  soloBudgetRerollUsed: false,
  placedItems: [] as PlacedItem[],
  spent: 0,
  canvasBackgroundId: null as string | null,
  characters: makeCharacters(),
  decorateStep: 'background' as DecorateStep,
  seenDecorateGuides: {
    background: false,
    groom: false,
    bride: false,
    objects: false,
  } as Record<DecorateStep, boolean>,
  lowBudgetAlertShown: false,
  printFrameRatio: '2:3' as PrintFrameRatio,
  printFrame: null as PrintFrame | null,
}

export const useAppStore = create<AppState>((set, get) => ({
  ...initialState,

  setStage: (stage) => set({ stage }),

  setPlayerCount: (count) => set({ playerCount: count }),

  start: (count) =>
    set((state) => {
      const playerCount = count ?? state.playerCount
      // 인원과 관계없이 한 사람이 시작할 때마다 세트를 하나 소비한다.
      // 앞사람이 혼자 A를 봤다면 이어지는 2인 세션은 B → A 순서가 된다.
      const roundSetIndex = state.nextRoundSetIndex
      const nextRoundSetIndex = (roundSetIndex + 1) % WORLDCUP_ROUND_SETS.length

      return {
        stage: 'worldcup',
        playerCount,
        currentPlayer: 0,
        roundSetIndex,
        nextRoundSetIndex,
        players: makePlayers(playerCount),
        roundIndex: 0,
        typeAxisScores: emptyAxisScores(),
        axisScores: emptyAxisScores(),
        resultTypeId: null,
        resultCode: null,
        totalBudget: null,
        budget: null,
        soloBudgetRerollUsed: false,
        placedItems: [],
        spent: 0,
        canvasBackgroundId: null,
        characters: makeCharacters(),
        decorateStep: 'background',
        seenDecorateGuides: {
          background: false,
          groom: false,
          bride: false,
          objects: false,
        },
        lowBudgetAlertShown: false,
        printFrameRatio: '2:3',
        printFrame: null,
      }
    }),

  choose: (round, side) => {
    const choice = side === 'A' ? round.A : round.B
    // 두 사진이 네 축 모두 반대라 한 번의 선택이 네 축을 동시에 가리킨다.
    // 유형 판정과 게이지가 같은 점수를 쓴다.
    set((state) => ({
      typeAxisScores: addWeights(state.typeAxisScores, choice.weights),
      axisScores: addWeights(state.axisScores, choice.weights),
    }))

    // 다음 라운드로, 마지막이면 현재 플레이어 유형을 기록한다.
    const { roundIndex, roundSetIndex, playerCount, currentPlayer } = get()
    const roundCount = getWorldCupRounds(
      roundSetIndex,
      hasBonusRound(playerCount, currentPlayer),
    ).length
    const nextIndex = roundIndex + 1
    if (nextIndex >= roundCount) {
      get().computeResult()
      const { players, nextRoundSetIndex } = get()
      if (playerCount === 2 && currentPlayer === 0) {
        // 두 번째 사람은 로테이션의 다음 세트를 이어받고, 거기에 보너스 문항이 붙는다.
        // 두 사람의 사진 선택을 모두 마친 뒤 합친 취향 결과를 보여준다.
        set({
          currentPlayer: 1,
          roundSetIndex: nextRoundSetIndex,
          nextRoundSetIndex: (nextRoundSetIndex + 1) % WORLDCUP_ROUND_SETS.length,
          roundIndex: 0,
          typeAxisScores: emptyAxisScores(),
          axisScores: emptyAxisScores(),
          stage: 'worldcup',
        })
      } else if (playerCount === 2) {
        const combinedTypeScores = combineAxisScores(players.map((p) => p.typeAxisScores))
        const combinedGaugeScores = combineAxisScores(players.map((p) => p.axisScores))
        const code = computeCode(combinedTypeScores)
        const type = findTypeByCode(code)
        set({
          typeAxisScores: combinedTypeScores,
          axisScores: alignGaugeScores(combinedGaugeScores, code),
          resultCode: code,
          resultTypeId: type ? type.typeId : null,
          stage: 'result',
        })
      } else {
        set({ stage: 'result' })
      }
    } else {
      set({ roundIndex: nextIndex })
    }
  },

  computeResult: () => {
    const { typeAxisScores, axisScores, currentPlayer, players } = get()
    const code = computeCode(typeAxisScores)
    const type = findTypeByCode(code)
    const typeId = type ? type.typeId : null
    const updated = players.map((p, i) =>
      i === currentPlayer
        ? {
            ...p,
            resultCode: code,
            resultTypeId: typeId,
            typeAxisScores: cloneAxisScores(typeAxisScores),
            axisScores: cloneAxisScores(axisScores),
          }
        : p,
    )
    // 미러도 갱신(다른 스테이지 표시용).
    set({
      players: updated,
      resultCode: code,
      resultTypeId: typeId,
      axisScores: alignGaugeScores(axisScores, code),
    })
  },

  startBudget: () => set({ currentPlayer: 0, stage: 'budget' }),

  drawBudget: (reroll = false) => {
    const { currentPlayer, playerCount, players, soloBudgetRerollUsed } = get()
    const currentBudget = players[currentPlayer]?.budget
    const canReroll =
      reroll && playerCount === 1 && currentBudget != null && !soloBudgetRerollUsed
    if (currentBudget != null && !canReroll) return false

    const minimumAmount = playerCount === 1 ? SOLO_MIN_BUDGET_AMOUNT : MIN_BUDGET_AMOUNT
    let result = drawBudgetResult(minimumAmount)
    if (canReroll) {
      for (let attempt = 0; attempt < 8 && result.amount === currentBudget; attempt += 1) {
        result = drawBudgetResult(minimumAmount)
      }
    }
    const { tierId, tierLabel, amount } = result
    const updated = players.map((p, i) =>
      i === currentPlayer ? { ...p, budget: amount, tierId, tierLabel } : p,
    )
    set({
      players: updated,
      soloBudgetRerollUsed: canReroll ? true : soloBudgetRerollUsed,
    })
    return true
  },

  nextAfterBudget: () => {
    const { playerCount, currentPlayer, players } = get()
    if (playerCount === 2 && currentPlayer === 0) {
      set({ currentPlayer: 1 })
    } else {
      // 마지막 예산까지 뽑으면 합계를 꾸미기 예산으로 확정한다.
      const total = players.reduce((sum, p) => sum + (p.budget ?? 0), 0)
      set({ totalBudget: total, budget: total, stage: 'decorateIntro' })
    }
  },

  placeItem: (itemId, x, y) => {
    const item = findItem(itemId)
    if (!item) return null
    const { spent, budget, placedItems, characters } = get()
    // 예산 한도 반영: 합계가 예산을 넘으면 배치하지 않음.
    if (budget !== null && spent + item.price > budget) return null
    placeCounter += 1
    const placed: PlacedItem = {
      instanceId: `p${placeCounter}`,
      itemId,
      scale: item.objectGroup === 'accessories' ? DEFAULT_ACCESSORY_SCALE : 1,
      rotation: 0,
      x,
      y,
      z: nextZ(placedItems, characters),
    }
    set({ placedItems: [...placedItems, placed], spent: spent + item.price })
    return placed.instanceId
  },

  moveItem: (instanceId, x, y) =>
    set((state) => ({
      placedItems: state.placedItems.map((p) =>
        p.instanceId === instanceId ? { ...p, x, y } : p,
      ),
    })),

  setItemScale: (instanceId, requestedScale, anchor = 'center') =>
    set((state) => ({
      placedItems: state.placedItems.map((p) => {
        if (p.instanceId !== instanceId) return p
        const item = findItem(p.itemId)
        if (!item) return p
        const currentScale = p.scale ?? 1
        const scale = clampItemScale(requestedScale)
        if (scale === currentScale) return p
        const currentHeight = item.defaultHeight * currentScale
        const nextHeight = item.defaultHeight * scale
        if (anchor === 'top-left') {
          return { ...p, scale }
        }
        if (anchor === 'bottom-left') {
          return {
            ...p,
            y: p.y + currentHeight - nextHeight,
            scale,
          }
        }
        return {
          ...p,
          x: p.x - (item.defaultWidth * (scale - currentScale)) / 2,
          y: p.y - (item.defaultHeight * (scale - currentScale)) / 2,
          scale,
        }
      }),
    })),

  setItemRotation: (instanceId, rotation) =>
    set((state) => ({
      placedItems: state.placedItems.map((p) =>
        p.instanceId === instanceId ? { ...p, rotation: normalizeItemRotation(rotation) } : p,
      ),
    })),

  bringItemToFront: (instanceId) =>
    set((state) => {
      const z = nextZ(state.placedItems, state.characters)
      return {
        placedItems: state.placedItems.map((p) =>
          p.instanceId === instanceId ? { ...p, z } : p,
        ),
      }
    }),

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

  setCharacterGlasses: (who, glassesId) => {
    const { characters, spent, budget } = get()
    const cur = characters[who]?.glassesId
    const delta = glassesPrice(glassesId) - glassesPrice(cur)
    if (budget !== null && spent + delta > budget) return false
    set({
      characters: { ...characters, [who]: { ...characters[who], glassesId } },
      spent: Math.max(0, spent + delta),
    })
    return true
  },

  setCharacterScale: (who, requestedScale) =>
    set((state) => {
      const current = state.characters[who]
      const currentScale = current.scale ?? 1
      const scale = Math.min(
        MAX_CHARACTER_SCALE,
        Math.max(MIN_CHARACTER_SCALE, Math.round(requestedScale * 10) / 10),
      )
      if (scale === currentScale) return {}
      // 발밑 가운데를 기준으로 커지고 작아진다. 서 있던 자리가 그대로 유지돼서
      // 크기만 바꿔도 인물이 바닥에서 떠오르거나 옆으로 밀리지 않는다.
      const widthDelta = CHARACTER_FIGURE_WIDTH * (scale - currentScale)
      const heightDelta = CHARACTER_FIGURE_HEIGHT * (scale - currentScale)
      return {
        characters: {
          ...state.characters,
          [who]: {
            ...current,
            scale,
            x: current.x === null ? null : current.x - widthDelta / 2,
            y: current.y === null ? null : current.y - heightDelta,
          },
        },
      }
    }),

  moveCharacter: (who, x, y) =>
    set((state) => ({
      characters: { ...state.characters, [who]: { ...state.characters[who], x, y } },
    })),

  bringCharacterToFront: (who) =>
    set((state) => ({
      characters: {
        ...state.characters,
        [who]: { ...state.characters[who], z: nextZ(state.placedItems, state.characters) },
      },
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

  setCanvasBackground: (itemId) => {
    const { canvasBackgroundId, spent, budget } = get()
    const currentPrice = canvasBackgroundId ? findItem(canvasBackgroundId)?.price ?? 0 : 0
    const nextPrice = itemId ? findItem(itemId)?.price ?? 0 : 0
    const delta = nextPrice - currentPrice
    if (budget !== null && spent + delta > budget) return false
    set({
      canvasBackgroundId: itemId,
      spent: Math.max(0, spent + delta),
    })
    return true
  },
  setDecorateStep: (step) => set({ decorateStep: step }),
  markDecorateGuideSeen: (step) =>
    set((state) => ({
      seenDecorateGuides: { ...state.seenDecorateGuides, [step]: true },
    })),
  markLowBudgetAlertShown: () => set({ lowBudgetAlertShown: true }),
  setPrintFrameRatio: (ratio) => set({ printFrameRatio: ratio }),
  setPrintFrame: (frame) => set({ printFrame: frame }),

  reset: () => {
    placeCounter = 0
    const { nextRoundSetIndex } = get()
    set({
      ...initialState,
      nextRoundSetIndex,
      typeAxisScores: emptyAxisScores(),
      axisScores: emptyAxisScores(),
      players: [],
      placedItems: [],
      characters: makeCharacters(),
    })
  },
}))

import { useRef, useState, useCallback, useLayoutEffect, useMemo } from 'react'
import { useAppStore, type PrintFrame, type PrintFrameRatio } from '../store/useAppStore'
import {
  ITEMS,
  findItem,
  getWeddingPhraseFontRatio,
  type BackgroundGroup,
  type DecorItem,
  type ItemCategory,
  type ObjectShopGroup,
} from '../data/items'
import {
  CHARACTER_BODY,
  CHARACTER_HEAD,
  CHARACTERS,
  DEFAULT_HAIR_COLOR_ID,
  DEFAULT_HAIR_ID,
  DEFAULT_OUTFIT_ID,
  FACE_EXPRESSIONS,
  HAIR_COLOR_OPTIONS,
  HAIR_OPTIONS,
  OUTFIT_OPTIONS,
  findExpr,
  findHair,
  findHairColor,
  findOutfit,
  exprPrice,
  hairColorPrice,
  hairPrice,
  outfitPrice,
  DEFAULT_EXPR_ID,
  type CharacterKey,
} from '../data/characters'
import StageLayout from '../components/StageLayout'
import Button from '../components/Button'
import { formatWon } from '../utils/format'
import { SCENE_HEIGHT, SCENE_WIDTH } from '../data/constants'
import {
  getBackgroundRecommendations,
  type BackgroundRecommendation,
} from '../utils/backgroundRecommendations'

// 상점 탭: 실제 배치 아이템(itemCat) 또는 인물 표정(who) 중 하나.
interface ShopTab {
  key: string
  label: string
  itemCat?: ItemCategory
  who?: CharacterKey
  characterPart?: 'face' | 'hair' | 'hairColor' | 'outfit'
}
type CharacterPart = NonNullable<ShopTab['characterPart']>
type ObjectPart = ObjectShopGroup
type EquipmentCharacterPart = 'face' | 'hair' | 'hairColor' | 'outfit'

interface EquipmentEntry {
  key: string
  kind: 'background' | 'character' | 'placed'
  label: string
  name: string
  price: number
  image?: string | null
  swatch?: string
  renderStyle?: DecorItem['renderStyle']
  text?: string
  who?: CharacterKey
  part?: EquipmentCharacterPart
  instanceId?: string
}

const MAIN_TABS: ShopTab[] = [
  { key: 'background', label: '배경', itemCat: 'background' },
  { key: 'groom', label: '신랑', who: 'groom' },
  { key: 'bride', label: '신부', who: 'bride' },
  { key: 'objects', label: '오브젝트', itemCat: 'object' },
]

const CHARACTER_PART_TABS: { key: CharacterPart; label: string }[] = [
  { key: 'hair', label: '헤어' },
  { key: 'hairColor', label: '염색' },
  { key: 'face', label: '표정' },
  { key: 'outfit', label: '의상' },
]

const OBJECT_PART_TABS: { key: ObjectPart; label: string; itemCat: ItemCategory }[] = [
  { key: 'props', label: '오브제', itemCat: 'object' },
  { key: 'stickers', label: '스티커', itemCat: 'sticker' },
  { key: 'presetText', label: '웨딩 문구', itemCat: 'text' },
  { key: 'letterBalloons', label: '글자 풍선', itemCat: 'text' },
]

const BACKGROUND_PART_TABS: { key: BackgroundGroup; label: string }[] = [
  { key: 'solid', label: '단색' },
  { key: 'indoor', label: '실내' },
  { key: 'outdoor', label: '야외' },
  { key: 'regional', label: '지역' },
]

const ITEM_CATEGORY_LABELS: Record<Exclude<ItemCategory, 'background'>, string> = {
  object: '오브제',
  sticker: '스티커',
  text: '문구',
}

// 원본 1000×1400 프레임에서 실제로 쓸 영역. base 실루엣(측정: x0.31~0.69, y0.21~0.79)에
// 넉넉히 여백을 둬서, 표정 별·머리·드레스처럼 몸 밖으로 나가는 요소가 잘리지 않게 한다.
const CONTENT = { x0: 0, x1: 1, y0: 0.12, y1: 0.98 }
const CW_FRAC = CONTENT.x1 - CONTENT.x0 // 잘라낸 폭 비율
const CH_FRAC = CONTENT.y1 - CONTENT.y0 // 잘라낸 높이 비율
// 잘라낸 박스 안에 풀프레임 이미지를 확대·오프셋해서 넣기 위한 값(%).
const IMG_W_PCT = 100 / CW_FRAC
const IMG_H_PCT = 100 / CH_FRAC
const IMG_L_PCT = -CONTENT.x0 * IMG_W_PCT
const IMG_T_PCT = -CONTENT.y0 * IMG_H_PCT
// 캔버스 대비 인물(잘라낸 박스) 너비 + 종횡비. 여백을 늘린 만큼 박스 너비도 키워
// 실제 인물의 화면상 크기는 비슷하게 유지.
const FIGURE_W_RATIO = 400 / 1080
const FIGURE_ASPECT_W = CW_FRAC * 1000
const FIGURE_ASPECT_H = CH_FRAC * 1400
const FIGURE_H_OVER_W = FIGURE_ASPECT_H / FIGURE_ASPECT_W
const FIGURE_WIDTH = SCENE_WIDTH * FIGURE_W_RATIO
const FIGURE_HEIGHT = FIGURE_WIDTH * FIGURE_H_OVER_W
const CHARACTER_MIN_VISIBLE_RATIO = 0.4
const CHARACTER_MIN_VISIBLE_WIDTH = FIGURE_WIDTH * CHARACTER_MIN_VISIBLE_RATIO
const CHARACTER_MIN_VISIBLE_HEIGHT = FIGURE_HEIGHT * CHARACTER_MIN_VISIBLE_RATIO
const MIN_PRINT_FRAME_SIZE = SCENE_WIDTH * 0.18
const DEFAULT_PRINT_FRAME_SCALE = 0.85

const PRINT_FRAME_OPTIONS: { ratio: PrintFrameRatio; label: string; ratioLabel: string; value: number }[] = [
  { ratio: '2:3', label: '세로 사진', ratioLabel: '2:3', value: 2 / 3 },
  { ratio: '3:2', label: '가로 사진', ratioLabel: '3:2', value: 3 / 2 },
]

type FrameResizeCorner = 'nw' | 'ne' | 'sw' | 'se'
type FrameDragState =
  | { kind: 'move'; offsetX: number; offsetY: number }
  | {
      kind: 'resize'
      corner: FrameResizeCorner
      startX: number
      startY: number
      frame: PrintFrame
    }

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function printFrameRatioValue(ratio: PrintFrameRatio) {
  return PRINT_FRAME_OPTIONS.find((option) => option.ratio === ratio)?.value ?? 4 / 6
}

function defaultPrintFrame(ratio: PrintFrameRatio): PrintFrame {
  const value = printFrameRatioValue(ratio)
  const sceneRatio = SCENE_WIDTH / SCENE_HEIGHT
  const maxWidth = value > sceneRatio ? SCENE_WIDTH : SCENE_HEIGHT * value
  const width = maxWidth * DEFAULT_PRINT_FRAME_SCALE
  const height = width / value
  return {
    x: (SCENE_WIDTH - width) / 2,
    y: (SCENE_HEIGHT - height) / 2,
    width,
    height,
  }
}

function movePrintFrame(frame: PrintFrame, x: number, y: number): PrintFrame {
  return {
    ...frame,
    x: clamp(x, 0, SCENE_WIDTH - frame.width),
    y: clamp(y, 0, SCENE_HEIGHT - frame.height),
  }
}

function resizePrintFrame(
  frame: PrintFrame,
  corner: FrameResizeCorner,
  startX: number,
  startY: number,
  pointerX: number,
  pointerY: number,
  ratio: number,
): PrintFrame {
  const fixedX = corner.includes('w') ? frame.x + frame.width : frame.x
  const fixedY = corner.includes('n') ? frame.y + frame.height : frame.y
  const widthDelta = corner.includes('w') ? startX - pointerX : pointerX - startX
  const heightDeltaAsWidth = (corner.includes('n') ? startY - pointerY : pointerY - startY) * ratio
  const resizeDelta =
    Math.abs(widthDelta) >= Math.abs(heightDeltaAsWidth) ? widthDelta : heightDeltaAsWidth
  const maxWidth = corner.includes('w') ? fixedX : SCENE_WIDTH - fixedX
  const maxHeight = corner.includes('n') ? fixedY : SCENE_HEIGHT - fixedY
  const width = clamp(
    frame.width + resizeDelta,
    MIN_PRINT_FRAME_SIZE,
    Math.min(maxWidth, maxHeight * ratio),
  )
  const height = width / ratio
  return {
    x: corner.includes('w') ? fixedX - width : fixedX,
    y: corner.includes('n') ? fixedY - height : fixedY,
    width,
    height,
  }
}

function clampCharacterPosition(x: number, y: number) {
  return {
    x: Math.min(
      SCENE_WIDTH - CHARACTER_MIN_VISIBLE_WIDTH,
      Math.max(-FIGURE_WIDTH + CHARACTER_MIN_VISIBLE_WIDTH, x),
    ),
    y: Math.min(
      SCENE_HEIGHT - CHARACTER_MIN_VISIBLE_HEIGHT,
      Math.max(-FIGURE_HEIGHT + CHARACTER_MIN_VISIBLE_HEIGHT, y),
    ),
  }
}

// 캐릭터 파츠·표정 이미지를 잘라낸 박스에 채우는 공용 스타일.
const CHAR_IMG_STYLE: React.CSSProperties = {
  position: 'absolute',
  width: `${IMG_W_PCT}%`,
  height: `${IMG_H_PCT}%`,
  left: `${IMG_L_PCT}%`,
  top: `${IMG_T_PCT}%`,
  maxWidth: 'none',
}

function ShopScrollRow({ children }: { children: React.ReactNode }) {
  return (
    <div className="shop-scrollbar-cards">
      <div className="shop-scrollbar flex gap-3 overflow-x-scroll pb-3">
        {children}
      </div>
    </div>
  )
}

function WeddingPhrase({
  text,
  color,
  className = '',
}: {
  text: string
  color: string
  className?: string
}) {
  const fontSize = `${getWeddingPhraseFontRatio(text) * 100}cqw`

  return (
    <span
      aria-hidden="true"
      className={`pointer-events-none relative block ${className}`}
      style={{ containerType: 'inline-size' }}
    >
      <span
        className="absolute inset-[3%] grid grid-cols-[0.65em_minmax(0,1fr)_0.65em] items-center gap-[0.1em] overflow-hidden rounded-lg border-[3px] bg-white/90 px-[2%] font-black leading-none shadow-md"
        style={{
          borderColor: color,
          color,
          fontSize,
          textShadow: '0 1px 1px rgba(255,255,255,0.9)',
          whiteSpace: 'nowrap',
        }}
      >
        <span className="flex justify-center text-[0.55em] opacity-55">♥</span>
        <span className="min-w-0 text-center">{text}</span>
        <span className="flex justify-center text-[0.55em] opacity-55">♥</span>
      </span>
    </span>
  )
}

function LetterShapeBalloon({
  letter,
  color,
  className = '',
}: {
  letter: string
  color: string
  className?: string
}) {
  const letterStyle: React.CSSProperties = {
    color,
    fontFamily: "'Arial Rounded MT Bold', 'Arial Black', sans-serif",
    fontSize: '74cqw',
    fontWeight: 900,
    lineHeight: 1,
    WebkitTextStroke: '2.2cqw rgba(0,0,0,0.12)',
    paintOrder: 'stroke fill',
    textShadow:
      '1.6cqw 0 rgba(255,255,255,0.32), -1.6cqw 0 rgba(0,0,0,0.08), 0 3cqw 3cqw rgba(0,0,0,0.18)',
  }

  return (
    <span
      aria-hidden="true"
      className={`pointer-events-none relative block ${className}`}
      style={{ containerType: 'inline-size' }}
    >
      <span className="absolute left-1/2 top-[72%] h-[28%] w-px -translate-x-1/2 bg-gray-500/70" />
      <span
        className="absolute left-1/2 top-[67%] h-[8%] w-[9%] -translate-x-1/2 rounded-b-full border border-black/10"
        style={{ backgroundColor: color }}
      />
      <span className="absolute inset-x-0 top-[-3%] flex h-[75%] items-center justify-center">
        <span style={letterStyle}>{letter}</span>
      </span>
      <span className="absolute inset-x-0 top-[-4%] flex h-[75%] items-center justify-center opacity-55">
        <span
          style={{
            ...letterStyle,
            color: 'transparent',
            WebkitTextStroke: '1.1cqw rgba(255,255,255,0.65)',
            textShadow: 'none',
            transform: 'translate(-0.8cqw, -0.8cqw)',
          }}
        >
          {letter}
        </span>
      </span>
    </span>
  )
}

// 5) decorate — 신랑·신부 고정 배치 + 배경/표정/아이템 꾸미기.
export default function Decorate() {
  const placedItems = useAppStore((s) => s.placedItems)
  const spent = useAppStore((s) => s.spent)
  const budget = useAppStore((s) => s.budget)
  const placeItem = useAppStore((s) => s.placeItem)
  const moveItem = useAppStore((s) => s.moveItem)
  const setItemScale = useAppStore((s) => s.setItemScale)
  const bringItemToFront = useAppStore((s) => s.bringItemToFront)
  const removeItem = useAppStore((s) => s.removeItem)
  const characters = useAppStore((s) => s.characters)
  const setCharacterExpr = useAppStore((s) => s.setCharacterExpr)
  const setCharacterHair = useAppStore((s) => s.setCharacterHair)
  const setCharacterHairColor = useAppStore((s) => s.setCharacterHairColor)
  const setCharacterOutfit = useAppStore((s) => s.setCharacterOutfit)
  const moveCharacter = useAppStore((s) => s.moveCharacter)
  const bringCharacterToFront = useAppStore((s) => s.bringCharacterToFront)
  const canvasBackgroundId = useAppStore((s) => s.canvasBackgroundId)
  const setCanvasBackground = useAppStore((s) => s.setCanvasBackground)
  const printFrameRatio = useAppStore((s) => s.printFrameRatio)
  const printFrame = useAppStore((s) => s.printFrame)
  const setPrintFrameRatio = useAppStore((s) => s.setPrintFrameRatio)
  const setPrintFrame = useAppStore((s) => s.setPrintFrame)
  const setStage = useAppStore((s) => s.setStage)
  const resultCode = useAppStore((s) => s.resultCode)
  const axisScores = useAppStore((s) => s.axisScores)
  const playerCount = useAppStore((s) => s.playerCount)

  const backgroundRecommendations = useMemo(
    () => getBackgroundRecommendations(resultCode, axisScores),
    [axisScores, resultCode],
  )
  const recommendationById = useMemo(
    () =>
      new Map<string, BackgroundRecommendation>(
        backgroundRecommendations.map((recommendation) => [
          recommendation.item.id,
          recommendation,
        ]),
      ),
    [backgroundRecommendations],
  )
  const firstRecommendedGroup =
    backgroundRecommendations[0]?.item.backgroundGroup ?? 'solid'
  const [activeMainTabKey, setActiveMainTabKey] = useState<string>(MAIN_TABS[0].key)
  const [activeBackgroundPart, setActiveBackgroundPart] =
    useState<BackgroundGroup>(firstRecommendedGroup)
  const [activeCharacterParts, setActiveCharacterParts] = useState<Record<CharacterKey, CharacterPart>>({
    groom: 'hair',
    bride: 'hair',
  })
  const [activeObjectPart, setActiveObjectPart] = useState<ObjectPart>('props')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [selectedChar, setSelectedChar] = useState<CharacterKey | null>(null)
  const [warning, setWarning] = useState<string | null>(null)
  const [isFrameEditing, setIsFrameEditing] = useState(false)

  const canvasViewportRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLDivElement>(null)
  const hasInitializedBackgroundRef = useRef(false)
  const [canvasTransform, setCanvasTransform] = useState({ scale: 1, left: 0, top: 0 })
  const dragRef = useRef<{ kind: 'item' | 'char'; key: string; offsetX: number; offsetY: number } | null>(null)
  const frameDragRef = useRef<FrameDragState | null>(null)

  const remaining = budget === null ? null : budget - spent
  const background = canvasBackgroundId ? findItem(canvasBackgroundId) : undefined
  const backgroundPrice = background?.price ?? 0
  const activeMainTab = MAIN_TABS.find((t) => t.key === activeMainTabKey) ?? MAIN_TABS[0]
  const activeCharacterPart = activeMainTab.who ? activeCharacterParts[activeMainTab.who] : 'hair'
  const activeObjectTab =
    OBJECT_PART_TABS.find((tab) => tab.key === activeObjectPart) ??
    OBJECT_PART_TABS[0]
  const activePrintFrame = printFrame ?? defaultPrintFrame(printFrameRatio)
  const activeMainTabIndex = Math.max(0, MAIN_TABS.findIndex((t) => t.key === activeMainTab.key))
  const subTabWidthPct = 58
  const subTabCenterPct = ((activeMainTabIndex + 0.5) / MAIN_TABS.length) * 100
  const subTabLeftPct = Math.max(0, Math.min(100 - subTabWidthPct, subTabCenterPct - subTabWidthPct / 2))
  const subTabStyle = { width: `${subTabWidthPct}%`, marginLeft: `${subTabLeftPct}%` }
  const activeTab: ShopTab = activeMainTab.who
    ? {
        key: `${activeMainTab.key}-${activeCharacterPart}`,
        label: `${activeMainTab.label} ${CHARACTER_PART_TABS.find((t) => t.key === activeCharacterPart)?.label ?? ''}`,
        who: activeMainTab.who,
        characterPart: activeCharacterPart,
      }
    : activeMainTab.key === 'objects'
      ? {
          key: `objects-${activeObjectPart}`,
          label: activeObjectTab.label,
          itemCat: activeObjectTab.itemCat,
        }
      : activeMainTab
  const visibleItems = ITEMS.filter(
    (item) =>
      item.category === activeTab.itemCat &&
      (item.category !== 'background' ||
        item.backgroundGroup === activeBackgroundPart) &&
      (activeMainTab.key !== 'objects' ||
        item.objectGroup === activeObjectPart),
  ).sort((a, b) => a.price - b.price)
  const equipmentEntries = useMemo<EquipmentEntry[]>(() => {
    const entries: EquipmentEntry[] = []

    if (background) {
      entries.push({
        key: 'background',
        kind: 'background',
        label: '배경',
        name: background.name,
        price: background.price,
        image: background.image,
      })
    }

    for (const character of CHARACTERS) {
      const state = characters[character.key]
      const hair = findHair(character.key, state.hairId)
      const hairColor = findHairColor(state.hairColorId)
      const expression = findExpr(state.exprId)
      const outfit = findOutfit(character.key, state.outfitId)

      if (hair && hair.id !== DEFAULT_HAIR_ID) {
        entries.push({
          key: `${character.key}-hair`,
          kind: 'character',
          label: `${character.label} 헤어`,
          name: hair.name,
          price: hair.price,
          image: hair.image,
          who: character.key,
          part: 'hair',
        })
      }
      if (hairColor && hairColor.id !== DEFAULT_HAIR_COLOR_ID) {
        entries.push({
          key: `${character.key}-hair-color`,
          kind: 'character',
          label: `${character.label} 염색`,
          name: hairColor.name,
          price: hairColor.price,
          swatch: hairColor.swatch,
          who: character.key,
          part: 'hairColor',
        })
      }
      if (expression && expression.id !== DEFAULT_EXPR_ID) {
        entries.push({
          key: `${character.key}-face`,
          kind: 'character',
          label: `${character.label} 표정`,
          name: expression.name,
          price: expression.price,
          image: expression.image,
          who: character.key,
          part: 'face',
        })
      }
      if (outfit && outfit.id !== DEFAULT_OUTFIT_ID) {
        entries.push({
          key: `${character.key}-outfit`,
          kind: 'character',
          label: `${character.label} 의상`,
          name: outfit.name,
          price: outfit.price,
          image: outfit.image,
          who: character.key,
          part: 'outfit',
        })
      }
    }

    for (const placed of placedItems) {
      const item = findItem(placed.itemId)
      if (!item || item.category === 'background') continue
      entries.push({
        key: placed.instanceId,
        kind: 'placed',
        label: ITEM_CATEGORY_LABELS[item.category],
        name: item.name,
        price: item.price,
        image: item.image,
        swatch: item.image ? undefined : item.thumbnail,
        renderStyle: item.renderStyle,
        text: item.text,
        instanceId: placed.instanceId,
      })
    }

    return entries
  }, [background, characters, placedItems])

  // 첫 꾸미기 진입에서는 1순위 추천 배경으로 시작하고, 비싸면 무료 아이보리를 쓴다.
  useLayoutEffect(() => {
    if (hasInitializedBackgroundRef.current) return
    hasInitializedBackgroundRef.current = true
    if (canvasBackgroundId) return

    const recommended = backgroundRecommendations[0]?.item
    const canAffordRecommended =
      recommended && (budget === null || spent + recommended.price <= budget)
    const initialBackground = canAffordRecommended
      ? recommended
      : findItem('bg-solid-ivory')

    if (!initialBackground || !setCanvasBackground(initialBackground.id)) return
    if (initialBackground.backgroundGroup) {
      setActiveBackgroundPart(initialBackground.backgroundGroup)
    }
  }, [backgroundRecommendations, budget, canvasBackgroundId, setCanvasBackground, spent])

  // 진입 시 인물 기본 위치 초기화(신랑 왼쪽·신부 오른쪽, 하단 중앙).
  useLayoutEffect(() => {
    const viewport = canvasViewportRef.current
    if (!viewport) return

    const updateCanvas = () => {
      const viewportWidth = viewport.offsetWidth
      const viewportHeight = viewport.offsetHeight
      const scale = Math.min(viewportWidth / SCENE_WIDTH, viewportHeight / SCENE_HEIGHT)
      const left = 0
      const top = Math.max(0, (viewportHeight - SCENE_HEIGHT * scale) / 2)

      setCanvasTransform((current) =>
        current.scale === scale && current.left === left && current.top === top
          ? current
          : { scale, left, top },
      )

      const y = SCENE_HEIGHT - FIGURE_HEIGHT - SCENE_WIDTH * 0.03
      const gap = SCENE_WIDTH * 0.04
      const startX = SCENE_WIDTH / 2 - (FIGURE_WIDTH * 2 + gap) / 2
      const chars = useAppStore.getState().characters
      if (chars.groom.x === null) moveCharacter('groom', startX, y)
      if (chars.bride.x === null) moveCharacter('bride', startX + FIGURE_WIDTH + gap, y)
    }

    updateCanvas()
    const observer = new ResizeObserver(updateCanvas)
    observer.observe(viewport)
    return () => observer.disconnect()
  }, [moveCharacter])

  const warn = (msg: string) => {
    setWarning(msg)
    window.setTimeout(() => setWarning(null), 1800)
  }

  // 캔버스 transform:scale을 고려해 화면 좌표 → 캔버스 내부 좌표로 변환.
  const toCanvasCoords = useCallback((clientX: number, clientY: number) => {
    const el = canvasRef.current
    if (!el) return { x: 0, y: 0 }
    const rect = el.getBoundingClientRect()
    const scale = rect.width / el.offsetWidth || 1
    return { x: (clientX - rect.left) / scale, y: (clientY - rect.top) / scale }
  }, [])

  // 상점 아이템 탭: 배경은 캔버스 배경으로 설정, 나머지는 캔버스에 배치.
  const handleTapItem = (item: DecorItem) => {
    if (item.category === 'background') {
      if (!setCanvasBackground(item.id)) {
        warn('예산이 부족해서 이 배경으로 바꿀 수 없어요.')
        return
      }
      if (item.backgroundGroup) setActiveBackgroundPart(item.backgroundGroup)
      return
    }
    const jitter = (placedItems.length % 5) * 24
    const x = SCENE_WIDTH / 2 - item.defaultWidth / 2 + jitter
    const y = SCENE_HEIGHT / 2 - item.defaultHeight / 2 + jitter
    const instanceId = placeItem(item.id, x, y)
    if (!instanceId) {
      warn('예산을 초과해서 배치할 수 없어요.')
      return
    }
    setSelectedId(instanceId)
    setSelectedChar(null)
  }

  const handleRecommendationTap = (recommendation: BackgroundRecommendation) => {
    if (!setCanvasBackground(recommendation.item.id)) {
      warn('예산이 부족해서 이 배경으로 바꿀 수 없어요.')
      return
    }
    if (recommendation.item.backgroundGroup) {
      setActiveBackgroundPart(recommendation.item.backgroundGroup)
    }
  }

  const handleMainTabClick = (tab: ShopTab) => {
    setActiveMainTabKey(tab.key)
  }

  const handleCharacterPartClick = (who: CharacterKey, part: CharacterPart) => {
    setActiveCharacterParts((prev) => ({ ...prev, [who]: part }))
  }

  const handlePointerDownItem = (e: React.PointerEvent, instanceId: string, px: number, py: number) => {
    if (isFrameEditing) return
    e.stopPropagation()
    setSelectedId(instanceId)
    setSelectedChar(null)
    bringItemToFront(instanceId)
    const { x, y } = toCanvasCoords(e.clientX, e.clientY)
    dragRef.current = { kind: 'item', key: instanceId, offsetX: x - px, offsetY: y - py }
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
  }

  // 인물 드래그(삭제 불가, 위치만 이동) + 선택 표시
  const handlePointerDownChar = (e: React.PointerEvent, who: CharacterKey, px: number, py: number) => {
    if (isFrameEditing) return
    e.stopPropagation()
    setSelectedChar(who)
    setSelectedId(null)
    bringCharacterToFront(who)
    const { x, y } = toCanvasCoords(e.clientX, e.clientY)
    dragRef.current = { kind: 'char', key: who, offsetX: x - px, offsetY: y - py }
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
  }

  const handlePointerMove = (e: React.PointerEvent) => {
    const frameDrag = frameDragRef.current
    if (frameDrag) {
      const { x, y } = toCanvasCoords(e.clientX, e.clientY)
      if (frameDrag.kind === 'move') {
        setPrintFrame(movePrintFrame(activePrintFrame, x - frameDrag.offsetX, y - frameDrag.offsetY))
      } else {
        setPrintFrame(
          resizePrintFrame(
            frameDrag.frame,
            frameDrag.corner,
            frameDrag.startX,
            frameDrag.startY,
            x,
            y,
            printFrameRatioValue(printFrameRatio),
          ),
        )
      }
      return
    }
    const drag = dragRef.current
    if (!drag) return
    const { x, y } = toCanvasCoords(e.clientX, e.clientY)
    if (drag.kind === 'item') moveItem(drag.key, x - drag.offsetX, y - drag.offsetY)
    else {
      const position = clampCharacterPosition(x - drag.offsetX, y - drag.offsetY)
      moveCharacter(drag.key as CharacterKey, position.x, position.y)
    }
  }

  const handlePointerUp = () => {
    dragRef.current = null
    frameDragRef.current = null
  }

  const beginFrameEditing = () => {
    if (!printFrame) setPrintFrame(activePrintFrame)
    setSelectedId(null)
    setSelectedChar(null)
    dragRef.current = null
    setIsFrameEditing(true)
  }

  const finishFrameEditing = () => {
    frameDragRef.current = null
    setIsFrameEditing(false)
  }

  const updatePrintFrameRatio = (ratio: PrintFrameRatio) => {
    setPrintFrameRatio(ratio)
    setPrintFrame(defaultPrintFrame(ratio))
  }

  const startFrameMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isFrameEditing) return
    e.preventDefault()
    e.stopPropagation()
    const point = toCanvasCoords(e.clientX, e.clientY)
    frameDragRef.current = {
      kind: 'move',
      offsetX: point.x - activePrintFrame.x,
      offsetY: point.y - activePrintFrame.y,
    }
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  const startFrameResize = (corner: FrameResizeCorner) => (e: React.PointerEvent<HTMLButtonElement>) => {
    e.preventDefault()
    e.stopPropagation()
    const point = toCanvasCoords(e.clientX, e.clientY)
    frameDragRef.current = {
      kind: 'resize',
      corner,
      startX: point.x,
      startY: point.y,
      frame: activePrintFrame,
    }
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  const handleRemoveEquipment = (entry: EquipmentEntry) => {
    if (entry.kind === 'background') {
      setCanvasBackground(null)
      return
    }
    if (entry.kind === 'placed' && entry.instanceId) {
      removeItem(entry.instanceId)
      if (selectedId === entry.instanceId) setSelectedId(null)
      return
    }
    if (entry.kind !== 'character' || !entry.who || !entry.part) return

    if (entry.part === 'hair') setCharacterHair(entry.who, DEFAULT_HAIR_ID)
    else if (entry.part === 'hairColor') setCharacterHairColor(entry.who, DEFAULT_HAIR_COLOR_ID)
    else if (entry.part === 'face') setCharacterExpr(entry.who, DEFAULT_EXPR_ID)
    else setCharacterOutfit(entry.who, DEFAULT_OUTFIT_ID)
  }

  const handleSelectEquipment = (entry: EquipmentEntry) => {
    if (entry.kind !== 'placed' || !entry.instanceId) return
    setSelectedId(entry.instanceId)
    setSelectedChar(null)
    bringItemToFront(entry.instanceId)
  }

  return (
    <StageLayout>
      <div className="flex h-full flex-col gap-4">
        {/* 예산 바 */}
        <div className="rounded-2xl bg-white px-5 py-4 shadow-sm">
          <div className="flex items-center justify-between text-xl font-semibold">
            <span className="text-gray-500">예산 {budget === null ? '-' : formatWon(budget)}</span>
            <span className="text-gray-500">
              사용 <span className="font-bold text-brand-500">{formatWon(spent)}</span>
            </span>
            <span className={`font-semibold ${remaining !== null && remaining < 0 ? 'text-red-500' : 'text-emerald-600'}`}>
              남음 {remaining === null ? '-' : formatWon(Math.max(0, remaining))}
            </span>
          </div>
          {warning && <p className="mt-2 text-center text-lg font-bold text-red-500">{warning}</p>}
        </div>

        {/* 전체 배경 캔버스 + 장비 목록 */}
        <div className="flex min-h-0 flex-1 gap-3">
          <div
            ref={canvasViewportRef}
            className="relative min-h-0 min-w-0 flex-1 overflow-hidden rounded-2xl bg-[repeating-linear-gradient(45deg,#fafafa,#fafafa_12px,#f4f4f5_12px,#f4f4f5_24px)]"
          >
            <div
              ref={canvasRef}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerDown={() => {
                setSelectedId(null)
                setSelectedChar(null)
              }}
              className="absolute overflow-hidden"
              style={{
                left: canvasTransform.left,
                top: canvasTransform.top,
                width: SCENE_WIDTH,
                height: SCENE_HEIGHT,
                backgroundColor: background?.image ? '#ffffff' : background?.thumbnail ?? '#ffffff',
                transform: `scale(${canvasTransform.scale})`,
                transformOrigin: 'top left',
              }}
            >
            {/* 배경 이미지 */}
            {background?.image && (
              <img
                src={background.image}
                alt={background.name}
                className="pointer-events-none absolute inset-0 h-full w-full object-cover"
                draggable={false}
              />
            )}

          {/* 인물: 신랑·신부 (삭제/교체 불가, 드래그로 위치 이동 가능) */}
          {CHARACTERS.map((c) => {
            const cs = characters[c.key]
            if (cs.x === null || cs.y === null) return null // 위치 초기화 전
            const ex = findExpr(cs.exprId ?? DEFAULT_EXPR_ID)
            const hair = findHair(c.key, cs.hairId ?? DEFAULT_HAIR_ID)
            const hairColor = findHairColor(cs.hairColorId ?? DEFAULT_HAIR_COLOR_ID)
            const outfit = findOutfit(c.key, cs.outfitId ?? DEFAULT_OUTFIT_ID)
            const isDefaultOutfit = (cs.outfitId ?? DEFAULT_OUTFIT_ID) === DEFAULT_OUTFIT_ID
            const hasHairColor = hairColor?.id !== DEFAULT_HAIR_COLOR_ID
            const hairBaseStyle =
              hasHairColor && !hair?.maskImage
                ? { ...CHAR_IMG_STYLE, filter: hairColor?.filter }
                : CHAR_IMG_STYLE
            const hairColorStyle = {
              ...CHAR_IMG_STYLE,
              filter: hairColor?.filter,
              WebkitMaskImage: hair?.maskImage ? `url(${hair.maskImage})` : undefined,
              maskImage: hair?.maskImage ? `url(${hair.maskImage})` : undefined,
              WebkitMaskSize: '100% 100%',
              maskSize: '100% 100%',
              WebkitMaskRepeat: 'no-repeat',
              maskRepeat: 'no-repeat',
            }
            return (
              <div
                key={c.key}
                onPointerDown={(e) => handlePointerDownChar(e, c.key, cs.x!, cs.y!)}
                className={`absolute overflow-hidden rounded-2xl ${
                  selectedChar === c.key ? 'ring-4 ring-brand-400' : ''
                }`}
                style={{
                  left: cs.x,
                  top: cs.y,
                  width: `${FIGURE_W_RATIO * 100}%`,
                  aspectRatio: `${FIGURE_ASPECT_W} / ${FIGURE_ASPECT_H}`,
                  zIndex: cs.z ?? 0,
                  touchAction: 'none',
                }}
              >
                {/* z순서: head → hair → 표정 → body. 모두 같은 풀프레임 이미지라 그대로 겹친다. */}
                <img
                  src={CHARACTER_HEAD}
                  alt={c.label}
                  className="pointer-events-none drop-shadow"
                  style={CHAR_IMG_STYLE}
                  draggable={false}
                />
                {hair?.image && (
                  <>
                    <img
                      src={hair.image}
                      alt=""
                      className="pointer-events-none"
                      style={hairBaseStyle}
                      draggable={false}
                    />
                    {hasHairColor && hair.maskImage && (
                      <img
                        src={hair.image}
                        alt=""
                        className="pointer-events-none"
                        style={hairColorStyle}
                        draggable={false}
                      />
                    )}
                  </>
                )}
                {ex && (
                  <img
                    src={ex.image}
                    alt=""
                    className="pointer-events-none"
                    style={CHAR_IMG_STYLE}
                    draggable={false}
                  />
                )}
                <img
                  src={outfit?.image ?? CHARACTER_BODY}
                  alt=""
                  className="pointer-events-none drop-shadow"
                  style={CHAR_IMG_STYLE}
                  draggable={false}
                />
                {isDefaultOutfit && (
                  <span
                    className="pointer-events-none absolute font-bold text-gray-600"
                    style={{
                      left: '50%',
                      top: '55%',
                      transform: 'translate(-50%, -50%)',
                      fontSize: 25,
                      textShadow: '0 1px 3px rgba(255,255,255,0.9)',
                    }}
                  >
                    {c.label}
                  </span>
                )}
              </div>
            )
          })}

          {/* 배치한 꾸미기 아이템(오브제/스티커/문구) */}
          {placedItems.map((p) => {
            const item = findItem(p.itemId)
            if (!item) return null
            const isSelected = p.instanceId === selectedId
            const itemScale = p.scale ?? 1
            return (
              <div
                key={p.instanceId}
                onPointerDown={(e) => handlePointerDownItem(e, p.instanceId, p.x, p.y)}
                className={`absolute flex items-center justify-center text-center text-base font-semibold text-white/90 ${
                  isSelected ? 'ring-4 ring-brand-400' : ''
                }`}
                style={{
                  left: p.x,
                  top: p.y,
                  width: item.defaultWidth * itemScale,
                  height: item.defaultHeight * itemScale,
                  zIndex: p.z,
                  backgroundColor:
                    item.image ||
                    item.renderStyle === 'weddingPhrase' ||
                    item.renderStyle === 'letterShapeBalloon'
                      ? 'transparent'
                      : item.thumbnail,
                  borderRadius: item.shape === 'circle' ? '9999px' : '12px',
                  touchAction: 'none',
                }}
              >
                {item.image ? (
                  <img
                    src={item.image}
                    alt={item.name}
                    className="pointer-events-none h-full w-full object-contain drop-shadow"
                    draggable={false}
                  />
                ) : item.renderStyle === 'weddingPhrase' ? (
                  <WeddingPhrase
                    text={item.text ?? ''}
                    color={item.thumbnail}
                    className="h-full w-full"
                  />
                ) : item.renderStyle === 'letterShapeBalloon' ? (
                  <LetterShapeBalloon
                    letter={item.text ?? ''}
                    color={item.thumbnail}
                    className="h-full w-full"
                  />
                ) : (
                  <span className="pointer-events-none px-1">{item.name}</span>
                )}
                {isSelected && (
                  <>
                    <button
                      type="button"
                      aria-label="크게"
                      title="크게"
                      disabled={itemScale >= 2}
                      onPointerDown={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        setItemScale(p.instanceId, itemScale + 0.1, 'top-left')
                      }}
                      className="absolute -left-3 -top-3 flex h-9 w-9 items-center justify-center rounded-full bg-brand-500 text-2xl font-black text-white shadow-md disabled:bg-gray-300"
                    >
                      +
                    </button>
                    <button
                      type="button"
                      aria-label="작게"
                      title="작게"
                      disabled={itemScale <= 0.5}
                      onPointerDown={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        setItemScale(p.instanceId, itemScale - 0.1, 'bottom-left')
                      }}
                      className="absolute -bottom-3 -left-3 flex h-9 w-9 items-center justify-center rounded-full bg-brand-500 text-2xl font-black text-white shadow-md disabled:bg-gray-300"
                    >
                      −
                    </button>
                    <button
                      type="button"
                      aria-label="크기 초기화"
                      title="크기 초기화"
                      disabled={itemScale === 1}
                      onPointerDown={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        setItemScale(p.instanceId, 1)
                      }}
                      className="absolute -bottom-3 -right-3 flex h-9 w-9 items-center justify-center rounded-full bg-white text-xl font-black text-brand-600 shadow-md ring-2 ring-brand-400 disabled:text-gray-300 disabled:ring-gray-300"
                    >
                      ↺
                    </button>
                    <button
                      type="button"
                      aria-label="삭제"
                      title="삭제"
                      onPointerDown={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        removeItem(p.instanceId)
                        setSelectedId(null)
                      }}
                      className="absolute -right-3 -top-3 flex h-9 w-9 items-center justify-center rounded-full bg-red-500 text-base font-bold text-white shadow-md"
                    >
                      ✕
                    </button>
                  </>
                )}
              </div>
            )
          })}

              <div
                aria-label="인쇄 프레임"
                onPointerDown={startFrameMove}
                className={`absolute box-border touch-none ${
                  isFrameEditing
                    ? 'border-[6px] border-white ring-4 ring-brand-400'
                    : 'pointer-events-none border-4 border-white/90 ring-2 ring-brand-300'
                }`}
                style={{
                  left: activePrintFrame.x,
                  top: activePrintFrame.y,
                  width: activePrintFrame.width,
                  height: activePrintFrame.height,
                  zIndex: 9998,
                  boxShadow: `0 0 0 9999px rgba(100, 116, 139, ${isFrameEditing ? 0.62 : 0.52})`,
                }}
              >
                {isFrameEditing &&
                  (['nw', 'ne', 'sw', 'se'] as const).map((corner) => (
                    <button
                      key={corner}
                      type="button"
                      aria-label={`${corner} 모서리로 프레임 크기 조절`}
                      onPointerDown={startFrameResize(corner)}
                      className={`absolute h-14 w-14 rounded-full border-[6px] border-white bg-brand-500 shadow-md ${
                        corner.includes('n') ? 'top-3' : 'bottom-3'
                      } ${corner.includes('w') ? 'left-3' : 'right-3'}`}
                    />
                  ))}
              </div>
            </div>

            {isFrameEditing && (
              <div className="absolute left-4 top-4 z-[10001] flex overflow-hidden rounded-lg border-2 border-white bg-white shadow-md">
                {PRINT_FRAME_OPTIONS.map((option) => (
                  <button
                    key={option.ratio}
                    type="button"
                    onClick={() => updatePrintFrameRatio(option.ratio)}
                    className={`flex min-w-16 flex-col items-center justify-center px-3 py-2 font-black ${
                      printFrameRatio === option.ratio
                        ? 'bg-brand-500 text-white'
                        : 'bg-white text-gray-600 active:bg-brand-50'
                    }`}
                  >
                    <span className="text-base">{option.label}</span>
                    <span
                      className={`text-sm ${
                        printFrameRatio === option.ratio ? 'text-white/85' : 'text-gray-400'
                      }`}
                    >
                      {option.ratioLabel}
                    </span>
                  </button>
                ))}
              </div>
            )}

            <button
              type="button"
              aria-pressed={isFrameEditing}
              onClick={isFrameEditing ? finishFrameEditing : beginFrameEditing}
              className={`absolute right-4 top-4 z-[10001] min-w-32 rounded-lg px-5 py-3 text-lg font-black shadow-md ${
                isFrameEditing
                  ? 'bg-brand-500 text-white active:bg-brand-600'
                  : 'bg-white text-brand-600 ring-2 ring-brand-300 active:bg-brand-50'
              }`}
            >
              {isFrameEditing ? '조정 완료' : '프레임 조정'}
            </button>

            <div className="pointer-events-none absolute inset-0 z-[9999] rounded-2xl border-2 border-brand-100" />
          </div>

          <aside className="flex w-[23%] min-w-[168px] flex-col overflow-hidden rounded-2xl border-2 border-brand-100 bg-white shadow-sm">
            <div className="flex shrink-0 items-center justify-between border-b border-brand-100 px-2.5 py-3">
              <h2 className="text-lg font-black text-gray-800">구매 목록</h2>
              <span className="text-sm font-bold text-brand-500">{equipmentEntries.length}개</span>
            </div>
            <div className="equipment-scrollbar min-h-0 flex-1 overflow-y-scroll px-2">
              {equipmentEntries.length === 0 ? (
                <div className="flex h-full items-center justify-center px-4 text-center text-base font-semibold text-gray-400">
                  선택한 장비가 없습니다
                </div>
              ) : (
                equipmentEntries.map((entry) => (
                  <div
                    key={entry.key}
                    className={`grid min-h-[68px] grid-cols-[minmax(0,1fr)_2rem] items-center gap-1 border-b border-gray-100 py-2 last:border-b-0 ${
                      entry.kind === 'placed' && entry.instanceId === selectedId
                        ? 'bg-brand-50'
                        : ''
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => handleSelectEquipment(entry)}
                      disabled={entry.kind !== 'placed'}
                      className="grid min-w-0 grid-cols-[2.25rem_minmax(0,1fr)] items-center gap-1 text-left disabled:cursor-default"
                      aria-label={
                        entry.kind === 'placed'
                          ? `${entry.name} 선택하고 맨 앞으로 가져오기`
                          : undefined
                      }
                    >
                      <span className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-md bg-brand-50">
                        {entry.image ? (
                          <img
                            src={entry.image}
                            alt=""
                            className="h-full w-full object-contain"
                            draggable={false}
                          />
                        ) : entry.renderStyle === 'weddingPhrase' ? (
                          <WeddingPhrase
                            text={entry.text ?? ''}
                            color={entry.swatch ?? '#ef6f9a'}
                            className="h-full w-full"
                          />
                        ) : entry.renderStyle === 'letterShapeBalloon' ? (
                          <LetterShapeBalloon
                            letter={entry.text ?? ''}
                            color={entry.swatch ?? '#ef6f9a'}
                            className="h-full w-full"
                          />
                        ) : (
                          <span
                            className="h-7 w-7 rounded-md border border-black/5"
                            style={{ backgroundColor: entry.swatch ?? '#f3f4f6' }}
                          />
                        )}
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-bold text-gray-400">{entry.label}</span>
                        <span className="block truncate text-base font-black text-gray-800">{entry.name}</span>
                        <span className="block truncate text-sm font-bold text-brand-500">
                          {entry.price === 0 ? '무료' : formatWon(entry.price)}
                        </span>
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemoveEquipment(entry)}
                      className="flex h-8 w-8 items-center justify-center rounded-full bg-red-50 text-xl font-bold leading-none text-red-500 active:bg-red-100"
                      aria-label={`${entry.name} 빼기`}
                      title="장비에서 빼기"
                    >
                      ×
                    </button>
                  </div>
                ))
              )}
            </div>
            <div className="flex shrink-0 items-center justify-between border-t border-brand-100 px-2.5 py-3 text-sm font-bold">
              <span className="text-gray-500">사용 합계</span>
              <span className="text-brand-500">{formatWon(spent)}</span>
            </div>
          </aside>
        </div>

        {/* 상점 */}
        <div className="rounded-2xl bg-white p-3 shadow-sm">
          {/* 카테고리 탭 */}
          <div className="mb-2 grid grid-cols-4 gap-2">
            {MAIN_TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => handleMainTabClick(t)}
                className={`select-none rounded-xl py-2 text-lg font-bold ${
                  t.key === activeMainTabKey ? 'bg-brand-500 text-white' : 'bg-brand-50 text-brand-500'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
          <div className="mb-3 flex min-h-[40px] items-center rounded-lg bg-gray-100 p-1" style={subTabStyle}>
            {activeMainTab.who ? (
              <div className="grid w-full grid-cols-4 gap-1">
                {CHARACTER_PART_TABS.map((t) => (
                  <button
                    key={t.key}
                    onClick={() => handleCharacterPartClick(activeMainTab.who!, t.key)}
                    className={`select-none rounded-md py-1.5 text-base font-bold transition ${
                      t.key === activeCharacterPart
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-500 active:bg-white/70'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            ) : activeMainTab.key === 'objects' ? (
              <div className="grid w-full grid-cols-4 gap-1">
                {OBJECT_PART_TABS.map((t) => (
                  <button
                    key={t.key}
                    onClick={() => setActiveObjectPart(t.key)}
                    className={`select-none rounded-md py-1.5 text-base font-bold transition ${
                      t.key === activeObjectPart
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-500 active:bg-white/70'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            ) : activeMainTab.key === 'background' ? (
              <div className="grid w-full grid-cols-4 gap-1">
                {BACKGROUND_PART_TABS.map((t) => (
                  <button
                    key={t.key}
                    onClick={() => setActiveBackgroundPart(t.key)}
                    className={`select-none rounded-md py-1.5 text-base font-bold transition ${
                      t.key === activeBackgroundPart
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-500 active:bg-white/70'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            ) : (
              <div aria-hidden="true" className="h-8 w-full" />
            )}
          </div>

          <div className="mb-3 h-[118px] shrink-0">
            <p className="mb-1 px-1 text-xl font-black leading-tight text-gray-700">
              {playerCount === 2
                ? '두 분의 합친 취향에 어울리는 배경'
                : '당신의 취향에 어울리는 배경'}
            </p>
            <div className="grid grid-cols-3 gap-2">
              {backgroundRecommendations.map((recommendation) => {
                const selected = recommendation.item.id === canvasBackgroundId
                const delta = recommendation.item.price - backgroundPrice
                const affordable = budget === null || spent + delta <= budget
                return (
                  <button
                    key={recommendation.item.id}
                    onClick={() => handleRecommendationTap(recommendation)}
                    disabled={!affordable && !selected}
                    className={`grid h-20 min-w-0 select-none grid-cols-[3.25rem_minmax(0,1fr)] items-center gap-2 rounded-lg border-2 p-1.5 text-left ${
                      selected
                        ? 'border-brand-500 bg-brand-50'
                        : 'border-brand-100 bg-white active:bg-brand-50 disabled:opacity-40'
                    }`}
                  >
                    <img
                      src={recommendation.item.image}
                      alt={recommendation.item.name}
                      className="h-16 w-[3.25rem] rounded-md object-cover"
                      draggable={false}
                    />
                    <span className="min-w-0">
                      <span className="block truncate text-base font-black leading-tight text-brand-500">
                        {recommendation.label}
                      </span>
                      <span className="block truncate text-lg font-bold leading-tight text-gray-800">
                        {recommendation.item.name}
                      </span>
                      <span className="block truncate text-sm leading-tight text-gray-500">
                        {recommendation.reason} · {formatWon(recommendation.item.price)}
                      </span>
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* 표정 탭: 해당 인물의 표정 교체 */}
          {activeTab.who && activeTab.characterPart === 'face' ? (
            <ShopScrollRow key={activeTab.key}>
              {FACE_EXPRESSIONS.map((ex) => {
                const who = activeTab.who!
                const curExpr = characters[who]?.exprId ?? DEFAULT_EXPR_ID
                const isCur = ex.id === curExpr
                const delta = ex.price - exprPrice(curExpr)
                const affordable = budget === null || spent + delta <= budget
                return (
                  <button
                    key={ex.id}
                    onClick={() => {
                      if (!setCharacterExpr(who, ex.id)) warn('예산을 초과해서 바꿀 수 없어요.')
                    }}
                    disabled={!affordable && !isCur}
                    className={`flex w-24 shrink-0 select-none flex-col items-center gap-1 rounded-xl border-2 p-1.5 active:bg-brand-50 disabled:opacity-40 ${
                      isCur ? 'border-brand-500 bg-brand-50' : 'border-brand-100'
                    }`}
                  >
                    <span className="h-16 w-16 overflow-hidden rounded-lg bg-brand-50">
                      <img
                        src={ex.image}
                        alt={ex.name}
                        className="h-full w-full object-cover"
                        style={{ objectPosition: '50% 30%' }}
                        draggable={false}
                      />
                    </span>
                    <span className="w-full truncate text-center text-base font-semibold text-gray-700">{ex.name}</span>
                    <span className="w-full truncate text-center text-sm text-gray-400">
                      {ex.price === 0 ? '무료' : formatWon(ex.price)}
                    </span>
                  </button>
                )
              })}
            </ShopScrollRow>
          ) : activeTab.who && activeTab.characterPart === 'hair' ? (
            <ShopScrollRow key={activeTab.key}>
              {HAIR_OPTIONS[activeTab.who].map((hair) => {
                const who = activeTab.who!
                const curHair = characters[who]?.hairId ?? DEFAULT_HAIR_ID
                const curHairColor = findHairColor(characters[who]?.hairColorId ?? DEFAULT_HAIR_COLOR_ID)
                const hasPreviewHairColor = curHairColor?.id !== DEFAULT_HAIR_COLOR_ID
                const previewBaseStyle =
                  hasPreviewHairColor && !hair.maskImage
                    ? { objectPosition: '50% 20%', filter: curHairColor?.filter }
                    : { objectPosition: '50% 20%' }
                const previewMaskStyle = {
                  objectPosition: '50% 20%',
                  filter: curHairColor?.filter,
                  WebkitMaskImage: hair.maskImage ? `url(${hair.maskImage})` : undefined,
                  maskImage: hair.maskImage ? `url(${hair.maskImage})` : undefined,
                  WebkitMaskSize: '100% 100%',
                  maskSize: '100% 100%',
                  WebkitMaskRepeat: 'no-repeat',
                  maskRepeat: 'no-repeat',
                }
                const isCur = hair.id === curHair
                const delta = hair.price - hairPrice(who, curHair)
                const affordable = budget === null || spent + delta <= budget
                return (
                  <button
                    key={hair.id}
                    onClick={() => {
                      if (!setCharacterHair(who, hair.id)) warn('예산을 초과해서 바꿀 수 없어요.')
                    }}
                    disabled={!affordable && !isCur}
                    className={`flex w-24 shrink-0 select-none flex-col items-center gap-1 rounded-xl border-2 p-1.5 active:bg-brand-50 disabled:opacity-40 ${
                      isCur ? 'border-brand-500 bg-brand-50' : 'border-brand-100'
                    }`}
                  >
                    <span className="relative flex h-16 w-16 items-center justify-center overflow-hidden rounded-lg bg-brand-50 text-sm font-bold text-brand-300">
                      {hair.image ? (
                        <>
                          <img
                            src={hair.image}
                            alt={hair.name}
                            className="h-full w-full object-cover"
                            style={previewBaseStyle}
                            draggable={false}
                          />
                          {hasPreviewHairColor && hair.maskImage && (
                            <img
                              src={hair.image}
                              alt=""
                              className="absolute inset-0 h-full w-full object-cover"
                              style={previewMaskStyle}
                              draggable={false}
                            />
                          )}
                        </>
                      ) : (
                        '없음'
                      )}
                    </span>
                    <span className="w-full truncate text-center text-base font-semibold text-gray-700">{hair.name}</span>
                    <span className="w-full truncate text-center text-sm text-gray-400">
                      {hair.price === 0 ? '무료' : formatWon(hair.price)}
                    </span>
                  </button>
                )
              })}
            </ShopScrollRow>
          ) : activeTab.who && activeTab.characterPart === 'hairColor' ? (
            <ShopScrollRow key={activeTab.key}>
              {HAIR_COLOR_OPTIONS.map((color) => {
                const who = activeTab.who!
                const curColor = characters[who]?.hairColorId ?? DEFAULT_HAIR_COLOR_ID
                const isCur = color.id === curColor
                const delta = color.price - hairColorPrice(curColor)
                const affordable = budget === null || spent + delta <= budget
                return (
                  <button
                    key={color.id}
                    onClick={() => {
                      if (!setCharacterHairColor(who, color.id)) warn('예산을 초과해서 바꿀 수 없어요.')
                    }}
                    disabled={!affordable && !isCur}
                    className={`flex w-24 shrink-0 select-none flex-col items-center gap-1 rounded-xl border-2 p-1.5 active:bg-brand-50 disabled:opacity-40 ${
                      isCur ? 'border-brand-500 bg-brand-50' : 'border-brand-100'
                    }`}
                  >
                    <span className="flex h-16 w-16 items-center justify-center rounded-lg bg-brand-50">
                      <span
                        className="h-11 w-11 rounded-full border border-white shadow-inner"
                        style={{ backgroundColor: color.swatch }}
                      />
                    </span>
                    <span className="w-full truncate text-center text-base font-semibold text-gray-700">{color.name}</span>
                    <span className="w-full truncate text-center text-sm text-gray-400">
                      {color.price === 0 ? '무료' : formatWon(color.price)}
                    </span>
                  </button>
                )
              })}
            </ShopScrollRow>
          ) : activeTab.who && activeTab.characterPart === 'outfit' ? (
            <ShopScrollRow key={activeTab.key}>
              {OUTFIT_OPTIONS[activeTab.who].map((outfit) => {
                const who = activeTab.who!
                const curOutfit = characters[who]?.outfitId ?? DEFAULT_OUTFIT_ID
                const isCur = outfit.id === curOutfit
                const delta = outfit.price - outfitPrice(who, curOutfit)
                const affordable = budget === null || spent + delta <= budget
                return (
                  <button
                    key={outfit.id}
                    onClick={() => {
                      if (!setCharacterOutfit(who, outfit.id)) warn('예산을 초과해서 바꿀 수 없어요.')
                    }}
                    disabled={!affordable && !isCur}
                    className={`flex w-24 shrink-0 select-none flex-col items-center gap-1 rounded-xl border-2 p-1.5 active:bg-brand-50 disabled:opacity-40 ${
                      isCur ? 'border-brand-500 bg-brand-50' : 'border-brand-100'
                    }`}
                  >
                    <span className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-lg bg-brand-50">
                      <img
                        src={outfit.image}
                        alt={outfit.name}
                        className="h-full w-full object-cover"
                        style={{ objectPosition: '50% 55%' }}
                        draggable={false}
                      />
                    </span>
                    <span className="w-full truncate text-center text-base font-semibold text-gray-700">{outfit.name}</span>
                    <span className="w-full truncate text-center text-sm text-gray-400">
                      {outfit.price === 0 ? '무료' : formatWon(outfit.price)}
                    </span>
                  </button>
                )
              })}
            </ShopScrollRow>
          ) : (
            // 배치 아이템 탭
            <ShopScrollRow key={activeTab.key}>
              {activeTab.itemCat === 'background' && activeBackgroundPart === 'solid' && (
                <button
                  type="button"
                  aria-pressed={canvasBackgroundId === null}
                  onClick={() => setCanvasBackground(null)}
                  className={`flex w-28 shrink-0 select-none flex-col items-center gap-1 rounded-xl border-2 p-1.5 active:bg-brand-50 ${
                    canvasBackgroundId === null
                      ? 'border-brand-500 bg-brand-50'
                      : 'border-brand-100'
                  }`}
                >
                  <span className="h-16 w-16 rounded-lg border-2 border-gray-200 bg-white" />
                  <span className="w-full truncate text-center text-base font-semibold text-gray-700">
                    흰색 배경
                  </span>
                  <span className="w-full truncate text-center text-sm text-gray-400">무료</span>
                </button>
              )}
              {visibleItems.map((item) => {
                const isBg = item.category === 'background'
                const delta = isBg ? item.price - backgroundPrice : item.price
                const affordable = budget === null || spent + delta <= budget
                const selected = isBg && item.id === canvasBackgroundId
                const recommendation = recommendationById.get(item.id)
                return (
                  <button
                    key={item.id}
                    onClick={() => handleTapItem(item)}
                    disabled={!affordable}
                    className={`flex w-28 shrink-0 select-none flex-col items-center gap-1 rounded-xl border-2 p-1.5 active:bg-brand-50 disabled:opacity-40 ${
                      selected ? 'border-brand-500 bg-brand-50' : 'border-brand-100'
                    }`}
                  >
                    {item.image ? (
                      <span className="relative h-16 w-16">
                        <img
                          src={item.image}
                          alt={item.name}
                          className={`h-16 w-16 rounded-lg ${isBg ? 'object-cover' : 'object-contain'}`}
                          draggable={false}
                        />
                        {recommendation && (
                          <span className="absolute left-1 top-1 rounded bg-brand-500 px-1.5 py-0.5 text-xs font-black text-white">
                            추천
                          </span>
                        )}
                      </span>
                    ) : item.renderStyle === 'weddingPhrase' ? (
                      <WeddingPhrase
                        text={item.text ?? ''}
                        color={item.thumbnail}
                        className="h-16 w-16"
                      />
                    ) : item.renderStyle === 'letterShapeBalloon' ? (
                      <LetterShapeBalloon
                        letter={item.text ?? ''}
                        color={item.thumbnail}
                        className="h-16 w-16"
                      />
                    ) : (
                      <span
                        className="h-16 w-16"
                        style={{
                          backgroundColor: item.thumbnail,
                          borderRadius: item.shape === 'circle' ? '9999px' : '8px',
                        }}
                      />
                    )}
                    <span className="w-full truncate text-center text-base font-semibold text-gray-700">{item.name}</span>
                    <span
                      className={`w-full truncate text-center text-sm ${
                        recommendation ? 'font-bold text-brand-500' : 'text-gray-400'
                      }`}
                    >
                      {item.price === 0 ? '무료' : formatWon(item.price)}
                    </span>
                  </button>
                )
              })}
            </ShopScrollRow>
          )}
        </div>

        <Button onClick={() => setStage('frameConfirm')} className="w-full">
          완성하기
        </Button>
      </div>
    </StageLayout>
  )
}

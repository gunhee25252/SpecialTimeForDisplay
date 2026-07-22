import { useRef, useState, useCallback, useLayoutEffect } from 'react'
import { useAppStore } from '../store/useAppStore'
import { ITEMS, findItem, type BackgroundGroup, type DecorItem, type ItemCategory } from '../data/items'
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

// 상점 탭: 실제 배치 아이템(itemCat) 또는 인물 표정(who) 중 하나.
interface ShopTab {
  key: string
  label: string
  itemCat?: ItemCategory
  who?: CharacterKey
  characterPart?: 'face' | 'hair' | 'hairColor' | 'outfit'
}
type CharacterPart = NonNullable<ShopTab['characterPart']>
type ObjectPart = Exclude<ItemCategory, 'background'>

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

const OBJECT_PART_TABS: { key: ObjectPart; label: string }[] = [
  { key: 'object', label: '오브제' },
  { key: 'sticker', label: '스티커' },
  { key: 'text', label: '문구' },
]

const BACKGROUND_PART_TABS: { key: BackgroundGroup; label: string }[] = [
  { key: 'indoor', label: '실내' },
  { key: 'outdoor', label: '야외' },
]

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

// 5) decorate — 신랑·신부 고정 배치 + 배경/표정/아이템 꾸미기.
export default function Decorate() {
  const placedItems = useAppStore((s) => s.placedItems)
  const spent = useAppStore((s) => s.spent)
  const budget = useAppStore((s) => s.budget)
  const placeItem = useAppStore((s) => s.placeItem)
  const moveItem = useAppStore((s) => s.moveItem)
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
  const setStage = useAppStore((s) => s.setStage)

  const [activeMainTabKey, setActiveMainTabKey] = useState<string>(MAIN_TABS[0].key)
  const [activeBackgroundPart, setActiveBackgroundPart] = useState<BackgroundGroup>('indoor')
  const [activeCharacterParts, setActiveCharacterParts] = useState<Record<CharacterKey, CharacterPart>>({
    groom: 'hair',
    bride: 'hair',
  })
  const [activeObjectPart, setActiveObjectPart] = useState<ObjectPart>('object')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [selectedChar, setSelectedChar] = useState<CharacterKey | null>(null)
  const [warning, setWarning] = useState<string | null>(null)

  const canvasRef = useRef<HTMLDivElement>(null)
  const dragRef = useRef<{ kind: 'item' | 'char'; key: string; offsetX: number; offsetY: number } | null>(null)

  const remaining = budget === null ? null : budget - spent
  const background = canvasBackgroundId ? findItem(canvasBackgroundId) : undefined
  const activeMainTab = MAIN_TABS.find((t) => t.key === activeMainTabKey) ?? MAIN_TABS[0]
  const activeCharacterPart = activeMainTab.who ? activeCharacterParts[activeMainTab.who] : 'hair'
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
          label: OBJECT_PART_TABS.find((t) => t.key === activeObjectPart)?.label ?? '',
          itemCat: activeObjectPart,
        }
      : activeMainTab

  // 진입 시 인물 기본 위치 초기화(신랑 왼쪽·신부 오른쪽, 하단 중앙).
  useLayoutEffect(() => {
    const el = canvasRef.current
    if (!el) return
    const cw = el.offsetWidth
    const ch = el.offsetHeight
    const charW = cw * FIGURE_W_RATIO
    const charH = charW * FIGURE_H_OVER_W
    const y = ch - charH - cw * 0.03
    const gap = cw * 0.04
    const startX = cw / 2 - (charW * 2 + gap) / 2
    const chars = useAppStore.getState().characters
    if (chars.groom.x === null) moveCharacter('groom', startX, y)
    if (chars.bride.x === null) moveCharacter('bride', startX + charW + gap, y)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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
      setCanvasBackground(item.id)
      return
    }
    const el = canvasRef.current
    const cw = el?.offsetWidth ?? 600
    const ch = el?.offsetHeight ?? 800
    const jitter = (placedItems.length % 5) * 24
    const x = cw / 2 - item.defaultWidth / 2 + jitter
    const y = ch / 2 - item.defaultHeight / 2 + jitter
    const instanceId = placeItem(item.id, x, y)
    if (!instanceId) {
      warn('예산을 초과해서 배치할 수 없어요.')
      return
    }
    setSelectedId(instanceId)
    setSelectedChar(null)
  }

  const handleMainTabClick = (tab: ShopTab) => {
    setActiveMainTabKey(tab.key)
  }

  const handleCharacterPartClick = (who: CharacterKey, part: CharacterPart) => {
    setActiveCharacterParts((prev) => ({ ...prev, [who]: part }))
  }

  const handlePointerDownItem = (e: React.PointerEvent, instanceId: string, px: number, py: number) => {
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
    e.stopPropagation()
    setSelectedChar(who)
    setSelectedId(null)
    bringCharacterToFront(who)
    const { x, y } = toCanvasCoords(e.clientX, e.clientY)
    dragRef.current = { kind: 'char', key: who, offsetX: x - px, offsetY: y - py }
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
  }

  const handlePointerMove = (e: React.PointerEvent) => {
    const drag = dragRef.current
    if (!drag) return
    const { x, y } = toCanvasCoords(e.clientX, e.clientY)
    if (drag.kind === 'item') moveItem(drag.key, x - drag.offsetX, y - drag.offsetY)
    else moveCharacter(drag.key as CharacterKey, x - drag.offsetX, y - drag.offsetY)
  }

  const handlePointerUp = () => {
    dragRef.current = null
  }

  return (
    <StageLayout>
      <div className="flex h-full flex-col gap-4">
        {/* 예산 바 */}
        <div className="rounded-2xl bg-white px-5 py-4 shadow-sm">
          <div className="flex items-center justify-between text-lg">
            <span className="text-gray-500">예산 {budget === null ? '-' : formatWon(budget)}</span>
            <span className="text-gray-500">
              사용 <span className="font-bold text-brand-500">{formatWon(spent)}</span>
            </span>
            <span className={`font-semibold ${remaining !== null && remaining < 0 ? 'text-red-500' : 'text-emerald-600'}`}>
              남음 {remaining === null ? '-' : formatWon(Math.max(0, remaining))}
            </span>
          </div>
          {warning && <p className="mt-2 text-center text-red-500">{warning}</p>}
        </div>

        {/* 캔버스 */}
        <div
          ref={canvasRef}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerDown={() => {
            setSelectedId(null)
            setSelectedChar(null)
          }}
          className="relative flex-1 overflow-hidden rounded-2xl border-2 border-brand-100 bg-[repeating-linear-gradient(45deg,#fafafa,#fafafa_12px,#f4f4f5_12px,#f4f4f5_24px)]"
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
            return (
              <div
                key={p.instanceId}
                onPointerDown={(e) => handlePointerDownItem(e, p.instanceId, p.x, p.y)}
                className={`absolute flex items-center justify-center text-center text-xs text-white/90 ${
                  isSelected ? 'ring-4 ring-brand-400' : ''
                }`}
                style={{
                  left: p.x,
                  top: p.y,
                  width: item.defaultWidth,
                  height: item.defaultHeight,
                  zIndex: p.z,
                  backgroundColor: item.image ? 'transparent' : item.thumbnail,
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
                ) : (
                  <span className="pointer-events-none px-1">{item.name}</span>
                )}
                {isSelected && (
                  <button
                    onPointerDown={(e) => {
                      e.stopPropagation()
                      removeItem(p.instanceId)
                      setSelectedId(null)
                    }}
                    className="absolute -right-3 -top-3 flex h-9 w-9 items-center justify-center rounded-full bg-red-500 text-base font-bold text-white shadow"
                  >
                    ✕
                  </button>
                )}
              </div>
            )
          })}
        </div>

        {/* 상점 */}
        <div className="rounded-2xl bg-white p-3 shadow-sm">
          {/* 카테고리 탭 */}
          <div className="mb-2 grid grid-cols-4 gap-2">
            {MAIN_TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => handleMainTabClick(t)}
                className={`select-none rounded-xl py-2 text-base font-medium ${
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
                    className={`select-none rounded-md py-1.5 text-sm font-semibold transition ${
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
              <div className="grid w-full grid-cols-3 gap-1">
                {OBJECT_PART_TABS.map((t) => (
                  <button
                    key={t.key}
                    onClick={() => setActiveObjectPart(t.key)}
                    className={`select-none rounded-md py-1.5 text-sm font-semibold transition ${
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
              <div className="grid w-full grid-cols-2 gap-1">
                {BACKGROUND_PART_TABS.map((t) => (
                  <button
                    key={t.key}
                    onClick={() => setActiveBackgroundPart(t.key)}
                    className={`select-none rounded-md py-1.5 text-sm font-semibold transition ${
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
                    className={`flex w-24 shrink-0 select-none flex-col items-center gap-1 rounded-xl border-2 p-2 active:bg-brand-50 disabled:opacity-40 ${
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
                    <span className="w-full truncate text-center text-sm text-gray-700">{ex.name}</span>
                    <span className="w-full truncate text-center text-xs text-gray-400">
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
                    className={`flex w-24 shrink-0 select-none flex-col items-center gap-1 rounded-xl border-2 p-2 active:bg-brand-50 disabled:opacity-40 ${
                      isCur ? 'border-brand-500 bg-brand-50' : 'border-brand-100'
                    }`}
                  >
                    <span className="relative flex h-16 w-16 items-center justify-center overflow-hidden rounded-lg bg-brand-50 text-xs font-bold text-brand-300">
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
                    <span className="w-full truncate text-center text-sm text-gray-700">{hair.name}</span>
                    <span className="w-full truncate text-center text-xs text-gray-400">
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
                    className={`flex w-24 shrink-0 select-none flex-col items-center gap-1 rounded-xl border-2 p-2 active:bg-brand-50 disabled:opacity-40 ${
                      isCur ? 'border-brand-500 bg-brand-50' : 'border-brand-100'
                    }`}
                  >
                    <span className="flex h-16 w-16 items-center justify-center rounded-lg bg-brand-50">
                      <span
                        className="h-11 w-11 rounded-full border border-white shadow-inner"
                        style={{ backgroundColor: color.swatch }}
                      />
                    </span>
                    <span className="w-full truncate text-center text-sm text-gray-700">{color.name}</span>
                    <span className="w-full truncate text-center text-xs text-gray-400">
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
                    className={`flex w-24 shrink-0 select-none flex-col items-center gap-1 rounded-xl border-2 p-2 active:bg-brand-50 disabled:opacity-40 ${
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
                    <span className="w-full truncate text-center text-sm text-gray-700">{outfit.name}</span>
                    <span className="w-full truncate text-center text-xs text-gray-400">
                      {outfit.price === 0 ? '무료' : formatWon(outfit.price)}
                    </span>
                  </button>
                )
              })}
            </ShopScrollRow>
          ) : (
            // 배치 아이템 탭
            <ShopScrollRow key={activeTab.key}>
              {ITEMS.filter((i) =>
                i.category === activeTab.itemCat &&
                (i.category !== 'background' || i.backgroundGroup === activeBackgroundPart),
              ).map((item) => {
                const isBg = item.category === 'background'
                const affordable = isBg || budget === null || spent + item.price <= budget
                const selected = isBg && item.id === canvasBackgroundId
                return (
                  <button
                    key={item.id}
                    onClick={() => handleTapItem(item)}
                    disabled={!affordable}
                    className={`flex w-28 shrink-0 select-none flex-col items-center gap-1 rounded-xl border-2 p-2 active:bg-brand-50 disabled:opacity-40 ${
                      selected ? 'border-brand-500 bg-brand-50' : 'border-brand-100'
                    }`}
                  >
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.name}
                        className={`h-16 w-16 rounded-lg ${isBg ? 'object-cover' : 'object-contain'}`}
                        draggable={false}
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
                    <span className="w-full truncate text-center text-sm text-gray-700">{item.name}</span>
                    <span className="w-full truncate text-center text-xs text-gray-400">
                      {item.price === 0 ? '무료' : formatWon(item.price)}
                    </span>
                  </button>
                )
              })}
            </ShopScrollRow>
          )}
        </div>

        <Button onClick={() => setStage('complete')} className="w-full">
          완성하기
        </Button>
      </div>
    </StageLayout>
  )
}

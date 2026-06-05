import { useRef, useState, useCallback } from 'react'
import { useAppStore } from '../store/useAppStore'
import { ITEMS, ITEM_CATEGORIES, findItem, type ItemCategory } from '../data/items'
import StageLayout from '../components/StageLayout'
import Button from '../components/Button'
import { formatWon } from '../utils/format'

// 5) decorate — 캔버스 + 아이템 상점. 배치/이동/삭제, 예산 한도 반영.
export default function Decorate() {
  const placedItems = useAppStore((s) => s.placedItems)
  const spent = useAppStore((s) => s.spent)
  const budget = useAppStore((s) => s.budget)
  const placeItem = useAppStore((s) => s.placeItem)
  const moveItem = useAppStore((s) => s.moveItem)
  const removeItem = useAppStore((s) => s.removeItem)
  const setStage = useAppStore((s) => s.setStage)

  const [activeCategory, setActiveCategory] = useState<ItemCategory>(ITEM_CATEGORIES[0].key)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [warning, setWarning] = useState<string | null>(null)

  const canvasRef = useRef<HTMLDivElement>(null)
  // 드래그 상태: 어떤 인스턴스를, 잡은 지점 기준 offset 만큼.
  const dragRef = useRef<{ instanceId: string; offsetX: number; offsetY: number } | null>(null)

  const remaining = budget === null ? null : budget - spent

  // 캔버스 transform:scale을 고려해 화면 좌표 → 캔버스 내부 좌표로 변환.
  const toCanvasCoords = useCallback((clientX: number, clientY: number) => {
    const el = canvasRef.current
    if (!el) return { x: 0, y: 0 }
    const rect = el.getBoundingClientRect()
    const scale = rect.width / el.offsetWidth || 1
    return {
      x: (clientX - rect.left) / scale,
      y: (clientY - rect.top) / scale,
    }
  }, [])

  // 상점 아이템 탭 → 캔버스 중앙 부근에 배치(겹침 방지용 약간의 오프셋).
  const handleAddItem = (itemId: string) => {
    const item = findItem(itemId)
    if (!item) return
    const el = canvasRef.current
    const cw = el?.offsetWidth ?? 600
    const ch = el?.offsetHeight ?? 800
    const jitter = (placedItems.length % 5) * 24
    const x = cw / 2 - item.defaultWidth / 2 + jitter
    const y = ch / 2 - item.defaultHeight / 2 + jitter
    const ok = placeItem(itemId, x, y)
    if (!ok) {
      setWarning('예산을 초과해서 배치할 수 없어요.')
      window.setTimeout(() => setWarning(null), 1800)
    }
  }

  const handlePointerDownItem = (e: React.PointerEvent, instanceId: string, px: number, py: number) => {
    e.stopPropagation()
    setSelectedId(instanceId)
    const { x, y } = toCanvasCoords(e.clientX, e.clientY)
    dragRef.current = { instanceId, offsetX: x - px, offsetY: y - py }
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
  }

  const handlePointerMove = (e: React.PointerEvent) => {
    const drag = dragRef.current
    if (!drag) return
    const { x, y } = toCanvasCoords(e.clientX, e.clientY)
    moveItem(drag.instanceId, x - drag.offsetX, y - drag.offsetY)
  }

  const handlePointerUp = () => {
    dragRef.current = null
  }

  const visibleItems = ITEMS.filter((i) => i.category === activeCategory)

  return (
    <StageLayout>
      <div className="flex h-full flex-col gap-4">
        {/* 예산 바 */}
        <div className="rounded-2xl bg-white px-5 py-4 shadow-sm">
          <div className="flex items-center justify-between text-lg">
            <span className="text-gray-500">
              예산 {budget === null ? '-' : formatWon(budget)}
            </span>
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
          onPointerDown={() => setSelectedId(null)}
          className="relative flex-1 overflow-hidden rounded-2xl border-2 border-brand-100 bg-[repeating-linear-gradient(45deg,#fafafa,#fafafa_12px,#f4f4f5_12px,#f4f4f5_24px)]"
        >
          {placedItems.length === 0 && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-xl text-gray-300">
              아래에서 아이템을 골라 배치해보세요
            </div>
          )}
          {placedItems.map((p) => {
            const item = findItem(p.itemId)
            if (!item) return null
            const isSelected = p.instanceId === selectedId
            return (
              <div
                key={p.instanceId}
                onPointerDown={(e) => handlePointerDownItem(e, p.instanceId, p.x, p.y)}
                className={`absolute flex items-center justify-center text-center text-xs text-white/90 shadow ${
                  isSelected ? 'ring-4 ring-brand-400' : ''
                }`}
                style={{
                  left: p.x,
                  top: p.y,
                  width: item.defaultWidth,
                  height: item.defaultHeight,
                  zIndex: p.z,
                  backgroundColor: item.thumbnail,
                  borderRadius: item.shape === 'circle' ? '9999px' : '12px',
                  touchAction: 'none',
                }}
              >
                <span className="pointer-events-none px-1">{item.name}</span>
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

        {/* 상점: 카테고리 탭 + 아이템 목록 */}
        <div className="rounded-2xl bg-white p-3 shadow-sm">
          <div className="mb-3 flex gap-2">
            {ITEM_CATEGORIES.map((c) => (
              <button
                key={c.key}
                onClick={() => setActiveCategory(c.key)}
                className={`flex-1 select-none rounded-xl py-2 text-lg font-medium ${
                  c.key === activeCategory ? 'bg-brand-500 text-white' : 'bg-brand-50 text-brand-500'
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
          <div className="flex gap-3 overflow-x-auto pb-1">
            {visibleItems.map((item) => {
              const affordable = budget === null || spent + item.price <= budget
              return (
                <button
                  key={item.id}
                  onClick={() => handleAddItem(item.id)}
                  disabled={!affordable}
                  className="flex w-28 shrink-0 select-none flex-col items-center gap-1 rounded-xl border border-brand-100 p-2 active:bg-brand-50 disabled:opacity-40"
                >
                  <span
                    className="h-16 w-16"
                    style={{
                      backgroundColor: item.thumbnail,
                      borderRadius: item.shape === 'circle' ? '9999px' : '8px',
                    }}
                  />
                  <span className="text-sm text-gray-700">{item.name}</span>
                  <span className="text-xs text-gray-400">{formatWon(item.price)}</span>
                </button>
              )
            })}
          </div>
        </div>

        <Button onClick={() => setStage('complete')} className="w-full">
          완성하기
        </Button>
      </div>
    </StageLayout>
  )
}

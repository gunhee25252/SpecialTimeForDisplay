// 꾸미기 아이템 카탈로그. decorate 화면의 상점/캔버스가 이 목록을 쓴다.
// Phase 1: 색 블록/도형 더미. thumbnail은 색상값(placeholder), 나중에 이미지 경로로 교체.
export type ItemCategory = 'background' | 'object' | 'sticker' | 'text'

export interface DecorItem {
  id: string
  category: ItemCategory
  name: string
  price: number // 원
  thumbnail: string // Phase 1: CSS 색상값. Phase 2: 이미지 경로
  // 캔버스 배치 시 기본 크기(px, 캔버스 좌표 기준)
  defaultWidth: number
  defaultHeight: number
  shape?: 'rect' | 'circle' // Phase 1 도형 placeholder
}

export const ITEM_CATEGORIES: { key: ItemCategory; label: string }[] = [
  { key: 'background', label: '배경' },
  { key: 'object', label: '오브제' },
  { key: 'sticker', label: '스티커' },
  { key: 'text', label: '문구' },
]

export const ITEMS: DecorItem[] = [
  { id: 'bg-pink', category: 'background', name: '핑크 배경', price: 1_000_000, thumbnail: '#f9c6d3', defaultWidth: 240, defaultHeight: 320, shape: 'rect' },
  { id: 'bg-blue', category: 'background', name: '블루 배경', price: 1_000_000, thumbnail: '#bcd5f2', defaultWidth: 240, defaultHeight: 320, shape: 'rect' },
  { id: 'bg-mono', category: 'background', name: '모노 배경', price: 1_500_000, thumbnail: '#d4d4d4', defaultWidth: 240, defaultHeight: 320, shape: 'rect' },

  { id: 'obj-arch', category: 'object', name: '아치 오브제', price: 3_000_000, thumbnail: '#e7c8a0', defaultWidth: 160, defaultHeight: 160, shape: 'rect' },
  { id: 'obj-table', category: 'object', name: '테이블', price: 2_500_000, thumbnail: '#c9a27a', defaultWidth: 180, defaultHeight: 120, shape: 'rect' },

  { id: 'st-flower', category: 'sticker', name: '꽃 스티커', price: 800_000, thumbnail: '#f2a9c4', defaultWidth: 100, defaultHeight: 100, shape: 'circle' },
  { id: 'st-ring', category: 'sticker', name: '링 스티커', price: 1_200_000, thumbnail: '#e9d27a', defaultWidth: 90, defaultHeight: 90, shape: 'circle' },
  { id: 'st-heart', category: 'sticker', name: '하트 스티커', price: 600_000, thumbnail: '#f08a8a', defaultWidth: 90, defaultHeight: 90, shape: 'circle' },

  { id: 'tx-justmarried', category: 'text', name: 'JUST MARRIED', price: 500_000, thumbnail: '#333333', defaultWidth: 200, defaultHeight: 60, shape: 'rect' },
  { id: 'tx-date', category: 'text', name: '날짜 문구', price: 400_000, thumbnail: '#555555', defaultWidth: 160, defaultHeight: 60, shape: 'rect' },
]

export function findItem(id: string): DecorItem | undefined {
  return ITEMS.find((i) => i.id === id)
}

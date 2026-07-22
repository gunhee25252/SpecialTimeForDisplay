import { assetUrl } from '../utils/asset'

// 꾸미기 배경 이미지(3종). 전부 decorate 전용.
const BG_IMAGES = {
  chapel: assetUrl('images/backgrounds/chapel.png'),
  garden: assetUrl('images/backgrounds/garden.png'),
  ballroom: assetUrl('images/backgrounds/ballroom.png'),
  bg01: assetUrl('images/backgrounds/bg01.png'),
  bg02: assetUrl('images/backgrounds/bg02.png'),
}

const PROP_IMAGES = {
  prop00: assetUrl('images/props/prop00.png'),
}

// 꾸미기 아이템 카탈로그. decorate 화면의 상점/캔버스가 이 목록을 쓴다.
// thumbnail: 이미지가 없을 때 쓰는 CSS 색상값. image: 있으면 실제 이미지로 렌더.
export type ItemCategory = 'background' | 'object' | 'sticker' | 'text'
export type BackgroundGroup = 'indoor' | 'outdoor'

export interface DecorItem {
  id: string
  category: ItemCategory
  name: string
  price: number // 원 (배경은 무료)
  thumbnail: string // 이미지 없을 때의 색상 블록
  image?: string // 실제 이미지 경로(있으면 우선)
  // 캔버스 배치 시 기본 크기(px, 캔버스 좌표 기준)
  defaultWidth: number
  defaultHeight: number
  shape?: 'rect' | 'circle'
  backgroundGroup?: BackgroundGroup
}

export const ITEM_CATEGORIES: { key: ItemCategory; label: string }[] = [
  { key: 'background', label: '배경' },
  { key: 'object', label: '오브제' },
  { key: 'sticker', label: '스티커' },
  { key: 'text', label: '문구' },
]

export const ITEMS: DecorItem[] = [
  // 배경(무료) — 탭하면 캔버스 배경으로 설정. 크기는 캔버스 전체를 덮는다.
  { id: 'bg-chapel', category: 'background', name: '실내 채플', price: 0, thumbnail: '#f6ecd9', image: BG_IMAGES.chapel, defaultWidth: 1080, defaultHeight: 1920, backgroundGroup: 'indoor' },
  { id: 'bg-garden', category: 'background', name: '야외 가든', price: 0, thumbnail: '#bfe3a8', image: BG_IMAGES.garden, defaultWidth: 1080, defaultHeight: 1920, backgroundGroup: 'outdoor' },
  { id: 'bg-ballroom', category: 'background', name: '보라 볼룸', price: 0, thumbnail: '#d9c7ee', image: BG_IMAGES.ballroom, defaultWidth: 1080, defaultHeight: 1920, backgroundGroup: 'indoor' },
  { id: 'bg-01', category: 'background', name: '야외 웨딩', price: 0, thumbnail: '#ead9ca', image: BG_IMAGES.bg01, defaultWidth: 1080, defaultHeight: 1920, backgroundGroup: 'outdoor' },
  { id: 'bg-02', category: 'background', name: '실내 웨딩', price: 0, thumbnail: '#d5d8e6', image: BG_IMAGES.bg02, defaultWidth: 1080, defaultHeight: 1920, backgroundGroup: 'indoor' },

  // 오브제/스티커/문구 — Phase 1 더미(색 블록/도형)
  { id: 'prop00', category: 'object', name: '오브제 1', price: 1_000_000, thumbnail: '#e7c8a0', image: PROP_IMAGES.prop00, defaultWidth: 202, defaultHeight: 286, shape: 'rect' },
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

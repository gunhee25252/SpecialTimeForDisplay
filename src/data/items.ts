import { assetUrl } from '../utils/asset'

// 꾸미기 배경 이미지. 전부 decorate 전용.
const BG_IMAGES = {
  chapel: assetUrl('images/backgrounds/chapel.png'),
  garden: assetUrl('images/backgrounds/garden.png'),
  ballroom: assetUrl('images/backgrounds/ballroom.png'),
  bg01: assetUrl('images/backgrounds/bg01.png'),
  bg02: assetUrl('images/backgrounds/bg02.png'),
  type01: assetUrl('images/backgrounds/bg-type01.png'),
  type02: assetUrl('images/backgrounds/bg-type02.png'),
  type03: assetUrl('images/backgrounds/bg-type03.png'),
  type04: assetUrl('images/backgrounds/bg-type04.png'),
  type05: assetUrl('images/backgrounds/bg-type05.png'),
  type06: assetUrl('images/backgrounds/bg-type06.png'),
  type07: assetUrl('images/backgrounds/bg-type07.png'),
  type08: assetUrl('images/backgrounds/bg-type08.png'),
  type09: assetUrl('images/backgrounds/bg-type09.png'),
  type10: assetUrl('images/backgrounds/bg-type10.png'),
  type11: assetUrl('images/backgrounds/bg-type11.png'),
  type12: assetUrl('images/backgrounds/bg-type12.png'),
  type13: assetUrl('images/backgrounds/bg-type13.png'),
  type14: assetUrl('images/backgrounds/bg-type14.png'),
  type15: assetUrl('images/backgrounds/bg-type15.png'),
  type16: assetUrl('images/backgrounds/bg-type16.png'),
}

const PROP_IMAGES = {
  prop00: assetUrl('images/props/prop00.png'),
  prop01: assetUrl('images/props/prop01.png'),
  prop02: assetUrl('images/props/prop02.png'),
  prop03: assetUrl('images/props/prop03.png'),
  prop04: assetUrl('images/props/prop04.png'),
}

// 꾸미기 아이템 카탈로그. decorate 화면의 상점/캔버스가 이 목록을 쓴다.
// thumbnail: 이미지가 없을 때 쓰는 CSS 색상값. image: 있으면 실제 이미지로 렌더.
export type ItemCategory = 'background' | 'object' | 'sticker' | 'text'
export type BackgroundGroup = 'indoor' | 'outdoor'

export interface DecorItem {
  id: string
  category: ItemCategory
  name: string
  price: number // 원
  thumbnail: string // 이미지 없을 때의 색상 블록
  image?: string // 실제 이미지 경로(있으면 우선)
  // 캔버스 배치 시 기본 크기(px, 캔버스 좌표 기준)
  defaultWidth: number
  defaultHeight: number
  shape?: 'rect' | 'circle'
  backgroundGroup?: BackgroundGroup
  tasteCode?: string
}

export const ITEM_CATEGORIES: { key: ItemCategory; label: string }[] = [
  { key: 'background', label: '배경' },
  { key: 'object', label: '오브제' },
  { key: 'sticker', label: '스티커' },
  { key: 'text', label: '문구' },
]

export const ITEMS: DecorItem[] = [
  // 배경 — 탭하면 차액을 정산하고 캔버스 전체 배경으로 설정한다.
  { id: 'bg-chapel', category: 'background', name: '실내 채플', price: 6_000_000, thumbnail: '#f6ecd9', image: BG_IMAGES.chapel, defaultWidth: 1080, defaultHeight: 1620, backgroundGroup: 'indoor' },
  { id: 'bg-garden', category: 'background', name: '야외 가든', price: 5_000_000, thumbnail: '#bfe3a8', image: BG_IMAGES.garden, defaultWidth: 1080, defaultHeight: 1620, backgroundGroup: 'outdoor' },
  { id: 'bg-ballroom', category: 'background', name: '보라 볼룸', price: 10_000_000, thumbnail: '#d9c7ee', image: BG_IMAGES.ballroom, defaultWidth: 1080, defaultHeight: 1620, backgroundGroup: 'indoor' },
  { id: 'bg-01', category: 'background', name: '야외 웨딩', price: 7_000_000, thumbnail: '#ead9ca', image: BG_IMAGES.bg01, defaultWidth: 1080, defaultHeight: 1620, backgroundGroup: 'outdoor' },
  { id: 'bg-02', category: 'background', name: '실내 웨딩', price: 6_000_000, thumbnail: '#d5d8e6', image: BG_IMAGES.bg02, defaultWidth: 1080, defaultHeight: 1620, backgroundGroup: 'indoor' },
  { id: 'bg-type01', category: 'background', name: '펄 채플', price: 8_000_000, thumbnail: '#eeeae3', image: BG_IMAGES.type01, defaultWidth: 1080, defaultHeight: 1620, backgroundGroup: 'indoor', tasteCode: 'IN-LIGHT-FANCY-MONO' },
  { id: 'bg-type02', category: 'background', name: '파스텔 채플', price: 9_000_000, thumbnail: '#efb6cb', image: BG_IMAGES.type02, defaultWidth: 1080, defaultHeight: 1620, backgroundGroup: 'indoor', tasteCode: 'IN-LIGHT-FANCY-CHROMA' },
  { id: 'bg-type03', category: 'background', name: '클린 스튜디오', price: 2_000_000, thumbnail: '#ececeb', image: BG_IMAGES.type03, defaultWidth: 1080, defaultHeight: 1620, backgroundGroup: 'indoor', tasteCode: 'IN-LIGHT-SIMPLE-MONO' },
  { id: 'bg-type04', category: 'background', name: '민트 채플', price: 7_000_000, thumbnail: '#bcd9c8', image: BG_IMAGES.type04, defaultWidth: 1080, defaultHeight: 1620, backgroundGroup: 'indoor', tasteCode: 'IN-LIGHT-SIMPLE-CHROMA' },
  { id: 'bg-type05', category: 'background', name: '실버 볼룸', price: 12_000_000, thumbnail: '#343238', image: BG_IMAGES.type05, defaultWidth: 1080, defaultHeight: 1620, backgroundGroup: 'indoor', tasteCode: 'IN-DARK-FANCY-MONO' },
  { id: 'bg-type06', category: 'background', name: '주얼 볼룸', price: 15_000_000, thumbnail: '#6f205f', image: BG_IMAGES.type06, defaultWidth: 1080, defaultHeight: 1620, backgroundGroup: 'indoor', tasteCode: 'IN-DARK-FANCY-CHROMA' },
  { id: 'bg-type07', category: 'background', name: '다크 갤러리', price: 4_000_000, thumbnail: '#292832', image: BG_IMAGES.type07, defaultWidth: 1080, defaultHeight: 1620, backgroundGroup: 'indoor', tasteCode: 'IN-DARK-SIMPLE-MONO' },
  { id: 'bg-type08', category: 'background', name: '틸 라운지', price: 5_000_000, thumbnail: '#173c54', image: BG_IMAGES.type08, defaultWidth: 1080, defaultHeight: 1620, backgroundGroup: 'indoor', tasteCode: 'IN-DARK-SIMPLE-CHROMA' },
  { id: 'bg-type09', category: 'background', name: '화이트 가든', price: 6_000_000, thumbnail: '#e6e4dc', image: BG_IMAGES.type09, defaultWidth: 1080, defaultHeight: 1620, backgroundGroup: 'outdoor', tasteCode: 'OUT-LIGHT-FANCY-MONO' },
  { id: 'bg-type10', category: 'background', name: '컬러 메도우', price: 7_000_000, thumbnail: '#e19aa3', image: BG_IMAGES.type10, defaultWidth: 1080, defaultHeight: 1620, backgroundGroup: 'outdoor', tasteCode: 'OUT-LIGHT-FANCY-CHROMA' },
  { id: 'bg-type11', category: 'background', name: '오션 테라스', price: 9_000_000, thumbnail: '#cddce4', image: BG_IMAGES.type11, defaultWidth: 1080, defaultHeight: 1620, backgroundGroup: 'outdoor', tasteCode: 'OUT-LIGHT-SIMPLE-MONO' },
  { id: 'bg-type12', category: 'background', name: '레이크 가든', price: 8_000_000, thumbnail: '#8ed7b2', image: BG_IMAGES.type12, defaultWidth: 1080, defaultHeight: 1620, backgroundGroup: 'outdoor', tasteCode: 'OUT-LIGHT-SIMPLE-CHROMA' },
  { id: 'bg-type13', category: 'background', name: '달빛 가든', price: 10_000_000, thumbnail: '#393b3d', image: BG_IMAGES.type13, defaultWidth: 1080, defaultHeight: 1620, backgroundGroup: 'outdoor', tasteCode: 'OUT-DARK-FANCY-MONO' },
  { id: 'bg-type14', category: 'background', name: '오로라 가든', price: 14_000_000, thumbnail: '#315f9d', image: BG_IMAGES.type14, defaultWidth: 1080, defaultHeight: 1620, backgroundGroup: 'outdoor', tasteCode: 'OUT-DARK-FANCY-CHROMA' },
  { id: 'bg-type15', category: 'background', name: '달빛 클리프', price: 12_000_000, thumbnail: '#505966', image: BG_IMAGES.type15, defaultWidth: 1080, defaultHeight: 1620, backgroundGroup: 'outdoor', tasteCode: 'OUT-DARK-SIMPLE-MONO' },
  { id: 'bg-type16', category: 'background', name: '노을 비치', price: 10_000_000, thumbnail: '#705396', image: BG_IMAGES.type16, defaultWidth: 1080, defaultHeight: 1620, backgroundGroup: 'outdoor', tasteCode: 'OUT-DARK-SIMPLE-CHROMA' },

  // 오브제/스티커/문구 — Phase 1 더미(색 블록/도형)
  { id: 'prop00', category: 'object', name: '로즈 3단 케이크', price: 1_000_000, thumbnail: '#e7c8a0', image: PROP_IMAGES.prop00, defaultWidth: 202, defaultHeight: 286, shape: 'rect' },
  { id: 'prop01', category: 'object', name: '핑크 하트 케이크', price: 1_000_000, thumbnail: '#e7c8a0', image: PROP_IMAGES.prop01, defaultWidth: 186, defaultHeight: 246, shape: 'rect' },
  { id: 'prop02', category: 'object', name: '라벤더 하트 케이크', price: 1_000_000, thumbnail: '#e7c8a0', image: PROP_IMAGES.prop02, defaultWidth: 187, defaultHeight: 249, shape: 'rect' },
  { id: 'prop03', category: 'object', name: '세이지 하트 케이크', price: 1_000_000, thumbnail: '#e7c8a0', image: PROP_IMAGES.prop03, defaultWidth: 186, defaultHeight: 251, shape: 'rect' },
  { id: 'prop04', category: 'object', name: '블루 하트 케이크', price: 1_000_000, thumbnail: '#e7c8a0', image: PROP_IMAGES.prop04, defaultWidth: 195, defaultHeight: 260, shape: 'rect' },
  { id: 'obj-arch', category: 'object', name: '아치', price: 3_000_000, thumbnail: '#e7c8a0', defaultWidth: 160, defaultHeight: 160, shape: 'rect' },
  { id: 'obj-table', category: 'object', name: '테이블', price: 2_500_000, thumbnail: '#c9a27a', defaultWidth: 180, defaultHeight: 120, shape: 'rect' },

  { id: 'st-flower', category: 'sticker', name: '꽃', price: 800_000, thumbnail: '#f2a9c4', defaultWidth: 100, defaultHeight: 100, shape: 'circle' },
  { id: 'st-ring', category: 'sticker', name: '링', price: 1_200_000, thumbnail: '#e9d27a', defaultWidth: 90, defaultHeight: 90, shape: 'circle' },
  { id: 'st-heart', category: 'sticker', name: '하트', price: 600_000, thumbnail: '#f08a8a', defaultWidth: 90, defaultHeight: 90, shape: 'circle' },

  { id: 'tx-justmarried', category: 'text', name: 'JUST MARRIED', price: 500_000, thumbnail: '#333333', defaultWidth: 200, defaultHeight: 60, shape: 'rect' },
  { id: 'tx-date', category: 'text', name: '날짜', price: 400_000, thumbnail: '#555555', defaultWidth: 160, defaultHeight: 60, shape: 'rect' },
]

export function findItem(id: string): DecorItem | undefined {
  return ITEMS.find((i) => i.id === id)
}

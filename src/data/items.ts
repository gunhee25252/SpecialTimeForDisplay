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
  prop05: assetUrl('images/props/prop05.png'),
  prop06: assetUrl('images/props/prop06.png'),
  prop07: assetUrl('images/props/prop07.png'),
  prop08: assetUrl('images/props/prop08.png'),
  prop09: assetUrl('images/props/prop09.png'),
  prop10: assetUrl('images/props/prop10.png'),
  prop11: assetUrl('images/props/prop11.png'),
  prop12: assetUrl('images/props/prop12.png'),
  prop13: assetUrl('images/props/prop13.png'),
  prop14: assetUrl('images/props/prop14.png'),
  prop15: assetUrl('images/props/prop15.png'),
  prop16: assetUrl('images/props/prop16.png'),
  prop17: assetUrl('images/props/prop17.png'),
}

const STICKER_IMAGES = {
  sticker00: assetUrl('images/stickers/sticker00.png'),
  sticker01: assetUrl('images/stickers/sticker01.png'),
  sticker02: assetUrl('images/stickers/sticker02.png'),
  sticker03: assetUrl('images/stickers/sticker03.png'),
  sticker04: assetUrl('images/stickers/sticker04.png'),
  sticker05: assetUrl('images/stickers/sticker05.png'),
  sticker06: assetUrl('images/stickers/sticker06.png'),
  sticker07: assetUrl('images/stickers/sticker07.png'),
  sticker08: assetUrl('images/stickers/sticker08.png'),
  sticker09: assetUrl('images/stickers/sticker09.png'),
  sticker10: assetUrl('images/stickers/sticker10.png'),
  sticker11: assetUrl('images/stickers/sticker11.png'),
  sticker12: assetUrl('images/stickers/sticker12.png'),
  sticker13: assetUrl('images/stickers/sticker13.png'),
  sticker14: assetUrl('images/stickers/sticker14.png'),
  sticker15: assetUrl('images/stickers/sticker15.png'),
  sticker16: assetUrl('images/stickers/sticker16.png'),
}

// 꾸미기 아이템 카탈로그. decorate 화면의 상점/캔버스가 이 목록을 쓴다.
// thumbnail: 이미지가 없을 때 쓰는 CSS 색상값. image: 있으면 실제 이미지로 렌더.
export type ItemCategory = 'background' | 'object' | 'sticker' | 'text'
export type BackgroundGroup = 'indoor' | 'outdoor' | 'solid'
export type ObjectShopGroup =
  | 'props'
  | 'stickers'
  | 'presetText'
  | 'letterBalloons'

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
  renderStyle?: 'weddingPhrase' | 'letterShapeBalloon'
  text?: string
  objectGroup?: ObjectShopGroup
  backgroundGroup?: BackgroundGroup
  tasteCode?: string
}

export function getWeddingPhraseFontRatio(text: string): number {
  const visualUnits = Array.from(text).reduce((sum, character) => {
    if (/\s/.test(character)) return sum + 0.35
    if (/[A-Za-z0-9]/.test(character)) return sum + 0.45
    if (character === '&') return sum + 0.65
    const codePoint = character.codePointAt(0) ?? 0
    if (codePoint >= 0xac00 && codePoint <= 0xd7a3) return sum + 0.72
    return sum + 0.55
  }, 0)

  const maximumRatio = visualUnits <= 2.5 ? 0.15 : 0.11
  return Math.min(maximumRatio, 0.44 / Math.max(1, visualUnits))
}

export const ITEM_CATEGORIES: { key: ItemCategory; label: string }[] = [
  { key: 'background', label: '배경' },
  { key: 'object', label: '오브제' },
  { key: 'sticker', label: '스티커' },
  { key: 'text', label: '문구' },
]

const LETTER_BALLOON_COLORS = [
  '#ef6f9a',
  '#f08a6b',
  '#d9ad3f',
  '#55ad92',
  '#5b93df',
  '#9676d1',
]

const LETTER_SHAPE_BALLOONS: DecorItem[] = Array.from({ length: 26 }, (_, index) => {
  const letter = String.fromCharCode(65 + index)
  return {
    id: `tx-letter-balloon-${letter.toLowerCase()}`,
    category: 'text',
    name: `${letter} 글자 풍선`,
    price: 200_000,
    thumbnail: LETTER_BALLOON_COLORS[index % LETTER_BALLOON_COLORS.length],
    defaultWidth: 108,
    defaultHeight: 108,
    shape: 'rect',
    renderStyle: 'letterShapeBalloon',
    text: letter,
    objectGroup: 'letterBalloons',
  }
})

const WEDDING_PHRASE_DEFINITIONS = [
  { id: 'i-do', text: 'I DO', price: 200_000, color: '#d95f8d' },
  { id: 'we-do', text: 'WE DO', price: 200_000, color: '#4f86c6' },
  { id: 'you-and-me', text: 'YOU & ME', price: 300_000, color: '#8b6bb1' },
  { id: 'mr-and-mrs', text: 'MR & MRS', price: 300_000, color: '#4d8f7a' },
  { id: 'just-married', text: 'JUST MARRIED', price: 400_000, color: '#cf647c' },
  { id: 'our-wedding-day', text: 'OUR WEDDING DAY', price: 400_000, color: '#6675b8' },
  { id: 'save-the-date', text: 'SAVE THE DATE', price: 500_000, color: '#a87832' },
  { id: 'best-day-ever', text: 'BEST DAY EVER', price: 500_000, color: '#b05779' },
  { id: 'love-always', text: 'LOVE ALWAYS', price: 500_000, color: '#367f87' },
  { id: 'together-forever', text: 'TOGETHER FOREVER', price: 600_000, color: '#7a63a6' },
  { id: 'happily-ever-after', text: 'HAPPILY EVER AFTER', price: 600_000, color: '#b36d3b' },
  { id: 'forever-starts-here', text: 'FOREVER STARTS HERE', price: 700_000, color: '#486f9f' },
  { id: 'we-are-getting-married', text: '우리 결혼해요', price: 400_000, color: '#d95f8d' },
  { id: 'we-are-married', text: '결혼합니다', price: 400_000, color: '#4f86c6' },
  { id: 'from-today-forever', text: '오늘부터 평생', price: 500_000, color: '#8b6bb1' },
  { id: 'together-for-life', text: '평생 함께할게요', price: 500_000, color: '#4d8f7a' },
  { id: 'happy-together', text: '함께라서 행복해', price: 500_000, color: '#cf647c' },
  { id: 'happily-for-a-long-time', text: '오래오래 행복하게', price: 600_000, color: '#6675b8' },
] as const

const WEDDING_PHRASES: DecorItem[] = WEDDING_PHRASE_DEFINITIONS.map(
  ({ id, text, price, color }) => ({
    id: `tx-wedding-${id}`,
    category: 'text',
    name: text,
    price,
    thumbnail: color,
    defaultWidth: text.length <= 5 ? 180 : text.length <= 12 ? 240 : 300,
    defaultHeight: 90,
    shape: 'rect',
    renderStyle: 'weddingPhrase',
    text,
    objectGroup: 'presetText',
  }),
)

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

  // 단색 배경: 이미지 없이 색상값을 캔버스와 인쇄물에 직접 사용한다.
  { id: 'bg-solid-ivory', category: 'background', name: '아이보리', price: 0, thumbnail: '#fff6e8', defaultWidth: 1080, defaultHeight: 1620, backgroundGroup: 'solid' },
  { id: 'bg-solid-blush', category: 'background', name: '블러시 핑크', price: 0, thumbnail: '#f7dce5', defaultWidth: 1080, defaultHeight: 1620, backgroundGroup: 'solid' },
  { id: 'bg-solid-butter', category: 'background', name: '버터 옐로', price: 0, thumbnail: '#f7e7ae', defaultWidth: 1080, defaultHeight: 1620, backgroundGroup: 'solid' },
  { id: 'bg-solid-sage', category: 'background', name: '세이지', price: 0, thumbnail: '#cedbc8', defaultWidth: 1080, defaultHeight: 1620, backgroundGroup: 'solid' },
  { id: 'bg-solid-mint', category: 'background', name: '민트', price: 0, thumbnail: '#c9e7df', defaultWidth: 1080, defaultHeight: 1620, backgroundGroup: 'solid' },
  { id: 'bg-solid-sky', category: 'background', name: '스카이 블루', price: 0, thumbnail: '#cddff2', defaultWidth: 1080, defaultHeight: 1620, backgroundGroup: 'solid' },
  { id: 'bg-solid-lavender', category: 'background', name: '라벤더', price: 0, thumbnail: '#ddd3ef', defaultWidth: 1080, defaultHeight: 1620, backgroundGroup: 'solid' },
  { id: 'bg-solid-warm-gray', category: 'background', name: '웜 그레이', price: 0, thumbnail: '#d7d3cf', defaultWidth: 1080, defaultHeight: 1620, backgroundGroup: 'solid' },
  { id: 'bg-solid-charcoal', category: 'background', name: '차콜', price: 0, thumbnail: '#464851', defaultWidth: 1080, defaultHeight: 1620, backgroundGroup: 'solid' },
  { id: 'bg-solid-navy', category: 'background', name: '딥 네이비', price: 0, thumbnail: '#293852', defaultWidth: 1080, defaultHeight: 1620, backgroundGroup: 'solid' },
  { id: 'bg-solid-burgundy', category: 'background', name: '버건디', price: 0, thumbnail: '#713d4a', defaultWidth: 1080, defaultHeight: 1620, backgroundGroup: 'solid' },

  // 오브제: 공간에 실제로 놓이는 물건. 가격 오름차순으로 표시한다.
  { id: 'prop17', category: 'object', name: '동그리 안경', price: 500_000, thumbnail: '#2e2b31', image: PROP_IMAGES.prop17, defaultWidth: 170, defaultHeight: 65, shape: 'rect', objectGroup: 'props' },
  { id: 'prop06', category: 'object', name: '촛대 세트', price: 500_000, thumbnail: '#e8b94b', image: PROP_IMAGES.prop06, defaultWidth: 145, defaultHeight: 243, shape: 'rect', objectGroup: 'props' },
  { id: 'prop05', category: 'object', name: '장미 화병', price: 1_000_000, thumbnail: '#e999a4', image: PROP_IMAGES.prop05, defaultWidth: 180, defaultHeight: 214, shape: 'rect', objectGroup: 'props' },
  { id: 'prop01', category: 'object', name: '핑크 하트 케이크', price: 2_000_000, thumbnail: '#e7c8a0', image: PROP_IMAGES.prop01, defaultWidth: 186, defaultHeight: 246, shape: 'rect', objectGroup: 'props' },
  { id: 'prop02', category: 'object', name: '라벤더 하트 케이크', price: 3_000_000, thumbnail: '#e7c8a0', image: PROP_IMAGES.prop02, defaultWidth: 187, defaultHeight: 249, shape: 'rect', objectGroup: 'props' },
  { id: 'prop03', category: 'object', name: '세이지 하트 케이크', price: 4_000_000, thumbnail: '#e7c8a0', image: PROP_IMAGES.prop03, defaultWidth: 186, defaultHeight: 251, shape: 'rect', objectGroup: 'props' },
  { id: 'prop04', category: 'object', name: '블루 하트 케이크', price: 5_000_000, thumbnail: '#e7c8a0', image: PROP_IMAGES.prop04, defaultWidth: 195, defaultHeight: 260, shape: 'rect', objectGroup: 'props' },
  { id: 'prop00', category: 'object', name: '로즈 3단 케이크', price: 7_000_000, thumbnail: '#e7c8a0', image: PROP_IMAGES.prop00, defaultWidth: 202, defaultHeight: 286, shape: 'rect', objectGroup: 'props' },
  { id: 'prop08', category: 'object', name: '웰컴 보드', price: 10_000_000, thumbnail: '#e7c8a0', image: PROP_IMAGES.prop08, defaultWidth: 240, defaultHeight: 416, shape: 'rect', objectGroup: 'props' },
  { id: 'prop09', category: 'object', name: '하트 풍선', price: 15_000_000, thumbnail: '#edb3c3', image: PROP_IMAGES.prop09, defaultWidth: 260, defaultHeight: 433, shape: 'rect', objectGroup: 'props' },
  { id: 'prop07', category: 'object', name: '샴페인 테이블', price: 20_000_000, thumbnail: '#ead6ad', image: PROP_IMAGES.prop07, defaultWidth: 250, defaultHeight: 274, shape: 'rect', objectGroup: 'props' },
  { id: 'prop10', category: 'object', name: '웨딩 소파', price: 30_000_000, thumbnail: '#edb4ba', image: PROP_IMAGES.prop10, defaultWidth: 450, defaultHeight: 340, shape: 'rect', objectGroup: 'props' },
  { id: 'prop11', category: 'object', name: '플라워 아치', price: 40_000_000, thumbnail: '#e899a4', image: PROP_IMAGES.prop11, defaultWidth: 650, defaultHeight: 769, shape: 'rect', objectGroup: 'props' },
  { id: 'prop16', category: 'object', name: '로열 플라워 아치', price: 50_000_000, thumbnail: '#edb1b8', image: PROP_IMAGES.prop16, defaultWidth: 760, defaultHeight: 806, shape: 'rect', objectGroup: 'props' },
  { id: 'prop12', category: 'object', name: '샴페인 타워', price: 60_000_000, thumbnail: '#e8c675', image: PROP_IMAGES.prop12, defaultWidth: 300, defaultHeight: 460, shape: 'rect', objectGroup: 'props' },
  { id: 'prop13', category: 'object', name: '그랜드 피아노', price: 70_000_000, thumbnail: '#e8d2a8', image: PROP_IMAGES.prop13, defaultWidth: 500, defaultHeight: 520, shape: 'rect', objectGroup: 'props' },
  { id: 'prop14', category: 'object', name: '크리스털 분수', price: 100_000_000, thumbnail: '#9edee4', image: PROP_IMAGES.prop14, defaultWidth: 430, defaultHeight: 500, shape: 'rect', objectGroup: 'props' },
  { id: 'prop15', category: 'object', name: '클래식 웨딩카', price: 100_000_000, thumbnail: '#e8c98e', image: PROP_IMAGES.prop15, defaultWidth: 660, defaultHeight: 400, shape: 'rect', objectGroup: 'props' },

  // 스티커: 공간과 무관하게 사진 위에 붙이는 평면 장식.
  { id: 'sticker00', category: 'sticker', name: '핑크 하트', price: 200_000, thumbnail: '#f5a6b5', image: STICKER_IMAGES.sticker00, defaultWidth: 120, defaultHeight: 107, shape: 'rect', objectGroup: 'stickers' },
  { id: 'sticker01', category: 'sticker', name: '장미 꽃잎', price: 200_000, thumbnail: '#ef9b9b', image: STICKER_IMAGES.sticker01, defaultWidth: 120, defaultHeight: 105, shape: 'rect', objectGroup: 'stickers' },
  { id: 'sticker02', category: 'sticker', name: '별빛', price: 300_000, thumbnail: '#f6ca57', image: STICKER_IMAGES.sticker02, defaultWidth: 120, defaultHeight: 109, shape: 'rect', objectGroup: 'stickers' },
  { id: 'sticker03', category: 'sticker', name: '구름', price: 300_000, thumbnail: '#f4ead7', image: STICKER_IMAGES.sticker03, defaultWidth: 140, defaultHeight: 111, shape: 'rect', objectGroup: 'stickers' },
  { id: 'sticker04', category: 'sticker', name: '핑크 리본', price: 400_000, thumbnail: '#f4b7c1', image: STICKER_IMAGES.sticker04, defaultWidth: 140, defaultHeight: 135, shape: 'rect', objectGroup: 'stickers' },
  { id: 'sticker05', category: 'sticker', name: '파스텔 무지개', price: 400_000, thumbnail: '#e6b8de', image: STICKER_IMAGES.sticker05, defaultWidth: 140, defaultHeight: 103, shape: 'rect', objectGroup: 'stickers' },
  { id: 'sticker06', category: 'sticker', name: '하트 편지', price: 500_000, thumbnail: '#f1dfbd', image: STICKER_IMAGES.sticker06, defaultWidth: 140, defaultHeight: 112, shape: 'rect', objectGroup: 'stickers' },
  { id: 'sticker07', category: 'sticker', name: '데이지', price: 500_000, thumbnail: '#f5dc76', image: STICKER_IMAGES.sticker07, defaultWidth: 140, defaultHeight: 128, shape: 'rect', objectGroup: 'stickers' },
  { id: 'sticker08', category: 'sticker', name: '달과 별', price: 600_000, thumbnail: '#f5d867', image: STICKER_IMAGES.sticker08, defaultWidth: 125, defaultHeight: 131, shape: 'rect', objectGroup: 'stickers' },
  { id: 'sticker09', category: 'sticker', name: '리본 선물', price: 600_000, thumbnail: '#efbdba', image: STICKER_IMAGES.sticker09, defaultWidth: 120, defaultHeight: 132, shape: 'rect', objectGroup: 'stickers' },
  { id: 'sticker10', category: 'sticker', name: '장미 부케', price: 700_000, thumbnail: '#e9959f', image: STICKER_IMAGES.sticker10, defaultWidth: 135, defaultHeight: 147, shape: 'rect', objectGroup: 'stickers' },
  { id: 'sticker11', category: 'sticker', name: '꽃 리스', price: 800_000, thumbnail: '#edb5ac', image: STICKER_IMAGES.sticker11, defaultWidth: 145, defaultHeight: 146, shape: 'rect', objectGroup: 'stickers' },
  { id: 'sticker12', category: 'sticker', name: '축배', price: 800_000, thumbnail: '#edcb77', image: STICKER_IMAGES.sticker12, defaultWidth: 145, defaultHeight: 128, shape: 'rect', objectGroup: 'stickers' },
  { id: 'sticker13', category: 'sticker', name: '웨딩 벨', price: 900_000, thumbnail: '#e9bd4c', image: STICKER_IMAGES.sticker13, defaultWidth: 140, defaultHeight: 114, shape: 'rect', objectGroup: 'stickers' },
  { id: 'sticker14', category: 'sticker', name: '선물 상자', price: 900_000, thumbnail: '#efb4bb', image: STICKER_IMAGES.sticker14, defaultWidth: 140, defaultHeight: 176, shape: 'rect', objectGroup: 'stickers' },
  { id: 'sticker15', category: 'sticker', name: '웨딩 카메라', price: 1_000_000, thumbnail: '#ead8b8', image: STICKER_IMAGES.sticker15, defaultWidth: 145, defaultHeight: 135, shape: 'rect', objectGroup: 'stickers' },
  { id: 'sticker16', category: 'sticker', name: '웨딩 링', price: 1_200_000, thumbnail: '#dfa12c', image: STICKER_IMAGES.sticker16, defaultWidth: 150, defaultHeight: 106, shape: 'rect', objectGroup: 'stickers' },

  // 문구 — 자주 쓰이는 웨딩 사인과 글자 자체가 풍선인 버전을 제공한다.
  ...WEDDING_PHRASES,
  ...LETTER_SHAPE_BALLOONS,
]

export function findItem(id: string): DecorItem | undefined {
  return ITEMS.find((i) => i.id === id)
}

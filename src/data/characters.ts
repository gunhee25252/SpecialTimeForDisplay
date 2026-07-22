import { assetUrl } from '../utils/asset'

// 캐릭터 공통 파츠. 모든 파츠/표정/헤어는 동일한 1000×1400 프레임의 투명 PNG라 그대로 겹치면 정렬된다.
export const CHARACTER_HEAD = assetUrl('images/characters/head.png')
export const CHARACTER_BODY = assetUrl('images/characters/body.png')

export interface FaceExpr {
  id: string
  name: string
  image: string
  price: number // 원 (기본 표정은 0)
}

export interface HairOption {
  id: string
  name: string
  image: string | null
  maskImage?: string | null
  price: number
}

export interface HairColorOption {
  id: string
  name: string
  swatch: string
  filter: string
  price: number
}

export interface OutfitOption {
  id: string
  name: string
  image: string
  price: number
}

// 표정 목록. 새 표정은 characters/expr/에 넣고 여기에 한 줄 추가.
export const FACE_EXPRESSIONS: FaceExpr[] = [
  { id: 'face00', name: '기본', image: assetUrl('images/characters/expr/face00.png'), price: 0 },
  { id: 'face01', name: '뾰로통', image: assetUrl('images/characters/expr/face01.png'), price: 500_000 },
  { id: 'face02', name: '엉엉', image: assetUrl('images/characters/expr/face02.png'), price: 500_000 },
  { id: 'face03', name: '부끄', image: assetUrl('images/characters/expr/face03.png'), price: 500_000 },
  { id: 'face04', name: '새침', image: assetUrl('images/characters/expr/face04.png'), price: 500_000 },
  { id: 'face05', name: '윙크', image: assetUrl('images/characters/expr/face05.png'), price: 500_000 },
  { id: 'face06', name: '시무룩', image: assetUrl('images/characters/expr/face06.png'), price: 500_000 },
  { id: 'face07', name: '반짝', image: assetUrl('images/characters/expr/face07.png'), price: 500_000 },
  { id: 'face08', name: '하트', image: assetUrl('images/characters/expr/face08.png'), price: 500_000 },
  { id: 'face09', name: '뿌듯', image: assetUrl('images/characters/expr/face09.png'), price: 500_000 },
  { id: 'face10', name: '기대', image: assetUrl('images/characters/expr/face10.png'), price: 500_000 },
  { id: 'face11', name: '활짝', image: assetUrl('images/characters/expr/face11.png'), price: 500_000 },
  { id: 'face12', name: '콕', image: assetUrl('images/characters/expr/face12.png'), price: 500_000 },
]

// 기본(base) 상태의 표정.
export const DEFAULT_EXPR_ID = 'face00'

export const DEFAULT_HAIR_ID = 'none'
export const DEFAULT_HAIR_COLOR_ID = 'natural'
export const DEFAULT_OUTFIT_ID = 'body'
const HAIR_PRICE = 500_000
const HAIR_COLOR_PRICE = 500_000
const OUTFIT_PRICE = 1_000_000

const GROOM_HAIR_IDS = [
  'man_hair_00',
  'man_hair_01',
  'man_hair_02',
  'man_hair_03',
  'man_hair_04',
  'man_hair_05',
  'man_hair_06',
  'man_hair_07',
  'man_hair_08',
  'man_hair_09',
  'man_hair_10',
  'man_hair_12',
  'man_hair_13',
  'man_hair_14',
  'man_hair_15',
  'man_hair_16',
  'man_hair_17',
  'man_hair_18',
  'man_hair_19',
]

const BRIDE_HAIR_IDS = [
  'woman_hair_00',
  'woman_hair_01',
  'woman_hair_02',
  'woman_hair_03',
  'woman_hair_04',
  'woman_hair_05',
  'woman_hair_06',
  'woman_hair_07',
  'woman_hair_08',
  'woman_hair_09',
  'woman_hair_10',
  'woman_hair_11',
  'woman_hair_12',
  'woman_hair_13',
  'woman_hair_14',
  'woman_hair_15',
  'woman_hair_16',
  'woman_hair_17',
  'woman_hair_18',
  'woman_hair_19',
]

const GROOM_OUTFIT_IDS = [
  'suit00',
  'suit01',
  'suit02',
  'suit03',
  'suit04',
  'suit05',
  'suit06',
  'suit07',
  'suit08',
  'suit09',
  'suit10',
  'suit11',
]
const BRIDE_OUTFIT_IDS = [
  'dress00',
  'dress01',
  'dress02',
  'dress03',
  'dress04',
  'dress05',
  'dress06',
  'dress07',
  'dress08',
  'dress09',
]

function makeHairOption(id: string, label: string, index: number, folder?: string, hasMask = false): HairOption {
  const path = folder ? `images/characters/${folder}/${id}.png` : `images/characters/${id}.png`
  return {
    id,
    name: `${label} 헤어 ${index + 1}`,
    image: assetUrl(path),
    maskImage: hasMask ? assetUrl(path.replace('.png', '_m.png')) : null,
    price: HAIR_PRICE,
  }
}

function makeOutfitOption(id: string, label: string, index: number, folder: string): OutfitOption {
  return {
    id,
    name: `${label} ${index + 1}`,
    image: assetUrl(`images/characters/${folder}/${id}.png`),
    price: OUTFIT_PRICE,
  }
}

// 고정 등장 인물 2명(삭제/변경 불가). 몸/머리는 공유하고, 헤어와 표정만 각자.
export type CharacterKey = 'groom' | 'bride'
export const CHARACTERS: { key: CharacterKey; label: string }[] = [
  { key: 'groom', label: '신랑' },
  { key: 'bride', label: '신부' },
]

export const HAIR_OPTIONS: Record<CharacterKey, HairOption[]> = {
  groom: [
    { id: DEFAULT_HAIR_ID, name: '헤어 없음', image: null, price: 0 },
    ...GROOM_HAIR_IDS.map((id, index) => makeHairOption(id, '신랑', index, 'man_hair', true)),
  ],
  bride: [
    { id: DEFAULT_HAIR_ID, name: '헤어 없음', image: null, price: 0 },
    ...BRIDE_HAIR_IDS.map((id, index) => makeHairOption(id, '신부', index, 'woman_hair', true)),
  ],
}

export const HAIR_COLOR_OPTIONS: HairColorOption[] = [
  { id: DEFAULT_HAIR_COLOR_ID, name: '기본색', swatch: '#27211f', filter: 'none', price: 0 },
  {
    id: 'brown',
    name: '브라운',
    swatch: '#7a4a2a',
    filter: 'sepia(0.85) saturate(1.8) hue-rotate(340deg) brightness(0.82)',
    price: HAIR_COLOR_PRICE,
  },
  {
    id: 'blonde',
    name: '블론드',
    swatch: '#d8aa52',
    filter: 'sepia(1) saturate(2.4) hue-rotate(350deg) brightness(1.18)',
    price: HAIR_COLOR_PRICE,
  },
  {
    id: 'ash',
    name: '애쉬',
    swatch: '#8b9299',
    filter: 'grayscale(1) brightness(1.28) contrast(0.82)',
    price: HAIR_COLOR_PRICE,
  },
  {
    id: 'pink',
    name: '핑크',
    swatch: '#d77a9d',
    filter: 'sepia(1) saturate(2.4) hue-rotate(285deg) brightness(1.08)',
    price: HAIR_COLOR_PRICE,
  },
  {
    id: 'blue',
    name: '블루',
    swatch: '#4f80c7',
    filter: 'sepia(1) saturate(2.5) hue-rotate(175deg) brightness(0.95)',
    price: HAIR_COLOR_PRICE,
  },
  {
    id: 'choco',
    name: '초코',
    swatch: '#4a2f25',
    filter: 'sepia(0.85) saturate(1.45) hue-rotate(335deg) brightness(0.62)',
    price: HAIR_COLOR_PRICE,
  },
  {
    id: 'copper',
    name: '카퍼',
    swatch: '#b76534',
    filter: 'sepia(1) saturate(2.6) hue-rotate(330deg) brightness(1.02)',
    price: HAIR_COLOR_PRICE,
  },
  {
    id: 'wine',
    name: '와인',
    swatch: '#7c2538',
    filter: 'sepia(0.85) saturate(2.4) hue-rotate(295deg) brightness(0.72)',
    price: HAIR_COLOR_PRICE,
  },
  {
    id: 'lavender',
    name: '라벤더',
    swatch: '#a78bd6',
    filter: 'sepia(0.8) saturate(2.2) hue-rotate(215deg) brightness(1.12)',
    price: HAIR_COLOR_PRICE,
  },
  {
    id: 'mint',
    name: '민트',
    swatch: '#7fcfbc',
    filter: 'sepia(0.9) saturate(1.9) hue-rotate(115deg) brightness(1.12)',
    price: HAIR_COLOR_PRICE,
  },
  {
    id: 'navy',
    name: '네이비',
    swatch: '#28395f',
    filter: 'sepia(0.75) saturate(2.4) hue-rotate(180deg) brightness(0.62)',
    price: HAIR_COLOR_PRICE,
  },
  {
    id: 'white',
    name: '화이트',
    swatch: '#e7e2da',
    filter: 'grayscale(1) brightness(1.72) contrast(0.72)',
    price: HAIR_COLOR_PRICE,
  },
]

export const OUTFIT_OPTIONS: Record<CharacterKey, OutfitOption[]> = {
  groom: [
    { id: DEFAULT_OUTFIT_ID, name: '기본 의상', image: CHARACTER_BODY, price: 0 },
    ...GROOM_OUTFIT_IDS.map((id, index) => makeOutfitOption(id, '정장', index, 'man_clothes')),
  ],
  bride: [
    { id: DEFAULT_OUTFIT_ID, name: '기본 의상', image: CHARACTER_BODY, price: 0 },
    ...BRIDE_OUTFIT_IDS.map((id, index) => makeOutfitOption(id, '드레스', index, 'woman_clothes')),
  ],
}

export function findExpr(id: string | null | undefined): FaceExpr | undefined {
  return FACE_EXPRESSIONS.find((e) => e.id === id)
}

export function exprPrice(id: string | null | undefined): number {
  return findExpr(id)?.price ?? 0
}

export function findHair(who: CharacterKey, id: string | null | undefined): HairOption | undefined {
  return HAIR_OPTIONS[who].find((h) => h.id === id)
}

export function hairPrice(who: CharacterKey, id: string | null | undefined): number {
  return findHair(who, id)?.price ?? 0
}

export function findHairColor(id: string | null | undefined): HairColorOption | undefined {
  return HAIR_COLOR_OPTIONS.find((c) => c.id === id)
}

export function hairColorPrice(id: string | null | undefined): number {
  return findHairColor(id)?.price ?? 0
}

export function findOutfit(who: CharacterKey, id: string | null | undefined): OutfitOption | undefined {
  return OUTFIT_OPTIONS[who].find((o) => o.id === id)
}

export function outfitPrice(who: CharacterKey, id: string | null | undefined): number {
  return findOutfit(who, id)?.price ?? 0
}

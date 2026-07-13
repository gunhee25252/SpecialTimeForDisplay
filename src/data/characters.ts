import { assetUrl } from '../utils/asset'

// 캐릭터 공통 파츠. 모든 파츠/표정/헤어는 동일한 1000×1400 프레임의 투명 PNG라 그대로 겹치면 정렬된다.
export const CHARACTER_HEAD = assetUrl('images/characters/head.png')
export const CHARACTER_BODY = assetUrl('images/characters/body.png')
export const GROOM_HAIR = assetUrl('images/characters/man_hair_00.png')
export const BRIDE_HAIR = assetUrl('images/characters/woman_hair_00.png')
export const BRIDE_HAIR_01 = assetUrl('images/characters/woman_hair_01.png')
export const GROOM_SUIT = assetUrl('images/characters/suit00.png')
export const BRIDE_DRESS = assetUrl('images/characters/dress00.png')

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
export const DEFAULT_OUTFIT_ID = 'body'

// 고정 등장 인물 2명(삭제/변경 불가). 몸/머리는 공유하고, 헤어와 표정만 각자.
export type CharacterKey = 'groom' | 'bride'
export const CHARACTERS: { key: CharacterKey; label: string }[] = [
  { key: 'groom', label: '신랑' },
  { key: 'bride', label: '신부' },
]

export const HAIR_OPTIONS: Record<CharacterKey, HairOption[]> = {
  groom: [
    { id: DEFAULT_HAIR_ID, name: '헤어 없음', image: null, price: 0 },
    { id: 'man_hair_00', name: '신랑 헤어 1', image: GROOM_HAIR, price: 500_000 },
  ],
  bride: [
    { id: DEFAULT_HAIR_ID, name: '헤어 없음', image: null, price: 0 },
    { id: 'woman_hair_00', name: '신부 헤어 1', image: BRIDE_HAIR, price: 500_000 },
    { id: 'woman_hair_01', name: '신부 헤어 2', image: BRIDE_HAIR_01, price: 500_000 },
    { id: 'woman_hair_02', name: '신부 헤어 3', image: assetUrl('images/characters/woman_hair_02.png'), price: 500_000 },
    { id: 'woman_hair_03', name: '신부 헤어 4', image: assetUrl('images/characters/woman_hair_03.png'), price: 500_000 },
    { id: 'woman_hair_04', name: '신부 헤어 5', image: assetUrl('images/characters/woman_hair_04.png'), price: 500_000 },
    { id: 'woman_hair_05', name: '신부 헤어 6', image: assetUrl('images/characters/woman_hair_05.png'), price: 500_000 },
    { id: 'woman_hair_06', name: '신부 헤어 7', image: assetUrl('images/characters/woman_hair_06.png'), price: 500_000 },
    { id: 'woman_hair_07', name: '신부 헤어 8', image: assetUrl('images/characters/woman_hair_07.png'), price: 500_000 },
    { id: 'woman_hair_08', name: '신부 헤어 9', image: assetUrl('images/characters/woman_hair_08.png'), price: 500_000 },
    { id: 'woman_hair_11', name: '신부 헤어 12', image: assetUrl('images/characters/woman_hair_11.png'), price: 500_000 },
    { id: 'woman_hair_13', name: '신부 헤어 14', image: assetUrl('images/characters/woman_hair_13.png'), price: 500_000 },
    { id: 'woman_hair_17', name: '신부 헤어 18', image: assetUrl('images/characters/woman_hair_17.png'), price: 500_000 },
  ],
}

export const OUTFIT_OPTIONS: Record<CharacterKey, OutfitOption[]> = {
  groom: [
    { id: DEFAULT_OUTFIT_ID, name: '기본 의상', image: CHARACTER_BODY, price: 0 },
    { id: 'suit00', name: '정장 1', image: GROOM_SUIT, price: 1_000_000 },
  ],
  bride: [
    { id: DEFAULT_OUTFIT_ID, name: '기본 의상', image: CHARACTER_BODY, price: 0 },
    { id: 'dress00', name: '드레스 1', image: BRIDE_DRESS, price: 1_000_000 },
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

export function findOutfit(who: CharacterKey, id: string | null | undefined): OutfitOption | undefined {
  return OUTFIT_OPTIONS[who].find((o) => o.id === id)
}

export function outfitPrice(who: CharacterKey, id: string | null | undefined): number {
  return findOutfit(who, id)?.price ?? 0
}

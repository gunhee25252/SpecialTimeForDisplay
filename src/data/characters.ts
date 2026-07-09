import { assetUrl } from '../utils/asset'

// 캐릭터(공유 base 몸) + 겹쳐 그리는 표정 레이어.
// 모든 표정은 base.png와 동일한 1000×1400 프레임의 투명 PNG라 그대로 겹치면 정렬된다.
export const CHARACTER_BASE = assetUrl('images/characters/base.png')

export interface FaceExpr {
  id: string
  name: string
  image: string
  price: number // 원 (기본 표정은 0)
}

// 표정 목록. 새 표정은 characters/expr/에 넣고 여기에 한 줄 추가.
export const FACE_EXPRESSIONS: FaceExpr[] = [
  { id: 'face0', name: '기본', image: assetUrl('images/characters/expr/face0.png'), price: 0 },
  { id: 'face1', name: '뾰로통', image: assetUrl('images/characters/expr/face1.png'), price: 500_000 },
]

// 기본(base) 상태의 표정.
export const DEFAULT_EXPR_ID = 'face0'

// 고정 등장 인물 2명(삭제/변경 불가). 지금은 base 몸 공유, 표정만 각자.
export type CharacterKey = 'groom' | 'bride'
export const CHARACTERS: { key: CharacterKey; label: string }[] = [
  { key: 'groom', label: '신랑' },
  { key: 'bride', label: '신부' },
]

export function findExpr(id: string | null | undefined): FaceExpr | undefined {
  return FACE_EXPRESSIONS.find((e) => e.id === id)
}

export function exprPrice(id: string | null | undefined): number {
  return findExpr(id)?.price ?? 0
}

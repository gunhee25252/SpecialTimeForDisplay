// 16유형 데이터. code는 4개 축 극을 'space-tone-deco-color' 순서로 '-'로 이은 것.
// Phase 1: 이름/설명은 placeholder. 나중에 이 파일의 name/description만 채우면 된다.
export interface Type16 {
  typeId: string // '01' ~ '16'
  code: string // 예: 'IN-LIGHT-FANCY-CHROMA'
  name: string // 임시 이름
  description: string // 한줄 설명(임시)
}

export const TYPES_16: Type16[] = [
  { typeId: '01', code: 'IN-LIGHT-FANCY-MONO', name: '유형 01', description: '한줄 설명 (임시) — 01' },
  { typeId: '02', code: 'IN-LIGHT-FANCY-CHROMA', name: '유형 02', description: '한줄 설명 (임시) — 02' },
  { typeId: '03', code: 'IN-LIGHT-SIMPLE-MONO', name: '유형 03', description: '한줄 설명 (임시) — 03' },
  { typeId: '04', code: 'IN-LIGHT-SIMPLE-CHROMA', name: '유형 04', description: '한줄 설명 (임시) — 04' },
  { typeId: '05', code: 'IN-DARK-FANCY-MONO', name: '유형 05', description: '한줄 설명 (임시) — 05' },
  { typeId: '06', code: 'IN-DARK-FANCY-CHROMA', name: '유형 06', description: '한줄 설명 (임시) — 06' },
  { typeId: '07', code: 'IN-DARK-SIMPLE-MONO', name: '유형 07', description: '한줄 설명 (임시) — 07' },
  { typeId: '08', code: 'IN-DARK-SIMPLE-CHROMA', name: '유형 08', description: '한줄 설명 (임시) — 08' },
  { typeId: '09', code: 'OUT-LIGHT-FANCY-MONO', name: '유형 09', description: '한줄 설명 (임시) — 09' },
  { typeId: '10', code: 'OUT-LIGHT-FANCY-CHROMA', name: '유형 10', description: '한줄 설명 (임시) — 10' },
  { typeId: '11', code: 'OUT-LIGHT-SIMPLE-MONO', name: '유형 11', description: '한줄 설명 (임시) — 11' },
  { typeId: '12', code: 'OUT-LIGHT-SIMPLE-CHROMA', name: '유형 12', description: '한줄 설명 (임시) — 12' },
  { typeId: '13', code: 'OUT-DARK-FANCY-MONO', name: '유형 13', description: '한줄 설명 (임시) — 13' },
  { typeId: '14', code: 'OUT-DARK-FANCY-CHROMA', name: '유형 14', description: '한줄 설명 (임시) — 14' },
  { typeId: '15', code: 'OUT-DARK-SIMPLE-MONO', name: '유형 15', description: '한줄 설명 (임시) — 15' },
  { typeId: '16', code: 'OUT-DARK-SIMPLE-CHROMA', name: '유형 16', description: '한줄 설명 (임시) — 16' },
]

// code로 유형을 찾는 헬퍼. 없으면 undefined.
export function findTypeByCode(code: string): Type16 | undefined {
  return TYPES_16.find((t) => t.code === code)
}

// 취향 4개 축 정의. 로직(점수 누적·유형 산출)은 이 정의만 참조하므로,
// 축 이름/극 라벨을 바꿔도 store·stage 코드는 건드릴 필요가 없다.

export type AxisKey = 'space' | 'tone' | 'deco' | 'color'

// 각 축의 두 극(pole) 코드. 유형 코드는 이 pole 코드들을 '-'로 이은 것.
export type SpacePole = 'IN' | 'OUT'
export type TonePole = 'LIGHT' | 'DARK'
export type DecoPole = 'FANCY' | 'SIMPLE'
export type ColorPole = 'MONO' | 'CHROMA'
export type PoleCode = SpacePole | TonePole | DecoPole | ColorPole

export interface AxisDef {
  key: AxisKey
  label: string // 화면 표시용 축 이름
  // poles[0] = 동점 시 우선되는 극(= A극). 유형 코드 산출 순서도 이 배열 순서를 따른다.
  poles: { code: PoleCode; label: string }[]
}

// 동점 처리: 각 축 poles[0]이 우선(A극 우선 규칙). 추후 규칙 변경은 여기/store에서.
export const AXES: AxisDef[] = [
  {
    key: 'space',
    label: '공간',
    poles: [
      { code: 'IN', label: '실내' },
      { code: 'OUT', label: '야외' },
    ],
  },
  {
    key: 'tone',
    label: '톤',
    poles: [
      { code: 'LIGHT', label: '밝음' },
      { code: 'DARK', label: '어두움' },
    ],
  },
  {
    key: 'deco',
    label: '장식',
    poles: [
      { code: 'FANCY', label: '화려함' },
      { code: 'SIMPLE', label: '심플함' },
    ],
  },
  {
    key: 'color',
    label: '색감',
    poles: [
      { code: 'MONO', label: '무채색' },
      { code: 'CHROMA', label: '유채색' },
    ],
  },
]

// 극(PoleCode) → 소속 축(AxisKey) 역방향 매핑. AXES에서 자동 생성.
// weights 맵의 키(극)만 보고 어느 축 점수인지 찾을 때 사용.
export const POLE_TO_AXIS: Record<PoleCode, AxisKey> = AXES.reduce(
  (acc, axis) => {
    for (const pole of axis.poles) acc[pole.code] = axis.key
    return acc
  },
  {} as Record<PoleCode, AxisKey>,
)

// 동점 시 우선되는 극(축별 고정 순서). 추후 규칙 변경은 이 상수만 수정.
export const TIE_BREAK_POLE: Record<AxisKey, PoleCode> = {
  space: 'IN',
  tone: 'LIGHT',
  deco: 'FANCY',
  color: 'MONO',
}

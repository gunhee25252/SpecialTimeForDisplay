export type AxisKey = 'space' | 'tone' | 'deco' | 'color'

export type SpacePole = 'IN' | 'OUT'
export type TonePole = 'LIGHT' | 'DARK'
export type DecoPole = 'FANCY' | 'SIMPLE'
export type ColorPole = 'MONO' | 'CHROMA'
export type PoleCode = SpacePole | TonePole | DecoPole | ColorPole

export interface AxisDef {
  key: AxisKey
  label: string
  poles: { code: PoleCode; label: string }[]
}

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
    label: '분위기',
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

export const POLE_TO_AXIS: Record<PoleCode, AxisKey> = AXES.reduce(
  (acc, axis) => {
    for (const pole of axis.poles) acc[pole.code] = axis.key
    return acc
  },
  {} as Record<PoleCode, AxisKey>,
)

export const TIE_BREAK_POLE: Record<AxisKey, PoleCode> = {
  space: 'IN',
  tone: 'LIGHT',
  deco: 'FANCY',
  color: 'MONO',
}

import { assetUrl } from '../utils/asset'

// 효과음 파일은 public/sounds/ 에 넣고 아래 경로만 맞추면 된다.
export const SOUNDS = {
  start: assetUrl('sounds/start.mp3'), // 시작 버튼
  draw: assetUrl('sounds/draw.mp3'), // 예산 뽑기음
  fanfare: assetUrl('sounds/fanfare.mp3'), // 결과 팡파레
  shutter: assetUrl('sounds/shutter.mp3'), // 완성 셔터음
  click: assetUrl('sounds/effect/click.mp3'),
  drumRoll: assetUrl('sounds/effect/drum-roll.mp3'),
  tada: assetUrl('sounds/effect/tada.mp3'),
} as const

export const BGM_PATH = assetUrl('sounds/bgm/ribbon-heart-loop.mp3')
export const BGM_VOLUME = 0.36

export const EFFECT_VOLUMES = {
  default: 0.6,
  click: 0.54,
  drumRoll: 1,
  tada: 0.6,
} as const

export type SoundName = keyof typeof SOUNDS

// 효과음이 준비되어 있으므로 전시 기본값은 재생 상태다.
export const SOUND_DEFAULT_MUTED = false

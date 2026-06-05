// 사운드 설정. Phase 1: 파일은 placeholder(아직 없음), 기본 mute=true.
// 실제 음원은 public/sounds/ 에 넣고 아래 경로만 맞추면 된다.
export const SOUNDS = {
  start: '/sounds/start.mp3', // 시작 버튼
  draw: '/sounds/draw.mp3', // 예산 뽑기음
  fanfare: '/sounds/fanfare.mp3', // 결과 팡파레
  shutter: '/sounds/shutter.mp3', // 완성 셔터음
} as const

export type SoundName = keyof typeof SOUNDS

// 전시 기본값: 음소거. 운영 중 useSoundStore.toggleMuted()로 켤 수 있다.
export const SOUND_DEFAULT_MUTED = true

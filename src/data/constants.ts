// 전시 운영용 상수들. 연출/시간 관련 값은 전부 여기로 모은다.

// 무입력 자동 리셋 시간(ms). 전시장에서 관람객이 떠난 뒤 시작 화면으로 복귀.
export const IDLE_TIMEOUT_MS = 300_000

// 기준 키오스크 해상도 (세로 9:16). 레이아웃은 이 비율을 기준으로 맞춘다.
export const BASE_WIDTH = 1080
export const BASE_HEIGHT = 1920

// The decorate scene shares one 2:3 coordinate system from editing through print.
export const SCENE_WIDTH = 1080
export const SCENE_HEIGHT = 1620

// 예산을 남김없이 쓸수록 좋다: 남은 예산이 이 금액 이하로 내려가면 컬러로 인화하고,
// 넘게 남으면 흑백으로 인화한다.
export const COLOR_PRINT_MAX_REMAINING = 10_000_000

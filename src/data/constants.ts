// 전시 운영용 상수들. 연출/시간 관련 값은 전부 여기로 모은다.

// 무입력 자동 리셋 시간(ms). 전시장에서 관람객이 떠난 뒤 시작 화면으로 복귀.
export const IDLE_TIMEOUT_MS = 300_000

// 기준 키오스크 해상도 (세로 9:16). 레이아웃은 이 비율을 기준으로 맞춘다.
export const BASE_WIDTH = 1080
export const BASE_HEIGHT = 1920

// The decorate scene shares one 2:3 coordinate system from editing through print.
export const SCENE_WIDTH = 1080
export const SCENE_HEIGHT = 1620

// 예산 기준 흑백/컬러 인화 규칙에 쓰던 기준선. 지금은 예산과 무관하게 항상 컬러로 인화하므로
// 아무 곳에서도 쓰지 않는다. 규칙을 되살릴 때를 위해 값만 남겨 둔다.
export const COLOR_PRINT_MAX_REMAINING = 30_000_000

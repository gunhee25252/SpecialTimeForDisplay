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

// 인물 그림(1000×1400 풀프레임)에서 실제로 쓸 영역. base 실루엣에 여백을 둬서
// 표정 별·머리·드레스처럼 몸 밖으로 나가는 요소가 잘리지 않게 한다.
// 화면(Decorate)·인쇄(print)·크기 조절(store)이 같은 값을 봐야 어긋나지 않는다.
export const CHARACTER_CONTENT = { x0: 0, x1: 1, y0: 0.12, y1: 1 }

// 배율 1일 때 인물 박스의 크기(장면 좌표 px).
export const CHARACTER_FIGURE_WIDTH = SCENE_WIDTH * (400 / 1080)
export const CHARACTER_FIGURE_HEIGHT =
  CHARACTER_FIGURE_WIDTH *
  (((CHARACTER_CONTENT.y1 - CHARACTER_CONTENT.y0) * 1400) /
    ((CHARACTER_CONTENT.x1 - CHARACTER_CONTENT.x0) * 1000))

// 인물 크기 조절 범위(오브젝트와 같은 0.1 단계).
export const MIN_CHARACTER_SCALE = 0.5
export const MAX_CHARACTER_SCALE = 2

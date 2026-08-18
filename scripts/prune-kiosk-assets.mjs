// 키오스크 배포본에서 실제로 쓰이지 않는 월드컵 사진을 제거한다.
// 사용 목록은 worldcupRounds.ts에서 직접 뽑으므로 라운드 구성이 바뀌어도 그대로 맞는다.
// public/ 원본은 건드리지 않고 kiosk-package/web 안에서만 지운다.
import { readFileSync, readdirSync, rmSync, statSync } from 'node:fs'
import { join } from 'node:path'

const packageDirectory = process.argv[2]
if (!packageDirectory) {
  console.error('사용법: node scripts/prune-kiosk-assets.mjs <kiosk-package 경로>')
  process.exit(1)
}

const roundsSource = readFileSync('src/data/worldcupRounds.ts', 'utf8')
// wcImage('x.png') 형태든 file: 'x.png' 형태든, 파일명처럼 보이는 문자열을 모두 사용 중으로 본다.
// 라운드 데이터 구조가 바뀌어도 계속 동작하게 하려는 것.
const used = new Set(
  [...roundsSource.matchAll(/'([^']+\.(?:png|jpg|jpeg|webp))'/g)].map((match) => match[1]),
)

if (used.size === 0) {
  // 파싱이 깨진 채로 지우면 배포본이 망가지므로 여기서 멈춘다.
  console.error('worldcupRounds.ts에서 사용 중인 사진을 찾지 못했습니다. 삭제를 중단합니다.')
  process.exit(1)
}

const worldcupDirectory = join(packageDirectory, 'web', 'images', 'worldcup')
let removedCount = 0
let removedBytes = 0

for (const name of readdirSync(worldcupDirectory)) {
  if (used.has(name)) continue
  const file = join(worldcupDirectory, name)
  removedBytes += statSync(file).size
  rmSync(file)
  removedCount += 1
}

const keptCount = readdirSync(worldcupDirectory).length
console.log(
  `월드컵 사진 정리: ${keptCount}장 유지, ${removedCount}장 제거 (${(removedBytes / 1048576).toFixed(1)}MB)`,
)

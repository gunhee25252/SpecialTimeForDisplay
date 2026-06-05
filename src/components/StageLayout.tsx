import type { ReactNode } from 'react'
import ResetButton from './ResetButton'

// 스테이지 공통 레이아웃. 세로 화면에 맞춘 풀높이 컬럼 + 처음으로 버튼.
// showReset=false로 intro에서는 숨길 수 있다.
export default function StageLayout({
  children,
  showReset = true,
}: {
  children: ReactNode
  showReset?: boolean
}) {
  return (
    <div className="relative flex h-full w-full flex-col px-8 py-10">
      {showReset && <ResetButton />}
      {children}
    </div>
  )
}

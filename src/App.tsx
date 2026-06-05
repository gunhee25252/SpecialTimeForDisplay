import { useAppStore, type Stage } from './store/useAppStore'
import { useIdleReset } from './hooks/useIdleReset'
import KioskFrame from './components/KioskFrame'
import TransitionController from './transitions/TransitionController'
import Intro from './stages/Intro'
import WorldCup from './stages/WorldCup'
import Result from './stages/Result'
import Budget from './stages/Budget'
import Decorate from './stages/Decorate'
import Complete from './stages/Complete'

// 단일 페이지 + stage 상태로 화면 전환. 전환 연출은 TransitionController가 얹는다.
export default function App() {
  const stage = useAppStore((s) => s.stage)

  // intro에서는 자동 리셋 불필요. 그 외 스테이지에서만 무입력 타이머 동작.
  useIdleReset(stage !== 'intro')

  return (
    <KioskFrame>
      <TransitionController>{(s) => <StageView stage={s} />}</TransitionController>
    </KioskFrame>
  )
}

function StageView({ stage }: { stage: Stage }) {
  switch (stage) {
    case 'intro':
      return <Intro />
    case 'worldcup':
      return <WorldCup />
    case 'result':
      return <Result />
    case 'budget':
      return <Budget />
    case 'decorate':
      return <Decorate />
    case 'complete':
      return <Complete />
    default:
      return <Intro />
  }
}

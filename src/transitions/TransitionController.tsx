import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { AnimatePresence } from 'framer-motion'
import { useAppStore, type Stage } from '../store/useAppStore'
import { getTransitionType, type TransitionType } from './transitionType'
import StageMotion from './StageMotion'
import {
  AnalyzingOverlay,
  BloomOverlay,
  BudgetFlyOverlay,
  PlayerIntroCard,
  ShakeWrapper,
  ShutterOverlay,
  StampOverlay,
  WhiteFadeOverlay,
  WipeOverlay,
} from './TransitionOverlays'
import { fireCelebration } from './confetti'
import { TRANSITIONS } from '../config/transitions'
import { PLAYER_INTRO_AUTO_MS } from '../config/players'
import { useSound } from '../hooks/useSound'

const ms = (s: number) => s * 1000

// 전환 레이어 오케스트레이터.
// - 스토어의 stage 변화를 감지해 전환 종류를 정하고, 기본 전환/시그니처 오버레이를 얹는다.
// - 각 스테이지 내부에는 손대지 않는다. children(stage)로 받아 모션 래퍼로만 감싼다.
export default function TransitionController({
  children,
}: {
  children: (stage: Stage) => ReactNode
}) {
  const stage = useAppStore((s) => s.stage)
  const playerCount = useAppStore((s) => s.playerCount)
  const currentPlayer = useAppStore((s) => s.currentPlayer)
  const { play } = useSound()

  const prevRef = useRef<Stage | null>(null)
  const idRef = useRef(0)
  const timers = useRef<number[]>([])

  const [transition, setTransition] = useState<{ type: TransitionType; id: number }>({
    type: 'initial',
    id: 0,
  })
  const [revealed, setRevealed] = useState(true) // result는 분석중 동안 false로 대기
  const [sig, setSig] = useState<{ type: TransitionType; id: number } | null>(null)
  const [showStamp, setShowStamp] = useState(false)
  const [shake, setShake] = useState(false)
  // 둘이 모드: 플레이어 worldcup 직전 인트로 카드
  const [playerIntro, setPlayerIntro] = useState<{ player: number; id: number } | null>(null)

  const clearTimers = useCallback(() => {
    timers.current.forEach((t) => window.clearTimeout(t))
    timers.current = []
  }, [])
  const after = useCallback((s: number, fn: () => void) => {
    timers.current.push(window.setTimeout(fn, ms(s)))
  }, [])

  // 분석중 종료 → result 공개 + 컨페티 + 스탬프 + 팡파레
  const finishAnalyzing = useCallback(() => {
    clearTimers()
    setSig(null)
    setRevealed(true)
    setShowStamp(true)
    fireCelebration()
    play('fanfare')
    after(TRANSITIONS.signature.stamp.duration + 0.4, () => setShowStamp(false))
  }, [after, clearTimers, play])

  // 긴 연출 스킵(화면 탭)
  const skip = useCallback(() => {
    if (playerIntro) {
      clearTimers()
      setPlayerIntro(null)
      return
    }
    if (!sig) return
    if (sig.type === 'enterResult') {
      finishAnalyzing()
      return
    }
    clearTimers()
    setSig(null)
    setShake(false)
  }, [playerIntro, sig, finishAnalyzing, clearTimers])

  useEffect(() => {
    const prev = prevRef.current
    prevRef.current = stage
    if (prev === stage) return

    const type = getTransitionType(prev, stage)
    const id = ++idRef.current
    clearTimers()
    setTransition({ type, id })
    setShowStamp(false)
    setShake(false)
    setPlayerIntro(null)

    // 둘이 모드: worldcup 진입 시(P1·P2 공통) 플레이어 인트로 카드를 띄운다.
    if (stage === 'worldcup' && playerCount === 2) {
      setRevealed(true)
      setSig(null)
      setPlayerIntro({ player: currentPlayer, id })
      play('start')
      after(PLAYER_INTRO_AUTO_MS / 1000, () => setPlayerIntro(null))
      return
    }

    switch (type) {
      case 'enterResult':
        setRevealed(false) // 분석 끝날 때까지 result 숨김
        setSig({ type, id })
        after(TRANSITIONS.signature.analyzing.duration, finishAnalyzing)
        break
      case 'introToWorldcup':
        setRevealed(true)
        setSig({ type, id })
        play('start')
        after(TRANSITIONS.signature.bloom.duration, () => setSig(null))
        break
      case 'enterDecorate':
        setRevealed(true)
        setSig({ type, id })
        after(TRANSITIONS.signature.budgetFly.duration, () => setSig(null))
        break
      case 'decorateToComplete':
        setRevealed(true)
        setSig({ type, id })
        setShake(true)
        play('shutter')
        after(TRANSITIONS.signature.shutter.shake, () => setShake(false))
        after(TRANSITIONS.signature.shutter.flash + 0.25, () => setSig(null))
        break
      case 'reset':
        setRevealed(true)
        setSig({ type, id })
        after(TRANSITIONS.signature.reset.duration, () => setSig(null))
        break
      default:
        setRevealed(true)
        setSig(null)
    }
    // stage 변화에만 반응 (콜백들은 안정적)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage])

  // 언마운트 시 타이머 정리
  useEffect(() => () => clearTimers(), [clearTimers])

  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* 공통 와이프 (reset/최초 마운트 제외) */}
      {transition.type !== 'initial' && transition.type !== 'reset' && (
        <WipeOverlay key={`wipe-${transition.id}`} />
      )}

      {/* 스테이지 레이어 (셔터 흔들림 래퍼로 감쌈) */}
      <ShakeWrapper active={shake}>
        <AnimatePresence mode="wait" custom={transition.type} initial={false}>
          <StageMotion key={stage} type={transition.type} revealed={revealed}>
            {children(stage)}
          </StageMotion>
        </AnimatePresence>
      </ShakeWrapper>

      {/* 시그니처 오버레이 */}
      <AnimatePresence>
        {sig?.type === 'introToWorldcup' && <BloomOverlay key={`bloom-${sig.id}`} />}
        {sig?.type === 'enterResult' && <AnalyzingOverlay key={`analyze-${sig.id}`} />}
        {sig?.type === 'enterDecorate' && <BudgetFlyOverlay key={`budget-${sig.id}`} />}
        {sig?.type === 'decorateToComplete' && <ShutterOverlay key={`shutter-${sig.id}`} />}
        {sig?.type === 'reset' && <WhiteFadeOverlay key={`white-${sig.id}`} />}
      </AnimatePresence>

      {/* 스탬프 (result 공개 직후) */}
      <AnimatePresence>{showStamp && <StampOverlay key="stamp" />}</AnimatePresence>

      {/* 플레이어 인트로 카드 (둘이 모드) */}
      <AnimatePresence>
        {playerIntro && <PlayerIntroCard key={`pintro-${playerIntro.id}`} player={playerIntro.player} />}
      </AnimatePresence>

      {/* 스킵 레이어: 시그니처/인트로 연출 중 탭하면 즉시 다음으로 */}
      {(sig !== null || playerIntro !== null) && (
        <button
          aria-label="연출 건너뛰기"
          onClick={skip}
          className="absolute inset-0 z-[60] bg-transparent"
        />
      )}
    </div>
  )
}

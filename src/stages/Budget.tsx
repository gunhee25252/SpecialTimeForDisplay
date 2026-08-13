import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { useAppStore } from '../store/useAppStore'
import StageLayout from '../components/StageLayout'
import Button from '../components/Button'
import { formatWon } from '../utils/format'
import { BUDGET_DRAW, DREAM_TIER_ID } from '../config/budgetDraw'
import { fireCelebration, fireGoldBurst } from '../transitions/confetti'
import { useCountUp } from '../hooks/useCountUp'
import { budgetRollDuration, useBudgetRoll } from '../hooks/useBudgetRoll'
import PlayerIndicator from '../components/PlayerIndicator'
import { PLAYER_LABELS } from '../config/players'
import { useSound } from '../hooks/useSound'
import { EFFECT_VOLUMES } from '../config/sounds'

type Phase = 'idle' | 'spinning' | 'revealed' | 'summing'

interface Drawn {
  amount: number
  tierId: string | null
  tierLabel: string | null
}

// 4) budget — 티어 가중 추첨 + 슬롯머신 뽑기 연출. 인원/순서에 따라 흐름 분기.
export default function Budget() {
  const playerCount = useAppStore((s) => s.playerCount)
  const currentPlayer = useAppStore((s) => s.currentPlayer)
  const players = useAppStore((s) => s.players)
  const drawBudget = useAppStore((s) => s.drawBudget)
  const soloBudgetRerollUsed = useAppStore((s) => s.soloBudgetRerollUsed)
  const nextAfterBudget = useAppStore((s) => s.nextAfterBudget)
  const { play, stop } = useSound()

  const [phase, setPhase] = useState<Phase>('idle')
  const [drawn, setDrawn] = useState<Drawn | null>(null)
  const [showGold, setShowGold] = useState(false)
  const [isRerollConfirming, setIsRerollConfirming] = useState(false)
  const timerRef = useRef<number | null>(null)

  const isDuo = playerCount === 2
  const isLastPlayer = !isDuo || currentPlayer === 1
  const budgetTitle = isDuo
    ? `${PLAYER_LABELS[currentPlayer]} 예산을 뽑아볼까요?`
    : '나의 웨딩 예산은?'

  // 뽑기 롤링: 100만원대 → 1000만원대 → 1억원대 순서로 일정 박자씩 굴린다.
  const draw = useBudgetRoll(
    drawn?.amount ?? 0,
    phase === 'spinning',
    BUDGET_DRAW.rollStageDurationMs,
  )

  // 둘이 합산 카운트업(마지막 플레이어 합산 단계에서만 동작).
  const total = (players[0]?.budget ?? 0) + (players[1]?.budget ?? 0)
  const sum = useCountUp(total, BUDGET_DRAW.sumDurationMs, phase === 'summing')

  const clearTimer = () => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }
  useEffect(() => () => clearTimer(), [])
  useEffect(() => {
    clearTimer()
    stop('drumRoll')
    setPhase('idle')
    setDrawn(null)
    setShowGold(false)
    setIsRerollConfirming(false)
  }, [currentPlayer])

  const handleSettled = () => {
    clearTimer()
    stop('drumRoll')
    play('tada', { volume: EFFECT_VOLUMES.tada })
    setPhase('revealed')
    // 티어별 차등 연출: 드림 웨딩은 골드 플래시 + 컨페티.
    const p = useAppStore.getState().players[currentPlayer]
    if (p?.tierId === DREAM_TIER_ID) {
      setShowGold(true)
      fireGoldBurst()
      window.setTimeout(() => fireCelebration(), 250)
    }
  }

  const handleDraw = (reroll = false) => {
    if (!drawBudget(reroll)) return
    const p = useAppStore.getState().players[currentPlayer]
    if (!p || p.budget == null) return
    setDrawn({ amount: p.budget, tierId: p.tierId, tierLabel: p.tierLabel })
    setShowGold(false)
    setPhase('spinning')
    clearTimer()
    play('drumRoll', { loop: true, volume: EFFECT_VOLUMES.drumRoll })
    timerRef.current = window.setTimeout(
      handleSettled,
      budgetRollDuration(p.budget, BUDGET_DRAW.rollStageDurationMs),
    )
  }

  // 스핀/합산 스킵
  const skipSpin = () => {
    if (phase === 'spinning') {
      draw.skip()
      handleSettled()
    }
  }
  const skipSum = () => sum.skip()

  const isDream = drawn?.tierId === DREAM_TIER_ID

  return (
    <StageLayout>
      {/* 드림 웨딩 골드 플래시 */}
      {showGold && (
        <motion.div
          className="pointer-events-none absolute inset-0 z-40 bg-gradient-to-b from-amber-200 via-yellow-100 to-transparent"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.85, 0.15] }}
          transition={{ duration: 0.8, times: [0, 0.3, 1] }}
        />
      )}

      <div className="relative z-10 flex h-full flex-col items-center justify-center gap-10 text-center">
        {/* 헤더: (둘이) 플레이어 인디케이터 + 라벨 + 앞사람 요약 */}
        <div className="space-y-3">
          {isDuo && <PlayerIndicator />}
          <p className="font-ryuryu text-[60px] font-bold text-brand-500">{budgetTitle}</p>
          {isDuo && currentPlayer === 1 && players[0]?.budget != null && (
            <p className="text-lg text-gray-400">
              {PLAYER_LABELS[0]} 예산 · {players[0].tierLabel} {formatWon(players[0].budget)}
            </p>
          )}
        </div>

        {/* 합산 단계(둘이 마지막) */}
        {phase === 'summing' ? (
          <button onClick={skipSum} className="flex w-full flex-col items-center gap-4">
            <p className="text-2xl text-gray-500">두 사람의 예산을 합치면</p>
            <div className="flex items-end gap-3 text-2xl text-gray-400">
              <span>{formatWon(players[0]?.budget ?? 0)}</span>
              <span className="text-brand-400">+</span>
              <span>{formatWon(players[1]?.budget ?? 0)}</span>
            </div>
            <p className="text-7xl font-extrabold text-brand-600">{formatWon(sum.value)}</p>
          </button>
        ) : (
          <>
            {/* 슬롯 디스플레이 */}
            <div
              className={`flex min-h-[180px] w-full items-center justify-center rounded-3xl border-4 px-6 ${
                phase === 'revealed' && isDream
                  ? 'border-amber-400 bg-amber-50'
                  : 'border-dashed border-brand-200 bg-white'
              }`}
            >
              {drawn ? (
                <p className={`font-extrabold tabular-nums ${isDream ? 'text-8xl text-amber-500' : 'text-7xl text-gray-800'}`}>
                  {formatWon(phase === 'revealed' ? drawn.amount : draw.value)}
                </p>
              ) : (
                <p className="text-6xl font-bold text-brand-200">???만원</p>
              )}
            </div>

            {/* 티어 배너 */}
            {phase === 'revealed' && drawn?.tierLabel && (
              <motion.div
                initial={{ scale: 0.6, opacity: 0, y: 10 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                transition={{ type: 'spring', bounce: isDream ? 0.6 : 0.3, duration: isDream ? 0.7 : 0.4 }}
                className={
                  isDream
                    ? 'rounded-full bg-gradient-to-r from-amber-400 to-yellow-500 px-12 py-5 text-4xl font-extrabold text-white shadow-lg'
                    : 'rounded-full bg-brand-100 px-8 py-3 text-2xl font-bold text-brand-600'
                }
              >
                {isDream && '✨ '}
                {drawn.tierLabel}
                {isDream && ' ✨'}
              </motion.div>
            )}
          </>
        )}

        {/* 액션 버튼 */}
        <div className="flex min-h-[80px] flex-col items-center gap-4">
          {phase === 'idle' && (
            <Button onClick={() => handleDraw()} className="px-16 py-7 text-3xl">
              예산 뽑기
            </Button>
          )}
          {phase === 'revealed' && !isLastPlayer && (
            <Button onClick={nextAfterBudget}>두 번째 예산 뽑기</Button>
          )}
          {phase === 'revealed' && isLastPlayer && isDuo && (
            <Button onClick={() => setPhase('summing')}>두 사람 예산 합치기</Button>
          )}
          {phase === 'revealed' && isLastPlayer && !isDuo && (
            <div className="flex gap-4">
              <Button
                variant="secondary"
                onClick={() => setIsRerollConfirming(true)}
                disabled={soloBudgetRerollUsed}
              >
                예산 다시 돌리기 · {soloBudgetRerollUsed ? '0회 남음' : '1회 남음'}
              </Button>
              <Button onClick={nextAfterBudget}>사진 만들러 가기</Button>
            </div>
          )}
          {phase === 'summing' && <Button onClick={nextAfterBudget}>사진 만들러 가기</Button>}
        </div>
      </div>

      {/* 스핀 스킵 레이어 */}
      {phase === 'spinning' && (
        <button
          aria-label="뽑기 건너뛰기"
          onClick={skipSpin}
          className="absolute inset-0 z-30 bg-transparent"
        />
      )}

      {isRerollConfirming && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="budget-reroll-confirm-title"
          className="absolute inset-0 z-[50000] flex items-center justify-center bg-gray-900/60 px-12"
        >
          <div className="w-full max-w-[760px] rounded-2xl border-4 border-brand-100 bg-white px-12 py-14 text-center shadow-2xl">
            <h2
              id="budget-reroll-confirm-title"
              className="text-4xl font-black leading-tight text-gray-800"
            >
              정말 예산을 다시 돌리시겠습니까?
            </h2>
            <p className="mt-6 whitespace-pre-line text-2xl font-bold leading-relaxed text-red-500">
              {'현재 예산은 사라지고 다시 뽑은 예산으로 변경됩니다.\n예산 다시 돌리기는 한 번만 사용할 수 있습니다.'}
            </p>
            <div className="mt-10 grid grid-cols-2 gap-5">
              <button
                type="button"
                onClick={() => setIsRerollConfirming(false)}
                className="rounded-2xl border-2 border-gray-300 bg-white px-8 py-5 text-2xl font-black text-gray-600 active:bg-gray-100"
              >
                아니요
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsRerollConfirming(false)
                  handleDraw(true)
                }}
                className="rounded-2xl bg-brand-500 px-8 py-5 text-2xl font-black text-white active:bg-brand-600"
              >
                네
              </button>
            </div>
          </div>
        </div>
      )}
    </StageLayout>
  )
}

import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { useAppStore } from '../store/useAppStore'
import StageLayout from '../components/StageLayout'
import Button from '../components/Button'
import { formatWon } from '../utils/format'
import { BUDGET_DRAW, DREAM_TIER_ID } from '../config/budgetDraw'
import { MIN_BUDGET_AMOUNT } from '../data/budgetTiers'
import { fireCelebration, fireGoldBurst } from '../transitions/confetti'
import { useCountUp } from '../hooks/useCountUp'
import PlayerIndicator from '../components/PlayerIndicator'
import { PLAYER_LABELS } from '../config/players'

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
  const nextAfterBudget = useAppStore((s) => s.nextAfterBudget)

  const [phase, setPhase] = useState<Phase>('idle')
  const [drawn, setDrawn] = useState<Drawn | null>(null)
  const [showGold, setShowGold] = useState(false)
  const timerRef = useRef<number | null>(null)

  const isDuo = playerCount === 2
  const isLastPlayer = !isDuo || currentPlayer === 1

  // 뽑기 카운트업(낮은 금액 → 뽑힌 금액). 스핀 중에만 동작.
  const draw = useCountUp(
    drawn?.amount ?? MIN_BUDGET_AMOUNT,
    BUDGET_DRAW.spinDurationMs,
    phase === 'spinning',
    MIN_BUDGET_AMOUNT,
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

  const handleSettled = () => {
    clearTimer()
    setPhase('revealed')
    // 티어별 차등 연출: 드림 웨딩은 골드 플래시 + 컨페티.
    const p = useAppStore.getState().players[currentPlayer]
    if (p?.tierId === DREAM_TIER_ID) {
      setShowGold(true)
      fireGoldBurst()
      window.setTimeout(() => fireCelebration(), 250)
    }
  }

  const handleDraw = () => {
    drawBudget() // 1회 확정
    const p = useAppStore.getState().players[currentPlayer]
    if (!p || p.budget == null) return
    setDrawn({ amount: p.budget, tierId: p.tierId, tierLabel: p.tierLabel })
    setShowGold(false)
    setPhase('spinning')
    clearTimer()
    timerRef.current = window.setTimeout(handleSettled, BUDGET_DRAW.spinDurationMs)
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
          <p className="text-2xl text-brand-400">
            {isDuo ? `${PLAYER_LABELS[currentPlayer]} 분의 예산은?` : '나의 웨딩 예산은?'}
          </p>
          {isDuo && currentPlayer === 1 && players[0]?.budget != null && (
            <p className="text-lg text-gray-400">
              {PLAYER_LABELS[0]} · {players[0].tierLabel} {formatWon(players[0].budget)}
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
                <p className="text-6xl font-bold text-brand-200">??? 만원</p>
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
            <Button onClick={handleDraw} className="px-16 py-7 text-3xl">
              예산 뽑기
            </Button>
          )}
          {phase === 'revealed' && !isLastPlayer && (
            <Button onClick={nextAfterBudget}>다음 사람 →</Button>
          )}
          {phase === 'revealed' && isLastPlayer && isDuo && (
            <Button onClick={() => setPhase('summing')}>합산 결과 보기</Button>
          )}
          {phase === 'revealed' && isLastPlayer && !isDuo && (
            <Button onClick={nextAfterBudget}>결과 보기</Button>
          )}
          {phase === 'summing' && <Button onClick={nextAfterBudget}>결과 보기</Button>}
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
    </StageLayout>
  )
}

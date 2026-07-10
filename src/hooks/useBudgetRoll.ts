import { useEffect, useMemo, useRef, useState } from 'react'
import { BUDGET_ROUND_UNIT, MAX_BUDGET_AMOUNT, MIN_BUDGET_AMOUNT } from '../data/budgetTiers'

const DIGIT_STAGES = [1_000_000, 10_000_000, 100_000_000, 1_000_000_000]
const ROLL_INTERVAL_MS = 45

function stageBasesFor(target: number): number[] {
  return DIGIT_STAGES.filter((stage) => stage <= Math.max(target, MIN_BUDGET_AMOUNT))
}

export function budgetRollDuration(target: number, stageDurationMs: number): number {
  return Math.max(1, stageBasesFor(target).length) * stageDurationMs
}

function stageRange(stageStart: number) {
  const nextStage = DIGIT_STAGES[DIGIT_STAGES.indexOf(stageStart) + 1] ?? MAX_BUDGET_AMOUNT + BUDGET_ROUND_UNIT
  return {
    min: stageStart,
    max: Math.max(stageStart, Math.min(nextStage - BUDGET_ROUND_UNIT, MAX_BUDGET_AMOUNT)),
  }
}

function randomBudgetInRange(min: number, max: number): number {
  const steps = Math.max(0, Math.floor((max - min) / BUDGET_ROUND_UNIT))
  return min + Math.floor(Math.random() * (steps + 1)) * BUDGET_ROUND_UNIT
}

export function useBudgetRoll(target: number, active: boolean, stageDurationMs: number) {
  const [value, setValue] = useState(MIN_BUDGET_AMOUNT)
  const skipRef = useRef(false)
  const stages = useMemo(() => stageBasesFor(target), [target])

  useEffect(() => {
    if (!active) {
      setValue(MIN_BUDGET_AMOUNT)
      return
    }

    skipRef.current = false
    let timeout = 0
    const start = performance.now()
    const maxStageIndex = Math.max(0, stages.length - 1)
    let lastTick = 0

    const step = (now: number) => {
      if (skipRef.current) {
        setValue(target)
        return
      }

      const elapsed = now - start
      const stageIndex = Math.min(maxStageIndex, Math.floor(elapsed / stageDurationMs))
      const stageStart = stages[stageIndex] ?? MIN_BUDGET_AMOUNT

      if (elapsed >= (maxStageIndex + 1) * stageDurationMs) {
        setValue(target)
        return
      }

      if (now - lastTick >= ROLL_INTERVAL_MS) {
        lastTick = now
        const { min, max } = stageRange(stageStart)
        setValue(randomBudgetInRange(min, max))
      }

      timeout = window.setTimeout(() => step(performance.now()), 16)
    }

    step(start)
    return () => window.clearTimeout(timeout)
  }, [active, stageDurationMs, stages, target])

  const skip = () => {
    skipRef.current = true
    setValue(target)
  }

  return { value, skip }
}

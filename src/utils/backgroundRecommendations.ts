import { AXES, type PoleCode } from '../data/axes'
import { ITEMS, type DecorItem } from '../data/items'
import type { AxisScores } from '../store/useAppStore'

export type BackgroundRecommendationKind = 'best' | 'similar' | 'adventurous'

export interface BackgroundRecommendation {
  item: DecorItem
  kind: BackgroundRecommendationKind
  label: string
  reason: string
  score: number
}

interface RankedBackground {
  item: DecorItem
  score: number
  matches: boolean[]
  mismatchCount: number
}

const RECOMMENDATION_LABELS: Record<BackgroundRecommendationKind, string> = {
  best: '가장 잘 맞아요',
  similar: '비슷한 분위기',
  adventurous: '새로운 조합',
}

function rankBackgrounds(resultCode: string, axisScores: AxisScores): RankedBackground[] {
  const resultPoles = resultCode.split('-') as PoleCode[]
  const strengths = AXES.map((axis) => {
    const [left, right] = axis.poles
    const leftScore = axisScores[axis.key]?.[left.code] ?? 0
    const rightScore = axisScores[axis.key]?.[right.code] ?? 0
    const total = Math.max(1, leftScore + rightScore)
    return Math.abs(leftScore - rightScore) / total
  })

  return ITEMS.filter(
    (item): item is DecorItem & { tasteCode: string } =>
      item.category === 'background' && Boolean(item.tasteCode),
  )
    .map((item) => {
      const itemPoles = item.tasteCode.split('-') as PoleCode[]
      const matches = AXES.map((_, index) => itemPoles[index] === resultPoles[index])
      const score = matches.reduce(
        (total, matchesAxis, index) =>
          total + (matchesAxis ? 100 + strengths[index] * 100 : 30 - strengths[index] * 30),
        0,
      )
      return {
        item,
        score,
        matches,
        mismatchCount: matches.filter((matchesAxis) => !matchesAxis).length,
      }
    })
    .sort((a, b) => b.score - a.score || a.item.name.localeCompare(b.item.name, 'ko'))
}

export function getBackgroundRecommendations(
  resultCode: string | null,
  axisScores: AxisScores,
): BackgroundRecommendation[] {
  if (!resultCode) return []

  const ranked = rankBackgrounds(resultCode, axisScores)
  if (ranked.length === 0) return []

  const resultPoles = resultCode.split('-') as PoleCode[]
  const strengths = AXES.map((axis, index) => {
    const [left, right] = axis.poles
    const leftScore = axisScores[axis.key]?.[left.code] ?? 0
    const rightScore = axisScores[axis.key]?.[right.code] ?? 0
    const total = Math.max(1, leftScore + rightScore)
    return {
      index,
      strength: Math.abs(leftScore - rightScore) / total,
      winnerLabel: axis.poles.find((pole) => pole.code === resultPoles[index])?.label ?? '',
    }
  })
  const strongest = [...strengths].sort((a, b) => b.strength - a.strength)[0]

  const best = ranked.find((candidate) => candidate.mismatchCount === 0) ?? ranked[0]
  const similar =
    ranked.find(
      (candidate) => candidate.item.id !== best.item.id && candidate.mismatchCount === 1,
    ) ?? ranked.find((candidate) => candidate.item.id !== best.item.id)
  const adventurous =
    ranked.find(
      (candidate) =>
        candidate.item.id !== best.item.id &&
        candidate.item.id !== similar?.item.id &&
        candidate.mismatchCount >= 2 &&
        candidate.matches[strongest.index],
    ) ??
    ranked.find(
      (candidate) =>
        candidate.item.id !== best.item.id && candidate.item.id !== similar?.item.id,
    )

  const recommendations: BackgroundRecommendation[] = [
    {
      item: best.item,
      kind: 'best',
      label: RECOMMENDATION_LABELS.best,
      reason: '4가지 취향을 모두 반영',
      score: best.score,
    },
  ]

  if (similar) {
    const changedAxisIndex = similar.matches.findIndex((matchesAxis) => !matchesAxis)
    recommendations.push({
      item: similar.item,
      kind: 'similar',
      label: RECOMMENDATION_LABELS.similar,
      reason:
        changedAxisIndex >= 0
          ? `${AXES[changedAxisIndex].label}만 살짝 바꾼 선택`
          : '핵심 취향이 비슷한 선택',
      score: similar.score,
    })
  }

  if (adventurous) {
    recommendations.push({
      item: adventurous.item,
      kind: 'adventurous',
      label: RECOMMENDATION_LABELS.adventurous,
      reason: `${strongest.winnerLabel} 취향은 그대로 유지`,
      score: adventurous.score,
    })
  }

  return recommendations
}

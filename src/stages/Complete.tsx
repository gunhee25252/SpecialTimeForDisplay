import { useEffect, useMemo, useState } from 'react'
import { useAppStore } from '../store/useAppStore'
import { findTypeByCode } from '../data/types16'
import StageLayout from '../components/StageLayout'
import Button from '../components/Button'
import { formatWon } from '../utils/format'
import {
  calculatePrintSpec,
  commitPrintId,
  getNextPrintId,
  renderPrintImage,
  savePrintFiles,
} from '../utils/print'

const PRINTING_DELAY_MS = 5_000
const PRINT_DONE_DELAY_MS = 2_000

export default function Complete() {
  const resultCode = useAppStore((s) => s.resultCode)
  const playerCount = useAppStore((s) => s.playerCount)
  const budget = useAppStore((s) => s.budget)
  const spent = useAppStore((s) => s.spent)
  const placedItems = useAppStore((s) => s.placedItems)
  const canvasBackgroundId = useAppStore((s) => s.canvasBackgroundId)
  const characters = useAppStore((s) => s.characters)
  const reset = useAppStore((s) => s.reset)
  const [printId, setPrintId] = useState(() => getNextPrintId())
  const [isSaving, setIsSaving] = useState(false)
  const [printStatus, setPrintStatus] = useState<'idle' | 'printing' | 'done'>('idle')
  const [printError, setPrintError] = useState<string | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  const type = resultCode ? findTypeByCode(resultCode) : undefined
  const isDuo = playerCount === 2
  const remaining = Math.max(0, (budget ?? 0) - spent)
  const printSpec = useMemo(() => calculatePrintSpec(printId, budget, spent), [budget, printId, spent])

  useEffect(() => {
    let cancelled = false
    let objectUrl: string | null = null

    renderPrintImage({
      printId,
      budget,
      spent,
      canvasBackgroundId,
      characters,
      placedItems,
    })
      .then((blob) => {
        if (cancelled) return
        objectUrl = URL.createObjectURL(blob)
        setPreviewUrl(objectUrl)
      })
      .catch(() => {
        if (!cancelled) setPreviewUrl(null)
      })

    return () => {
      cancelled = true
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [budget, canvasBackgroundId, characters, placedItems, printId, spent])

  useEffect(() => {
    if (printStatus === 'printing') {
      const timer = window.setTimeout(() => setPrintStatus('done'), PRINTING_DELAY_MS)
      return () => window.clearTimeout(timer)
    }
    if (printStatus === 'done') {
      const timer = window.setTimeout(() => reset(), PRINT_DONE_DELAY_MS)
      return () => window.clearTimeout(timer)
    }
    return undefined
  }, [printStatus, reset])

  const handlePrintSave = async () => {
    if (isSaving || printStatus !== 'idle') return
    setIsSaving(true)
    setPrintError(null)
    try {
      const imageBlob = await renderPrintImage({
        printId,
        budget,
        spent,
        canvasBackgroundId,
        characters,
        placedItems,
      })
      await savePrintFiles(imageBlob, printSpec)

      commitPrintId(printId)
      setPrintId(printId + 1)
      setPrintStatus('printing')
    } catch (error) {
      setPrintError(error instanceof Error ? error.message : '저장 중 문제가 생겼어요.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <StageLayout>
      <div className="flex flex-1 flex-col items-center justify-center gap-5 text-center">
        <div>
          <p className="text-2xl font-semibold text-brand-400">완성!</p>
          <p className="mt-2 text-base text-gray-500">
            {isDuo ? '두 분의 합친 취향 유형' : '취향 유형'} · {type ? type.name : '유형 없음'}
          </p>
        </div>

        <div className="flex w-full flex-col items-center justify-center gap-4">
          <div
            className="flex shrink-0 items-center justify-center overflow-hidden rounded-2xl border-4 border-white bg-white shadow-sm"
            style={{ width: 630, height: 1121 }}
          >
            {previewUrl ? (
              <img
                src={previewUrl}
                alt="완성된 사진"
                className="block object-contain"
                style={{ width: '100%', height: '100%' }}
                draggable={false}
              />
            ) : (
              <p className="text-lg text-gray-400">이미지를 준비하고 있어요.</p>
            )}
          </div>

          <div className="w-full rounded-2xl bg-white px-8 py-4 shadow-sm">
            <p className="text-lg font-semibold text-gray-800">
              출력 정보: {printSpec.grayscale ? '흑백' : '컬러'} / {printSpec.size} / {printSpec.copies}장
            </p>
            <p className="mt-2 text-base text-gray-500">
              남은 예산 {formatWon(remaining)}
            </p>
            {printStatus === 'done' && (
              <p className="mt-2 text-brand-500">인쇄가 완료됐어요. 처음 화면으로 돌아갑니다.</p>
            )}
            {printError && <p className="mt-2 text-red-500">{printError}</p>}
          </div>
        </div>

        <div className="flex w-full flex-col gap-3">
          <Button onClick={handlePrintSave} className="w-full" disabled={isSaving || printStatus !== 'idle'}>
            {printStatus === 'done' ? '인쇄 완료' : isSaving || printStatus === 'printing' ? '인쇄 중...' : '인쇄하기'}
          </Button>
          <Button onClick={reset} className="w-full" disabled={isSaving || printStatus !== 'idle'}>
            다시 하기
          </Button>
        </div>
      </div>
    </StageLayout>
  )
}

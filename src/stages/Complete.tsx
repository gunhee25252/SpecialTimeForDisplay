import { useEffect, useMemo, useState } from 'react'
import { useAppStore } from '../store/useAppStore'
import StageLayout from '../components/StageLayout'
import Button from '../components/Button'
import {
  calculatePrintSpec,
  commitPrintId,
  getNextPrintId,
  isLandscapePrintFrame,
  openPrintDialog,
  renderPrintImage,
  savePrintFiles,
} from '../utils/print'

const PRINTING_DELAY_MS = 5_000
const PRINT_DONE_DELAY_MS = 10_000

export default function Complete() {
  const playerCount = useAppStore((s) => s.playerCount)
  const budget = useAppStore((s) => s.budget)
  const spent = useAppStore((s) => s.spent)
  const placedItems = useAppStore((s) => s.placedItems)
  const canvasBackgroundId = useAppStore((s) => s.canvasBackgroundId)
  const characters = useAppStore((s) => s.characters)
  const printFrameRatio = useAppStore((s) => s.printFrameRatio)
  const printFrame = useAppStore((s) => s.printFrame)
  const reset = useAppStore((s) => s.reset)
  const [printId, setPrintId] = useState(() => getNextPrintId())
  const [isSaving, setIsSaving] = useState(false)
  const [printStatus, setPrintStatus] = useState<'idle' | 'printing' | 'done'>('idle')
  const [printError, setPrintError] = useState<string | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  const isDuo = playerCount === 2
  const printSpec = useMemo(
    () => ({ ...calculatePrintSpec(printId, budget, spent, printFrameRatio), frame: printFrame }),
    [budget, printFrame, printFrameRatio, printId, spent],
  )
  const previewRatio = isLandscapePrintFrame(printFrameRatio) ? 3 / 2 : 2 / 3
  const previewWidth = 630
  const previewHeight = Math.min(1121, previewWidth / previewRatio)

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
      printFrame,
      printFrameRatio,
      prepareForPrint: true,
      grayscale: printSpec.grayscale,
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
  }, [budget, canvasBackgroundId, characters, placedItems, printFrame, printFrameRatio, printId, printSpec.grayscale, spent])

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
        printFrame,
        printFrameRatio,
        prepareForPrint: true,
        grayscale: printSpec.grayscale,
        rotateLandscapeForOutput: true,
      })
      // 서버가 저장과 인쇄를 함께 처리한다. 폴더 보관에 실패해도 인쇄는 그대로 진행한다
      // (저장된 경우에만 번호를 소진).
      let printedByServer = false
      try {
        const result = await savePrintFiles(imageBlob, printSpec)
        printedByServer = result.printed === true
        commitPrintId(printId)
        setPrintId(printId + 1)
      } catch {
        // 저장 실패는 인쇄를 막지 않는다.
      }

      // 서버가 프린터로 직접 보냈으면 브라우저 인쇄 대화상자를 열지 않는다.
      if (!printedByServer) {
        await openPrintDialog(imageBlob)
      }
      setPrintStatus('printing')
    } catch (error) {
      setPrintError(error instanceof Error ? error.message : '저장 중 문제가 생겼어요.')
    } finally {
      setIsSaving(false)
    }
  }

  if (printStatus === 'done') {
    return (
      <StageLayout showReset={false}>
        <div className="flex flex-1 flex-col items-center justify-center text-center">
          <div className="w-full rounded-3xl border-4 border-brand-200 bg-white px-10 py-20 shadow-sm">
            <p className="font-ryuryu text-[92px] font-black text-brand-500">인쇄 중입니다</p>
            <p className="mt-10 text-4xl font-bold text-gray-800">
              사진이 바로 여기에서 나옵니다. 잠시만 기다려 주세요.
            </p>
            <p className="mt-8 text-3xl font-semibold text-gray-500">
              10초 후 처음 화면으로 돌아갑니다.
            </p>
          </div>
        </div>
      </StageLayout>
    )
  }

  return (
    <StageLayout>
      <div className="flex flex-1 flex-col items-center justify-center gap-6 text-center">
        <div>
          <p className="font-ryuryu text-[64px] font-black text-brand-500">완성!</p>
        </div>

        <div className="flex w-full flex-col items-center justify-center gap-4">
          <div
            className="flex shrink-0 items-center justify-center overflow-hidden rounded-2xl border-4 border-white bg-white shadow-sm"
            style={{ width: previewWidth, height: previewHeight }}
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
              <p className="text-2xl font-semibold text-gray-400">이미지를 준비하고 있어요.</p>
            )}
          </div>

          <p className="text-[32px] font-bold leading-snug text-gray-700">
            {isDuo
              ? '두 사람의 선택으로 완성한 웨딩 사진'
              : '나의 선택으로 완성한 웨딩 사진'}
          </p>

          {printError && (
            <p className="w-full rounded-2xl bg-white px-8 py-5 text-3xl font-semibold text-red-500 shadow-sm">
              {printError}
            </p>
          )}
        </div>

        <div className="flex w-full flex-col gap-3">
          <Button onClick={handlePrintSave} className="w-full py-6 text-3xl" disabled={isSaving || printStatus !== 'idle'}>
            {isSaving || printStatus === 'printing' ? '인쇄 중...' : '인쇄하기'}
          </Button>
        </div>
      </div>
    </StageLayout>
  )
}

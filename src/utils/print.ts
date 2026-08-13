import { SCENE_HEIGHT, SCENE_WIDTH } from '../data/constants'
import { findItem, getWeddingPhraseFontRatio } from '../data/items'
import {
  CHARACTER_BODY,
  CHARACTER_HEAD,
  CHARACTERS,
  DEFAULT_EXPR_ID,
  DEFAULT_HAIR_COLOR_ID,
  DEFAULT_HAIR_ID,
  DEFAULT_OUTFIT_ID,
  findExpr,
  findHair,
  findHairColor,
  findOutfit,
} from '../data/characters'
import type { CharactersState, PlacedItem, PrintFrame, PrintFrameRatio } from '../store/useAppStore'

export type PrintSize = '4x6' | '5x7' | 'a4'

export interface PrintSpec {
  printId: number
  imageFile: string
  copies: number
  grayscale: boolean
  size: PrintSize
  sheetRatio: '2:3' | '3:2'
  pixelWidth: number
  pixelHeight: number
  dpi: number
  rotationDegrees: 0 | 90
  frameRatio?: PrintFrameRatio
  frame?: PrintFrame | null
}

export interface PrintRenderState {
  printId: number
  budget: number | null
  spent: number
  canvasBackgroundId: string | null
  characters: CharactersState
  placedItems: PlacedItem[]
  printFrame?: PrintFrame | null
  printFrameRatio?: PrintFrameRatio
  prepareForPrint?: boolean
  grayscale?: boolean
  rotateLandscapeForOutput?: boolean
}

const CONTENT = { x0: 0, x1: 1, y0: 0.12, y1: 0.98 }
const CW_FRAC = CONTENT.x1 - CONTENT.x0
const CH_FRAC = CONTENT.y1 - CONTENT.y0
const IMG_W_PCT = 100 / CW_FRAC
const IMG_H_PCT = 100 / CH_FRAC
const IMG_L_PCT = -CONTENT.x0 * IMG_W_PCT
const IMG_T_PCT = -CONTENT.y0 * IMG_H_PCT
const FIGURE_W_RATIO = 400 / 1080
const FIGURE_ASPECT_W = CW_FRAC * 1000
const FIGURE_ASPECT_H = CH_FRAC * 1400
const FIGURE_H_OVER_W = FIGURE_ASPECT_H / FIGURE_ASPECT_W
const PRINT_SHEET_WIDTH = 1200
const PRINT_SHEET_HEIGHT = 1800
const PRINT_DPI = 300

export function isLandscapePrintFrame(frameRatio: PrintFrameRatio) {
  return frameRatio === '3:2'
}

function printSheetDimensions(frameRatio: PrintFrameRatio) {
  const landscape = isLandscapePrintFrame(frameRatio)
  return landscape
    ? { width: PRINT_SHEET_HEIGHT, height: PRINT_SHEET_WIDTH }
    : { width: PRINT_SHEET_WIDTH, height: PRINT_SHEET_HEIGHT }
}

function padPrintId(printId: number): string {
  return String(printId).padStart(3, '0')
}

export function makePrintFileName(printId: number, ext: 'png' | 'json'): string {
  return `print-${padPrintId(printId)}.${ext}`
}

export function getNextPrintId(): number {
  const raw = window.localStorage.getItem('special-time-print-id')
  const last = raw ? Number.parseInt(raw, 10) : 0
  return Number.isFinite(last) ? last + 1 : 1
}

export function commitPrintId(printId: number) {
  window.localStorage.setItem('special-time-print-id', String(printId))
}

export function calculatePrintSpec(
  printId: number,
  budget: number | null,
  spent: number,
  frameRatio: PrintFrameRatio = '2:3',
): PrintSpec {
  const remaining = Math.max(0, (budget ?? 0) - spent)
  const rotationDegrees = isLandscapePrintFrame(frameRatio) ? 90 : 0
  return {
    printId,
    imageFile: makePrintFileName(printId, 'png'),
    copies: 1,
    grayscale: remaining < 10_000_000,
    size: '4x6',
    sheetRatio: '2:3',
    pixelWidth: PRINT_SHEET_WIDTH,
    pixelHeight: PRINT_SHEET_HEIGHT,
    dpi: PRINT_DPI,
    rotationDegrees,
    frameRatio,
  }
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error(`이미지를 불러오지 못했어요: ${src}`))
    img.src = src
  })
}

async function drawImage(
  ctx: CanvasRenderingContext2D,
  src: string,
  x: number,
  y: number,
  width: number,
  height: number,
  filter = 'none',
  opacity = 1,
) {
  const img = await loadImage(src)
  ctx.save()
  ctx.filter = filter
  ctx.globalAlpha = opacity
  ctx.drawImage(img, x, y, width, height)
  ctx.restore()
}

async function drawMaskedImage(
  ctx: CanvasRenderingContext2D,
  src: string,
  maskSrc: string,
  x: number,
  y: number,
  width: number,
  height: number,
  filter: string,
) {
  const [img, mask] = await Promise.all([loadImage(src), loadImage(maskSrc)])
  const layer = document.createElement('canvas')
  layer.width = SCENE_WIDTH
  layer.height = SCENE_HEIGHT
  const layerCtx = layer.getContext('2d')
  if (!layerCtx) return

  layerCtx.save()
  layerCtx.filter = filter
  layerCtx.drawImage(img, x, y, width, height)
  layerCtx.restore()
  layerCtx.globalCompositeOperation = 'destination-in'
  layerCtx.drawImage(mask, x, y, width, height)
  layerCtx.globalCompositeOperation = 'source-over'
  ctx.drawImage(layer, 0, 0)
}

function drawEmptyBackground(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, SCENE_WIDTH, SCENE_HEIGHT)
}

async function drawCharacter(ctx: CanvasRenderingContext2D, key: 'groom' | 'bride', cs: CharactersState['groom']) {
  if (cs.x === null || cs.y === null) return

  const ex = findExpr(cs.exprId ?? DEFAULT_EXPR_ID)
  const hair = findHair(key, cs.hairId ?? DEFAULT_HAIR_ID)
  const hairColor = findHairColor(cs.hairColorId ?? DEFAULT_HAIR_COLOR_ID)
  const outfit = findOutfit(key, cs.outfitId ?? DEFAULT_OUTFIT_ID)
  const isDefaultOutfit = (cs.outfitId ?? DEFAULT_OUTFIT_ID) === DEFAULT_OUTFIT_ID
  const hasHairColor = hairColor?.id !== DEFAULT_HAIR_COLOR_ID
  const figureW = SCENE_WIDTH * FIGURE_W_RATIO
  const figureH = figureW * FIGURE_H_OVER_W
  const imgX = cs.x + (IMG_L_PCT / 100) * figureW
  const imgY = cs.y + (IMG_T_PCT / 100) * figureH
  const imgW = (IMG_W_PCT / 100) * figureW
  const imgH = (IMG_H_PCT / 100) * figureH

  ctx.save()
  ctx.beginPath()
  ctx.roundRect(cs.x, cs.y, figureW, figureH, 16)
  ctx.clip()
  await drawImage(ctx, CHARACTER_HEAD, imgX, imgY, imgW, imgH)
  if (hair?.image) {
    const hairFilter = hasHairColor ? hairColor?.filter ?? 'none' : 'none'
    await drawImage(ctx, hair.image, imgX, imgY, imgW, imgH, hasHairColor && !hair.maskImage ? hairFilter : 'none')
    if (hasHairColor && hair.maskImage) {
      await drawMaskedImage(ctx, hair.image, hair.maskImage, imgX, imgY, imgW, imgH, hairFilter)
    }
  }
  if (ex) await drawImage(ctx, ex.image, imgX, imgY, imgW, imgH)
  await drawImage(ctx, outfit?.image ?? CHARACTER_BODY, imgX, imgY, imgW, imgH)
  if (isDefaultOutfit) {
    ctx.font = '700 25px sans-serif'
    ctx.fillStyle = '#4b5563'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(key === 'groom' ? '신랑' : '신부', cs.x + figureW / 2, cs.y + figureH * 0.55)
  }
  ctx.restore()
}

function drawWeddingPhrase(
  ctx: CanvasRenderingContext2D,
  text: string,
  color: string,
  x: number,
  y: number,
  width: number,
  height: number,
) {
  const centerX = x + width / 2
  const centerY = y + height / 2
  const insetX = width * 0.03
  const insetY = height * 0.03
  const fontRatio = getWeddingPhraseFontRatio(text)
  const fontSize = Math.max(12, Math.round(width * fontRatio))

  ctx.save()
  ctx.shadowColor = 'rgba(0, 0, 0, 0.16)'
  ctx.shadowBlur = Math.max(4, width * 0.025)
  ctx.shadowOffsetY = Math.max(2, height * 0.04)
  ctx.fillStyle = 'rgba(255, 255, 255, 0.92)'
  ctx.strokeStyle = color
  ctx.lineWidth = Math.max(3, width * 0.012)
  ctx.beginPath()
  ctx.roundRect(
    x + insetX,
    y + insetY,
    width - insetX * 2,
    height - insetY * 2,
    Math.min(14, height * 0.14),
  )
  ctx.fill()
  ctx.stroke()

  ctx.shadowColor = 'transparent'
  ctx.fillStyle = color
  ctx.font = `900 ${fontSize}px sans-serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(text, centerX, centerY, width * 0.58)

  ctx.globalAlpha = 0.55
  ctx.font = `900 ${Math.round(fontSize * 0.65)}px sans-serif`
  ctx.fillText('♥', x + width * 0.09, centerY)
  ctx.fillText('♥', x + width * 0.91, centerY)
  ctx.restore()
}

function drawLetterShapeBalloon(
  ctx: CanvasRenderingContext2D,
  letter: string,
  color: string,
  x: number,
  y: number,
  width: number,
  height: number,
) {
  const centerX = x + width / 2
  const textY = y + height * 0.34
  const maxTextWidth = width * 0.9

  ctx.save()
  ctx.strokeStyle = 'rgba(75, 85, 99, 0.7)'
  ctx.lineWidth = Math.max(1, width * 0.012)
  ctx.beginPath()
  ctx.moveTo(centerX, y + height * 0.72)
  ctx.lineTo(centerX, y + height)
  ctx.stroke()

  ctx.fillStyle = color
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.12)'
  ctx.lineWidth = Math.max(2, width * 0.045)
  ctx.lineJoin = 'round'
  ctx.shadowColor = 'rgba(0, 0, 0, 0.18)'
  ctx.shadowBlur = width * 0.03
  ctx.shadowOffsetY = width * 0.025
  ctx.font = `900 ${Math.round(width * 0.74)}px "Arial Rounded MT Bold", "Arial Black", sans-serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.strokeText(letter, centerX, textY, maxTextWidth)
  ctx.fillText(letter, centerX, textY, maxTextWidth)

  ctx.shadowColor = 'transparent'
  ctx.globalAlpha = 0.55
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.75)'
  ctx.lineWidth = Math.max(1, width * 0.012)
  ctx.strokeText(
    letter,
    centerX - width * 0.008,
    textY - height * 0.008,
    maxTextWidth,
  )
  ctx.globalAlpha = 1

  ctx.fillStyle = color
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)'
  ctx.lineWidth = Math.max(1, width * 0.01)
  ctx.beginPath()
  ctx.roundRect(
    centerX - width * 0.045,
    y + height * 0.67,
    width * 0.09,
    height * 0.08,
    width * 0.02,
  )
  ctx.fill()
  ctx.stroke()
  ctx.restore()
}

async function drawPlacedItem(ctx: CanvasRenderingContext2D, placed: PlacedItem) {
  const item = findItem(placed.itemId)
  if (!item) return
  const scale = placed.scale ?? 1
  const width = item.defaultWidth * scale
  const height = item.defaultHeight * scale
  const rotation = placed.rotation ?? 0
  const drawX = -width / 2
  const drawY = -height / 2

  ctx.save()
  ctx.translate(placed.x + width / 2, placed.y + height / 2)
  ctx.rotate((rotation * Math.PI) / 180)

  try {
    if (item.image) {
      await drawImage(ctx, item.image, drawX, drawY, width, height, 'none', item.imageOpacity ?? 1)
      return
    }
    if (item.renderStyle === 'weddingPhrase') {
      drawWeddingPhrase(ctx, item.text ?? '', item.thumbnail, drawX, drawY, width, height)
      return
    }
    if (item.renderStyle === 'letterShapeBalloon') {
      drawLetterShapeBalloon(ctx, item.text ?? '', item.thumbnail, drawX, drawY, width, height)
      return
    }

    ctx.fillStyle = item.thumbnail
    const radius = item.shape === 'circle' ? Math.min(width, height) / 2 : 12 * scale
    ctx.beginPath()
    ctx.roundRect(drawX, drawY, width, height, radius)
    ctx.fill()
    ctx.fillStyle = 'rgba(255,255,255,0.9)'
    ctx.font = `700 ${16 * scale}px sans-serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(item.name, 0, 0)
  } finally {
    ctx.restore()
  }
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob)
      else reject(new Error('PNG 파일을 만들 수 없어요.'))
    }, 'image/png')
  })
}

function cropCanvas(source: HTMLCanvasElement, frame: PrintFrame): HTMLCanvasElement {
  const cropX = clamp(Math.round(frame.x), 0, SCENE_WIDTH - 1)
  const cropY = clamp(Math.round(frame.y), 0, SCENE_HEIGHT - 1)
  const cropW = clamp(Math.round(frame.width), 1, SCENE_WIDTH - cropX)
  const cropH = clamp(Math.round(frame.height), 1, SCENE_HEIGHT - cropY)
  const cropped = document.createElement('canvas')
  cropped.width = cropW
  cropped.height = cropH
  const croppedCtx = cropped.getContext('2d')
  if (!croppedCtx) throw new Error('잘라낸 캔버스를 만들 수 없어요.')
  croppedCtx.drawImage(source, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH)
  return cropped
}

function applyGrayscale(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('흑백 이미지를 만들 수 없어요.')
  const image = ctx.getImageData(0, 0, canvas.width, canvas.height)
  const pixels = image.data
  for (let index = 0; index < pixels.length; index += 4) {
    const luminance = Math.round(
      pixels[index] * 0.2126 + pixels[index + 1] * 0.7152 + pixels[index + 2] * 0.0722,
    )
    pixels[index] = luminance
    pixels[index + 1] = luminance
    pixels[index + 2] = luminance
  }
  ctx.putImageData(image, 0, 0)
}

function composePrintSheet(
  content: HTMLCanvasElement,
  grayscale: boolean,
  frameRatio: PrintFrameRatio,
): HTMLCanvasElement {
  const dimensions = printSheetDimensions(frameRatio)
  const sheet = document.createElement('canvas')
  sheet.width = dimensions.width
  sheet.height = dimensions.height
  const ctx = sheet.getContext('2d')
  if (!ctx) throw new Error('2:3 인화지를 만들 수 없어요.')

  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, sheet.width, sheet.height)

  const scale = Math.max(sheet.width / content.width, sheet.height / content.height)
  const width = Math.round(content.width * scale)
  const height = Math.round(content.height * scale)
  const x = Math.round((sheet.width - width) / 2)
  const y = Math.round((sheet.height - height) / 2)

  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(content, x, y, width, height)

  if (grayscale) applyGrayscale(sheet)
  return sheet
}

function rotateClockwise(source: HTMLCanvasElement): HTMLCanvasElement {
  const rotated = document.createElement('canvas')
  rotated.width = source.height
  rotated.height = source.width
  const ctx = rotated.getContext('2d')
  if (!ctx) throw new Error('가로형 인화 이미지를 회전할 수 없어요.')
  ctx.translate(rotated.width, 0)
  ctx.rotate(Math.PI / 2)
  ctx.drawImage(source, 0, 0)
  return rotated
}

export async function renderPrintImage(state: PrintRenderState): Promise<Blob> {
  const canvas = document.createElement('canvas')
  canvas.width = SCENE_WIDTH
  canvas.height = SCENE_HEIGHT
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('캔버스를 만들 수 없어요.')

  const background = state.canvasBackgroundId ? findItem(state.canvasBackgroundId) : undefined
  if (background?.image) {
    await drawImage(ctx, background.image, 0, 0, SCENE_WIDTH, SCENE_HEIGHT)
  } else if (background) {
    ctx.fillStyle = background.thumbnail
    ctx.fillRect(0, 0, SCENE_WIDTH, SCENE_HEIGHT)
  } else {
    drawEmptyBackground(ctx)
  }

  const drawables = [
    ...CHARACTERS.map((c) => ({ kind: 'character' as const, key: c.key, z: state.characters[c.key].z ?? 0 })),
    ...state.placedItems.map((item) => ({ kind: 'item' as const, item, z: item.z })),
  ].sort((a, b) => a.z - b.z)

  for (const drawable of drawables) {
    if (drawable.kind === 'character') {
      await drawCharacter(ctx, drawable.key, state.characters[drawable.key])
    } else {
      await drawPlacedItem(ctx, drawable.item)
    }
  }

  const framed = state.printFrame ? cropCanvas(canvas, state.printFrame) : canvas
  let output = state.prepareForPrint
    ? composePrintSheet(framed, state.grayscale ?? false, state.printFrameRatio ?? '2:3')
    : framed
  if (
    state.prepareForPrint &&
    state.rotateLandscapeForOutput &&
    isLandscapePrintFrame(state.printFrameRatio ?? '2:3')
  ) {
    output = rotateClockwise(output)
  }
  return canvasToBlob(output)
}

export function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = fileName
  document.body.appendChild(a)
  a.click()
  a.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export function openPrintDialog(imageBlob: Blob): Promise<void> {
  return new Promise((resolve, reject) => {
    const imageUrl = URL.createObjectURL(imageBlob)
    const frame = document.createElement('iframe')
    frame.title = '인화 이미지'
    frame.setAttribute('aria-hidden', 'true')
    Object.assign(frame.style, {
      position: 'fixed',
      left: '-10000px',
      top: '0',
      width: '4in',
      height: '6in',
      border: '0',
      pointerEvents: 'none',
    })
    document.body.appendChild(frame)

    let cleanupTimer: number | undefined
    const cleanup = () => {
      if (cleanupTimer !== undefined) window.clearTimeout(cleanupTimer)
      URL.revokeObjectURL(imageUrl)
      frame.remove()
    }

    const printDocument = frame.contentDocument
    const printWindow = frame.contentWindow
    if (!printDocument || !printWindow) {
      cleanup()
      reject(new Error('인쇄 창을 열 수 없어요.'))
      return
    }

    printDocument.title = '웨딩 사진 인화'
    const style = printDocument.createElement('style')
    style.textContent = `
      @page { size: 4in 6in; margin: 0; }
      html, body {
        width: 4in;
        height: 6in;
        margin: 0;
        padding: 0;
        overflow: hidden;
        background: #fff;
      }
      img {
        display: block;
        width: 100%;
        height: 100%;
        object-fit: contain;
      }
    `
    printDocument.head.appendChild(style)

    const image = printDocument.createElement('img')
    image.alt = '완성된 웨딩 사진'
    image.onload = () => {
      printWindow.addEventListener('afterprint', cleanup, { once: true })
      cleanupTimer = window.setTimeout(cleanup, 60_000)
      printWindow.focus()
      printWindow.print()
      resolve()
    }
    image.onerror = () => {
      cleanup()
      reject(new Error('인쇄할 이미지를 불러오지 못했어요.'))
    }
    image.src = imageUrl
    printDocument.body.appendChild(image)
  })
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(new Error('PNG 데이터를 읽을 수 없어요.'))
    reader.readAsDataURL(blob)
  })
}

export async function savePrintFiles(imageBlob: Blob, spec: PrintSpec): Promise<{ imageFile: string; jsonFile: string }> {
  const response = await fetch('./api/prints', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      imageDataUrl: await blobToDataUrl(imageBlob),
      spec,
    }),
  })

  if (!response.ok) {
    throw new Error('결과물을 폴더에 바로 저장하지 못했어요.')
  }

  return response.json() as Promise<{ imageFile: string; jsonFile: string }>
}

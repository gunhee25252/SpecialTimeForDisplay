import { BASE_HEIGHT, BASE_WIDTH } from '../data/constants'
import { findItem } from '../data/items'
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
import type { CharactersState, PlacedItem } from '../store/useAppStore'

export type PrintSize = '4x6' | '5x7' | 'a4'

export interface PrintSpec {
  printId: number
  imageFile: string
  copies: number
  grayscale: boolean
  size: PrintSize
}

export interface PrintRenderState {
  printId: number
  budget: number | null
  spent: number
  canvasBackgroundId: string | null
  characters: CharactersState
  placedItems: PlacedItem[]
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

export function calculatePrintSpec(printId: number, budget: number | null, spent: number): PrintSpec {
  const remaining = Math.max(0, (budget ?? 0) - spent)

  if (remaining < 1_000_000) {
    return { printId, imageFile: makePrintFileName(printId, 'png'), copies: 1, grayscale: true, size: '4x6' }
  }
  if (remaining < 2_000_000) {
    return { printId, imageFile: makePrintFileName(printId, 'png'), copies: 1, grayscale: false, size: '4x6' }
  }
  if (remaining < 4_000_000) {
    return { printId, imageFile: makePrintFileName(printId, 'png'), copies: 2, grayscale: false, size: '4x6' }
  }
  if (remaining < 8_000_000) {
    return { printId, imageFile: makePrintFileName(printId, 'png'), copies: 1, grayscale: false, size: '5x7' }
  }
  if (remaining < 15_000_000) {
    return { printId, imageFile: makePrintFileName(printId, 'png'), copies: 2, grayscale: false, size: '5x7' }
  }
  return { printId, imageFile: makePrintFileName(printId, 'png'), copies: 1, grayscale: false, size: 'a4' }
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
) {
  const img = await loadImage(src)
  ctx.save()
  ctx.filter = filter
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
  layer.width = BASE_WIDTH
  layer.height = BASE_HEIGHT
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
  ctx.fillStyle = '#fafafa'
  ctx.fillRect(0, 0, BASE_WIDTH, BASE_HEIGHT)
  ctx.fillStyle = '#f4f4f5'
  for (let y = -BASE_HEIGHT; y < BASE_HEIGHT; y += 48) {
    ctx.save()
    ctx.translate(0, y)
    ctx.rotate(Math.PI / 4)
    ctx.fillRect(0, 0, 24, BASE_HEIGHT * 2)
    ctx.restore()
  }
}

async function drawCharacter(ctx: CanvasRenderingContext2D, key: 'groom' | 'bride', cs: CharactersState['groom']) {
  if (cs.x === null || cs.y === null) return

  const ex = findExpr(cs.exprId ?? DEFAULT_EXPR_ID)
  const hair = findHair(key, cs.hairId ?? DEFAULT_HAIR_ID)
  const hairColor = findHairColor(cs.hairColorId ?? DEFAULT_HAIR_COLOR_ID)
  const outfit = findOutfit(key, cs.outfitId ?? DEFAULT_OUTFIT_ID)
  const isDefaultOutfit = (cs.outfitId ?? DEFAULT_OUTFIT_ID) === DEFAULT_OUTFIT_ID
  const hasHairColor = hairColor?.id !== DEFAULT_HAIR_COLOR_ID
  const figureW = BASE_WIDTH * FIGURE_W_RATIO
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

async function drawPlacedItem(ctx: CanvasRenderingContext2D, placed: PlacedItem) {
  const item = findItem(placed.itemId)
  if (!item) return

  if (item.image) {
    await drawImage(ctx, item.image, placed.x, placed.y, item.defaultWidth, item.defaultHeight)
    return
  }

  ctx.save()
  ctx.fillStyle = item.thumbnail
  const radius = item.shape === 'circle' ? Math.min(item.defaultWidth, item.defaultHeight) / 2 : 12
  ctx.beginPath()
  ctx.roundRect(placed.x, placed.y, item.defaultWidth, item.defaultHeight, radius)
  ctx.fill()
  ctx.fillStyle = 'rgba(255,255,255,0.9)'
  ctx.font = '700 16px sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(item.name, placed.x + item.defaultWidth / 2, placed.y + item.defaultHeight / 2)
  ctx.restore()
}

export async function renderPrintImage(state: PrintRenderState): Promise<Blob> {
  const canvas = document.createElement('canvas')
  canvas.width = BASE_WIDTH
  canvas.height = BASE_HEIGHT
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('캔버스를 만들 수 없어요.')

  const background = state.canvasBackgroundId ? findItem(state.canvasBackgroundId) : undefined
  if (background?.image) {
    await drawImage(ctx, background.image, 0, 0, BASE_WIDTH, BASE_HEIGHT)
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

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob)
      else reject(new Error('PNG 파일을 만들 수 없어요.'))
    }, 'image/png')
  })
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

import { motion } from 'framer-motion'
import type { ReactNode } from 'react'
import { TRANSITIONS } from '../config/transitions'
import { useAppStore } from '../store/useAppStore'
import { formatWon } from '../utils/format'
import { PLAYER_INTRO_MESSAGES, PLAYER_INTRO_HINT } from '../config/players'

const T = TRANSITIONS

// 공통 와이프: 스큐된 브랜드 패널이 화면을 한 번 쓸고 지나간다(넘어가는 감각 강화).
export function WipeOverlay() {
  return (
    <motion.div
      className="pointer-events-none absolute inset-0 z-40 overflow-hidden"
      initial={{ x: '-105%' }}
      animate={{ x: '105%' }}
      transition={{ duration: T.wipe.duration, ease: T.wipe.ease }}
    >
      <div className="ml-[-15%] h-full w-[130%] -skew-x-12 bg-gradient-to-r from-brand-400 via-brand-300 to-brand-500" />
    </motion.div>
  )
}

// intro → worldcup: 버튼 부근(하단 중앙)에서 라이트 블룸이 퍼진다.
export function BloomOverlay() {
  return (
    <motion.div
      className="pointer-events-none absolute inset-0 z-50 flex items-end justify-center"
      initial={{ opacity: 1 }}
      animate={{ opacity: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: T.signature.bloom.duration, ease: 'easeOut' }}
    >
      <motion.div
        className="mb-48 h-40 w-40 rounded-full bg-white"
        style={{ filter: 'blur(24px)' }}
        initial={{ scale: 0.2, opacity: 0.95 }}
        animate={{ scale: 16, opacity: 0 }}
        transition={{ duration: T.signature.bloom.duration, ease: 'easeOut' }}
      />
    </motion.div>
  )
}

// worldcup → result: "취향 분석 중..." 로딩(샤이닝 링 + 도트). 탭하면 스킵.
export function AnalyzingOverlay() {
  return (
    <motion.div
      className="absolute inset-0 z-50 flex flex-col items-center justify-center gap-10 bg-brand-500/95 text-white"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <motion.div
        className="h-40 w-40 rounded-full border-8 border-white/25 border-t-white"
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
      />
      <p className="text-5xl font-bold">취향 분석 중...</p>
      <div className="flex gap-3">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="h-4 w-4 rounded-full bg-white"
            animate={{ opacity: [0.2, 1, 0.2] }}
            transition={{ repeat: Infinity, duration: 0.9, delay: i * 0.2 }}
          />
        ))}
      </div>
      <p className="mt-4 text-xl text-white/70">화면을 터치하면 결과로 넘어가요</p>
    </motion.div>
  )
}

// result 등장 직후 유형 이름에 "도장 찍히는" 스탬프.
export function StampOverlay() {
  return (
    <motion.div
      className="pointer-events-none absolute inset-0 z-50 flex items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      <motion.div
        className="flex h-60 w-60 items-center justify-center rounded-full border-[10px] border-brand-500 text-4xl font-extrabold text-brand-500"
        initial={{ scale: 2.6, opacity: 0, rotate: -18 }}
        animate={{ scale: 1, opacity: 1, rotate: -12 }}
        transition={{ type: 'spring', bounce: 0.55, duration: T.signature.stamp.duration }}
      >
        취향 확정!
      </motion.div>
    </motion.div>
  )
}

// result → budget: 선물상자가 아래에서 올라와 가운데 멈췄다가 위로 빠진다.
export function GiftOverlay() {
  return (
    <motion.div
      className="pointer-events-none absolute inset-0 z-50 flex items-center justify-center bg-brand-50/80"
      initial={{ opacity: 0 }}
      animate={{ opacity: [0, 1, 1, 0] }}
      exit={{ opacity: 0 }}
      transition={{ duration: T.signature.gift.duration, times: [0, 0.25, 0.75, 1] }}
    >
      <motion.div
        className="flex h-72 w-72 items-center justify-center rounded-[2rem] bg-brand-400 text-[7rem] shadow-2xl"
        initial={{ y: '120%', rotate: -8, opacity: 0 }}
        animate={{ y: ['120%', '0%', '0%', '-130%'], rotate: [-8, 0, 0, 8], opacity: [0, 1, 1, 0] }}
        transition={{ duration: T.signature.gift.duration, times: [0, 0.35, 0.7, 1], ease: 'easeInOut' }}
      >
        🎁
      </motion.div>
    </motion.div>
  )
}

// budget → decorate: 뽑힌 금액이 가운데서 떠올라 우상단(잔액)으로 흡수된다.
export function BudgetFlyOverlay() {
  const budget = useAppStore((s) => s.budget)
  return (
    <div className="pointer-events-none absolute inset-0 z-50">
      <motion.div
        className="absolute -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-brand-500 px-8 py-5 text-5xl font-bold text-white shadow-xl"
        initial={{ left: '50%', top: '50%', scale: 0.6, opacity: 0 }}
        animate={{
          left: ['50%', '50%', '50%', '88%'],
          top: ['50%', '45%', '45%', '7%'],
          scale: [0.6, 1.2, 1, 0.45],
          opacity: [0, 1, 1, 0],
        }}
        transition={{ duration: T.signature.budgetFly.duration, times: [0, 0.3, 0.6, 1], ease: 'easeInOut' }}
      >
        {budget === null ? '' : formatWon(budget)}
      </motion.div>
    </div>
  )
}

// decorate → complete: 흰색 셔터 플래시.
export function ShutterOverlay() {
  return (
    <motion.div
      className="pointer-events-none absolute inset-0 z-50 bg-white"
      initial={{ opacity: 0 }}
      animate={{ opacity: [0, 1, 0] }}
      exit={{ opacity: 0 }}
      transition={{ duration: T.signature.shutter.flash, times: [0, 0.25, 1], ease: 'easeOut' }}
    />
  )
}

// reset(처음으로): 화이트 페이드 후 intro.
export function WhiteFadeOverlay() {
  return (
    <motion.div
      className="pointer-events-none absolute inset-0 z-50 bg-white"
      initial={{ opacity: 0 }}
      animate={{ opacity: [0, 1, 0] }}
      exit={{ opacity: 0 }}
      transition={{ duration: T.signature.reset.duration, times: [0, 0.5, 1], ease: 'easeInOut' }}
    />
  )
}

// 둘이 모드: 각 플레이어 worldcup 직전 풀스크린 인트로 카드.
export function PlayerIntroCard({ player }: { player: number }) {
  return (
    <motion.div
      className="absolute inset-0 z-50 flex flex-col items-center justify-center gap-6 bg-brand-500 text-white"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <motion.span
        className="flex h-24 w-24 items-center justify-center rounded-full bg-white/15 text-5xl font-extrabold"
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', bounce: 0.5, delay: 0.1 }}
      >
        {player + 1}
      </motion.span>
      <motion.p
        className="px-10 text-center text-5xl font-bold leading-snug"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.18 }}
      >
        {PLAYER_INTRO_MESSAGES[player]}
      </motion.p>
      <p className="mt-4 text-xl text-white/70">{PLAYER_INTRO_HINT}</p>
    </motion.div>
  )
}

// decorate → complete: 셔터 순간 화면을 짧게 흔든다. active일 때 1회 재생.
export function ShakeWrapper({ active, children }: { active: boolean; children: ReactNode }) {
  return (
    <motion.div
      className="absolute inset-0"
      animate={active ? { x: [0, -14, 11, -8, 6, -3, 0], y: [0, 8, -6, 4, -2, 0] } : { x: 0, y: 0 }}
      transition={active ? { duration: T.signature.shutter.shake } : { duration: 0.001 }}
    >
      {children}
    </motion.div>
  )
}

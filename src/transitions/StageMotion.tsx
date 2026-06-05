import { motion, type Variants } from 'framer-motion'
import type { ReactNode } from 'react'
import { TRANSITIONS } from '../config/transitions'
import type { TransitionType } from './transitionType'

const T = TRANSITIONS

// 들어오는 화면의 전환(타입별) 설정.
function enterTransition(type: TransitionType) {
  switch (type) {
    case 'enterResult':
      return { type: 'spring' as const, bounce: T.signature.resultEnter.bounce, duration: T.signature.resultEnter.duration }
    case 'introToWorldcup':
      return { duration: T.signature.bloom.duration, ease: T.base.ease }
    case 'decorateToComplete':
      return { duration: T.signature.shutter.develop, ease: T.base.ease }
    case 'enterDecorate':
      return { duration: T.wipe.duration, ease: T.wipe.ease }
    default:
      return { duration: T.base.duration, ease: T.base.ease }
  }
}

// custom = TransitionType. initial/exit를 전환 종류별로 다르게 준다.
const variants: Variants = {
  initial: (type: TransitionType) => {
    switch (type) {
      case 'enterResult':
        return { opacity: 0, scale: 0.5 } // 작게 → scale+bounce 등장
      case 'introToWorldcup':
        return { opacity: 0, scale: T.signature.bloom.zoom } // 살짝 줌인
      case 'enterDecorate':
        return { opacity: 0, x: '55%' } // 옆에서 와이프 인
      case 'decorateToComplete':
        return { opacity: 0, scale: 1.12, filter: 'blur(18px)' } // 흐림 → 선명(인화)
      case 'reset':
      case 'initial':
        return { opacity: 0 }
      default:
        return { opacity: 0, y: T.base.slideUpPx } // 아래에서 슬라이드업
    }
  },
  animate: (type: TransitionType) => ({
    opacity: 1,
    x: 0,
    y: 0,
    scale: 1,
    filter: 'blur(0px)',
    transition: enterTransition(type),
  }),
  exit: (type: TransitionType) => {
    switch (type) {
      case 'enterDecorate':
        return { opacity: 0, y: '-35%', scaleY: 0.7, transition: { duration: 0.45, ease: T.base.ease } } // result가 위로 접혀 사라짐
      case 'reset':
        return { opacity: 0, transition: { duration: T.signature.reset.duration * 0.5 } }
      default:
        return { opacity: 0, y: -T.base.slideUpPx * 0.4, transition: { duration: T.base.duration * 0.5, ease: T.base.ease } }
    }
  },
}

// 스테이지 1개를 감싸는 모션 래퍼. revealed=false면 initial 상태로 대기(지연 등장: result).
export default function StageMotion({
  type,
  revealed,
  children,
}: {
  type: TransitionType
  revealed: boolean
  children: ReactNode
}) {
  return (
    <motion.div
      className="absolute inset-0"
      custom={type}
      variants={variants}
      initial="initial"
      animate={revealed ? 'animate' : 'initial'}
      exit="exit"
    >
      {children}
    </motion.div>
  )
}

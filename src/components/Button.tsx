import type { ButtonHTMLAttributes, ReactNode } from 'react'

// 터치용 공용 버튼. 타깃이 크고, 터치 시 선택 방지가 적용된다.
// 디자인은 placeholder 수준.
interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost'
  children: ReactNode
}

const VARIANT_CLASS: Record<NonNullable<ButtonProps['variant']>, string> = {
  primary: 'bg-brand-500 text-white active:bg-brand-600',
  secondary: 'bg-white text-brand-600 border-2 border-brand-400 active:bg-brand-50',
  ghost: 'bg-transparent text-gray-500 active:text-gray-700',
}

export default function Button({
  variant = 'primary',
  children,
  className = '',
  ...rest
}: ButtonProps) {
  return (
    <button
      {...rest}
      className={`select-none rounded-2xl px-8 py-5 text-2xl font-semibold shadow-sm transition-colors disabled:opacity-40 ${VARIANT_CLASS[variant]} ${className}`}
    >
      {children}
    </button>
  )
}

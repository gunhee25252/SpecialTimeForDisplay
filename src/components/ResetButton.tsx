import { useState } from 'react'
import { useAppStore } from '../store/useAppStore'

// 어느 화면에서든 처음(intro)으로 되돌리는 버튼. 우상단 고정.
export default function ResetButton() {
  const reset = useAppStore((s) => s.reset)
  const [isConfirming, setIsConfirming] = useState(false)

  const handleConfirm = () => {
    setIsConfirming(false)
    reset()
  }

  return (
    <>
      <button
        onClick={() => setIsConfirming(true)}
        className="absolute right-4 top-4 z-50 select-none rounded-full bg-black/30 px-5 py-3 text-lg font-medium text-white active:bg-black/50"
      >
        처음으로
      </button>

      {isConfirming && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="reset-confirm-title"
          className="absolute inset-0 z-[50000] flex items-center justify-center bg-gray-900/60 px-12"
        >
          <div className="w-full max-w-[760px] rounded-2xl border-4 border-brand-100 bg-white px-12 py-14 text-center shadow-2xl">
            <h2 id="reset-confirm-title" className="text-4xl font-black leading-tight text-gray-800">
              정말 처음으로 돌아가시겠습니까?
            </h2>
            <p className="mt-6 text-2xl font-bold leading-relaxed text-red-500">
              지금까지 진행한 내용은 저장되지 않고 모두 사라집니다.
            </p>
            <div className="mt-10 grid grid-cols-2 gap-5">
              <button
                type="button"
                onClick={() => setIsConfirming(false)}
                className="rounded-2xl border-2 border-gray-300 bg-white px-8 py-5 text-2xl font-black text-gray-600 active:bg-gray-100"
              >
                아니요
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                className="rounded-2xl bg-brand-500 px-8 py-5 text-2xl font-black text-white active:bg-brand-600"
              >
                네
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

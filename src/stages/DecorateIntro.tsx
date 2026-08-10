import { useAppStore } from '../store/useAppStore'
import StageLayout from '../components/StageLayout'
import Button from '../components/Button'

const GUIDE_ITEMS = [
  {
    title: '배경 꾸미기',
    description: '취향 추천을 참고해 사진의 장소와 분위기를 먼저 정해 보세요.',
  },
  {
    title: '신랑·신부 꾸미기',
    description: '헤어, 염색, 표정과 의상을 고르고 두 사람의 위치를 정해 보세요.',
  },
  {
    title: '오브젝트 꾸미기',
    description: '오브제와 문구를 배치하고 크기를 조절해 사진을 완성해 보세요.',
  },
]

export default function DecorateIntro() {
  const setStage = useAppStore((state) => state.setStage)

  return (
    <StageLayout>
      <div className="flex flex-1 flex-col items-center justify-center gap-10 text-center">
        <div>
          <p className="text-3xl font-black text-brand-500">꾸미기 안내</p>
          <h1 className="mt-5 text-6xl font-black leading-tight text-gray-800">
            나만의 웨딩 사진을
            <br />
            꾸며볼까요?
          </h1>
          <p className="mt-7 text-3xl font-semibold text-gray-600">
            세 단계로 차근차근 꾸미면 어렵지 않아요.
          </p>
        </div>

        <section className="w-full overflow-hidden rounded-[1.75rem] border-4 border-brand-100 bg-white px-10 py-6 shadow-sm">
          {GUIDE_ITEMS.map((item, index) => (
            <div
              key={item.title}
              className={`grid min-h-44 items-center gap-7 py-6 text-left ${
                index < GUIDE_ITEMS.length - 1 ? 'border-b-2 border-brand-100' : ''
              }`}
              style={{ gridTemplateColumns: '5rem minmax(0, 1fr)' }}
            >
              <span className="flex h-20 w-20 items-center justify-center rounded-full bg-brand-500 text-3xl font-black text-white">
                {index + 1}
              </span>
              <span>
                <span className="block text-3xl font-black text-gray-800">{item.title}</span>
                <span className="mt-3 block text-2xl font-semibold leading-relaxed text-gray-500">
                  {item.description}
                </span>
              </span>
            </div>
          ))}
        </section>

        <Button onClick={() => setStage('decorate')} className="px-20 py-7 text-3xl">
          꾸미기 시작
        </Button>
      </div>
    </StageLayout>
  )
}

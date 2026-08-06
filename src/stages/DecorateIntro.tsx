import { useAppStore } from '../store/useAppStore'
import StageLayout from '../components/StageLayout'
import Button from '../components/Button'

const GUIDE_ITEMS = [
  {
    title: '아이템 고르기',
    description: '배경, 헤어, 염색, 표정, 의상과 오브젝트를 눌러 적용해 보세요.',
  },
  {
    title: '원하는 곳에 배치하기',
    description: '캐릭터와 오브젝트를 손가락으로 끌어 원하는 위치로 옮길 수 있어요.',
  },
  {
    title: '크기와 구성 다듬기',
    description: '오브젝트를 선택한 뒤 +와 −로 크기를 조절하고 필요 없는 것은 삭제해 보세요.',
  },
  {
    title: '사진 프레임 맞추기',
    description: '프레임 조정에서 인쇄할 영역의 크기와 위치를 정한 뒤 완성해 주세요.',
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
            뽑은 예산 안에서 원하는 아이템을 자유롭게 골라보세요.
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

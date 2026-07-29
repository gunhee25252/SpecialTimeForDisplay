export interface Type16 {
  typeId: string
  code: string
  name: string
  description: string
}

export const TYPES_16: Type16[] = [
  {
    typeId: '01',
    code: 'IN-LIGHT-FANCY-MONO',
    name: '화이트 채플 로맨티스트',
    description: '밝은 실내 공간과 우아한 장식을 좋아해요. 색은 절제하되 분위기는 충분히 특별해야 마음이 움직이는 타입입니다.',
  },
  {
    typeId: '02',
    code: 'IN-LIGHT-FANCY-CHROMA',
    name: '블러썸 살롱',
    description: '화사한 조명, 풍성한 꽃, 부드러운 컬러가 잘 어울려요. 사진으로 남겼을 때 가장 로맨틱하게 보이는 장면을 선호합니다.',
  },
  {
    typeId: '03',
    code: 'IN-LIGHT-SIMPLE-MONO',
    name: '클린 스튜디오',
    description: '복잡한 장식보다 깨끗한 배경과 맑은 빛을 좋아해요. 오래 봐도 질리지 않는 단정한 결혼식 취향입니다.',
  },
  {
    typeId: '04',
    code: 'IN-LIGHT-SIMPLE-CHROMA',
    name: '소프트 데이라이트',
    description: '밝고 산뜻한 공간에 작은 컬러 포인트가 있는 구성을 좋아해요. 심플하지만 차갑지 않은 타입입니다.',
  },
  {
    typeId: '05',
    code: 'IN-DARK-FANCY-MONO',
    name: '블랙 타이 클래식',
    description: '어두운 조명과 고급스러운 장식이 주는 무게감을 선호해요. 드라마틱하지만 색은 절제된 쪽에 끌립니다.',
  },
  {
    typeId: '06',
    code: 'IN-DARK-FANCY-CHROMA',
    name: '시네마틱 볼룸',
    description: '강한 조명, 깊은 색감, 풍성한 연출이 어울려요. 결혼식이 한 편의 장면처럼 기억되길 바라는 타입입니다.',
  },
  {
    typeId: '07',
    code: 'IN-DARK-SIMPLE-MONO',
    name: '모던 갤러리',
    description: '차분하고 절제된 실내 공간을 좋아해요. 장식은 적어도 질감과 조명으로 분위기를 만드는 취향입니다.',
  },
  {
    typeId: '08',
    code: 'IN-DARK-SIMPLE-CHROMA',
    name: '딥 컬러 라운지',
    description: '조용한 무드 안에 깊은 컬러 포인트가 있는 장면에 끌려요. 흔하지 않고 감각적인 구성을 선호합니다.',
  },
  {
    typeId: '09',
    code: 'OUT-LIGHT-FANCY-MONO',
    name: '가든 채플',
    description: '야외의 개방감과 클래식한 웨딩 장식을 함께 좋아해요. 자연스럽지만 격식 있는 장면에 강합니다.',
  },
  {
    typeId: '10',
    code: 'OUT-LIGHT-FANCY-CHROMA',
    name: '플라워 가든 페스티벌',
    description: '햇살, 꽃, 색감이 가득한 장면에서 에너지를 느껴요. 밝고 생동감 있는 결혼식 취향입니다.',
  },
  {
    typeId: '11',
    code: 'OUT-LIGHT-SIMPLE-MONO',
    name: '오션뷰 미니멀',
    description: '풍경이 주인공이 되는 심플한 야외 예식을 좋아해요. 장식보다 공간 자체의 여백을 중요하게 봅니다.',
  },
  {
    typeId: '12',
    code: 'OUT-LIGHT-SIMPLE-CHROMA',
    name: '그린 피크닉',
    description: '가볍고 자연스러운 야외 분위기에 밝은 컬러가 더해진 장면을 선호해요. 편안하고 산뜻한 타입입니다.',
  },
  {
    typeId: '13',
    code: 'OUT-DARK-FANCY-MONO',
    name: '문라이트 가든',
    description: '야외의 낭만에 어두운 조명과 클래식한 장식을 더한 분위기에 끌려요. 차분하지만 인상적인 취향입니다.',
  },
  {
    typeId: '14',
    code: 'OUT-DARK-FANCY-CHROMA',
    name: '선셋 플라워',
    description: '노을빛, 풍성한 꽃, 따뜻한 색감이 잘 맞아요. 감정이 진하게 남는 장면을 좋아하는 타입입니다.',
  },
  {
    typeId: '15',
    code: 'OUT-DARK-SIMPLE-MONO',
    name: '노을 미니멀',
    description: '장식은 덜어내고 빛과 풍경으로 분위기를 만드는 쪽을 선호해요. 고요하고 여운이 긴 취향입니다.',
  },
  {
    typeId: '16',
    code: 'OUT-DARK-SIMPLE-CHROMA',
    name: '웜 나이트 아웃도어',
    description: '편안한 야외 무드에 따뜻한 컬러와 낮은 조명이 어울려요. 격식보다 분위기와 기억을 중시합니다.',
  },
]

export function findTypeByCode(code: string): Type16 | undefined {
  return TYPES_16.find((t) => t.code === code)
}

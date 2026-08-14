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
    description: '밝은 실내와 우아한 장식을 좋아해요. 절제된 색 속 특별한 분위기에 끌려요.',
  },
  {
    typeId: '02',
    code: 'IN-LIGHT-FANCY-CHROMA',
    name: '블러썸 살롱',
    description: '화사한 빛과 풍성한 꽃을 좋아해요. 로맨틱하게 남는 장면을 선호해요.',
  },
  {
    typeId: '03',
    code: 'IN-LIGHT-SIMPLE-MONO',
    name: '클린 스튜디오',
    description: '깨끗한 배경과 맑은 빛을 좋아해요. 오래 봐도 단정한 장면을 선호해요.',
  },
  {
    typeId: '04',
    code: 'IN-LIGHT-SIMPLE-CHROMA',
    name: '소프트 데이라이트',
    description: '밝은 공간과 작은 색 포인트를 좋아해요. 심플하지만 따뜻한 장면에 끌려요.',
  },
  {
    typeId: '05',
    code: 'IN-DARK-FANCY-MONO',
    name: '블랙 타이 클래식',
    description: '어두운 조명과 고급 장식을 좋아해요. 색이 절제된 장면에 끌려요.',
  },
  {
    typeId: '06',
    code: 'IN-DARK-FANCY-CHROMA',
    name: '시네마틱 볼룸',
    description: '강한 조명과 깊은 색감을 좋아해요. 영화 같은 장면을 오래 기억해요.',
  },
  {
    typeId: '07',
    code: 'IN-DARK-SIMPLE-MONO',
    name: '모던 갤러리',
    description: '차분하고 절제된 실내를 좋아해요. 적은 장식도 질감과 빛으로 채워요.',
  },
  {
    typeId: '08',
    code: 'IN-DARK-SIMPLE-CHROMA',
    name: '딥 컬러 라운지',
    description: '조용한 무드와 깊은 색에 끌려요. 흔하지 않은 감각적인 구성을 좋아해요.',
  },
  {
    typeId: '09',
    code: 'OUT-LIGHT-FANCY-MONO',
    name: '가든 채플',
    description: '탁 트인 야외와 클래식 장식을 좋아해요. 자연스럽고 격식 있는 장면에 강해요.',
  },
  {
    typeId: '10',
    code: 'OUT-LIGHT-FANCY-CHROMA',
    name: '플라워 가든 페스티벌',
    description: '햇살과 꽃이 가득한 장면을 좋아해요. 밝고 생동감 있는 분위기에 끌려요.',
  },
  {
    typeId: '11',
    code: 'OUT-LIGHT-SIMPLE-MONO',
    name: '오션뷰 미니멀',
    description: '풍경이 주인공인 야외 예식을 좋아해요. 장식보다 공간의 여백을 중요하게 봐요.',
  },
  {
    typeId: '12',
    code: 'OUT-LIGHT-SIMPLE-CHROMA',
    name: '그린 피크닉',
    description: '편안한 야외와 밝은 색을 좋아해요. 가볍고 산뜻한 장면을 선호해요.',
  },
  {
    typeId: '13',
    code: 'OUT-DARK-FANCY-MONO',
    name: '문라이트 가든',
    description: '야외의 낭만과 어두운 빛을 좋아해요. 차분하고 인상적인 장면에 끌려요.',
  },
  {
    typeId: '14',
    code: 'OUT-DARK-FANCY-CHROMA',
    name: '선셋 플라워',
    description: '노을과 꽃, 따뜻한 색을 좋아해요. 감정이 진하게 남는 장면에 끌려요.',
  },
  {
    typeId: '15',
    code: 'OUT-DARK-SIMPLE-MONO',
    name: '노을 미니멀',
    description: '장식을 덜고 빛과 풍경을 살려요. 고요하고 여운이 긴 장면을 좋아해요.',
  },
  {
    typeId: '16',
    code: 'OUT-DARK-SIMPLE-CHROMA',
    name: '웜 나이트 아웃도어',
    description: '편안한 야외와 따뜻한 빛을 좋아해요. 격식보다 분위기와 기억을 중시해요.',
  },
]

export function findTypeByCode(code: string): Type16 | undefined {
  return TYPES_16.find((t) => t.code === code)
}

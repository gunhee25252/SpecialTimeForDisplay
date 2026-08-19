# 장신구 이미지 (캐릭터 장착용)

`public/images/accessories/` 원본과 `public/images/props/prop17.png`을 여기에 복사해 뒀습니다.
편집한 뒤 같은 파일명으로 이 폴더에 다시 넣어 주시면, 제가 `public/`으로 옮기고 코드에 반영하겠습니다.

## 캔버스 규격 (중요)

캐릭터 레이어(머리·헤어·표정·옷)는 **전부 1000×1400 PNG 한 장**이고, 서로 좌표를 맞춘 채
그대로 겹쳐서 그립니다. 장신구도 **똑같이 1000×1400 캔버스에** 제자리에 그려 주시면
위치 계산 없이 그냥 겹쳐서 장착됩니다.

- 크기: **1000 × 1400**
- 배경: **투명**
- 형식: PNG (알파 포함)
- 장신구는 캔버스 안에서 **실제로 붙을 위치에** 그려 주세요 (가운데 정렬 X)

`_기준-캔버스/` 폴더에 정렬 기준으로 쓸 파일을 넣어 뒀습니다.

- `캐릭터-신랑-합성.png`, `캐릭터-신부-합성.png` — 완성된 모습 (배경 투명)
- `head.png`, `body.png`, `face00.png` — 기본 머리·몸·표정 레이어
- `man_hair_01.png`, `woman_hair_05.png` — 헤어 표본
- `suit00.png`, `dress00.png` — 옷 표본

편집기에서 합성 이미지를 맨 아래 깔고, 그 위에 장신구를 올려서 위치를 잡으시면 됩니다.

## 그리는 순서 (겹치는 순서)

현재 캐릭터는 이 순서로 겹칩니다.

```
머리(head) → 헤어 → 표정 → 옷(body/dress/suit)
```

옷이 가장 위라서, **목걸이는 옷보다 위에 그려져야 보입니다.** 장신구를 어느 층에 넣을지는
제가 코드에서 부위별로 나눠 처리하겠습니다 (모자·헤어핀은 헤어 위, 안경은 표정 위, 목걸이는 옷 위).

## 파일 목록

| 파일 | 상점 이름 | 붙는 곳 | 현재 크기 |
|---|---|---|---|
| accessory-crystal-tiara.png | 크리스털 티아라 | 머리 | 520×260 |
| accessory-ribbon-hat.png | 리본 모자 | 머리 | 520×360 |
| accessory-top-hat.png | 탑햇 | 머리 | 480×360 |
| accessory-floral-hairpin.png | 꽃 헤어핀 | 머리 | 500×220 |
| accessory-heart-sunglasses.png | 하트 선글라스 | 얼굴 | 520×230 |
| accessory-cat-eye-sunglasses.png | 캣아이 선글라스 | 얼굴 | 520×230 |
| accessory-aviator-sunglasses.png | 보잉 선글라스 | 얼굴 | 520×230 |
| accessory-oval-sunglasses.png | 타원 선글라스 | 얼굴 | 520×230 |
| accessory-slim-sunglasses.png | 슬림 선글라스 | 얼굴 | 520×230 |
| accessory-round-sunglasses.png | 레트로 선글라스 | 얼굴 | 520×230 |
| accessory-star-sunglasses.png | 별 선글라스 | 얼굴 | 520×230 |
| accessory-rimless-sunglasses.png | 반무테 선글라스 | 얼굴 | 520×230 |
| prop17.png | 동그리 안경 | 얼굴 | 1327×508 |
| accessory-pearl-necklace.png | 진주 목걸이 | 목 | 500×260 |
| accessory-pearl-earring.png | 진주 귀걸이 (상점에서 뺀 상태) | 귀 | 220×260 |
| accessory-gold-hoop.png | 골드 링 귀걸이 (상점에서 뺀 상태) | 귀 | 220×260 |
| accessory-pearl-earrings.png | (미사용) 진주 귀걸이 다른 버전 | 귀 | 520×220 |
| accessory-gold-hoops.png | (미사용) 골드 링 다른 버전 | 귀 | 520×220 |

- `prop17.png`는 오브젝트 폴더에 있지만 상점에서는 장신구로 묶여 있습니다.
- 귀걸이 2종(`pearl-earring`, `gold-hoop`)은 지금 상점에서 빼둔 상태입니다. 새로 그려서 주시면 다시 넣겠습니다.
- `pearl-earrings`, `gold-hoops`(복수형)는 코드에서 쓰지 않는 파일입니다. 참고용으로만 뒀습니다.

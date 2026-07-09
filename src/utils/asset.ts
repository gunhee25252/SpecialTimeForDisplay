// public/ 자산 경로를 Vite base(kiosk는 './')에 맞춰 해석한다.
// 예: assetUrl('images/backgrounds/chapel.png') → './images/backgrounds/chapel.png'
export function assetUrl(path: string): string {
  return import.meta.env.BASE_URL + path.replace(/^\//, '')
}

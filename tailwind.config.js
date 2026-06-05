/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // 전시 메인 컬러 #86BBFF(=brand-400) 기준 팔레트.
        // 색감 교체는 이 값들만 수정하면 전체 UI에 반영된다.
        brand: {
          50: '#eef5ff',
          100: '#dbeaff',
          200: '#c2dcff',
          300: '#a8ccff',
          400: '#86bbff',
          500: '#5a9ef7',
          600: '#3f82e0',
          700: '#2f66b8',
        },
      },
    },
  },
  plugins: [],
}

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // 莫兰迪主色调：灰蓝
        primary: {
          50: '#f2f4f7',
          100: '#e2e6ed',
          200: '#c8cfd9',
          300: '#a0acbd',
          400: '#7b8fa1',
          500: '#62768a',
          600: '#4e5f72',
          700: '#414e5d',
          800: '#38434f',
          900: '#323a44',
        },
        // 点缀色：灰粉
        accent: {
          50: '#f9f6f5',
          100: '#f2ecea',
          200: '#e6d9d6',
          300: '#d4beba',
          400: '#c9a7a6',
          500: '#b58a8a',
          600: '#9e6f70',
          700: '#835c5d',
          800: '#6d4e4f',
          900: '#5c4445',
        },
        // 莫兰迪绿（鼠尾草绿）
        sage: {
          300: '#a3b5a6',
          400: '#7d967e',
          500: '#5f7a60',
        },
        // 燕麦色
        warm: {
          300: '#d4c5a4',
          400: '#c0aa7d',
          500: '#b09661',
        },
        // 薰衣草灰
        lavender: {
          300: '#c8c0d8',
          400: '#b8b0c8',
          500: '#9c8fad',
        },
        // Notion 风格中性色
        notion: {
          bg:     '#ffffff',
          hover:  '#f7f6f3',
          line:   '#ededeb',
          text:   '#37352f',
          gray:   '#9b9a97',
          light:  '#f7f6f3',
        },
        sidebar: '#fbfbfa',
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'Noto Sans SC', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        card: '8px',
        btn: '6px',
      },
      boxShadow: {
        card: '0 0 0 1px rgba(0,0,0,0.03), 0 1px 2px rgba(0,0,0,0.04)',
        'card-hover': '0 0 0 1px rgba(0,0,0,0.05), 0 2px 8px rgba(0,0,0,0.06)',
      },
    },
  },
  plugins: [],
};

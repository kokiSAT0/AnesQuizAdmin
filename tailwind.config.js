// ts-node を通じて TypeScript のカラートークンを読み込みます
require('ts-node/register');
const { colors: tokenColors } = require('./theme/tokens.ts');

// '#RRGGBB' を 'r g b' 形式に変換する簡単な関数
function hexToRgb(hex) {
  const m = hex.replace('#', '').match(/.{2}/g);
  return m
    ? `${parseInt(m[0], 16)} ${parseInt(m[1], 16)} ${parseInt(m[2], 16)}`
    : '0 0 0';
}

// Tailwind 用のカラー設定と CSS 変数を作成
const lightVars = {};
const darkVars = {};
const twColors = {};

for (const key of Object.keys(tokenColors.light)) {
  lightVars[`--color-${key}`] = hexToRgb(tokenColors.light[key]);
  darkVars[`--color-${key}`] = hexToRgb(tokenColors.dark[key]);
  twColors[key] = `rgb(var(--color-${key})/<alpha-value>)`;
}

/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'media',
  content: ['./app/**/*.{tsx,jsx,ts,js}', 'components/**/*.{tsx,jsx,ts,js}'],
  presets: [require('nativewind/preset')],
  safelist: [
    {
      pattern:
        /(bg|border|text|stroke|fill)-(primary|secondary|tertiary|error|success|warning|info|typography|outline|background|indicator)-(0|50|100|200|300|400|500|600|700|800|900|950|white|gray|black|error|warning|muted|success|info|light|dark|primary)/,
    },
  ],
  theme: {
    extend: {
      colors: twColors,
      fontFamily: {
        heading: undefined,
        body: undefined,
        mono: undefined,
        roboto: ['Roboto', 'sans-serif'],
      },
      fontWeight: {
        extrablack: '950',
      },
      fontSize: {
        '2xs': '10px',
      },
      boxShadow: {
        'hard-1': '-2px 2px 8px 0px rgba(38, 38, 38, 0.20)',
        'hard-2': '0px 3px 10px 0px rgba(38, 38, 38, 0.20)',
        'hard-3': '2px 2px 8px 0px rgba(38, 38, 38, 0.20)',
        'hard-4': '0px -3px 10px 0px rgba(38, 38, 38, 0.20)',
        'hard-5': '0px 2px 10px 0px rgba(38, 38, 38, 0.10)',
        'soft-1': '0px 0px 10px rgba(38, 38, 38, 0.1)',
        'soft-2': '0px 0px 20px rgba(38, 38, 38, 0.2)',
        'soft-3': '0px 0px 30px rgba(38, 38, 38, 0.1)',
        'soft-4': '0px 0px 40px rgba(38, 38, 38, 0.1)',
      },
    },
  },
  plugins: [
    ({ addBase }) => {
      // CSS 変数としてカラーを定義
      addBase({ ':root': lightVars, '.dark': darkVars });
    },
  ],
};

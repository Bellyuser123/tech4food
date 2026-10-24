/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // PlateProof 360 Signature Palette
        burgundy: {
          50: '#FDF2F2',
          100: '#FBE6E7',
          200: '#F5C2C4',
          300: '#E99094',
          400: '#D75B61',
          500: '#B9252B',
          600: '#9E1B22', // Primary brand color
          700: '#82161C', // Hover / Dark accent
          800: '#681116',
          900: '#4D0D10',
          950: '#2F070A',
        },
        cream: {
          50: '#FDFCF9',
          100: '#FAF7F0',
          200: '#F5EFE3',
          300: '#ECE2CF',
          400: '#E0D0B6',
          500: '#D0BA97',
        },
        surface: {
          light: '#FFFFFF',
          cream: '#F9F6F0',
          muted: '#F3EFE7',
          dark: '#1C1917',
        },
        safety: {
          green: '#1E6B47',
          greenLight: '#E8F5EE',
          amber: '#B86800',
          amberLight: '#FEF7ED',
          red: '#9E1B22',
          redLight: '#FEECEB',
          blue: '#1E4E79',
          blueLight: '#EDF5FC',
        },
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['Outfit', 'Inter', 'sans-serif'],
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
      boxShadow: {
        card: '0 2px 8px -2px rgba(47, 7, 10, 0.05), 0 4px 16px -4px rgba(47, 7, 10, 0.08)',
        cardHover: '0 8px 24px -4px rgba(47, 7, 10, 0.12), 0 4px 12px -2px rgba(47, 7, 10, 0.06)',
        dropdown: '0 10px 30px -5px rgba(47, 7, 10, 0.15)',
        toast: '0 12px 28px -4px rgba(47, 7, 10, 0.18)',
      },
    },
  },
  plugins: [],
};

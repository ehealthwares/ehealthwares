import type { Config } from 'tailwindcss';

/**
 * eHealthwares brand system — derived from the "02-hex-module-cluster" logo
 * system (see ehealthwares-logo/README.md). Every module inherits a color:
 *
 *   Blue   #2563EB  Core technology platform / trust / infrastructure
 *   Teal   #0D9488  Clinical care & healthcare services
 *   Green  #16A34A  Pharmacy, wellness & health outcomes
 *   Violet #7C3AED  Digital health, innovation & analytics
 *   Amber  #F59E0B  Payments, billing & healthcare commerce
 *   Coral  #F43F5E  Emergency care, alerts & critical services
 *   Navy   #0F2A43  Enterprise management & administration
 *   Slate  #64748B  Supporting text
 */

const withShades = (hex: string) => {
  return {
    DEFAULT: hex,
    50: `${hex}0d`,
    100: `${hex}1a`,
    200: `${hex}33`,
    300: `${hex}4d`,
    400: `${hex}66`,
    500: `${hex}80`,
    600: hex,
    700: `${hex}cc`,
    800: `${hex}e6`,
    900: `${hex}f2`,
  };
};

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: '#0F2A43',
          50: '#F2F6FA',
          100: '#E3EBF4',
          200: '#C2D3E6',
          300: '#8FAECB',
          400: '#5583AB',
          500: '#2F5A85',
          600: '#1D4267',
          700: '#163453',
          800: '#0F2A43',
          900: '#0A1D2E',
          950: '#06121D',
        },
        brand: {
          ...withShades('#2563EB'),
        },
        blue: {
          ...withShades('#2563EB'),
        },
        violet: {
          ...withShades('#7C3AED'),
        },
        teal: {
          ...withShades('#0D9488'),
        },
        green: {
          ...withShades('#16A34A'),
        },
        amber: {
          ...withShades('#F59E0B'),
        },
        coral: {
          ...withShades('#F43F5E'),
        },
      },
      fontFamily: {
        display: ['Urbanist', 'Inter', 'system-ui', 'sans-serif'],
        body: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        glass: '0 8px 32px rgba(15, 42, 67, 0.10)',
        'glass-lg': '0 24px 64px rgba(15, 42, 67, 0.16)',
        glow: '0 0 0 1px rgba(37,99,235,0.12), 0 8px 40px -8px rgba(37,99,235,0.45)',
        'glow-violet': '0 8px 40px -8px rgba(124,58,237,0.45)',
        'glow-teal': '0 8px 40px -8px rgba(13,148,136,0.45)',
        'glow-coral': '0 8px 40px -8px rgba(244,63,94,0.45)',
        'glow-amber': '0 8px 40px -8px rgba(245,158,11,0.45)',
      },
      backgroundImage: {
        'hero-gradient':
          'radial-gradient(ellipse 80% 60% at 20% 0%, rgba(124,58,237,0.16) 0%, transparent 60%), radial-gradient(ellipse 60% 50% at 90% 10%, rgba(37,99,235,0.14) 0%, transparent 60%), linear-gradient(180deg, #F6F8FC 0%, #FDFDFF 100%)',
        'section-gradient':
          'linear-gradient(180deg, #FFFFFF 0%, #F4F7FC 100%)',
        'cta-gradient':
          'linear-gradient(120deg, #2563EB 0%, #0D9488 55%, #7C3AED 120%)',
        'cta-gradient-alt':
          'linear-gradient(120deg, #7C3AED 0%, #2563EB 60%, #0D9488 120%)',
        'brand-gradient': 'linear-gradient(135deg, #2563EB 0%, #7C3AED 100%)',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-14px)' },
        },
        'glow-pulse': {
          '0%, 100%': { opacity: '0.55' },
          '50%': { opacity: '1' },
        },
        'gradient-x': {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        marquee: {
          from: { transform: 'translateX(0)' },
          to: { transform: 'translateX(-50%)' },
        },
        'fade-up': {
          from: { opacity: '0', transform: 'translateY(24px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        float: 'float 7s ease-in-out infinite',
        'glow-pulse': 'glow-pulse 4s ease-in-out infinite',
        'gradient-x': 'gradient-x 6s ease infinite',
        marquee: 'marquee 36s linear infinite',
        'fade-up': 'fade-up 0.7s ease both',
      },
    },
  },
  plugins: [],
};

export default config;

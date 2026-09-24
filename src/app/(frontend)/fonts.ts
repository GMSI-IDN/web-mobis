import localFont from 'next/font/local'

export const inter = localFont({
  src: [
    {
      path: './inter/web/Inter-Regular.woff2',
      weight: '400',
      style: 'normal',
    },
    {
      path: './inter/web/Inter-Medium.woff2',
      weight: '500',
      style: 'normal',
    },
    {
      path: './inter/web/Inter-Bold.woff2',
      weight: '700',
      style: 'normal',
    },
  ],
  variable: '--font-inter',
  display: 'swap',
  // Disable preloading to free 336KB of critical bandwidth for the LCP image.
  // Fonts still load via CSS @font-face with font-display:swap — text appears
  // immediately with the system font and swaps to Inter when it finishes loading.
  preload: false,
})

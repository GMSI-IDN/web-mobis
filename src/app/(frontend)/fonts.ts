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
})

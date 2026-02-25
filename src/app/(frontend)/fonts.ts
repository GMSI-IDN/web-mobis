import localFont from 'next/font/local'

export const inter = localFont({
  src: [
    {
      path: './inter/InterVariable.ttf',
      weight: '100 900',
      style: 'normal',
    },
    {
      path: './inter/InterVariable-Italic.ttf',
      weight: '100 900',
      style: 'italic',
    },
  ],
  display: 'swap',
  variable: '--font-inter',
})

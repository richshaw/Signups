import localFont from 'next/font/local';

export const inter = localFont({
  src: [
    { path: './fonts/InterVariable.ttf', style: 'normal', weight: '100 900' },
    { path: './fonts/InterVariable-Italic.ttf', style: 'italic', weight: '100 900' },
  ],
  variable: '--font-inter',
  display: 'swap',
});

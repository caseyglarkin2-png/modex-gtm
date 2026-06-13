import localFont from 'next/font/local';

// Brand-supplied TTFs, scoped to the command-center route so they do not
// affect the rest of the RevOps OS shell. Exposed as CSS variables that the
// console.css token block consumes via --font-sans / --font-mono.
export const inter = localFont({
  src: [
    { path: './_fonts/Inter-Regular-400.ttf', weight: '400', style: 'normal' },
    { path: './_fonts/Inter-Medium-500.ttf', weight: '500', style: 'normal' },
    { path: './_fonts/Inter-SemiBold-600.ttf', weight: '600', style: 'normal' },
    { path: './_fonts/Inter-Bold-700.ttf', weight: '700', style: 'normal' },
  ],
  display: 'swap',
  variable: '--cc-font-sans',
});

export const jetbrainsMono = localFont({
  src: [
    { path: './_fonts/JetBrainsMono-Regular-400.ttf', weight: '400', style: 'normal' },
    { path: './_fonts/JetBrainsMono-Bold-700.ttf', weight: '700', style: 'normal' },
  ],
  display: 'swap',
  variable: '--cc-font-mono',
});

import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import PWARegister from './pwa-register';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = { title: 'KONKI | Aprenda a conquistar', description: 'Transforme objetivos em esforço, progresso e conquistas reais.', manifest:'/manifest.webmanifest', themeColor:[{media:'(prefers-color-scheme: light)',color:'#F7F6F1'},{media:'(prefers-color-scheme: dark)',color:'#0D0F0D'}], appleWebApp:{capable:true,statusBarStyle:'black-translucent',title:'KONKI'}, icons:{icon:[{url:'/favicon.svg',type:'image/svg+xml'},{url:'/icon-192.png',sizes:'192x192'}],apple:'/apple-touch-icon.png'}, openGraph:{title:'KONKI | Aprenda a conquistar',description:'Transforme objetivos em esforço, progresso e conquistas reais.',type:'website',images:['https://konki.quintellaeric11.chatgpt.site/og.png']}, twitter:{card:'summary_large_image',title:'KONKI | Aprenda a conquistar',description:'Transforme objetivos em esforço, progresso e conquistas reais.',images:['https://konki.quintellaeric11.chatgpt.site/og.png']} };

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover"/><meta name="mobile-web-app-capable" content="yes"/><script dangerouslySetInnerHTML={{__html:`try{const t=localStorage.getItem('konki-theme')||'system';const d=t==='dark'||(t==='system'&&matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.dataset.theme=d?'dark':'light';document.documentElement.style.colorScheme=d?'dark':'light'}catch{}`}}/></head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <PWARegister/>{children}
      </body>
    </html>
  );
}

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

export const metadata: Metadata = { title: 'CORRE | Conquiste o que você quer', description: 'Transforme objetivos em jornadas de desenvolvimento, responsabilidade e conquista.', manifest:'/manifest.webmanifest', themeColor:'#173f36', appleWebApp:{capable:true,statusBarStyle:'black-translucent',title:'CORRE'}, icons:{icon:[{url:'/favicon.svg',type:'image/svg+xml'},{url:'/icon-192.png',sizes:'192x192'}],apple:'/apple-touch-icon.png'}, openGraph:{title:'CORRE | Conquiste o que você quer',description:'Transforme objetivos em jornadas de desenvolvimento, responsabilidade e conquista.',type:'website'} };

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <head><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover"/><meta name="mobile-web-app-capable" content="yes"/></head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <PWARegister/>{children}
      </body>
    </html>
  );
}

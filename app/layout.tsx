import type { Metadata } from 'next'
import './globals.css'
import { Toaster } from 'sonner'

export const metadata: Metadata = {
  title: 'Canfly Banita',
  description: 'Создавайте забавные изображения с Canfly Banita',
  generator: 'v0.dev',
  applicationName: 'Banita',
  keywords: ['Canfly', 'Banita', 'Stable Diffusion', 'AI Art', 'Text-to-Image', 'Generative AI', 'Hugging Face'],
  authors: [{ name: 'Adiom Timur', url: 'https://github.com/adiom' }],
  creator: 'Adiom Timur',
  publisher: 'Canfly',
  metadataBase: new URL('https://banita.canfly.org'),
  openGraph: {
    title: 'Canfly Banita',
    description: 'Создавайте забавные изображения с Canfly Banita',
    url: 'https://banita.canfly.org',
    siteName: 'Canfly Banita',
    images: [
      {
        url: 'https://banita.canfly.org/banita-vector.png',
        width: 1024,
        height: 1024,
        alt: 'Banita — AI Art Generator',
      },
    ],
    locale: 'ru_RU',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    site: '@canfly_ai',
    creator: '@adiom_dev',
    title: 'Canfly Banita',
    description: 'Создавайте забавные изображения с Canfly Banita',
    images: ['https://banita.canfly.org/banita-dalle3.png'],
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>
        {children}
        <Toaster position="bottom-left" expand={true} richColors />
      </body>
    </html>
  )
}

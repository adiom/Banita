import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Canfly Banita',
  description: '2025',
  generator: 'v0.dev',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  )
}

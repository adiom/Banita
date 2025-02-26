import ImageGenerator from "@/components/ImageGenerator"
import Link from "next/link"

export default function Home() {
  return (
    <div className="min-h-screen relative">
      {/* Заголовок слева вверху */}
      <div className="absolute top-4 left-4">
        <h1 className="text-xl font-bold dark:text-zinc-300">
          Canfly Banita
        </h1>
      </div>

      {/* Основной контент по центру */}
      <div className="flex justify-center items-center min-h-screen">
        <ImageGenerator />
      </div>

      {/* Ссылка на Terms справа внизу */}
      <div className="absolute bottom-4 right-4">
        <Link 
          href="https://canfly.org/dev/Terms" 
          className="text-sm text-muted-foreground hover:underline"
          target="_blank"
          rel="noopener noreferrer"
        >
          TERMS
        </Link>
      </div>
    </div>
  )
}
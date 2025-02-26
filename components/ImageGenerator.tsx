"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { toast } from 'sonner'

interface Generation {
  id: number
  prompt: string
  image_url: string
  created_at: string
}

export default function ImageGenerator() {
  const [prompt, setPrompt] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [generations, setGenerations] = useState<Generation[]>([])
  const [elapsedTime, setElapsedTime] = useState(0)
  const scrollRef = useRef<HTMLDivElement>(null)
  const timerRef = useRef<NodeJS.Timeout>()
  const startTimeRef = useRef<number>(0)

  useEffect(() => {
    fetchGenerations()
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [generations])

  const fetchGenerations = async () => {
    try {
      const response = await fetch("/api/generations")
      if (response.ok) {
        const data = await response.json()
        setGenerations(data)
      }
    } catch (error) {
      console.error("Error fetching generations:", error)
    }
  }

  const startTimer = () => {
    startTimeRef.current = Date.now()
    timerRef.current = setInterval(() => {
      setElapsedTime(Date.now() - startTimeRef.current)
    }, 10) // Обновляем каждые 10мс
  }

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
    }
    setElapsedTime(0)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!prompt.trim()) return

    setIsLoading(true)
    startTimer() // Запускаем таймер

    try {
      const response = await fetch("/api/generate-image", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt }),
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        let errorDetails
        try {
          errorDetails = JSON.parse(data.details)
        } catch {
          errorDetails = {
            message: data.details || 'Неизвестная ошибка',
            warnings: []
          }
        }
  
        toast.error('Ошибка генерации', {
          description: (
            <div className="mt-2">
              <div className="font-medium text-red-500">
                {errorDetails.message}
              </div>
              {errorDetails.warnings?.map((warning: string, i: number) => (
                <div key={i} className="mt-1 text-sm text-gray-500">
                  {warning}
                </div>
              ))}
              <div className="mt-2 text-xs text-gray-400">
                Статус: {errorDetails.status} {errorDetails.statusText}
              </div>
            </div>
          ),
          duration: 8000,
          position: "bottom-right"
        })
        
        throw new Error(data.details)
      }
      
      await fetchGenerations()
      setPrompt("")
    } catch (error) {
      console.error("Error generating image:", error)
    } finally {
      setIsLoading(false)
      stopTimer() // Останавливаем таймер
    }
  }

  return (
    <div className="flex justify-center items-start min-h-screen bg-background p-4">
      <div className="w-full max-w-[800px] h-[calc(100vh-2rem)] flex flex-col bg-card rounded-lg shadow-lg">
        <ScrollArea className="flex-1 p-4" ref={scrollRef}>
          <div className="space-y-6">
            {generations.map((gen) => (
              <div key={gen.id} className="flex flex-col">
                <div className="bg-muted/30 rounded-lg p-4">
                  <p className="text-sm text-muted-foreground mb-2">{gen.prompt}</p>
                  <img 
                    src={gen.image_url || "/placeholder.svg"} 
                    alt={gen.prompt} 
                    className="w-full rounded-lg shadow-md"
                  />
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        <div className="border-t bg-card p-4">
          <form onSubmit={handleSubmit} className="flex gap-4">
            <Input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Опишите изображение, которое хотите создать..."
              className="flex-1"
              disabled={isLoading}
            />
            <Button type="submit" disabled={isLoading}>
              {isLoading ? `${elapsedTime}мс` : "Создать"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
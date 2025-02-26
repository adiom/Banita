import { HfInference } from "@huggingface/inference"
import { put } from "@vercel/blob"
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'
import { db } from '@/app/db/config'

const hf = new HfInference(process.env.HUGGING_FACE_API_TOKEN)
const GENERATIONS_DIR = join(process.cwd(), 'generations')
const IS_LOCAL = process.env.NODE_ENV === 'development'

async function ensureGenerationsDir() {
  if (IS_LOCAL && !existsSync(GENERATIONS_DIR)) {
    await mkdir(GENERATIONS_DIR, { recursive: true })
    console.log(`Создана папка: ${GENERATIONS_DIR}`)
  }
}

async function ensureTable() {
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS banita (
        id SERIAL PRIMARY KEY,
        prompt TEXT NOT NULL,
        image_url TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `)
  } catch (error) {
    console.error("Error creating table:", error)
  }
}

async function validateHFToken() {
  try {
    const response = await fetch("https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-2-1", {
      headers: {
        Authorization: `Bearer ${process.env.HUGGING_FACE_API_TOKEN}`
      }
    });
    
    console.log("HF API Token validation status:", response.status);
    const data = await response.json();
    console.log("HF API Token validation response:", data);
    
    return response.ok;
  } catch (error) {
    console.error("HF API Token validation error:", error);
    return false;
  }
}

export async function POST(request: Request) {
  const startTime = Date.now()
  
  try {
    const { prompt } = await request.json()
    console.log(`[${new Date().toISOString()}] Получен запрос с prompt:`, prompt)
    
    if (!prompt) {
      return new Response(JSON.stringify({ error: "Prompt is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      })
    }

    await ensureTable()

    // Прямой запрос к API Hugging Face
    const response = await fetch("https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-2-1", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.HUGGING_FACE_API_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        inputs: prompt,
        //parameters: {
        //  num_inference_steps: 20, // Снизьте до 10-15
        //  guidance_scale: 7.5,
        //  width: 384, // Число должно быть кратным 64 (384, 512)
        //  height: 384
        //}
      })
    });

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(JSON.stringify({
        status: response.status,
        statusText: response.statusText,
        message: errorData.error,
        warnings: errorData.warnings || []
      }))
    }

    const imageBuffer = await response.arrayBuffer()
    
    if (!imageBuffer || imageBuffer.byteLength === 0) {
      throw new Error("Empty image response")
    }

    const fileName = `generated-${Date.now()}.png`

    // Сохраняем локально только в режиме разработки
    if (IS_LOCAL) {
      const filePath = join(GENERATIONS_DIR, fileName)
      await writeFile(filePath, Buffer.from(imageBuffer))
      console.log(`Файл сохранен локально: ${filePath}`)
    }

    // Сохраняем в Vercel Blob
    const blob = new Blob([imageBuffer], { type: 'image/png' })
    const { url } = await put(fileName, blob, {
      access: "public",
    })

    console.log("Изображение сохранено в Blob:", url)

    // Сохраняем в базу данных
    await db.query(
      'INSERT INTO banita (prompt, image_url) VALUES ($1, $2)',
      [prompt, url]
    )

    const executionTime = Date.now() - startTime
    console.log(`Генерация завершена за ${executionTime}ms`)

    return new Response(JSON.stringify({ 
      url,
      executionTime 
    }), {
      headers: { "Content-Type": "application/json" },
    })

  } catch (error) {
    const errorTime = Date.now() - startTime
    console.error(`[${new Date().toISOString()}] Ошибка после ${errorTime}ms:`, error)
    
    return new Response(JSON.stringify({ 
      error: "Failed to generate image", 
      details: error instanceof Error ? error.message : "Unknown error",
      executionTime: errorTime
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
}
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

export async function POST(request: Request) {
  const { prompt } = await request.json()

  try {
    await ensureTable()

    const imageResponse = await hf.textToImage({
      inputs: prompt,
      model: "stabilityai/stable-diffusion-2-1",
      parameters: {
        num_inference_steps: 30,
        guidance_scale: 7.5,
        width: 768,
        height: 768,
      },
    })

    const fileName = `generated-${Date.now()}.png`
    
    // Сохраняем локально только в режиме разработки
    if (IS_LOCAL) {
      const filePath = join(GENERATIONS_DIR, fileName)
      await writeFile(filePath, Buffer.from(await imageResponse.arrayBuffer()))
      console.log(`Файл сохранен локально: ${filePath}`)
    }

    // Всегда сохраняем в Vercel Blob
    const blob = new Blob([imageResponse])
    const { url } = await put(fileName, blob, {
      access: "public",
    })
    console.log(`Файл сохранен в Vercel Blob: ${url}`)

    await db.query(
      'INSERT INTO banita (prompt, image_url) VALUES ($1, $2)',
      [prompt, url]
    )

    return new Response(imageResponse)
  } catch (error) {
    console.error("Error generating image:", error)
    return new Response(JSON.stringify({ error: "Failed to generate image" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
}
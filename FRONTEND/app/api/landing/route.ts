import { readFileSync } from 'fs'
import { join } from 'path'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const landingHtmlPath = join(process.cwd(), 'public', 'landing.html')
    const landingHtml = readFileSync(landingHtmlPath, 'utf-8')
    
    return new NextResponse(landingHtml, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
      },
    })
  } catch (error) {
    return new NextResponse('Landing page not found', { status: 404 })
  }
}

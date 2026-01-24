'use server'

import { createClient } from '@/lib/supabase/server'
import { v4 as uuidv4 } from 'uuid'
import puppeteer from 'puppeteer'
import * as cheerio from 'cheerio'

// Type definitions
export type ScrapeResult = {
    success: boolean
    data?: {
        id?: string
        title: string
        description: string
        imageUrl: string | null
        startDate: string | null
        endDate?: string | null
        location?: string | null
        url: string
        ticketUrl?: string | null
        organizer?: string | null
    }
    error?: string
}

const MONTHS: Record<string, number> = {
    'ianuarie': 0, 'februarie': 1, 'martie': 2, 'aprilie': 3, 'mai': 4, 'iunie': 5,
    'iulie': 6, 'august': 7, 'septembrie': 8, 'octombrie': 9, 'noiembrie': 10, 'decembrie': 11,
    'january': 0, 'february': 1, 'march': 2, 'april': 3, 'may': 4, 'june': 5,
    'july': 6, 'september': 8, 'october': 9, 'november': 10, 'december': 11,
    'jan': 0, 'feb': 1, 'mar': 2, 'apr': 3, 'jun': 5,
    'jul': 6, 'aug': 7, 'sep': 8, 'oct': 9, 'nov': 10, 'dec': 11
}

function parseDateFromText(text: string): string | null {
    if (!text) return null
    try {
        const lowerText = text.toLowerCase()
        const foundMonths = Object.keys(MONTHS).filter(m => lowerText.includes(m))
        if (foundMonths.length === 0) return null

        foundMonths.sort((a, b) => b.length - a.length)

        for (const monthKey of foundMonths) {
            const escapedMonth = monthKey
            const dateRegex = new RegExp(`(?:(\\d{1,2})(?:st|nd|rd|th)?\\s+(?:of\\s+)?${escapedMonth})|(?:${escapedMonth}\\s+(\\d{1,2})(?:st|nd|rd|th)?)`, 'i')

            const match = lowerText.match(dateRegex)
            if (match) {
                const dayStr = match[1] || match[2]
                const day = parseInt(dayStr)
                const month = MONTHS[monthKey]

                let year = new Date().getFullYear()
                const yearMatch = lowerText.match(/\b(202[4-9])\b/)
                if (yearMatch) {
                    year = parseInt(yearMatch[1])
                } else {
                    const now = new Date()
                    if (month < now.getMonth() || (month === now.getMonth() && day < now.getDate())) {
                        year += 1
                    }
                }

                let hours = 19
                let minutes = 0
                const timeMatch = lowerText.match(/(\d{1,2}):(\d{2})/)
                if (timeMatch) {
                    hours = parseInt(timeMatch[1])
                    minutes = parseInt(timeMatch[2])
                }

                const date = new Date(year, month, day, hours, minutes)
                if (!isNaN(date.getTime())) return date.toISOString()
            }
        }
    } catch (e) {
        console.error('API: Error parsing date', e)
    }
    return null
}

async function uploadImageFromBuffer(buffer: Buffer, currentUserId: string): Promise<string | null> {
    try {
        const filename = `${currentUserId}/${uuidv4()}.jpg`
        const supabase = await createClient()

        const { error: uploadError } = await supabase.storage
            .from('business-images')
            .upload(filename, buffer, {
                contentType: 'image/jpeg',
                upsert: false
            })

        if (uploadError) {
            console.error('Error uploading event image:', uploadError)
            return null
        }

        const { data: { publicUrl } } = supabase.storage
            .from('business-images')
            .getPublicUrl(filename)

        return publicUrl
    } catch (error) {
        console.error('Exception uploading event image:', error)
        return null
    }
}

export async function scrapeAndSaveEvent(url: string, businessId: string, cityId: string): Promise<ScrapeResult> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Unauthorized' }

    if (!url || typeof url !== 'string' || !url.includes('facebook.com')) {
        return { success: false, error: 'Please provide a valid Facebook URL' }
    }

    let browser = null
    try {
        browser = await puppeteer.launch({
            headless: true,
            args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage", "--disable-accelerated-2d-canvas", "--disable-gpu"]
        })

        const page = await browser.newPage()
        await page.setViewport({ width: 1920, height: 1080 })
        await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")

        console.log(`API: Puppeteer navigating to ${url}`)
        await page.goto(url, { waitUntil: "networkidle2", timeout: 60000 })

        // 1. Expand content (More Aggressive)
        try {
            await page.evaluate(async () => {
                const clickAll = () => {
                    const buttons = document.querySelectorAll('div[role="button"], span[role="button"], a, span')
                    let clicked = 0
                    buttons.forEach(b => {
                        const t = b.textContent?.trim() || ''
                        if (['See more', 'Vezi mai mult', 'mai mult', '...more'].some(p => t.includes(p))) {
                            // @ts-ignore
                            b.click()
                            clicked++
                        }
                    })
                    return clicked
                }

                // Try multiple times to catch dynamic loads
                clickAll()
                await new Promise(r => setTimeout(r, 1000))
                clickAll()
            })
            await new Promise(r => setTimeout(r, 2000)) // Wait for text expansion
        } catch { }

        // 2. Extract Data
        const data = await page.evaluate(() => {
            const getMeta = (p: string) => document.querySelector(`meta[property="${p}"]`)?.getAttribute("content") || null

            const title = getMeta("og:title") || document.title

            // Full Description Extraction (Logic from reference)
            let fullDescription = ""
            // @ts-ignore
            const potentialDescriptions = []

            // Strategy 1: Description areas
            const descSelectors = ['[data-testid="event-permalink-details"]', 'div[role="main"] span[dir="auto"]']
            descSelectors.forEach(sel => {
                document.querySelectorAll(sel).forEach(el => {
                    const t = el.textContent?.trim()
                    // @ts-ignore
                    if (t && t.length > 50) potentialDescriptions.push(t)
                })
            })

            // Strategy 2: Longest span text
            document.querySelectorAll('span[dir="auto"]').forEach(span => {
                const t = span.textContent?.trim()
                // @ts-ignore
                if (t && t.length > 100) potentialDescriptions.push(t)
            })

            if (potentialDescriptions.length > 0) {
                // @ts-ignore
                fullDescription = potentialDescriptions.reduce((a, b) => a.length > b.length ? a : b, "")
            }
            if (!fullDescription) fullDescription = getMeta("og:description") || ""

            // Extract Location (Regex from reference)
            let locationAddress: string | null = null
            const bodyText = document.body.innerText
            const locMatches = bodyText.match(/(?:Nicolae|Strada|Str\.|Bulevardul|Bd\.|Calea)[^,\n]+(?:,\s*[^,\n]+)?(?:,\s*\d{6})?(?:,\s*[A-Za-z]+)?/i)
            if (locMatches) locationAddress = locMatches[0]

            // Extract Organizer
            let organizer: string | null = null
            const hostMatch = bodyText.match(/(?:hosted by|găzduit de|by)\s+([^\n]+)/i)
            if (hostMatch) organizer = hostMatch[1].trim()

            // Extract Ticket URL
            let ticketUrl: string | null = null
            const ticketLinks = Array.from(document.querySelectorAll('a[href*="bilet"], a[href*="ticket"], a[href*="iabilet"]'))
            if (ticketLinks.length > 0) {
                // @ts-ignore
                ticketUrl = ticketLinks[0].href
            }

            // Image Logic (Largest)
            let imageUrl = getMeta("og:image")
            const imgs = Array.from(document.querySelectorAll('img'))
            // @ts-ignore
            const relevantImages = imgs
                .filter(i => i.src.includes('scontent') && i.naturalWidth > 500 && i.naturalHeight > 200)
                .map(i => ({ src: i.src, area: i.naturalWidth * i.naturalHeight }))
                // @ts-ignore
                .sort((a, b) => b.area - a.area)

            if (relevantImages.length > 0) {
                // @ts-ignore
                imageUrl = relevantImages[0].src
            }

            return {
                title,
                description: fullDescription,
                imageUrl,
                locationAddress,
                organizer,
                ticketUrl,
                bodyText: document.body.innerText,
                html: document.body.innerHTML
            }
        })

        // 3. Date Parsing
        let startDate: string | null = null
        const $ = cheerio.load(data.html)
        $('script[type="application/ld+json"]').each((_, el) => {
            try {
                const j = JSON.parse($(el).html() || '{}')
                const items = Array.isArray(j) ? j : [j]
                const event = items.find(i => i['@type'] === 'Event' || i.startDate)
                if (event?.startDate) startDate = new Date(event.startDate).toISOString()
            } catch { }
        })

        if (!startDate) {
            const metaDate = $('meta[property="og:start_time"]').attr('content') || $('meta[property="event:start_time"]').attr('content')
            if (metaDate && !isNaN(new Date(metaDate).getTime())) startDate = new Date(metaDate).toISOString()
        }

        if (!startDate) {
            startDate = parseDateFromText(data.description)
            if (!startDate) startDate = parseDateFromText(data.bodyText.substring(0, 3000))
        }

        if (!startDate) throw new Error('Nu am putut identifica data evenimentului.')

        // 4. Image Upload
        let finalImageUrl = data.imageUrl
        if (data.imageUrl) {
            try {
                const p2 = await browser.newPage()
                const res = await p2.goto(data.imageUrl, { waitUntil: 'networkidle2' })
                if (res) {
                    const buf = await res.buffer()
                    const up = await uploadImageFromBuffer(buf, user.id)
                    if (up) finalImageUrl = up
                }
                await p2.close()
            } catch (e) {
                console.error('Image upload failed', e)
            }
        }

        const end = new Date(startDate)
        end.setHours(end.getHours() + 3)

        // Enrich description with details if found
        let richDescription = data.description
        if (data.locationAddress) richDescription = `📍 Locație: ${data.locationAddress}\n\n${richDescription}`
        if (data.organizer) richDescription = `👤 Organizator: ${data.organizer}\n\n${richDescription}`
        if (data.ticketUrl) richDescription = `${richDescription}\n\n🎫 Bilete: ${data.ticketUrl}`

        const eventData = {
            business_id: businessId,
            city_id: cityId,
            title: data.title || 'Event',
            description: richDescription, // Save enriched description
            start_date: startDate,
            end_date: end.toISOString(),
            image_url: finalImageUrl,
            facebook_event_url: url,
            is_active: true,
            location: data.locationAddress // Save separate location if column exists
        }

        const { data: ins, error: dbErr } = await supabase.from('events').insert(eventData).select().single()
        if (dbErr) throw new Error(dbErr.message)

        return {
            success: true,
            data: {
                ...ins,
                imageUrl: ins.image_url,
                startDate: ins.start_date,
                url: ins.facebook_event_url,
                location: ins.location
            }
        }

    } catch (error) {
        console.error('Scraping Error:', error)
        return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    } finally {
        if (browser) await browser.close()
    }
}


import * as cheerio from 'cheerio'
import he from 'he'

const FB_EVENT_URL = 'https://m.facebook.com/events/1413627793820323/'

async function debugImageExtraction() {
    console.log(`Debug: fetching ${FB_EVENT_URL}`)
    try {
        const fetchOptions = {
            method: 'GET',
            headers: {
                "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.2 Mobile/15E148 Safari/604.1",
                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
                "Accept-Language": "en-US,en;q=0.9",
                "Sec-Fetch-User": "?1",
                "Upgrade-Insecure-Requests": "1",
            },
        }

        const response = await fetch(FB_EVENT_URL, fetchOptions)
        if (!response.ok) {
            console.error('Failed to fetch:', response.status)
            return
        }

        const html = await response.text()
        const image = processHtml(html, 'mobile')

        if (image) {
            console.log('\n--- Verifying Image Access ---')
            try {
                const imgRes = await fetch(image)
                console.log(`Fetch Image Status: ${imgRes.status}`)
                console.log(`Content-Type: ${imgRes.headers.get('content-type')}`)
                console.log(`Content-Length: ${imgRes.headers.get('content-length')}`)
            } catch (err) {
                console.error('Failed to fetch image:', err)
            }
        } else {
            console.log('\nNO IMAGE FOUND')
        }

    } catch (e) {
        console.error('Error:', e)
    }
}

function processHtml(html: string, type: string): string | null {
    console.log(`\n--- Processing ${type} HTML ---`)
    const $ = cheerio.load(html)

    // 1. Meta tags
    let ogImage = $('meta[property="og:image"]').attr('content') || $('meta[name="og:image"]').attr('content')
    console.log('1. OG Image:', ogImage)

    // 2. JSON-LD
    let jsonImage: string | null = null
    $('script[type="application/ld+json"]').each((_, element) => {
        const jsonText = $(element).html()
        if (jsonText) {
            try {
                const data = JSON.parse(jsonText)
                if (data.image) {
                    jsonImage = Array.isArray(data.image) ? data.image[0] : (data.image.url || data.image)
                    console.log('2. JSON-LD Image:', jsonImage)
                }
            } catch { }
        }
    })

    // 3. Regex/Script extraction (the logic from scrape-event.ts)
    const scriptContent = html
    const cdnPatterns = [
        /https?:\/\/scontent[^"'\s\\]+\.jpg[^"'\s\\]*/gi,
        /https?:\/\/scontent[^"'\s\\]+\.png[^"'\s\\]*/gi,
        /https?:\/\/external[^"'\s\\]+\.jpg[^"'\s\\]*/gi,
    ]

    const matches: string[] = []
    for (const pattern of cdnPatterns) {
        const m = scriptContent.match(pattern)
        if (m) matches.push(...m)
    }

    // Clean matches
    const cleanedUrls = matches.map(url =>
        url.replace(/\\u([0-9A-Fa-f]{4})/g, (_, hex) =>
            String.fromCharCode(parseInt(hex, 16))
        ).replace(/\\\//g, '/')
    )

    console.log(`3. Regex found ${cleanedUrls.length} potential images`)

    const highRes = cleanedUrls.find(url =>
        url.includes('_n.jpg') || url.includes('_o.jpg') ||
        url.includes('p720x720') || url.includes('p960x960')
    )
    console.log('   High Res Candidate:', highRes)

    return highRes || jsonImage || ogImage || null
}

debugImageExtraction()

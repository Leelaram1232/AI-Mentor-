import { NextResponse } from 'next/server';

/**
 * GET /api/scrape-notes?topic=XYZ&lang=English
 * Scrapes Wikipedia for the given topic and returns it as HTML Study Notes.
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const topic = searchParams.get('topic');
    const lang = searchParams.get('lang') || 'English';

    if (!topic) {
      return NextResponse.json({ error: 'Topic is required' }, { status: 400 });
    }

    // Map language to Wikipedia language codes
    const WIKI_LANG_CODES = {
      'English': 'en', 'Hindi': 'hi', 'Telugu': 'te', 'Tamil': 'ta',
      'Kannada': 'kn', 'Bengali': 'bn', 'Marathi': 'mr', 'Gujarati': 'gu',
      'Malayalam': 'ml', 'Spanish': 'es', 'French': 'fr', 'German': 'de', 'Japanese': 'ja',
    };
    const langCode = WIKI_LANG_CODES[lang] || 'en';

    // Step 1: Search Wikipedia for the closest matching page title
    const searchUrl = `https://${langCode}.wikipedia.org/w/api.php?action=opensearch&search=${encodeURIComponent(topic)}&limit=1&namespace=0&format=json`;
    const searchRes = await fetch(searchUrl, { signal: AbortSignal.timeout(5000) });
    
    if (!searchRes.ok) throw new Error('Failed to search Wikipedia');
    const searchData = await searchRes.json();
    
    // searchData format: [ "Search Term", ["Result Title"], [""], ["Link"] ]
    const pageTitle = searchData[1]?.[0];

    if (!pageTitle) {
      // Fallback search if exact topic not found
      return NextResponse.json({ 
        notes: `<p><em>No definitive study notes found for "${topic}" in ${lang}.</em></p><p>We recommend watching the video tutorial on the left to master this topic!</p>` 
      });
    }

    // Step 2: Fetch the page summary (extracts the lead sections formatted as HTML)
    const extractUrl = `https://${langCode}.wikipedia.org/api/rest_v1/page/html/${encodeURIComponent(pageTitle)}`;
    const extractRes = await fetch(extractUrl, { signal: AbortSignal.timeout(5000) });

    if (!extractRes.ok) throw new Error('Failed to fetch Wikipedia extract');
    let htmlContent = await extractRes.text();

    // Step 3: Clean up the HTML (remove Wikipedia-specific classes, links, and style tags)
    // We do basic string replacement since we're formatting for a clean "Study Notes" view
    htmlContent = htmlContent
      .replace(/<link.*?>/gi, '')
      .replace(/<style.*?>.*?<\/style>/gis, '')
      .replace(/<script.*?>.*?<\/script>/gis, '')
      .replace(/<sup.*?<\/sup>/gi, '') // Remove citation brackets like [1]
      .replace(/<a[^>]*>(.*?)<\/a>/gi, '$1') // Strip links but keep text
      .replace(/about="#.*?"/gi, '')
      .replace(/data-mw=".*?"/gi, '')
      .replace(/id=".*?"/gi, '')
      .replace(/class=".*?"/gi, '');

    // Extract just the first few paragraphs (introductory section) to keep notes concise
    const paragraphs = htmlContent.match(/<p>.*?<\/p>/gis) || [];
    const lists = htmlContent.match(/<ul>.*?<\/ul>/gis) || [];
    
    // Combine intro paragraphs and any top-level lists (useful for definitions/features)
    let finalHtml = `<h3>📚 ${pageTitle}</h3>`;
    finalHtml += paragraphs.slice(0, 3).join('\n'); // Take top 3 paragraphs
    if (lists.length > 0) finalHtml += lists[0];    // Take first list if exists

    if (!finalHtml.includes('<p>')) {
      finalHtml = `<p><em>Basic notes loaded for ${topic}. Check the video for practical implementation!</em></p>`;
    }

    // Append a small footer
    finalHtml += `<br><p style="font-size: 0.75rem; color: var(--text-secondary); text-align: right;"><em>Source: Web Scraped Knowledge Base</em></p>`;

    return NextResponse.json({ notes: finalHtml });

  } catch (error) {
    console.error('Notes Error:', error);
    return NextResponse.json(
      { notes: `<p style="color: var(--error-red);"><em>Failed to load study notes. Please check your connection or try again.</em></p>` },
      { status: 500 }
    );
  }
}

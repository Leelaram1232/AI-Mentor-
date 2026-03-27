import { NextResponse } from 'next/server';

const YT_API_KEY = process.env.YOUTUBE_API_KEY || process.env.NEXT_PUBLIC_YOUTUBE_API_KEY || '';

const LANG_CODES = {
  'English': 'en', 'Hindi': 'hi', 'Telugu': 'te', 'Tamil': 'ta',
  'Kannada': 'kn', 'Bengali': 'bn', 'Marathi': 'mr', 'Gujarati': 'gu',
  'Malayalam': 'ml', 'Spanish': 'es', 'French': 'fr', 'German': 'de', 'Japanese': 'ja',
};

function getEmbedURL(videoId) {
  if (!videoId) return '';
  return `https://www.youtube-nocookie.com/embed/${videoId}?rel=0&modestbranding=1`;
}

function formatDuration(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function formatISO8601(duration) {
  if (!duration) return '';
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return '';
  const h = parseInt(match[1] || '0');
  const m = parseInt(match[2] || '0');
  const s = parseInt(match[3] || '0');
  if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function formatCount(num) {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return String(num);
}

/**
 * YouTube Data API v3 search (server-side, no CORS issues)
 */
async function searchYouTubeAPI(query, language, maxResults) {
  if (!YT_API_KEY) return null;

  const langCode = LANG_CODES[language] || 'en';
  const params = new URLSearchParams({
    part: 'snippet',
    q: query,
    type: 'video',
    order: 'viewCount',
    maxResults: String(maxResults),
    relevanceLanguage: langCode,
    videoDuration: 'medium',
    videoEmbeddable: 'true',
    key: YT_API_KEY,
  });

  try {
    const res = await fetch(`https://www.googleapis.com/youtube/v3/search?${params}`, {
      signal: AbortSignal.timeout(6000),
    });
    if (!res.ok) {
      console.error('[YT API] Search failed:', res.status, await res.text().catch(() => ''));
      return null;
    }
    const data = await res.json();
    if (!data.items?.length) return null;

    // Get video statistics
    const videoIds = data.items.map(i => i.id.videoId).join(',');
    const statsRes = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=statistics,contentDetails&id=${videoIds}&key=${YT_API_KEY}`,
      { signal: AbortSignal.timeout(6000) }
    );
    const statsData = statsRes.ok ? await statsRes.json() : { items: [] };
    const statsMap = {};
    (statsData.items || []).forEach(v => { statsMap[v.id] = v; });

    return data.items.map(item => {
      const stats = statsMap[item.id.videoId];
      const views = parseInt(stats?.statistics?.viewCount || '0');
      const likes = parseInt(stats?.statistics?.likeCount || '0');
      return {
        videoId: item.id.videoId,
        title: item.snippet.title,
        thumbnail: item.snippet.thumbnails?.medium?.url || `https://i.ytimg.com/vi/${item.id.videoId}/mqdefault.jpg`,
        channelName: item.snippet.channelTitle,
        duration: formatISO8601(stats?.contentDetails?.duration),
        views: formatCount(views),
        likes: formatCount(likes),
        viewCount: views,
        embedUrl: getEmbedURL(item.id.videoId),
        watchUrl: `https://www.youtube.com/watch?v=${item.id.videoId}`,
      };
    }).sort((a, b) => b.viewCount - a.viewCount);
  } catch (err) {
    console.error('[YT API] Error:', err.message);
    return null;
  }
}

/**
 * Piped API fallback (server-side — no CORS restrictions)
 */
async function searchPiped(query, maxResults) {
  const instances = [
    'https://pipedapi.kavin.rocks',
    'https://pipedapi.adminforge.de',
    'https://api.piped.yt',
  ];

  // Try all instances in parallel, use first success
  const results = await Promise.allSettled(
    instances.map(async (instance) => {
      const url = `${instance}/search?q=${encodeURIComponent(query)}&filter=videos`;
      const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
      if (!res.ok) throw new Error(`${instance} returned ${res.status}`);
      const data = await res.json();
      if (!data.items?.length) throw new Error('No items');

      return data.items
        .filter(v => v.type === 'stream')
        .slice(0, maxResults)
        .map(v => {
          const videoId = v.url?.split('v=')[1]?.split('&')[0] || '';
          return {
            videoId,
            title: v.title || '',
            thumbnail: v.thumbnail || `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`,
            channelName: v.uploaderName || '',
            duration: formatDuration(v.duration || 0),
            views: formatCount(v.views || 0),
            likes: '',
            viewCount: v.views || 0,
            embedUrl: getEmbedURL(videoId),
            watchUrl: `https://www.youtube.com/watch?v=${videoId}`,
          };
        })
        .filter(v => v.videoId)
        .sort((a, b) => b.viewCount - a.viewCount);
    })
  );

  for (const r of results) {
    if (r.status === 'fulfilled' && r.value?.length) return r.value;
  }
  return null;
}

/**
 * Invidious API fallback (server-side — no CORS restrictions)
 */
async function searchInvidious(query, language, maxResults) {
  const instances = [
    'https://inv.nadeko.net',
    'https://invidious.nerdvpn.de',
    'https://iv.datura.network',
  ];

  const langCode = LANG_CODES[language] || 'en';

  // Try all instances in parallel, use first success
  const results = await Promise.allSettled(
    instances.map(async (instance) => {
      const res = await fetch(
        `${instance}/api/v1/search?q=${encodeURIComponent(query)}&type=video&sort_by=view_count&region=${langCode}`,
        { signal: AbortSignal.timeout(5000) }
      );
      if (!res.ok) throw new Error(`${instance} returned ${res.status}`);
      const data = await res.json();
      if (!Array.isArray(data) || !data.length) throw new Error('No data');

      return data
        .filter(v => v.type === 'video')
        .slice(0, maxResults)
        .sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0))
        .map(v => ({
          videoId: v.videoId,
          title: v.title,
          thumbnail: v.videoThumbnails?.[3]?.url || `https://i.ytimg.com/vi/${v.videoId}/mqdefault.jpg`,
          channelName: v.author || '',
          duration: v.lengthSeconds ? formatDuration(v.lengthSeconds) : '',
          views: formatCount(v.viewCount || 0),
          likes: '',
          viewCount: v.viewCount || 0,
          embedUrl: getEmbedURL(v.videoId),
          watchUrl: `https://www.youtube.com/watch?v=${v.videoId}`,
        }));
    })
  );

  for (const r of results) {
    if (r.status === 'fulfilled' && r.value?.length) return r.value;
  }
  return null;
}

/**
 * Direct YouTube HTML scraper (fallback if API key is invalid/missing and instances block)
 */
async function searchYouTubeScrape(query, maxResults) {
  try {
    const res = await fetch(`https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      signal: AbortSignal.timeout(6000),
    });
    if (!res.ok) return null;
    const html = await res.text();
    const match = html.match(/var ytInitialData = (\{.*?\});<\/script>/);
    if (!match) return null;
    
    const data = JSON.parse(match[1]);
    const contents = data.contents?.twoColumnSearchResultsRenderer?.primaryContents?.sectionListRenderer?.contents?.[0]?.itemSectionRenderer?.contents;
    
    if (!contents) return null;
    
    const results = [];
    for (const item of contents) {
      if (item.videoRenderer) {
        const v = item.videoRenderer;
        // Avoid live streams or weird items lacking duration
        if (!v.lengthText) continue; 
        const viewsStr = v.viewCountText?.simpleText || '0';
        const viewsNum = parseInt(viewsStr.replace(/,/g, '').replace(/[^\d]/g, '') || '0');
        results.push({
          videoId: v.videoId,
          title: v.title?.runs?.[0]?.text || '',
          thumbnail: v.thumbnail?.thumbnails?.[0]?.url || `https://i.ytimg.com/vi/${v.videoId}/mqdefault.jpg`,
          channelName: v.ownerText?.runs?.[0]?.text || '',
          duration: v.lengthText?.simpleText || '',
          views: formatCount(viewsNum),
          likes: '',
          viewCount: viewsNum,
          embedUrl: getEmbedURL(v.videoId),
          watchUrl: `https://www.youtube.com/watch?v=${v.videoId}`,
        });
        if (results.length >= maxResults) break;
      }
    }
    return results.length > 0 ? results : null;
  } catch (err) {
    console.error('[YT Scrape] Error:', err.message);
    return null;
  }
}

// ─── GET /api/youtube-search?q=...&maxResults=2&language=English ───────────

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q') || '';
  const maxResults = parseInt(searchParams.get('maxResults') || '2');
  const language = searchParams.get('language') || 'English';

  if (!query) {
    return NextResponse.json({ videos: [] });
  }

  // 1. Try YouTube Data API first (most reliable when key is valid)
  const ytResults = await searchYouTubeAPI(query, language, maxResults);
  if (ytResults?.length) {
    return NextResponse.json({ videos: ytResults, source: 'youtube' });
  }

  // 2. If official API failed, try ALL fallbacks in parallel for speed
  console.log('[YT Search] Official API failed/no key, trying fallbacks in parallel...');
  const [pipedResult, invResult, scrapeResult] = await Promise.allSettled([
    searchPiped(query, maxResults),
    searchInvidious(query, language, maxResults),
    searchYouTubeScrape(query, maxResults),
  ]);

  if (pipedResult.status === 'fulfilled' && pipedResult.value?.length) {
    return NextResponse.json({ videos: pipedResult.value, source: 'piped' });
  }
  if (invResult.status === 'fulfilled' && invResult.value?.length) {
    return NextResponse.json({ videos: invResult.value, source: 'invidious' });
  }
  if (scrapeResult.status === 'fulfilled' && scrapeResult.value?.length) {
    return NextResponse.json({ videos: scrapeResult.value, source: 'scraper' });
  }

  // 3. All failed — return empty
  console.warn('[YT Search] All sources failed for query:', query);
  return NextResponse.json({ videos: [], source: 'none' });
}

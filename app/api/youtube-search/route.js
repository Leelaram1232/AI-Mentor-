import { NextResponse } from 'next/server';

const YT_API_KEY = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY || '';

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
      signal: AbortSignal.timeout(8000),
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
      { signal: AbortSignal.timeout(8000) }
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

  for (const instance of instances) {
    try {
      const url = `${instance}/search?q=${encodeURIComponent(query)}&filter=videos`;
      const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
      if (!res.ok) continue;
      const data = await res.json();
      if (!data.items?.length) continue;

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
    } catch {
      continue;
    }
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

  for (const instance of instances) {
    try {
      const langCode = LANG_CODES[language] || 'en';
      const res = await fetch(
        `${instance}/api/v1/search?q=${encodeURIComponent(query)}&type=video&sort_by=view_count&region=${langCode}`,
        { signal: AbortSignal.timeout(8000) }
      );
      if (!res.ok) continue;
      const data = await res.json();
      if (!Array.isArray(data) || !data.length) continue;

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
    } catch {
      continue;
    }
  }
  return null;
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

  // 1. Try YouTube Data API
  const ytResults = await searchYouTubeAPI(query, language, maxResults);
  if (ytResults?.length) {
    return NextResponse.json({ videos: ytResults, source: 'youtube' });
  }

  // 2. Try Piped API
  const pipedResults = await searchPiped(query, maxResults);
  if (pipedResults?.length) {
    return NextResponse.json({ videos: pipedResults, source: 'piped' });
  }

  // 3. Try Invidious API
  const invResults = await searchInvidious(query, language, maxResults);
  if (invResults?.length) {
    return NextResponse.json({ videos: invResults, source: 'invidious' });
  }

  // 4. No results — return empty
  return NextResponse.json({ videos: [], source: 'none' });
}

// YouTube Video Search Utility — Enhanced with Popularity Sorting
// Uses YouTube Data API v3 for best results (sorted by view count)
// Falls back to Invidious API (free, no key needed)

const YT_API_KEY = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY || '';

/**
 * Build a YouTube search query optimized for learning content in user's language
 */
export function buildYouTubeSearchQuery(topic, language = 'English') {
  const langSuffix = (language && language !== 'English') ? ` in ${language}` : '';
  // Combine topic with educational keywords but allow more variety
  const keywords = ['tutorial', 'overview', 'explained', 'course'];
  const randomKeyword = keywords[Math.floor(Math.random() * keywords.length)];
  return `${topic} ${randomKeyword}${langSuffix}`;
}

/**
 * Get YouTube search results URL
 */
export function getYouTubeSearchURL(query) {
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
}

/**
 * Get YouTube embed URL from a video ID
 */
export function getYouTubeEmbedURL(videoId) {
  return `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1`;
}

// Language code mapping for YouTube regional filtering
const LANG_CODES = {
  'English': 'en', 'Hindi': 'hi', 'Telugu': 'te', 'Tamil': 'ta',
  'Kannada': 'kn', 'Bengali': 'bn', 'Marathi': 'mr', 'Gujarati': 'gu',
  'Malayalam': 'ml', 'Spanish': 'es', 'French': 'fr', 'German': 'de', 'Japanese': 'ja',
};

/**
 * PRIMARY: Search YouTube Data API v3 (needs API key)
 * Sorted by viewCount to recommend popular, high-quality videos
 */
async function searchWithYouTubeAPI(query, language, maxResults) {
  if (!YT_API_KEY) return null;

  const langCode = LANG_CODES[language] || 'en';
  const params = new URLSearchParams({
    part: 'snippet',
    q: query,
    type: 'video',
    order: 'viewCount',         // Sort by most views = best quality signal
    maxResults: String(maxResults),
    relevanceLanguage: langCode, // Prefer user's language
    videoDuration: 'medium',     // 4-20 min videos (tutorial length)
    key: YT_API_KEY,
  });

  try {
    const res = await fetch(`https://www.googleapis.com/youtube/v3/search?${params}`, {
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return null;
    const data = await res.json();

    // Get video statistics (view count, likes) for ranking
    const videoIds = data.items.map(i => i.id.videoId).join(',');
    const statsRes = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=statistics,contentDetails&id=${videoIds}&key=${YT_API_KEY}`,
      { signal: AbortSignal.timeout(5000) }
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
        embedUrl: getYouTubeEmbedURL(item.id.videoId),
        watchUrl: `https://www.youtube.com/watch?v=${item.id.videoId}`,
      };
    }).sort((a, b) => b.viewCount - a.viewCount); // Double-sort by views
  } catch {
    return null;
  }
}

/**
 * FALLBACK: Search using Invidious API (free, no key needed)
 * Also sorts by view count for quality recommendations
 */
async function searchWithInvidious(query, language, maxResults) {
  const instances = [
    'https://vid.puffyan.us',
    'https://invidious.snopyta.org',
    'https://y.com.sb',
    'https://invidious.fdn.fr',
  ];

  for (const instance of instances) {
    try {
      const langCode = LANG_CODES[language] || 'en';
      const res = await fetch(
        `${instance}/api/v1/search?q=${encodeURIComponent(query)}&type=video&sort_by=view_count&region=${langCode}`,
        { signal: AbortSignal.timeout(6000) }
      );
      if (!res.ok) continue;
      const data = await res.json();

      return data
        .filter(v => v.type === 'video')
        .slice(0, maxResults)
        .sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0)) // Sort by view count
        .map(v => ({
          videoId: v.videoId,
          title: v.title,
          thumbnail: v.videoThumbnails?.[3]?.url || `https://i.ytimg.com/vi/${v.videoId}/mqdefault.jpg`,
          channelName: v.author || '',
          duration: v.lengthSeconds ? formatDuration(v.lengthSeconds) : '',
          views: formatCount(v.viewCount || 0),
          likes: '',
          viewCount: v.viewCount || 0,
          subscribers: v.authorVerified ? '✓ Verified' : '',
          embedUrl: getYouTubeEmbedURL(v.videoId),
          watchUrl: `https://www.youtube.com/watch?v=${v.videoId}`,
        }));
    } catch {
      continue;
    }
  }
  return null;
}

/**
 * Main search function — tries YouTube API first, then Invidious, then fallback link
 * Returns videos sorted by popularity (views + subscribers)
 */
export async function searchYouTubeVideos(query, maxResults = 1, language = 'English') {
  // Try YouTube Data API first (best quality)
  const ytResults = await searchWithYouTubeAPI(query, language, maxResults);
  if (ytResults?.length) return ytResults;

  // Fallback to Invidious (free)
  const invResults = await searchWithInvidious(query, language, maxResults);
  if (invResults?.length) return invResults;

  // Last resort: return a search link
  return [{
    videoId: null,
    title: `Search: "${query}"`,
    thumbnail: '',
    channelName: '',
    duration: '',
    views: '',
    likes: '',
    viewCount: 0,
    embedUrl: '',
    watchUrl: getYouTubeSearchURL(query),
    isFallback: true,
  }];
}

/**
 * Get the single best (most viewed) video for a topic
 */
export async function getBestVideoForTopic(topic, language = 'English') {
  const query = buildYouTubeSearchQuery(topic, language);
  const results = await searchYouTubeVideos(query, 1, language);
  return results[0] || null;
}

// ── Helpers ──

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

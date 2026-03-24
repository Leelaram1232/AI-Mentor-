// YouTube Video Search Utility
// Routes all searches through our own Next.js API to avoid CORS issues
// Server route: /api/youtube-search

/**
 * Build a YouTube search query optimized for learning content in user's language
 */
export function buildYouTubeSearchQuery(topic, language = 'English') {
  const langSuffix = (language && language !== 'English') ? ` in ${language}` : '';
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
  if (!videoId) return '';
  return `https://www.youtube-nocookie.com/embed/${videoId}?rel=0&modestbranding=1`;
}

/**
 * Main search function — calls our server-side API proxy to avoid CORS
 * Returns videos sorted by popularity (views)
 */
export async function searchYouTubeVideos(query, maxResults = 2, language = 'English') {
  try {
    const params = new URLSearchParams({
      q: query,
      maxResults: String(maxResults),
      language: language,
    });

    const res = await fetch(`/api/youtube-search?${params}`, {
      signal: AbortSignal.timeout(15000),
    });

    if (!res.ok) {
      console.error('[YouTube] API route error:', res.status);
      return getFallbackResult(query);
    }

    const data = await res.json();

    if (data.videos?.length) {
      console.log(`[YouTube] Found ${data.videos.length} videos via ${data.source}`);
      return data.videos;
    }

    return getFallbackResult(query);
  } catch (err) {
    console.error('[YouTube] Search failed:', err.message);
    return getFallbackResult(query);
  }
}

/**
 * Get the single best (most viewed) video for a topic
 */
export async function getBestVideoForTopic(topic, language = 'English') {
  const query = buildYouTubeSearchQuery(topic, language);
  const results = await searchYouTubeVideos(query, 1, language);
  return results[0] || null;
}

/**
 * Fallback result when all APIs fail — returns a direct YouTube search link
 */
function getFallbackResult(query) {
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

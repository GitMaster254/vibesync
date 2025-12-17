export const config = {
  runtime: 'edge',
};

export default async function handler(req: Request) {
  const { searchParams } = new URL(req.url);
  const url = searchParams.get('url');

  if (!url) {
    return new Response('Missing URL parameter', { status: 400 });
  }

  try {
    console.log('Proxying request to:', url);
    
    const response = await fetch(url, {
      headers: {
        'Range': req.headers.get('Range') || 'bytes=0-',
        'User-Agent': 'Mozilla/5.0 (compatible; VibeSync/1.0)',
        'Referer': new URL(req.url).origin,
      },
    });

    console.log('Upstream response status:', response.status);
    console.log('Upstream content-type:', response.headers.get('content-type'));

    // Check if the response is actually audio content
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.startsWith('audio/')) {
      console.error('Non-audio content received:', contentType);
      
      // If it's HTML, it's likely an error page
      if (contentType?.includes('text/html')) {
        return new Response('The audio service returned an error page instead of audio content', {
          status: 502,
          headers: { 'Content-Type': 'text/plain' }
        });
      }
      
      return new Response(`Expected audio content, got: ${contentType}`, {
        status: 502,
        headers: { 'Content-Type': 'text/plain' }
      });
    }

    // Get the actual content type from upstream
    const actualContentType = response.headers.get('content-type') || 'audio/mpeg';

    // Forward the response with proper headers
    return new Response(response.body, {
      status: response.status,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': actualContentType, // Use the actual content type
        'Content-Length': response.headers.get('Content-Length') || '',
        'Content-Range': response.headers.get('Content-Range') || '',
        'Accept-Ranges': 'bytes',
      },
    });
  } catch (error) {
    console.error('Proxy error:', error);
    return new Response(`Failed to proxy stream: ${error instanceof Error ? error.message : 'Unknown error'}`, {
      status: 500,
      headers: { 'Content-Type': 'text/plain' }
    });
  }
}
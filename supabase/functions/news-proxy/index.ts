const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const GNEWS_KEY = '11da12c8c08db9d912fe59c560f651f5';
const ALLOWED_ENDPOINTS = new Set(['search', 'top-headlines']);

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { endpoint, params = {} } = await req.json();

    if (!ALLOWED_ENDPOINTS.has(endpoint)) {
      return new Response(JSON.stringify({ errors: ['Invalid news endpoint'] }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const url = new URL(`https://gnews.io/api/v4/${endpoint}`);
    Object.entries(params as Record<string, unknown>).forEach(([key, value]) => {
      if (typeof value === 'string' && value.trim()) {
        url.searchParams.set(key, value);
      }
    });
    url.searchParams.set('apikey', GNEWS_KEY);

    const response = await fetch(url.toString(), {
      headers: { Accept: 'application/json' },
    });
    const body = await response.text();

    return new Response(body, {
      status: response.status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'News proxy error';
    return new Response(JSON.stringify({ errors: [message] }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
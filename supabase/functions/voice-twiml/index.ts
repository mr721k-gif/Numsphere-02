const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function buildTwiML(content: string) {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<Response>${content}</Response>`;
  return new Response(xml, {
    status: 200,
    headers: {
      ...corsHeaders,
      'Content-Type': 'text/xml',
    },
  });
}

async function parseParams(req: Request) {
  const url = new URL(req.url);
  const contentType = req.headers.get('content-type') || '';
  let to: string | null = null;
  let from: string | null = null;

  if (contentType.includes('application/x-www-form-urlencoded') || contentType.includes('multipart/form-data')) {
    const form = await req.formData();
    to = (form.get('To') as string) || url.searchParams.get('To');
    from = (form.get('From') as string) || url.searchParams.get('From');
  } else if (contentType.includes('application/json')) {
    const body = await req.json().catch(() => ({} as any));
    to = body?.To ?? url.searchParams.get('To');
    from = body?.From ?? url.searchParams.get('From');
  } else {
    to = url.searchParams.get('To');
    from = url.searchParams.get('From');
  }

  return { to, from };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders, status: 200 });
  }

  try {
    const { to, from } = await parseParams(req);

    if (to) {
      const callerIdAttr = from ? ` callerId="${from}"` : '';
      return buildTwiML(`<Dial${callerIdAttr}><Number>${to}</Number></Dial>`);
    }

    return buildTwiML(`<Say voice="alice">Welcome to NumSphere. Please set up your account and call flow.</Say>`);
  } catch (_e) {
    return buildTwiML(`<Say>We are experiencing difficulties. Please try again later.</Say>`);
  }
});

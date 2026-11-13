import { createClient } from 'npm:@supabase/supabase-js@2';

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 20;
const userBuckets = new Map<string, { count: number; resetAt: number }>();

function isRateLimited(userId: string): boolean {
  const now = Date.now();
  const entry = userBuckets.get(userId);
  if (!entry || now > entry.resetAt) {
    userBuckets.set(userId, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }
  entry.count += 1;
  return entry.count > RATE_LIMIT_MAX;
}

const JSON_HEADERS = {
  'Content-Type': 'application/json',
  'X-Content-Type-Options': 'nosniff',
  'Cache-Control': 'no-store',
};

interface ExtractionResult {
  merchant: string | null;
  amount: number | null;
  currency: string | null;
  transaction_date: string | null;
  tax_amount: number | null;
}

Deno.serve(async (req: Request) => {
  try {
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');

    if (!supabaseUrl || !supabaseAnonKey || !geminiApiKey) {
      return new Response(JSON.stringify({ error: 'Server configuration error' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError || !authData?.user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: JSON_HEADERS,
      });
    }

    if (isRateLimited(authData.user.id)) {
      return new Response(JSON.stringify({ error: 'Rate limit exceeded' }), {
        status: 429,
        headers: JSON_HEADERS,
      });
    }

    const { filePath } = await req.json();
    if (
      !filePath ||
      typeof filePath !== 'string' ||
      filePath.includes('..') ||
      !filePath.startsWith(`${authData.user.id}/`)
    ) {
      return new Response(JSON.stringify({ error: 'Invalid filePath' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 25000);
    const cleanup = () => clearTimeout(timeout);

    const { data: fileBlob, error: downloadError } = await supabase.storage
      .from('receipts')
      .download(filePath);

    if (downloadError || !fileBlob) {
      cleanup();
      return new Response(JSON.stringify({ error: 'Failed to load receipt file' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const arrayBuffer = await fileBlob.arrayBuffer();
    const uint8 = new Uint8Array(arrayBuffer);
    let binary = '';
    for (let i = 0; i < uint8.length; i++) {
      binary += String.fromCharCode(uint8[i]);
    }
    const base64 = btoa(binary);

    const contentType = fileBlob.type || 'image/jpeg';

    const geminiResponse = await fetch(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': geminiApiKey,
        },
        signal: controller.signal,
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  inlineData: {
                    mimeType: contentType,
                    data: base64,
                  },
                },
                {
                  text: `Extract the following from this receipt image. Return ONLY valid JSON with these fields. If a field cannot be determined, set it to null. Fields: merchant (string), amount (number), currency (string, 3-letter code), transaction_date (string, YYYY-MM-DD), tax_amount (number or null).

Example: {"merchant": "Shoprite", "amount": 12500, "currency": "NGN", "transaction_date": "2026-06-18", "tax_amount": 937.5}

Return ONLY valid JSON, no markdown, no explanation.`,
                },
              ],
            },
          ],
        }),
      },
    );

    if (!geminiResponse.ok) {
      cleanup();
      return new Response(JSON.stringify({ error: 'Receipt extraction failed' }), {
        status: 502,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const geminiData = await geminiResponse.json();
    const rawText = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!rawText) {
      cleanup();
      return new Response(JSON.stringify({ error: 'No extraction output returned' }), {
        status: 502,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const cleanedText = rawText.replace(/^```json\s*/i, '').replace(/```$/i, '');

    let result: ExtractionResult;
    try {
      result = JSON.parse(cleanedText);
    } catch {
      cleanup();
      return new Response(JSON.stringify({ error: 'Failed to parse extraction output' }), {
        status: 502,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    cleanup();
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      return new Response(JSON.stringify({ error: 'Request timed out' }), {
        status: 504,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});

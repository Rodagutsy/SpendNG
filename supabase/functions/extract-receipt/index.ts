import { createClient } from 'npm:@supabase/supabase-js@2';

interface ExtractionResult {
  merchant: string | null;
  amount: number | null;
  currency: string | null;
  transaction_date: string | null;
  tax_amount: number | null;
}

Deno.serve(async (req: Request) => {
  console.log("STEP 1: Received request");
  try {
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { filePath } = await req.json();
    if (!filePath || typeof filePath !== 'string') {
      return new Response(JSON.stringify({ error: 'Missing filePath' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    console.log("STEP 2: filePath:", filePath);

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');

    if (!supabaseUrl || !serviceRoleKey || !geminiApiKey) {
      return new Response(JSON.stringify({ error: 'Missing environment variables' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    console.log("STEP 2a: API key prefix:", geminiApiKey.substring(0, 6) + '...');

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 25000);
    const cleanup = () => clearTimeout(timeout);

    console.log("STEP 3: Downloading from storage");
    const { data: fileBlob, error: downloadError } = await supabase.storage
      .from('receipts')
      .download(filePath);

    if (downloadError || !fileBlob) {
      cleanup();
      return new Response(JSON.stringify({ error: `Download failed: ${downloadError?.message ?? 'No data'}` }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    console.log("STEP 3b: Image downloaded, size:", fileBlob.size);

    const arrayBuffer = await fileBlob.arrayBuffer();
    const uint8 = new Uint8Array(arrayBuffer);
    let binary = '';
    for (let i = 0; i < uint8.length; i++) {
      binary += String.fromCharCode(uint8[i]);
    }
    const base64 = btoa(binary);
    console.log("STEP 3c: Base64 size:", base64.length);

    const contentType = fileBlob.type || 'image/jpeg';

    console.log("STEP 4: Calling Gemini models list to test key");
    const modelsCheck = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${geminiApiKey}`,
      { signal: controller.signal },
    );
    const modelsText = await modelsCheck.text();
    console.log("STEP 4a: Models list status:", modelsCheck.status, "body:", modelsText.substring(0, 500));

    console.log("STEP 4b: Calling Gemini generateContent");
    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiApiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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

    console.log("STEP 5: Gemini response received, status:", geminiResponse.status);

    if (!geminiResponse.ok) {
      cleanup();
      const errText = await geminiResponse.text();
      console.log("STEP 5a: Gemini error body:", errText);
      return new Response(JSON.stringify({ error: `Gemini API error: ${errText}` }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    console.log("STEP 5c: Parsing Gemini JSON");
    const geminiData = await geminiResponse.json();
    console.log("STEP 5d: Checking candidates");
    const rawText = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text;
    console.log("STEP 5e: rawText length:", rawText?.length ?? 0);

    if (!rawText) {
      cleanup();
      console.log("STEP 5f: Empty Gemini response, blockReason:", geminiData?.promptFeedback?.blockReason ?? 'none');
      return new Response(JSON.stringify({ error: 'Empty Gemini response' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    console.log("STEP 6: Cleaning and parsing JSON");
    const cleanedText = rawText.replace(/^```json\s*/i, '').replace(/```$/i, '');

    let result: ExtractionResult;
    try {
      result = JSON.parse(cleanedText);
    } catch (e) {
      cleanup();
      return new Response(JSON.stringify({ error: 'Invalid JSON from Gemini', raw: cleanedText }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    console.log("STEP 7: JSON parsed successfully:", JSON.stringify(result));
    cleanup();
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('extract-receipt CAUGHT:', err?.constructor?.name, err);
    if (err instanceof DOMException && err.name === 'AbortError') {
      return new Response(JSON.stringify({ error: 'Request timed out' }), {
        status: 504,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : 'Unknown error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});

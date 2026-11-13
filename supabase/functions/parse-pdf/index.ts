interface ParsedRow {
  date: string;
  amount: number;
  type: 'credit' | 'debit';
  description: string;
  balance: number | null;
}

function parseAmount(value: string): number {
  const cleaned = value.replace(/["'$₦,]/g, '').replace(/\s+/g, '');
  const n = parseFloat(cleaned);
  return isNaN(n) ? 0 : n;
}

function extractRawText(pdfBytes: Uint8Array): string {
  const text = new TextDecoder('utf-8').decode(pdfBytes);
  const parts: string[] = [];

  const streamMatches = text.match(/stream\s([\s\S]*?)\s*endstream/g);
  if (streamMatches) {
    for (const stream of streamMatches) {
      const content = stream.replace(/^stream\s/, '').replace(/\s*endstream$/, '');
      const textMatches = content.match(/\(([^)]*)\)/g);
      if (textMatches) {
        for (const t of textMatches) {
          const inner = t.slice(1, -1);
          if (inner.trim()) parts.push(inner);
        }
      }
      const hexMatches = content.match(/<([0-9A-Fa-f]+)>/g);
      if (hexMatches) {
        for (const h of hexMatches) {
          const hexStr = h.slice(1, -1);
          let decoded = '';
          for (let i = 0; i < hexStr.length; i += 2) {
            decoded += String.fromCharCode(parseInt(hexStr.substring(i, i + 2), 16));
          }
          if (decoded.trim()) parts.push(decoded);
        }
      }
    }
  }

  const tjMatches = text.match(/\[(.*?)\]\s*TJ/g);
  if (tjMatches) {
    for (const tj of tjMatches) {
      const innerTexts = tj.match(/\(([^)]*)\)/g);
      if (innerTexts) {
        const line = innerTexts.map((t) => t.slice(1, -1)).join('');
        if (line.trim()) parts.push(line);
      }
    }
  }

  return parts.join('\n');
}

function groupLinesByDate(lines: string[]): string[] {
  const grouped: string[] = [];
  let current: string[] = [];

  for (const line of lines) {
    if (/\d{2}\/\d{2}\/\d{4}/.test(line) || /\d{2}-[A-Za-z]{3}-\d{4}/.test(line)) {
      if (current.length > 0) grouped.push(current.join(' '));
      current = [line];
    } else if (current.length > 0) {
      current.push(line);
    } else {
      grouped.push(line);
    }
  }
  if (current.length > 0) grouped.push(current.join(' '));
  return grouped;
}

function extractRows(text: string): ParsedRow[] {
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
  const grouped = groupLinesByDate(lines);
  const rows: ParsedRow[] = [];

  for (const group of grouped) {
    const dateMatch = group.match(/(\d{2}\/\d{2}\/\d{4})/) || group.match(/(\d{2}-[A-Za-z]{3}-\d{4})/);
    if (!dateMatch) continue;

    const date = dateMatch[1];
    const numbers = [...group.matchAll(/(\d+(?:,\d{3})*\.\d{2})/g)].map((m) => parseAmount(m[1]));
    if (numbers.length === 0) continue;

    const inflow =
      /credit|\bcr\b|deposit|received|salary|income|refund|cash in/i.test(group) && !/debit|\bdr\b|payment|withdrawal|purchase|cash out/i.test(group)
        ? numbers[0]
        : null;
    const outflow =
      !inflow && (/debit|\bdr\b|payment|withdrawal|purchase|cash out/i.test(group) || numbers.length >= 1)
        ? numbers[0]
        : null;

    const amount = inflow ?? outflow ?? numbers[0];
    if (amount <= 0) continue;

    const type: 'credit' | 'debit' = inflow ? 'credit' : 'debit';

    const description = group
      .replace(date, '')
      .replace(/\d+(?:,\d{3})*\.\d{2}/g, '')
      .replace(/credit|debit|\bcr\b|\bdr\b|balance|available|ngn|₦/gi, '')
      .replace(/\s+/g, ' ')
      .trim();

    let balance: number | null = null;
    if (numbers.length >= 2) {
      balance = numbers[numbers.length - 1];
    }

    rows.push({ date, amount, type, description, balance });
  }

  return rows;
}

import { createClient } from 'npm:@supabase/supabase-js@2';

const MAX_BASE64_LENGTH = 10 * 1024 * 1024; // ~7.5 MB binary PDF limit

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
    if (!supabaseUrl || !supabaseAnonKey) {
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
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { fileBase64 } = await req.json();
    if (!fileBase64 || typeof fileBase64 !== 'string') {
      return new Response(JSON.stringify({ error: 'Missing fileBase64' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    if (fileBase64.length > MAX_BASE64_LENGTH) {
      return new Response(JSON.stringify({ error: 'PDF payload too large' }), {
        status: 413,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const binaryStr = atob(fileBase64);
    const bytes = new Uint8Array(binaryStr.length);
    for (let i = 0; i < binaryStr.length; i++) {
      bytes[i] = binaryStr.charCodeAt(i);
    }

    const fullText = extractRawText(bytes);
    const rows = extractRows(fullText);

    return new Response(JSON.stringify({ rows }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch {
    return new Response(JSON.stringify({ error: 'Failed to parse PDF' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});

export interface ExtractedPDFText {
  pages: string[];
  raw: string;
}

export async function extractPDFText(buffer: ArrayBuffer): Promise<ExtractedPDFText> {
  const raw = new TextDecoder('utf-8').decode(buffer);

  const pages: string[] = [];
  let currentPage = '';

  const lines = raw.split(/\r?\n/);
  for (const line of lines) {
    if (/\/Type\s*\/Page[^s]/i.test(line)) {
      if (currentPage.trim()) pages.push(currentPage.trim());
      currentPage = '';
    }

    const textMatch = line.match(/\(([^)]*)\)/g);
    if (textMatch) {
      for (const t of textMatch) {
        const content = t.slice(1, -1);
        if (content.trim()) currentPage += content + ' ';
      }
    }

    if (line.includes('TJ') || line.includes('Tj')) {
      currentPage += extractInlineText(line) + ' ';
    }
  }

  if (currentPage.trim()) pages.push(currentPage.trim());

  const text = pages.join('\n\n');
  return { pages, raw: text };
}

function extractInlineText(line: string): string {
  const matches = line.match(/\(([^)]*)\)\s*\)?/g);
  if (!matches) return '';
  return matches.map((m) => {
    const inner = m.match(/\(([^)]*)\)/);
    return inner ? inner[1] : '';
  }).join('');
}

export function pdfToCSVLines(pdfText: string): string {
  const lines = pdfText.split('\n').map((l) => l.trim()).filter(Boolean);
  const csvLines: string[] = [];
  let currentLine: string[] = [];

  for (const line of lines) {
    if (/\d{2}\/\d{2}\/\d{4}/.test(line) || /\d{2}-[A-Za-z]{3}-\d{4}/.test(line)) {
      if (currentLine.length > 0) {
        csvLines.push(currentLine.join(' '));
      }
      currentLine = [line];
    } else if (currentLine.length > 0) {
      currentLine.push(line);
    } else {
      csvLines.push(line);
    }
  }
  if (currentLine.length > 0) {
    csvLines.push(currentLine.join(' '));
  }

  return csvLines.join('\n');
}

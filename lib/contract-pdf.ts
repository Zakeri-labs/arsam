// Turns the rendered contract pages ([data-pdf-page] inside `root`) into a real PDF file:
// each page is rasterised with html-to-image and embedded as a JPEG on an A4 page.
// Elements marked data-pdf-link="<url>" become clickable links (video tiles).
// The PDF file itself is written here (a few objects, no library needed).

const A4_W = 595.28; // pt
const A4_H = 841.89;
const MARGIN = 12;
const PIXEL_RATIO = 2;

interface PdfPage {
  jpeg: Uint8Array;
  width: number; // image pixels
  height: number;
  links: { x: number; y: number; w: number; h: number; url: string }[]; // CSS px relative to the page node
  cssWidth: number;
  cssHeight: number;
}

function dataUrlToBytes(dataUrl: string): Uint8Array {
  const base64 = dataUrl.slice(dataUrl.indexOf(',') + 1);
  const bin = atob(base64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

// Pixel size from the JPEG's SOF marker (the canvas may round differently than css * ratio)
function jpegSize(bytes: Uint8Array): { width: number; height: number } | null {
  let i = 2;
  while (i + 9 < bytes.length) {
    if (bytes[i] !== 0xff) return null;
    const marker = bytes[i + 1];
    const len = (bytes[i + 2] << 8) | bytes[i + 3];
    if (marker >= 0xc0 && marker <= 0xc3) {
      return { height: (bytes[i + 5] << 8) | bytes[i + 6], width: (bytes[i + 7] << 8) | bytes[i + 8] };
    }
    i += 2 + len;
  }
  return null;
}

// PDF string literal: only ASCII, with ( ) \ escaped
function pdfString(s: string) {
  let ascii: string;
  try {
    ascii = encodeURI(decodeURI(s));
  } catch {
    ascii = encodeURI(s);
  }
  return `(${ascii.replace(/[\\()]/g, m => `\\${m}`)})`;
}

function buildPdf(pages: PdfPage[]): Blob {
  const enc = new TextEncoder();
  const chunks: Uint8Array[] = [];
  const offsets: number[] = [];
  let length = 0;
  const push = (part: string | Uint8Array) => {
    const bytes = typeof part === 'string' ? enc.encode(part) : part;
    chunks.push(bytes);
    length += bytes.length;
  };

  // Object numbers: 1 catalog, 2 page tree, then per page: page, content, image, links...
  let next = 3;
  const plan = pages.map(p => {
    const page = next++;
    const content = next++;
    const image = next++;
    const links = p.links.map(() => next++);
    return { page, content, image, links };
  });

  const startObj = (n: number) => {
    offsets[n] = length;
    push(`${n} 0 obj\n`);
  };

  push('%PDF-1.4\n%\xE2\xE3\xCF\xD3\n');
  startObj(1);
  push('<< /Type /Catalog /Pages 2 0 R >>\nendobj\n');
  startObj(2);
  push(`<< /Type /Pages /Kids [${plan.map(p => `${p.page} 0 R`).join(' ')}] /Count ${pages.length} >>\nendobj\n`);

  pages.forEach((p, i) => {
    const ids = plan[i];
    // Fit the page image inside A4 (contain), centred horizontally, top-aligned
    const scale = Math.min((A4_W - 2 * MARGIN) / p.cssWidth, (A4_H - 2 * MARGIN) / p.cssHeight);
    const drawW = p.cssWidth * scale;
    const drawH = p.cssHeight * scale;
    const x0 = (A4_W - drawW) / 2;
    const yTop = A4_H - MARGIN;

    startObj(ids.page);
    push(
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${A4_W} ${A4_H}] ` +
        `/Resources << /XObject << /Im0 ${ids.image} 0 R >> >> /Contents ${ids.content} 0 R` +
        (ids.links.length ? ` /Annots [${ids.links.map(n => `${n} 0 R`).join(' ')}]` : '') +
        ' >>\nendobj\n'
    );

    const stream = `q ${drawW.toFixed(2)} 0 0 ${drawH.toFixed(2)} ${x0.toFixed(2)} ${(yTop - drawH).toFixed(2)} cm /Im0 Do Q`;
    startObj(ids.content);
    push(`<< /Length ${stream.length} >>\nstream\n${stream}\nendstream\nendobj\n`);

    startObj(ids.image);
    push(
      `<< /Type /XObject /Subtype /Image /Width ${p.width} /Height ${p.height} /ColorSpace /DeviceRGB ` +
        `/BitsPerComponent 8 /Filter /DCTDecode /Length ${p.jpeg.length} >>\nstream\n`
    );
    push(p.jpeg);
    push('\nendstream\nendobj\n');

    p.links.forEach((l, k) => {
      const x1 = x0 + l.x * scale;
      const y2 = yTop - l.y * scale;
      const rect = [x1, y2 - l.h * scale, x1 + l.w * scale, y2].map(v => v.toFixed(2)).join(' ');
      startObj(ids.links[k]);
      push(`<< /Type /Annot /Subtype /Link /Rect [${rect}] /Border [0 0 0] /A << /S /URI /URI ${pdfString(l.url)} >> >>\nendobj\n`);
    });
  });

  const xrefStart = length;
  const count = next;
  let xref = `xref\n0 ${count}\n0000000000 65535 f \n`;
  for (let n = 1; n < count; n++) xref += `${String(offsets[n]).padStart(10, '0')} 00000 n \n`;
  push(xref);
  push(`trailer\n<< /Size ${count} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF\n`);

  return new Blob(chunks as BlobPart[], { type: 'application/pdf' });
}

async function waitForImages(root: HTMLElement) {
  const imgs = Array.from(root.querySelectorAll('img'));
  await Promise.all(
    imgs.map(img =>
      img.complete && img.naturalWidth
        ? Promise.resolve()
        : new Promise<void>(resolve => {
            img.addEventListener('load', () => resolve(), { once: true });
            img.addEventListener('error', () => resolve(), { once: true });
          })
    )
  );
  if (document.fonts?.ready) await document.fonts.ready;
}

/** Renders every [data-pdf-page] under `root` into one PDF Blob. */
export async function renderContractPdf(root: HTMLElement, onProgress?: (done: number, total: number) => void): Promise<Blob> {
  const { toJpeg, getFontEmbedCSS } = await import('html-to-image');
  await waitForImages(root);
  const nodes = Array.from(root.querySelectorAll<HTMLElement>('[data-pdf-page]'));
  if (!nodes.length) throw new Error('no pages');
  // Fonts are embedded once and reused for every page
  const fontEmbedCSS = await getFontEmbedCSS(nodes[0]).catch(() => undefined);

  const pages: PdfPage[] = [];
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    const cssWidth = node.offsetWidth;
    const cssHeight = node.offsetHeight;
    const dataUrl = await toJpeg(node, {
      quality: 0.9,
      pixelRatio: PIXEL_RATIO,
      backgroundColor: '#ffffff',
      width: cssWidth,
      height: cssHeight,
      fontEmbedCSS,
    });
    const box = node.getBoundingClientRect();
    const links = Array.from(node.querySelectorAll<HTMLElement>('[data-pdf-link]')).map(el => {
      const r = el.getBoundingClientRect();
      return { x: r.left - box.left, y: r.top - box.top, w: r.width, h: r.height, url: el.dataset.pdfLink || '' };
    }).filter(l => l.url);
    const jpeg = dataUrlToBytes(dataUrl);
    const size = jpegSize(jpeg);
    pages.push({
      jpeg,
      width: size?.width ?? Math.round(cssWidth * PIXEL_RATIO),
      height: size?.height ?? Math.round(cssHeight * PIXEL_RATIO),
      links,
      cssWidth,
      cssHeight,
    });
    onProgress?.(i + 1, nodes.length);
  }
  return buildPdf(pages);
}

export function contractPdfFileName(contractId: string) {
  return `Contract-${contractId.toUpperCase().replace(/[^A-Z0-9-]/g, '')}.pdf`;
}

/** Starts a browser download of the PDF. */
export function saveBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

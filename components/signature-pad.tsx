'use client';

import { useEffect, useRef, useState } from 'react';
import { Eraser } from 'lucide-react';

// Finger / stylus signature pad for phones and tablets. Produces a transparent PNG cropped to the ink.

export interface SignaturePadHandle {
  clear: () => void;
}

interface Props {
  onChange: (png: Blob | null) => void;
  height?: number;
  clearLabel?: string;
  hint?: string;
}

const INK = '#111827';
// Same minimum as the server (px of the exported PNG): a dot or a tick is not a signature
const MIN_WIDTH = 40;
const MIN_HEIGHT = 16;

async function exportPng(canvas: HTMLCanvasElement): Promise<Blob | null> {
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  const { width, height } = canvas;
  const { data } = ctx.getImageData(0, 0, width, height);
  let minX = width, minY = height, maxX = -1, maxY = -1;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (data[(y * width + x) * 4 + 3] > 8) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  if (maxX < 0) return null;
  const pad = 6;
  minX = Math.max(0, minX - pad); minY = Math.max(0, minY - pad);
  maxX = Math.min(width - 1, maxX + pad); maxY = Math.min(height - 1, maxY + pad);
  const out = document.createElement('canvas');
  out.width = maxX - minX + 1;
  out.height = maxY - minY + 1;
  out.getContext('2d')!.drawImage(canvas, minX, minY, out.width, out.height, 0, 0, out.width, out.height);
  if (out.width < MIN_WIDTH || out.height < MIN_HEIGHT) return null;
  return new Promise(resolve => out.toBlob(resolve, 'image/png'));
}

export default function SignaturePad({ onChange, height = 180, clearLabel = 'پاک کردن', hint = 'اینجا امضا کنید' }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const last = useRef<{ x: number; y: number } | null>(null);
  const [empty, setEmpty] = useState(true);
  const hasInk = useRef(false);

  // Keep the bitmap sharp on high-DPI screens; resizing clears the pad.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const fit = () => {
      const ratio = Math.max(window.devicePixelRatio || 1, 1);
      const rect = canvas.getBoundingClientRect();
      if (!rect.width) return;
      // Rotating the phone resizes the pad: keep what was drawn instead of wiping it
      let snapshot: HTMLCanvasElement | null = null;
      if (hasInk.current && canvas.width && canvas.height) {
        snapshot = document.createElement('canvas');
        snapshot.width = canvas.width;
        snapshot.height = canvas.height;
        snapshot.getContext('2d')!.drawImage(canvas, 0, 0);
      }
      canvas.width = Math.round(rect.width * ratio);
      canvas.height = Math.round(rect.height * ratio);
      const ctx = canvas.getContext('2d')!;
      ctx.scale(ratio, ratio);
      ctx.lineWidth = 2.6;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = INK;
      if (snapshot) {
        ctx.drawImage(snapshot, 0, 0, rect.width, rect.height);
        exportPng(canvas).then(png => onChange(png));
        return;
      }
      setEmpty(true);
      onChange(null);
    };
    fit();
    const observer = new ResizeObserver(() => {
      if (!drawing.current) fit();
    });
    observer.observe(canvas);
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const point = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const start = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    drawing.current = true;
    const p = point(e);
    last.current = p;
    const ctx = e.currentTarget.getContext('2d')!;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 1.3, 0, Math.PI * 2);
    ctx.fillStyle = INK;
    ctx.fill();
  };

  const move = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current || !last.current) return;
    const p = point(e);
    const ctx = e.currentTarget.getContext('2d')!;
    ctx.beginPath();
    ctx.moveTo(last.current.x, last.current.y);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    last.current = p;
  };

  const end = async () => {
    if (!drawing.current) return;
    drawing.current = false;
    last.current = null;
    const png = canvasRef.current ? await exportPng(canvasRef.current) : null;
    // A scribble that is too small still counts as ink on the pad, but is not accepted as a signature
    hasInk.current = true;
    setEmpty(false);
    onChange(png);
  };

  const clear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.getContext('2d')!.clearRect(0, 0, canvas.width, canvas.height);
    hasInk.current = false;
    setEmpty(true);
    onChange(null);
  };

  return (
    <div>
      <div className="relative overflow-hidden rounded-2xl border-2 border-dashed border-gray-300 bg-white" style={{ height }}>
        <canvas
          ref={canvasRef}
          className="h-full w-full cursor-crosshair"
          style={{ touchAction: 'none' }}
          onPointerDown={start}
          onPointerMove={move}
          onPointerUp={end}
          onPointerCancel={end}
        />
        {empty && (
          <span className="pointer-events-none absolute inset-0 flex items-center justify-center text-[13px] font-bold text-gray-300">{hint}</span>
        )}
      </div>
      <button
        type="button"
        onClick={clear}
        disabled={empty}
        className="mt-2 flex items-center gap-1.5 rounded-lg border border-gray-300/60 px-3 py-1.5 text-[11.5px] font-bold text-gray-500 disabled:opacity-40"
      >
        <Eraser size={13} />
        {clearLabel}
      </button>
    </div>
  );
}

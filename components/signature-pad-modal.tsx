'use client';

import { useEffect, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';

// Full-screen pad where the customer draws a signature with a finger or mouse; hands back a PNG file.
export default function SignaturePadModal({
  title, description, busy, onCancel, onSave,
}: {
  title: string;
  description?: string;
  busy?: boolean;
  onCancel: () => void;
  onSave: (png: File) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const [empty, setEmpty] = useState(true);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ratio = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * ratio;
    canvas.height = rect.height * ratio;
    const ctx = canvas.getContext('2d')!;
    ctx.scale(ratio, ratio);
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#0f172a';
  }, []);

  const point = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const start = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    drawing.current = true;
    const { x, y } = point(e);
    const ctx = canvasRef.current!.getContext('2d')!;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + 0.01, y);
    ctx.stroke();
    setEmpty(false);
  };
  const move = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current) return;
    const { x, y } = point(e);
    const ctx = canvasRef.current!.getContext('2d')!;
    ctx.lineTo(x, y);
    ctx.stroke();
  };
  const end = () => { drawing.current = false; };

  const clear = () => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.restore();
    setEmpty(true);
  };

  const save = () => {
    canvasRef.current!.toBlob(blob => {
      if (blob) onSave(new File([blob], `signature-${Date.now()}.png`, { type: 'image/png' }));
    }, 'image/png');
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/85 p-4 backdrop-blur-md" dir="rtl">
      <div className="w-full max-w-lg space-y-3 rounded-3xl border border-white/15 bg-[#0b172a] p-5 shadow-2xl">
        <h3 className="text-base font-black text-white">{title}</h3>
        {description && <p className="text-[11px] leading-6 text-white/60">{description}</p>}
        <canvas
          ref={canvasRef}
          onPointerDown={start}
          onPointerMove={move}
          onPointerUp={end}
          onPointerCancel={end}
          className="h-56 w-full touch-none rounded-2xl bg-white"
        />
        <div className="flex items-center justify-between gap-2">
          <button type="button" onClick={clear} disabled={empty || busy} className="rounded-xl bg-white/10 px-4 py-2 text-xs font-bold text-white disabled:opacity-40">پاک کردن</button>
          <div className="flex gap-2">
            <button type="button" onClick={onCancel} disabled={busy} className="rounded-xl bg-white/10 px-4 py-2 text-xs font-bold text-white disabled:opacity-40">انصراف</button>
            <button type="button" onClick={save} disabled={empty || busy} className="inline-flex items-center gap-1.5 rounded-xl bg-gold px-4 py-2 text-xs font-black text-black disabled:opacity-40">
              {busy && <Loader2 size={13} className="animate-spin" />}
              تأیید و ثبت امضا
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

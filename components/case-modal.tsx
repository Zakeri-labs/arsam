'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  FileText, Download, Upload, Phone, MessageSquare, Clock,
  CheckCircle2, AlertCircle, X, Save, Plus, Loader2, Sparkles,
  Globe, Building2, PhoneCall, Layers, Check
} from 'lucide-react';

export interface RequestFile {
  name: string;
  size: number;
  url?: string;
}

export interface ServiceRequest {
  id: string;
  name: string;
  phone: string;
  description: string;
  serviceTitle: string;
  files: RequestFile[];
  createdAt: string;
  queueNumber?: number | null;
  source?: string;
  queueStatus?: string;
}

const STATUS_STEPS = [
  { id: 'waiting', label: 'در انتظار بررسی اولیه', color: '#475569', bg: '#f8fafc', border: '#cbd5e1' },
  { id: 'in_progress', label: 'در حال اقدام و پیگیری', color: '#b45309', bg: '#fffbeb', border: '#fcd34d' },
  { id: 'pending_docs', label: 'منتظر مدارک از مشتری', color: '#c2410c', bg: '#fff7ed', border: '#fdba74' },
  { id: 'gov_process', label: 'در حال استعلام و امور دولتی', color: '#1d4ed8', bg: '#eff6ff', border: '#93c5fd' },
  { id: 'completed', label: 'تکمیل شد (خدمت نهایی)', color: '#047857', bg: '#ecfdf5', border: '#6ee7b7' },
  { id: 'absent', label: 'معلق / انصراف', color: '#b91c1c', bg: '#fef2f2', border: '#fca5a5' },
];

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

function formatDate(dateStr: string) {
  try {
    return new Date(dateStr).toLocaleDateString('fa-IR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch { return dateStr; }
}

export default function CaseModal({
  request,
  onClose,
  onUpdateSuccess,
}: {
  request: ServiceRequest;
  onClose: () => void;
  onUpdateSuccess: (updatedRequest: ServiceRequest) => void;
}) {
  const [source, setSource] = useState<string>(request.source || 'web');
  const [queueStatus, setQueueStatus] = useState<string>(request.queueStatus || 'waiting');
  const [description, setDescription] = useState<string>(request.description || '');
  const [files, setFiles] = useState<RequestFile[]>(request.files || []);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const cleanPhone = request.phone.replace(/[^0-9+]/g, '');
  const whatsappUrl = `https://wa.me/${cleanPhone}`;

  // Handle Admin File Upload directly to Supabase storage
  const handleAdminFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files;
    if (!selected || selected.length === 0) return;

    setUploading(true);
    try {
      const { supabase } = await import('@/lib/supabase');
      const newUploaded: RequestFile[] = [];

      for (let i = 0; i < selected.length; i++) {
        const file = selected[i];
        const buffer = await file.arrayBuffer();
        const fileExt = file.name.split('.').pop() || '';
        const uniqueId = Math.random().toString(36).substring(2, 9) + '_' + Date.now().toString(36);
        const safeName = `admin_${uniqueId}.${fileExt}`;

        const { data, error } = await supabase.storage
          .from('uploads')
          .upload(safeName, buffer, {
            contentType: file.type || 'application/octet-stream',
            upsert: false,
          });

        if (!error) {
          const { data: publicData } = supabase.storage.from('uploads').getPublicUrl(safeName);
          newUploaded.push({
            name: file.name,
            size: file.size,
            url: publicData.publicUrl,
          });
        }
      }

      setFiles(prev => [...prev, ...newUploaded]);
      setToastMsg('فایل جدید با موفقیت اضافه شد');
      setTimeout(() => setToastMsg(null), 3000);
    } catch (err) {
      console.error('Error uploading admin file:', err);
    } finally {
      setUploading(false);
    }
  };

  // Save changes
  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/requests', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: request.id,
          source,
          queueStatus,
          description,
          files,
        }),
      });

      if (res.ok) {
        onUpdateSuccess({
          ...request,
          source,
          queueStatus,
          description,
          files,
        });
        setToastMsg('تغییرات پرونده با موفقیت ذخیره شد');
        setTimeout(() => {
          setToastMsg(null);
          onClose();
        }, 1200);
      } else {
        alert('خطا در ذخیره‌سازی تغییرات پرونده');
      }
    } catch (err) {
      console.error('Error saving request:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs"
      />

      {/* Main Dialog (Sleek Clean Light Design) */}
      <motion.div
        initial={{ scale: 0.96, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.96, opacity: 0 }}
        className="relative z-10 w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-3xl p-6 bg-white text-[#0f1e37] shadow-2xl space-y-5 border border-slate-200"
        dir="rtl"
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2.5 mb-1">
              <h2 className="text-lg font-black text-[#0f1e37]">{request.name}</h2>
              <bdo
                dir="ltr"
                className="font-mono text-xs font-black text-[#0f1e37] bg-slate-100 px-2.5 py-0.5 rounded-lg border border-slate-200 inline-block tracking-wide"
                style={{ unicodeBidi: 'bidi-override', direction: 'ltr' }}
              >
                {request.phone}
              </bdo>
            </div>
            <p className="text-xs text-slate-500 flex items-center gap-2">
              <span>خدمت: <strong className="text-[#0f1e37] font-extrabold">{request.serviceTitle}</strong></span>
              <span>•</span>
              <span className="text-[11px] text-slate-400">{formatDate(request.createdAt)}</span>
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Toast */}
        {toastMsg && (
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-center text-xs font-bold">
            {toastMsg}
          </div>
        )}

        {/* Source & Status Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Source Selector */}
          <div className="space-y-1.5 bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80">
            <label className="text-xs font-black text-slate-600 block">سورس درخواست:</label>
            <div className="grid grid-cols-3 gap-1.5">
              {[
                { id: 'web', label: '🌐 آنلاین' },
                { id: 'qms', label: '🏛️ حضوری' },
                { id: 'phone', label: '📞 تلفنی' },
              ].map(s => (
                <button
                  key={s.id}
                  onClick={() => setSource(s.id)}
                  className="py-2 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer text-center border"
                  style={{
                    background: source === s.id ? '#0f1e37' : 'white',
                    borderColor: source === s.id ? '#0f1e37' : '#e2e8f0',
                    color: source === s.id ? 'white' : '#475569',
                  }}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Quick Contact Bar */}
          <div className="space-y-1.5 bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 flex flex-col justify-between">
            <label className="text-xs font-black text-slate-600 block">ارتباط سریع با مشتری:</label>
            <div className="flex items-center gap-2">
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 py-2 px-3 rounded-xl bg-[#25D366] text-white font-bold text-xs flex items-center justify-center gap-1.5 hover:brightness-105 transition-all shadow-xs"
              >
                <MessageSquare size={15} />
                واتساپ
              </a>
              <a
                href={`tel:${cleanPhone}`}
                className="py-2 px-3 rounded-xl bg-white border border-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center gap-1 hover:bg-slate-100 transition-all"
              >
                <Phone size={15} />
                تماس
              </a>
            </div>
          </div>
        </div>

        {/* Workflow Steps */}
        <div className="space-y-2 bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
          <label className="text-xs font-black text-slate-600 block">مرحله و وضعیت فعلی پرونده (گردش کار):</label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {STATUS_STEPS.map(st => {
              const active = queueStatus === st.id;
              return (
                <button
                  key={st.id}
                  onClick={() => setQueueStatus(st.id)}
                  className="p-2.5 rounded-xl text-xs font-bold text-right transition-all cursor-pointer border flex items-center justify-between"
                  style={{
                    background: active ? st.bg : 'white',
                    borderColor: active ? st.border : '#e2e8f0',
                    color: active ? st.color : '#64748b',
                  }}
                >
                  <span className="truncate max-w-[150px]">{st.label}</span>
                  {active && <Check size={14} style={{ color: st.color }} />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Case Timeline / Description Notes */}
        <div className="space-y-2 bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
          <label className="text-xs font-black text-slate-600 block">یادداشت‌ها و روندهای ادامه دار پرونده:</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            placeholder="یادداشت‌های پیگیری، تاریخچه تماس، مراحل دولتی یا توضیحات کارهای انجام شده را اینجا وارد کنید..."
            className="w-full rounded-xl bg-white border border-slate-200 p-3 text-xs text-[#0f1e37] placeholder-slate-400 outline-none focus:border-gold leading-relaxed font-medium"
          />
        </div>

        {/* Documents & File Upload */}
        <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
          <div className="flex items-center justify-between">
            <label className="text-xs font-black text-slate-600">مدارک و فایل‌های پرونده ({files.length} مورد):</label>

            {/* Admin Upload Button */}
            <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0f1e37] text-white text-xs font-bold hover:bg-[#162a4a] cursor-pointer transition-all shadow-xs">
              <Upload size={13} className="text-gold" />
              <span>{uploading ? 'در حال آپلود...' : '+ آپلود فایل جدید (ادمین)'}</span>
              <input
                type="file"
                multiple
                onChange={handleAdminFileUpload}
                disabled={uploading}
                className="hidden"
              />
            </label>
          </div>

          {files.length > 0 ? (
            <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
              {files.map((file, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 transition-all text-xs"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <FileText size={15} className="text-gold shrink-0" />
                    <span className="font-bold text-[#0f1e37] truncate max-w-[200px]">{file.name}</span>
                    <span className="text-[10px] text-slate-400">({formatFileSize(file.size)})</span>
                  </div>

                  {file.url && (
                    <a
                      href={file.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-gold/15 text-gold-dark text-[10px] font-bold hover:bg-gold/25"
                    >
                      <Download size={12} />
                      دانلود
                    </a>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center py-4 text-slate-400 text-xs">
              هیچ مدرکی تاکنون آپلود نشده است
            </p>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between border-t border-slate-100 pt-4">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-100 cursor-pointer"
          >
            بستن
          </button>

          <button
            onClick={handleSave}
            disabled={saving}
            className="px-7 py-2.5 rounded-xl font-black text-xs cursor-pointer flex items-center gap-2 bg-[#0f1e37] text-white hover:bg-[#162a4a] transition-all shadow-md disabled:opacity-50"
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} className="text-gold" />}
            <span>ذخیره تمامی تغییرات پرونده</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
}

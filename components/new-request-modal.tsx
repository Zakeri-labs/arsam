'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  X, Plus, User, Phone, FileText, Upload, Download,
  Globe, Building2, PhoneCall, Loader2, Sparkles, Check
} from 'lucide-react';

export default function NewRequestModal({
  onClose,
  onSuccess,
  servicesList = [],
}: {
  onClose: () => void;
  onSuccess: () => void;
  servicesList?: string[];
}) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [source, setSource] = useState<'web' | 'qms' | 'phone'>('phone');
  const [serviceTitle, setServiceTitle] = useState(servicesList[0] || 'مشاوره ثبت شرکت');
  const [customService, setCustomService] = useState('');
  const [description, setDescription] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) {
      setErrorMsg('پر کردن نام و شماره تلفن الزامی است.');
      return;
    }

    const finalService = customService.trim() || serviceTitle;

    setLoading(true);
    setErrorMsg(null);

    try {
      const formData = new FormData();
      formData.append('name', name.trim());
      formData.append('phone', phone.trim());
      formData.append('serviceTitle', finalService);
      formData.append('description', description.trim());
      formData.append('source', source);

      for (const f of files) {
        formData.append('files', f);
      }

      const res = await fetch('/api/requests', {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        onSuccess();
        onClose();
      } else {
        const data = await res.json();
        setErrorMsg(data.error || 'خطا در ثبت درخواست');
      }
    } catch (err: any) {
      setErrorMsg('ارتباط با سرور برقرار نشد');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop Overlay */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/70 backdrop-blur-xs"
      />

      {/* Main Glass Dialog (Dark Navy) */}
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="relative z-10 w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-3xl p-6 bg-[#0b172a] text-white shadow-2xl space-y-4 border border-white/10"
        dir="rtl"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-xl bg-gold text-[#0f1e37] flex items-center justify-center font-black">
              <Plus size={18} />
            </div>
            <div>
              <h2 className="text-base font-black text-white">ثبت درخواست / پرونده جدید</h2>
              <p className="text-[11px] text-white/50 mt-0.5">ثبت دستی نوبت یا درخواست تلفنی متقاضیان</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-white/40 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-xl bg-red-500/20 border border-red-500/40 text-red-300 text-xs font-bold text-center">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Row 1: Name & Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-black text-white/70 flex items-center gap-1">
                <User size={13} className="text-white/40" />
                <span>نام و نام خانوادگی متقاضی: *</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="مثلا: علی رضایی"
                required
                className="w-full rounded-xl border border-white/10 bg-[#0f1e37] p-2.5 text-xs text-white placeholder-white/30 outline-none focus:border-gold font-semibold"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-black text-white/70 flex items-center gap-1">
                <Phone size={13} className="text-white/40" />
                <span>شماره تلفن متقاضی: *</span>
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+968 71713238"
                required
                dir="ltr"
                className="w-full rounded-xl border border-white/10 bg-[#0f1e37] p-2.5 text-xs text-white placeholder-white/30 outline-none focus:border-gold font-mono font-bold text-left"
              />
            </div>
          </div>

          {/* Source Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-black text-white/70 block">سورس دریافت درخواست:</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'phone', label: '📞 تلفنی / مشاوره', icon: PhoneCall },
                { id: 'qms', label: '🏛️ مراجعه حضوری', icon: Building2 },
                { id: 'web', label: '🌐 ثبت دستی وب', icon: Globe },
              ].map(s => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setSource(s.id as any)}
                  className="py-2.5 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer text-center border flex items-center justify-center gap-1"
                  style={{
                    background: source === s.id ? '#c9a227' : 'rgba(255,255,255,0.03)',
                    borderColor: source === s.id ? '#c9a227' : 'rgba(255,255,255,0.08)',
                    color: source === s.id ? '#0f1e37' : 'rgba(255,255,255,0.7)',
                  }}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Service Title Dropdown / Custom */}
          <div className="space-y-1.5">
            <label className="text-xs font-black text-white/70 block">عنوان خدمت درخواستی:</label>
            {servicesList.length > 0 ? (
              <select
                value={serviceTitle}
                onChange={(e) => setServiceTitle(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-[#0f1e37] p-2.5 text-xs text-white outline-none focus:border-gold font-extrabold cursor-pointer"
              >
                {servicesList.map((svc, idx) => (
                  <option key={idx} value={svc}>{svc}</option>
                ))}
                <option value="custom">سایر / عنوان دلخواه...</option>
              </select>
            ) : null}

            {(servicesList.length === 0 || serviceTitle === 'custom') && (
              <input
                type="text"
                value={customService}
                onChange={(e) => setCustomService(e.target.value)}
                placeholder="عنوان خدمت سفارشی..."
                className="w-full mt-1.5 rounded-xl border border-white/10 bg-[#0f1e37] p-2.5 text-xs text-white placeholder-white/30 outline-none focus:border-gold font-semibold"
              />
            )}
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-xs font-black text-white/70 block">توضیحات اولیه پرونده:</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="نکات اولیه، خواسته متقاضی یا توضیحات توافقات..."
              className="w-full rounded-xl border border-white/10 bg-[#0f1e37] p-2.5 text-xs text-white placeholder-white/30 outline-none focus:border-gold leading-relaxed font-medium"
            />
          </div>

          {/* File attachments */}
          <div className="space-y-1.5">
            <label className="text-xs font-black text-white/70 block">مدارک پیوست (اختیاری):</label>
            <div className="relative border-2 border-dashed border-white/10 rounded-2xl p-4 text-center hover:border-gold transition-colors cursor-pointer bg-[#0f1e37]">
              <input
                type="file"
                multiple
                onChange={handleFileChange}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              />
              <Upload className="mx-auto h-6 w-6 text-white/40 mb-1" />
              <p className="text-xs font-bold text-white/70">
                {files.length > 0 ? `${files.length} فایل انتخاب گردید` : 'جهت آپلود مدارک کلیک کنید یا فایل‌ها را رها کنید'}
              </p>
            </div>
          </div>

          {/* Form Action Buttons */}
          <div className="flex items-center justify-between border-t border-white/10 pt-4 mt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-white/10 text-white/70 text-xs font-bold hover:bg-white/5 cursor-pointer"
            >
              انصراف
            </button>

            <button
              type="submit"
              disabled={loading}
              className="px-7 py-2.5 rounded-xl font-black text-xs cursor-pointer flex items-center gap-2 bg-gold text-[#0f1e37] hover:brightness-110 transition-all shadow-md disabled:opacity-50"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
              <span>ایجاد و ثبت پرونده</span>
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

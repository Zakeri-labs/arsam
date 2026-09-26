'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { KeyRound, Lock, Plus, Save, ShieldCheck, Trash2, UserPlus, X, Power } from 'lucide-react';
import { confirmDialog } from '@/components/confirm-dialog';

// Access management (general manager only): create staff accounts and choose
// which admin sections each one can open. The server enforces every rule; this
// screen is only the editor.

type Screen = 'services' | 'requests' | 'qms' | 'customers' | 'cars';

const SCREENS: { id: Screen; label: string }[] = [
  { id: 'services', label: 'مدیریت خدمات' },
  { id: 'requests', label: 'درخواست‌های ارسالی' },
  { id: 'qms', label: 'مدیریت صف QMS' },
  { id: 'customers', label: 'مدیریت مشتریان (CRM)' },
  { id: 'cars', label: 'مدیریت خودروها' },
];

const MIN_PASSWORD_LENGTH = 10;

interface BuiltInAccount {
  email: string;
  name: string;
  role: string;
  allowedScreens: Screen[];
}

interface StaffAccount {
  id: string;
  email: string;
  name: string;
  allowedScreens: Screen[];
  isActive: boolean;
  createdAt: string;
}

const screenLabel = (id: Screen) => SCREENS.find(s => s.id === id)?.label ?? id;

function ScreenPicker({ value, onChange }: { value: Screen[]; onChange: (next: Screen[]) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {SCREENS.map(s => {
        const on = value.includes(s.id);
        return (
          <button
            key={s.id}
            type="button"
            onClick={() => onChange(on ? value.filter(v => v !== s.id) : [...value, s.id])}
            className={`px-3 py-1.5 rounded-xl text-[11px] font-bold border transition-all cursor-pointer ${
              on ? 'bg-gold/20 border-gold/60 text-gold' : 'bg-white/5 border-white/10 text-white/50 hover:text-white'
            }`}
          >
            {on ? '✓ ' : ''}{s.label}
          </button>
        );
      })}
    </div>
  );
}

const inputClass =
  'w-full rounded-xl border border-white/10 bg-[#07111f] px-3 py-2.5 text-xs text-white placeholder:text-white/30 focus:border-gold/60 focus:outline-none';

export default function AccessScreen() {
  const [builtIn, setBuiltIn] = useState<BuiltInAccount[]>([]);
  const [staff, setStaff] = useState<StaffAccount[] | null>(null);
  const [busy, setBusy] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', allowedScreens: [] as Screen[] });

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editScreens, setEditScreens] = useState<Screen[]>([]);
  const [editName, setEditName] = useState('');

  const load = async () => {
    try {
      const res = await fetch('/api/admin-users');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'خطا در دریافت لیست کاربران');
      setBuiltIn(data.builtIn || []);
      setStaff(data.staff || []);
    } catch (err: any) {
      toast.error(err.message);
      setStaff([]);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const call = async (method: string, body?: object, query = '') => {
    setBusy(true);
    try {
      const res = await fetch(`/api/admin-users${query}`, {
        method,
        headers: body ? { 'Content-Type': 'application/json' } : undefined,
        body: body ? JSON.stringify(body) : undefined,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'خطا در انجام عملیات');
      return data;
    } catch (err: any) {
      toast.error(err.message);
      return null;
    } finally {
      setBusy(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password.length < MIN_PASSWORD_LENGTH) {
      toast.error(`رمز عبور باید حداقل ${MIN_PASSWORD_LENGTH} کاراکتر باشد.`);
      return;
    }
    if (form.allowedScreens.length === 0) {
      toast.error('حداقل یک بخش را انتخاب کنید.');
      return;
    }
    const data = await call('POST', form);
    if (data) {
      toast.success(`کاربر «${data.account.name}» ایجاد شد`);
      setForm({ name: '', email: '', password: '', allowedScreens: [] });
      setShowForm(false);
      load();
    }
  };

  const startEdit = (u: StaffAccount) => {
    setEditingId(u.id);
    setEditScreens(u.allowedScreens);
    setEditName(u.name);
  };

  const saveEdit = async () => {
    if (!editingId) return;
    if (editScreens.length === 0) {
      toast.error('حداقل یک بخش را انتخاب کنید.');
      return;
    }
    const data = await call('PATCH', { id: editingId, name: editName, allowedScreens: editScreens });
    if (data) {
      toast.success('دسترسی‌ها ذخیره شد');
      setEditingId(null);
      load();
    }
  };

  const toggleActive = async (u: StaffAccount) => {
    if (u.isActive && !(await confirmDialog({
      title: 'غیرفعال کردن کاربر',
      message: `«${u.name}» دیگر نمی‌تواند وارد پنل شود و اگر الان وارد است، فوراً خارج می‌شود.`,
      confirmText: 'غیرفعال شود',
      destructive: true,
    }))) return;
    const data = await call('PATCH', { id: u.id, isActive: !u.isActive });
    if (data) {
      toast.success(u.isActive ? 'کاربر غیرفعال شد' : 'کاربر فعال شد');
      load();
    }
  };

  const resetPassword = async (u: StaffAccount) => {
    const password = window.prompt(`رمز عبور جدید برای «${u.name}» (حداقل ${MIN_PASSWORD_LENGTH} کاراکتر):`);
    if (password === null) return;
    if (password.length < MIN_PASSWORD_LENGTH) {
      toast.error(`رمز عبور باید حداقل ${MIN_PASSWORD_LENGTH} کاراکتر باشد.`);
      return;
    }
    const data = await call('PATCH', { id: u.id, password });
    if (data) toast.success('رمز عبور تغییر کرد؛ کاربر از همه‌ی دستگاه‌ها خارج شد');
  };

  const remove = async (u: StaffAccount) => {
    if (!(await confirmDialog({
      title: 'حذف کاربر',
      message: `حساب «${u.name}» (${u.email}) برای همیشه حذف می‌شود.`,
      confirmText: 'حذف',
      destructive: true,
    }))) return;
    const data = await call('DELETE', undefined, `?id=${encodeURIComponent(u.id)}`);
    if (data) {
      toast.success('کاربر حذف شد');
      load();
    }
  };

  return (
    <div className="space-y-5 text-right text-white" dir="rtl">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-[#0b172a] p-4">
        <div className="flex items-center gap-3">
          <ShieldCheck className="h-6 w-6 text-gold" />
          <div>
            <h2 className="text-sm font-extrabold">کاربران و دسترسی‌ها</h2>
            <p className="text-[10px] text-white/50 mt-1">
              برای هر همکار یک حساب بسازید و مشخص کنید به کدام بخش‌های پنل دسترسی داشته باشد.
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowForm(v => !v)}
          className="flex items-center gap-2 rounded-xl bg-gold px-4 py-2.5 text-xs font-black text-[#0f1e37] hover:opacity-90 cursor-pointer"
        >
          {showForm ? <X className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
          {showForm ? 'انصراف' : 'افزودن کاربر'}
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <form onSubmit={handleCreate} className="space-y-4 rounded-2xl border border-gold/30 bg-[#0b172a] p-4">
          <div className="grid gap-3 md:grid-cols-3">
            <label className="space-y-1.5">
              <span className="text-[11px] font-bold text-white/60">نام و سمت</span>
              <input className={inputClass} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                placeholder="مثلاً: علی رضایی (پذیرش)" required maxLength={100} />
            </label>
            <label className="space-y-1.5">
              <span className="text-[11px] font-bold text-white/60">ایمیل (نام کاربری)</span>
              <input className={`${inputClass} dir-ltr text-left`} dir="ltr" type="email" value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })} placeholder="name@example.com" required />
            </label>
            <label className="space-y-1.5">
              <span className="text-[11px] font-bold text-white/60">رمز عبور (حداقل {MIN_PASSWORD_LENGTH} کاراکتر)</span>
              <input className={`${inputClass} text-left`} dir="ltr" type="password" autoComplete="new-password"
                value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required
                minLength={MIN_PASSWORD_LENGTH} />
            </label>
          </div>
          <div className="space-y-2">
            <span className="text-[11px] font-bold text-white/60">دسترسی به بخش‌ها</span>
            <ScreenPicker value={form.allowedScreens} onChange={v => setForm({ ...form, allowedScreens: v })} />
          </div>
          <button type="submit" disabled={busy}
            className="flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-xs font-black text-white hover:bg-emerald-600 disabled:opacity-50 cursor-pointer">
            <Plus className="h-4 w-4" /> ایجاد حساب
          </button>
        </form>
      )}

      {/* Built-in accounts */}
      <div className="rounded-2xl border border-white/10 bg-[#0b172a] p-4 space-y-3">
        <h3 className="text-xs font-extrabold text-white/80">حساب‌های اصلی</h3>
        <p className="text-[10px] text-white/40">رمز این حساب‌ها فقط از تنظیمات سرور (Vercel) تغییر می‌کند و از این صفحه قابل ویرایش نیستند.</p>
        {builtIn.map(u => (
          <div key={u.email} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/5 bg-white/[0.03] p-3">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold">
                <Lock className="h-3.5 w-3.5 text-white/40" /> {u.name}
                {u.role === 'superadmin' && <span className="rounded-full bg-gold/20 px-2 py-0.5 text-[9px] text-gold">مدیر کل</span>}
              </div>
              <div className="text-[10px] text-emerald-400 font-mono mt-1" dir="ltr">{u.email}</div>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {u.allowedScreens.map(s => (
                <span key={s} className="rounded-lg bg-white/5 px-2 py-1 text-[10px] text-white/60">{screenLabel(s)}</span>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Staff accounts */}
      <div className="rounded-2xl border border-white/10 bg-[#0b172a] p-4 space-y-3">
        <h3 className="text-xs font-extrabold text-white/80">همکاران</h3>
        {staff === null ? (
          <div className="py-8 text-center text-xs text-white/40">در حال دریافت...</div>
        ) : staff.length === 0 ? (
          <div className="py-8 text-center text-xs text-white/40">هنوز کاربری اضافه نشده است.</div>
        ) : (
          staff.map(u => (
            <div key={u.id} className={`rounded-xl border p-3 space-y-3 ${u.isActive ? 'border-white/10 bg-white/[0.03]' : 'border-red-500/20 bg-red-500/5 opacity-70'}`}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2 text-xs font-bold">
                    {editingId === u.id ? (
                      <input className={`${inputClass} py-1.5 w-56`} value={editName} onChange={e => setEditName(e.target.value)} maxLength={100} />
                    ) : u.name}
                    {!u.isActive && <span className="rounded-full bg-red-500/20 px-2 py-0.5 text-[9px] text-red-300">غیرفعال</span>}
                  </div>
                  <div className="text-[10px] text-emerald-400 font-mono mt-1" dir="ltr">{u.email}</div>
                </div>
                <div className="flex items-center gap-1.5">
                  {editingId === u.id ? (
                    <>
                      <button onClick={saveEdit} disabled={busy} title="ذخیره"
                        className="flex items-center gap-1 rounded-lg bg-emerald-500 px-3 py-1.5 text-[11px] font-bold text-white disabled:opacity-50 cursor-pointer">
                        <Save className="h-3.5 w-3.5" /> ذخیره
                      </button>
                      <button onClick={() => setEditingId(null)} title="انصراف"
                        className="rounded-lg bg-white/5 px-3 py-1.5 text-[11px] font-bold text-white/60 cursor-pointer">انصراف</button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => startEdit(u)} className="rounded-lg bg-white/5 px-3 py-1.5 text-[11px] font-bold text-white/80 hover:bg-white/10 cursor-pointer">
                        ویرایش دسترسی
                      </button>
                      <button onClick={() => resetPassword(u)} title="تغییر رمز" disabled={busy}
                        className="rounded-lg bg-white/5 p-2 text-white/70 hover:bg-white/10 cursor-pointer"><KeyRound className="h-3.5 w-3.5" /></button>
                      <button onClick={() => toggleActive(u)} title={u.isActive ? 'غیرفعال کردن' : 'فعال کردن'} disabled={busy}
                        className={`rounded-lg p-2 cursor-pointer ${u.isActive ? 'bg-white/5 text-amber-300 hover:bg-amber-500/10' : 'bg-emerald-500/15 text-emerald-300'}`}>
                        <Power className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={() => remove(u)} title="حذف" disabled={busy}
                        className="rounded-lg bg-white/5 p-2 text-red-400 hover:bg-red-500/10 cursor-pointer"><Trash2 className="h-3.5 w-3.5" /></button>
                    </>
                  )}
                </div>
              </div>
              {editingId === u.id ? (
                <ScreenPicker value={editScreens} onChange={setEditScreens} />
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {u.allowedScreens.map(s => (
                    <span key={s} className="rounded-lg bg-gold/10 px-2 py-1 text-[10px] text-gold/90">{screenLabel(s)}</span>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

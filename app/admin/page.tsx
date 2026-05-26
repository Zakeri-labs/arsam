'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Lock, Mail, Eye, EyeOff, LayoutDashboard, Plus, Search, 
  Trash2, Edit3, Globe, Save, LogOut, Check, X, FileText, 
  Layers, Landmark, Briefcase, Calendar, AlertTriangle, ExternalLink
} from 'lucide-react';
import { toast, Toaster } from 'sonner';

// Categories list matching app/page.tsx
const categories = [
  'Company Setup Services',
  'Renewal Services',
  'Ejari Registration Services',
  'Banking Services',
  'Tax Services',
  'Tourism Services',
  'License Modification Services',
  'Cancellation Services',
  'General Government Services',
];

const categoryTranslations = {
  'Company Setup Services': 'ثبت شرکت',
  'Renewal Services': 'تمدید خدمات',
  'Ejari Registration Services': 'ایجاری / بلدیه',
  'Banking Services': 'خدمات بانکی',
  'Tax Services': 'امور مالیاتی',
  'Tourism Services': 'گردشگری',
  'License Modification Services': 'اصلاح لایسنس',
  'Cancellation Services': 'کنسلی و انحلال',
  'General Government Services': 'خدمات دولتی',
};

interface Service {
  id: string;
  title: string;
  description: string;
  serviceFee?: string;
  governmentFees?: string;
  workingDays?: string;
  requirements?: string[];
  category?: string;
}

interface ServicesDB {
  en: Service[];
  fa: Service[];
  ar: Service[];
  uaeServiceIds: string[];
  omanServiceIds: string[];
}

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Dashboard state
  const [db, setDb] = useState<ServicesDB | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('all');
  const [selectedCountryFilter, setSelectedCountryFilter] = useState('all');

  // Editor modal state
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null); // null means adding a new service
  const [editorLanguageTab, setEditorLanguageTab] = useState<'fa' | 'en' | 'ar'>('fa');

  // Editor form values
  const [formId, setFormId] = useState('');
  const [formCategory, setFormCategory] = useState(categories[0]);
  const [formServiceFee, setFormServiceFee] = useState('');
  const [formGovFees, setFormGovFees] = useState('');
  const [formWorkingDays, setFormWorkingDays] = useState('');
  const [formUaeActive, setFormUaeActive] = useState(true);
  const [formOmanActive, setFormOmanActive] = useState(false);

  // Language specific form values
  const [langData, setLangData] = useState<Record<'en' | 'fa' | 'ar', {
    title: string;
    description: string;
    requirements: string[];
  }>>({
    en: { title: '', description: '', requirements: [''] },
    fa: { title: '', description: '', requirements: [''] },
    ar: { title: '', description: '', requirements: [''] },
  });

  // Check auth status on mount
  useEffect(() => {
    fetch('/api/auth')
      .then(res => res.json())
      .then(data => {
        setIsAuthenticated(data.authenticated);
      })
      .catch(() => setIsAuthenticated(false));
  }, []);

  // Fetch database when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      fetchServices();
    }
  }, [isAuthenticated]);

  const fetchServices = () => {
    fetch('/api/services')
      .then(res => res.json())
      .then(data => {
        if (data && data.en) {
          setDb(data);
        }
      })
      .catch(() => toast.error('خطا در لود اطلاعات خدمات'));
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('لطفا تمام فیلدها را پر کنید');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setIsAuthenticated(true);
        toast.success('خوش آمدید! ورود موفقیت‌آمیز بود');
      } else {
        toast.error(data.error || 'اطلاعات ورود اشتباه است');
      }
    } catch (err) {
      toast.error('خطا در برقراری ارتباط با سرور');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth', { method: 'DELETE' });
      setIsAuthenticated(false);
      setDb(null);
      toast.success('با موفقیت خارج شدید');
    } catch (err) {
      toast.error('خطا در خروج از حساب کاربری');
    }
  };

  // Open editor for adding new service
  const handleAddClick = () => {
    setEditingId(null);
    setFormId('');
    setFormCategory(categories[0]);
    setFormServiceFee('');
    setFormGovFees('');
    setFormWorkingDays('');
    setFormUaeActive(true);
    setFormOmanActive(false);

    setLangData({
      en: { title: '', description: '', requirements: [''] },
      fa: { title: '', description: '', requirements: [''] },
      ar: { title: '', description: '', requirements: [''] },
    });

    setEditorLanguageTab('fa');
    setIsEditorOpen(true);
  };

  // Open editor for editing an existing service
  const handleEditClick = (serviceId: string) => {
    if (!db) return;

    setEditingId(serviceId);
    setFormId(serviceId);

    // Find services in each language
    const serviceEN = db.en.find(s => s.id === serviceId);
    const serviceFA = db.fa.find(s => s.id === serviceId);
    const serviceAR = db.ar.find(s => s.id === serviceId);

    // Common fields (we can pull from FA, or EN)
    const base = serviceFA || serviceEN || serviceAR;
    if (!base) return;

    setFormCategory(base.category || categories[0]);
    setFormServiceFee(base.serviceFee || '');
    setFormGovFees(base.governmentFees || '');
    setFormWorkingDays(base.workingDays || '');
    setFormUaeActive(db.uaeServiceIds.includes(serviceId));
    setFormOmanActive(db.omanServiceIds.includes(serviceId));

    setLangData({
      en: {
        title: serviceEN?.title || '',
        description: serviceEN?.description || '',
        requirements: serviceEN?.requirements && serviceEN.requirements.length > 0 ? [...serviceEN.requirements] : [''],
      },
      fa: {
        title: serviceFA?.title || '',
        description: serviceFA?.description || '',
        requirements: serviceFA?.requirements && serviceFA.requirements.length > 0 ? [...serviceFA.requirements] : [''],
      },
      ar: {
        title: serviceAR?.title || '',
        description: serviceAR?.description || '',
        requirements: serviceAR?.requirements && serviceAR.requirements.length > 0 ? [...serviceAR.requirements] : [''],
      },
    });

    setEditorLanguageTab('fa');
    setIsEditorOpen(true);
  };

  const handleDeleteClick = async (serviceId: string) => {
    if (!db) return;
    const confirmDelete = window.confirm(`آیا مطمئن هستید که می‌خواهید خدمت با شناسه "${serviceId}" را حذف کنید؟`);
    if (!confirmDelete) return;

    // Filter out the service
    const updatedDb: ServicesDB = {
      en: db.en.filter(s => s.id !== serviceId),
      fa: db.fa.filter(s => s.id !== serviceId),
      ar: db.ar.filter(s => s.id !== serviceId),
      uaeServiceIds: db.uaeServiceIds.filter(id => id !== serviceId),
      omanServiceIds: db.omanServiceIds.filter(id => id !== serviceId),
    };

    setLoading(true);
    try {
      const res = await fetch('/api/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedDb),
      });

      if (res.ok) {
        setDb(updatedDb);
        toast.success('خدمت با موفقیت حذف شد');
      } else {
        const errData = await res.json();
        toast.error(errData.error || 'خطا در حذف خدمت');
      }
    } catch (err) {
      toast.error('خطا در ذخیره‌سازی اطلاعات در سرور');
    } finally {
      setLoading(false);
    }
  };

  // Requirement row manipulation
  const handleRequirementChange = (lang: 'en' | 'fa' | 'ar', index: number, value: string) => {
    const updated = { ...langData };
    updated[lang].requirements[index] = value;
    setLangData(updated);
  };

  const addRequirementRow = (lang: 'en' | 'fa' | 'ar') => {
    const updated = { ...langData };
    updated[lang].requirements.push('');
    setLangData(updated);
  };

  const removeRequirementRow = (lang: 'en' | 'fa' | 'ar', index: number) => {
    const updated = { ...langData };
    if (updated[lang].requirements.length > 1) {
      updated[lang].requirements.splice(index, 1);
    } else {
      updated[lang].requirements[0] = '';
    }
    setLangData(updated);
  };

  const handleSaveService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db) return;

    // Validate
    if (!langData.fa.title || !langData.en.title || !langData.ar.title) {
      toast.error('وارد کردن عنوان خدمت در هر ۳ زبان الزامی است');
      return;
    }

    if (!formUaeActive && !formOmanActive) {
      toast.error('خدمت باید حداقل برای یکی از کشورهای امارات یا عمان فعال باشد');
      return;
    }

    // Determine ID
    let finalId = formId.trim().toLowerCase().replace(/[^a-z0-9-_]/g, '-');
    if (!finalId) {
      // Slugify English Title
      finalId = langData.en.title.trim().toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-');
    }

    if (!finalId) {
      toast.error('شناسه خدمت معتبر نیست. لطفا یک شناسه انگلیسی وارد کنید');
      return;
    }

    // Check duplicate ID if adding new
    if (editingId === null) {
      const exists = db.fa.some(s => s.id === finalId);
      if (exists) {
        toast.error(`خطا: شناسه "${finalId}" تکراری است. لطفا شناسه یکتای دیگری انتخاب کنید.`);
        return;
      }
    }

    // Prepare clean requirements arrays (remove empty elements)
    const cleanRequirements = (lang: 'en' | 'fa' | 'ar') => {
      return langData[lang].requirements
        .map(r => r.trim())
        .filter(r => r !== '');
    };

    // Construct services for each language
    const createServiceObj = (lang: 'en' | 'fa' | 'ar'): Service => {
      const obj: Service = {
        id: finalId,
        title: langData[lang].title.trim(),
        description: langData[lang].description.trim(),
        requirements: cleanRequirements(lang),
        category: formCategory,
      };

      if (formServiceFee.trim()) obj.serviceFee = formServiceFee.trim();
      if (formGovFees.trim()) obj.governmentFees = formGovFees.trim();
      if (formWorkingDays.trim()) obj.workingDays = formWorkingDays.trim();

      return obj;
    };

    const newEnService = createServiceObj('en');
    const newFaService = createServiceObj('fa');
    const newArService = createServiceObj('ar');

    // Create updated database copy
    let updatedEn = [...db.en];
    let updatedFa = [...db.fa];
    let updatedAr = [...db.ar];
    let updatedUaeIds = [...db.uaeServiceIds];
    let updatedOmanIds = [...db.omanServiceIds];

    if (editingId !== null) {
      // Modify existing
      updatedEn = updatedEn.map(s => s.id === editingId ? newEnService : s);
      updatedFa = updatedFa.map(s => s.id === editingId ? newFaService : s);
      updatedAr = updatedAr.map(s => s.id === editingId ? newArService : s);

      // If ID changed, we must replace it in the lists too
      if (editingId !== finalId) {
        updatedEn = updatedEn.map(s => s.id === editingId ? { ...s, id: finalId } : s);
        updatedFa = updatedFa.map(s => s.id === editingId ? { ...s, id: finalId } : s);
        updatedAr = updatedAr.map(s => s.id === editingId ? { ...s, id: finalId } : s);
        updatedUaeIds = updatedUaeIds.map(id => id === editingId ? finalId : id);
        updatedOmanIds = updatedOmanIds.map(id => id === editingId ? finalId : id);
      }
    } else {
      // Add new
      updatedEn.push(newEnService);
      updatedFa.push(newFaService);
      updatedAr.push(newArService);
    }

    // Sync country lists
    // 1. UAE
    if (formUaeActive) {
      if (!updatedUaeIds.includes(finalId)) updatedUaeIds.push(finalId);
    } else {
      updatedUaeIds = updatedUaeIds.filter(id => id !== finalId);
    }
    // 2. Oman
    if (formOmanActive) {
      if (!updatedOmanIds.includes(finalId)) updatedOmanIds.push(finalId);
    } else {
      updatedOmanIds = updatedOmanIds.filter(id => id !== finalId);
    }

    const updatedDb: ServicesDB = {
      en: updatedEn,
      fa: updatedFa,
      ar: updatedAr,
      uaeServiceIds: updatedUaeIds,
      omanServiceIds: updatedOmanIds,
    };

    setLoading(true);
    try {
      const res = await fetch('/api/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedDb),
      });

      if (res.ok) {
        setDb(updatedDb);
        setIsEditorOpen(false);
        toast.success(editingId ? 'تغییرات خدمت با موفقیت ذخیره شد' : 'خدمت جدید با موفقیت اضافه شد');
      } else {
        const errData = await res.json();
        toast.error(errData.error || 'خطا در ذخیره‌سازی اطلاعات');
      }
    } catch (err) {
      toast.error('خطا در ذخیره‌سازی اطلاعات در سرور');
    } finally {
      setLoading(false);
    }
  };

  // Filter services for the display list
  const getFilteredServices = () => {
    if (!db) return [];

    // We list Persian version for the dashboard management
    let services = [...db.fa];

    // If search query exists
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      services = services.filter(s => 
        s.title.toLowerCase().includes(query) || 
        s.id.toLowerCase().includes(query) ||
        (s.description && s.description.toLowerCase().includes(query))
      );
    }

    // Category filter
    if (selectedCategoryFilter !== 'all') {
      services = services.filter(s => s.category === selectedCategoryFilter);
    }

    // Country filter
    if (selectedCountryFilter !== 'all') {
      if (selectedCountryFilter === 'uae') {
        services = services.filter(s => db.uaeServiceIds.includes(s.id));
      } else if (selectedCountryFilter === 'oman') {
        services = services.filter(s => db.omanServiceIds.includes(s.id));
      } else if (selectedCountryFilter === 'both') {
        services = services.filter(s => db.uaeServiceIds.includes(s.id) && db.omanServiceIds.includes(s.id));
      }
    }

    return services;
  };

  const filteredList = getFilteredServices();

  if (isAuthenticated === null) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0f1e37] text-white">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-gold border-t-transparent"></div>
          <span className="font-semibold text-sm tracking-wide">درحال بررسی سشن مدیریت...</span>
        </div>
      </div>
    );
  }

  // --- 1. LOGIN SCREEN ---
  if (!isAuthenticated) {
    return (
      <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-[#070e1b] via-[#0f1e37] to-[#162a4a] px-4 font-sans text-right" dir="rtl">
        {/* Luxury Background Lights */}
        <div className="absolute top-1/4 left-1/4 h-[350px] w-[350px] rounded-full bg-gold/10 blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 h-[350px] w-[350px] rounded-full bg-gold/5 blur-[120px]" />

        <Toaster position="bottom-center" toastOptions={{ style: { fontFamily: 'inherit' } }} />

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="z-10 w-full max-w-[420px] rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur-xl md:p-10"
        >
          {/* Brand Logo & Name */}
          <div className="mb-8 flex flex-col items-center">
            <div className="logo-shimmer-container relative h-20 w-44 mb-3">
              <Image
                src="/logo.png"
                alt="الافق الذهبی"
                fill
                className="object-contain"
                priority
              />
            </div>
            <h2 className="text-xl font-bold text-white tracking-wide">الافق الذهبی</h2>
            <p className="mt-1.5 text-xs text-white/60">ورود به پنل مدیریت کل خدمات</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            {/* Email Field */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-white/80 pr-1">پست الکترونیکی (ایمیل)</label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3.5 text-white/40">
                  <Mail className="h-4.5 w-4.5" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@gmail.com"
                  className="w-full rounded-2xl border border-white/10 bg-white/5 py-3 pr-11 pl-4 text-sm text-white placeholder-white/30 outline-none transition-all focus:border-gold/60 focus:bg-white/10 focus:ring-1 focus:ring-gold/30 text-left"
                  dir="ltr"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-white/80 pr-1">رمز عبور</label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3.5 text-white/40">
                  <Lock className="h-4.5 w-4.5" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-2xl border border-white/10 bg-white/5 py-3 pr-11 pl-12 text-sm text-white placeholder-white/30 outline-none transition-all focus:border-gold/60 focus:bg-white/10 focus:ring-1 focus:ring-gold/30 text-left"
                  dir="ltr"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-white/40 hover:text-white"
                >
                  {showPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="group relative flex w-full items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-r from-gold to-[#dbb42c] py-3.5 text-sm font-extrabold text-[#0f1e37] shadow-lg shadow-gold/15 transition-all hover:brightness-105 active:scale-98 disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#0f1e37] border-t-transparent"></div>
              ) : (
                <span className="flex items-center gap-1.5">
                  ورود به پنل مدیریت
                  <ChevronLeft className="h-4 w-4" />
                </span>
              )}
            </button>
          </form>

          {/* Luxury Tagline */}
          <div className="mt-8 text-center text-[10px] text-white/40 tracking-widest uppercase">
            <span>GOLDEN HORIZON SERVICES</span>
          </div>
        </motion.div>
      </div>
    );
  }

  // --- 2. ADMIN DASHBOARD SCREEN ---
  return (
    <div className="min-h-screen bg-slate-50/50 pb-16 font-sans text-right" dir="rtl">
      <Toaster position="top-center" toastOptions={{ style: { fontFamily: 'inherit' } }} />

      {/* Luxury Navbar */}
      <header className="sticky top-0 z-30 w-full border-b border-[#ede8df] bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 md:px-6">
          
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-navy to-[#1e3a5f] text-gold border border-gold/20 shadow-md">
              <LayoutDashboard className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-[15px] font-black text-navy leading-tight">پنل مدیریت خدمات</h1>
              <p className="text-[10px] font-bold text-gold tracking-wide mt-0.5">الافق الذهبی | AL UFUQ AL DAHABI</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <a 
              href="/" 
              target="_blank" 
              className="flex items-center gap-1 text-[11px] font-bold text-navy hover:text-gold transition-colors bg-secondary px-3 py-2 rounded-full border border-border"
            >
              مشاهده لندینگ پیج
              <ExternalLink className="h-3 w-3" />
            </a>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 text-[11px] font-bold text-red-600 hover:bg-red-50 hover:text-red-700 transition-all border border-red-200/50 px-4 py-2 rounded-full cursor-pointer"
            >
              خروج از حساب
              <LogOut className="h-3.5 w-3.5" />
            </button>
          </div>

        </div>
      </header>

      {/* Main Dashboard Layout */}
      <main className="mx-auto max-w-6xl px-4 py-6 md:px-6">
        {db ? (
          <div className="space-y-6">
            
            {/* Quick Stat Cards */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {/* Card 1 */}
              <div className="relative overflow-hidden rounded-2xl border border-border bg-white p-5 shadow-sm">
                <div className="absolute top-0 right-0 h-1 w-full bg-navy"></div>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-muted-foreground">کل خدمات ثبت شده</span>
                    <h3 className="mt-2 text-2xl font-black text-navy">{db.fa.length} خدمت</h3>
                  </div>
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-navy/5 text-navy">
                    <Briefcase className="h-5.5 w-5.5" />
                  </div>
                </div>
              </div>

              {/* Card 2 */}
              <div className="relative overflow-hidden rounded-2xl border border-border bg-white p-5 shadow-sm">
                <div className="absolute top-0 right-0 h-1 w-full bg-gold"></div>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-muted-foreground">خدمات فعال در امارات</span>
                    <h3 className="mt-2 text-2xl font-black text-navy">{db.uaeServiceIds.length} خدمت</h3>
                  </div>
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gold/5 text-gold">
                    <Landmark className="h-5.5 w-5.5" />
                  </div>
                </div>
              </div>

              {/* Card 3 */}
              <div className="relative overflow-hidden rounded-2xl border border-border bg-white p-5 shadow-sm">
                <div className="absolute top-0 right-0 h-1 w-full bg-emerald-500"></div>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-muted-foreground">خدمات فعال در عمان</span>
                    <h3 className="mt-2 text-2xl font-black text-navy">{db.omanServiceIds.length} خدمت</h3>
                  </div>
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                    <Globe className="h-5.5 w-5.5" />
                  </div>
                </div>
              </div>
            </div>

            {/* Filter and Management Bar */}
            <div className="rounded-2xl border border-border bg-white p-4 shadow-sm">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                
                {/* Search & Filters */}
                <div className="grid flex-1 grid-cols-1 gap-3 sm:grid-cols-3">
                  {/* Search Input */}
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground">
                      <Search className="h-4 w-4" />
                    </div>
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="جستجو در عنوان یا شناسه..."
                      className="w-full rounded-xl border border-border bg-slate-50/50 py-2.5 pr-9 pl-4 text-xs outline-none focus:border-gold focus:bg-white focus:ring-1 focus:ring-gold/30"
                    />
                  </div>

                  {/* Category Filter */}
                  <select
                    value={selectedCategoryFilter}
                    onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                    className="rounded-xl border border-border bg-slate-50/50 px-3 py-2.5 text-xs outline-none focus:border-gold focus:bg-white focus:ring-1 focus:ring-gold/30"
                  >
                    <option value="all">همه دسته‌بندی‌ها</option>
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{categoryTranslations[cat]}</option>
                    ))}
                  </select>

                  {/* Country Filter */}
                  <select
                    value={selectedCountryFilter}
                    onChange={(e) => setSelectedCountryFilter(e.target.value)}
                    className="rounded-xl border border-border bg-slate-50/50 px-3 py-2.5 text-xs outline-none focus:border-gold focus:bg-white focus:ring-1 focus:ring-gold/30"
                  >
                    <option value="all">همه کشورها (امارات / عمان)</option>
                    <option value="uae">فقط امارات متحده عربی</option>
                    <option value="oman">فقط سلطان‌نشین عمان</option>
                    <option value="both">مشترک در هر دو کشور</option>
                  </select>
                </div>

                {/* Add Service Button */}
                <button
                  onClick={handleAddClick}
                  className="flex items-center justify-center gap-1.5 rounded-xl bg-navy px-5 py-2.5 text-xs font-bold text-white hover:bg-navy-light shadow-md shadow-navy/10 active:scale-98 transition-all cursor-pointer"
                >
                  <Plus className="h-4.5 w-4.5" />
                  افزودن خدمت جدید
                </button>

              </div>
            </div>

            {/* Services Table List */}
            <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full table-auto border-collapse text-right text-xs">
                  <thead>
                    <tr className="border-b border-border bg-slate-50/70 text-navy font-bold">
                      <th className="py-4.5 px-4 font-extrabold">عنوان خدمت (فارسی)</th>
                      <th className="py-4.5 px-4 font-extrabold">دسته‌بندی</th>
                      <th className="py-4.5 px-4 font-extrabold">هزینه خدمات / کارمزد</th>
                      <th className="py-4.5 px-4 font-extrabold text-center">کشورها</th>
                      <th className="py-4.5 px-4 font-extrabold text-center">ترجمه‌ها</th>
                      <th className="py-4.5 px-4 font-extrabold text-center">عملیات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {filteredList.length > 0 ? (
                      filteredList.map((service) => {
                        const inUae = db.uaeServiceIds.includes(service.id);
                        const inOman = db.omanServiceIds.includes(service.id);
                        
                        // Check if translated versions exist
                        const hasEn = db.en.some(s => s.id === service.id && s.title.trim() !== '');
                        const hasAr = db.ar.some(s => s.id === service.id && s.title.trim() !== '');

                        return (
                          <tr key={service.id} className="hover:bg-slate-50/30 transition-colors">
                            {/* Title & ID */}
                            <td className="py-4 px-4">
                              <div className="font-bold text-navy text-[13px]">{service.title}</div>
                              <div className="mt-1 font-mono text-[10px] text-muted-foreground select-all bg-slate-50 px-2 py-0.5 rounded border border-border/20 inline-block">{service.id}</div>
                            </td>
                            
                            {/* Category */}
                            <td className="py-4 px-4 text-muted-foreground font-semibold">
                              {categoryTranslations[service.category || ''] || service.category}
                            </td>

                            {/* Service Fee */}
                            <td className="py-4 px-4 font-mono font-bold text-navy">
                              {service.serviceFee || 'ثبت نشده'}
                            </td>

                            {/* Countries Active */}
                            <td className="py-4 px-4 text-center">
                              <div className="flex justify-center gap-1.5">
                                {inUae && (
                                  <span className="rounded-full bg-gold/10 px-2 py-0.5 text-[10px] font-bold text-gold border border-gold/20">امارات</span>
                                )}
                                {inOman && (
                                  <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-600 border border-emerald-200/50">عمان</span>
                                )}
                                {!inUae && !inOman && (
                                  <span className="rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-bold text-red-600 border border-red-100">غیرفعال</span>
                                )}
                              </div>
                            </td>

                            {/* Translation Status */}
                            <td className="py-4 px-4 text-center">
                              <div className="flex justify-center gap-1">
                                <span className="rounded-full bg-navy/5 px-1.5 py-0.5 text-[9px] font-extrabold text-navy/70 border border-navy/10">FA</span>
                                <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-extrabold border ${hasEn ? 'bg-indigo-50 text-indigo-600 border-indigo-200/50' : 'bg-red-50 text-red-400 border-red-100'}`}>EN</span>
                                <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-extrabold border ${hasAr ? 'bg-orange-50 text-orange-600 border-orange-200/50' : 'bg-red-50 text-red-400 border-red-100'}`}>AR</span>
                              </div>
                            </td>

                            {/* Action Buttons */}
                            <td className="py-4 px-4 text-center">
                              <div className="flex justify-center gap-1.5">
                                <button
                                  onClick={() => handleEditClick(service.id)}
                                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-white text-navy hover:border-gold hover:bg-secondary transition-all active:scale-95 cursor-pointer"
                                  title="ویرایش خدمت"
                                >
                                  <Edit3 className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteClick(service.id)}
                                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-red-100 bg-white text-red-600 hover:border-red-300 hover:bg-red-50 transition-all active:scale-95 cursor-pointer"
                                  title="حذف خدمت"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={6} className="py-12 px-4 text-center">
                          <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                            <AlertTriangle className="h-8 w-8 text-amber-500" />
                            <span className="font-bold text-[13px]">هیچ خدمتی منطبق با فیلترها و جستجوی شما یافت نشد.</span>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        ) : (
          <div className="flex h-80 items-center justify-center rounded-2xl border border-border bg-white shadow-sm">
            <div className="flex flex-col items-center gap-4">
              <div className="h-8 w-8 animate-spin rounded-full border-3 border-navy border-t-transparent"></div>
              <span className="text-sm font-semibold text-muted-foreground">درحال دریافت اطلاعات از دیتابیس محلی خدمات...</span>
            </div>
          </div>
        )}
      </main>

      {/* --- 3. MULTILINGUAL SERVICE EDITOR MODAL --- */}
      <AnimatePresence>
        {isEditorOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto px-4 py-8">
            {/* Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsEditorOpen(false)}
              className="absolute inset-0 bg-navy/40 backdrop-blur-sm"
            />

            {/* Modal Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative z-10 w-full max-w-3xl rounded-3xl border border-border bg-white shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              
              {/* Header */}
              <div className="flex items-center justify-between border-b border-border bg-slate-50 px-6 py-4">
                <div className="flex items-center gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-navy/5 text-navy border border-navy/10">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-sm font-extrabold text-navy">
                      {editingId ? `ویرایش خدمت: ${langData.fa.title || editingId}` : 'افزودن خدمت جدید'}
                    </h2>
                    <p className="text-[10px] text-muted-foreground mt-0.5">لطفا فیلدهای زبانی را با دقت وارد فرمایید</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsEditorOpen(false)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-white text-muted-foreground hover:bg-slate-100 hover:text-navy transition-colors cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Form Content (Scrollable) */}
              <form onSubmit={handleSaveService} className="flex-1 overflow-y-auto p-6 space-y-6">
                
                {/* Section A: Common Settings (Shared across languages) */}
                <div className="space-y-4 rounded-2xl border border-border/80 bg-slate-50/50 p-4">
                  <h3 className="text-xs font-extrabold text-navy flex items-center gap-1.5 border-b border-border pb-2">
                    <Layers className="h-4 w-4 text-gold" />
                    ویژگی‌ها و تنظیمات عمومی (مشترک بین زبان‌ها)
                  </h3>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
                    {/* Unique ID */}
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-navy">شناسه انگلیسی یکتا (ID)</label>
                      <input
                        type="text"
                        value={formId}
                        onChange={(e) => setFormId(e.target.value)}
                        placeholder="مثال: company-mainland"
                        disabled={editingId !== null}
                        className="w-full rounded-xl border border-border bg-white px-3 py-2 text-xs outline-none focus:border-gold disabled:bg-slate-100 font-mono"
                        dir="ltr"
                        required={editingId !== null}
                      />
                      {editingId === null && (
                        <p className="text-[9px] text-muted-foreground">در صورت خالی ماندن، به صورت خودکار از عنوان انگلیسی ساخته می‌شود.</p>
                      )}
                    </div>

                    {/* Category Selection */}
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-navy">دسته‌بندی خدمت</label>
                      <select
                        value={formCategory}
                        onChange={(e) => setFormCategory(e.target.value)}
                        className="w-full rounded-xl border border-border bg-white px-3 py-2 text-xs outline-none focus:border-gold"
                      >
                        {categories.map(cat => (
                          <option key={cat} value={cat}>{categoryTranslations[cat]}</option>
                        ))}
                      </select>
                    </div>

                    {/* Service Fee */}
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-navy">هزینه خدمات (Service Fee)</label>
                      <input
                        type="text"
                        value={formServiceFee}
                        onChange={(e) => setFormServiceFee(e.target.value)}
                        placeholder="مثال: AED 3,000 یا ۳,۰۰۰ درهم"
                        className="w-full rounded-xl border border-border bg-white px-3 py-2 text-xs outline-none focus:border-gold"
                      />
                    </div>

                    {/* Gov Fees */}
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-navy">هزینه دولتی (Government Fees)</label>
                      <input
                        type="text"
                        value={formGovFees}
                        onChange={(e) => setFormGovFees(e.target.value)}
                        placeholder="مثال: From AED 12,000 (اختیاری)"
                        className="w-full rounded-xl border border-border bg-white px-3 py-2 text-xs outline-none focus:border-gold"
                      />
                    </div>

                    {/* Working Days */}
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-navy">روزهای کاری مورد نیاز</label>
                      <input
                        type="text"
                        value={formWorkingDays}
                        onChange={(e) => setFormWorkingDays(e.target.value)}
                        placeholder="مثال: 5 Working Days یا ۵ روز کاری"
                        className="w-full rounded-xl border border-border bg-white px-3 py-2 text-xs outline-none focus:border-gold"
                      />
                    </div>

                    {/* Countries Active */}
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-navy block">کشور مقصد (فعال در:)</label>
                      <div className="flex items-center gap-4 py-1">
                        <label className="flex items-center gap-1.5 text-xs font-semibold cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={formUaeActive}
                            onChange={(e) => setFormUaeActive(e.target.checked)}
                            className="rounded text-gold focus:ring-gold/30 h-4 w-4"
                          />
                          امارات متحده عربی
                        </label>
                        <label className="flex items-center gap-1.5 text-xs font-semibold cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={formOmanActive}
                            onChange={(e) => setFormOmanActive(e.target.checked)}
                            className="rounded text-gold focus:ring-gold/30 h-4 w-4"
                          />
                          عمان
                        </label>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section B: Multilingual Translation Tabs */}
                <div className="space-y-4">
                  
                  {/* Language Tab Headers */}
                  <div className="flex gap-2 border-b border-border pb-1">
                    {(['fa', 'en', 'ar'] as const).map(lang => {
                      const isActive = editorLanguageTab === lang;
                      return (
                        <button
                          key={lang}
                          type="button"
                          onClick={() => setEditorLanguageTab(lang)}
                          className={`px-4 py-2 border-b-2 text-xs font-extrabold transition-all cursor-pointer -mb-1.5 ${
                            isActive 
                              ? 'border-gold text-gold' 
                              : 'border-transparent text-muted-foreground hover:text-navy'
                          }`}
                        >
                          {lang === 'fa' ? 'فارسی (Persian)' : lang === 'en' ? 'English (انگلیسی)' : 'العربية (Arabic)'}
                        </button>
                      );
                    })}
                  </div>

                  {/* Tab Contents */}
                  <div className="space-y-4">
                    {/* Title */}
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-navy">
                        عنوان خدمت به زبان {editorLanguageTab === 'fa' ? 'فارسی' : editorLanguageTab === 'en' ? 'انگلیسی' : 'عربی'} <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={langData[editorLanguageTab].title}
                        onChange={(e) => {
                          const updated = { ...langData };
                          updated[editorLanguageTab].title = e.target.value;
                          setLangData(updated);
                        }}
                        placeholder={`عنوان خدمت را به ${editorLanguageTab === 'fa' ? 'فارسی' : editorLanguageTab === 'en' ? 'انگلیسی' : 'عربی'} بنویسید...`}
                        className={`w-full rounded-xl border border-border bg-white px-3 py-2 text-xs outline-none focus:border-gold ${editorLanguageTab === 'en' ? 'text-left font-sans' : 'text-right'}`}
                        dir={editorLanguageTab === 'en' ? 'ltr' : 'rtl'}
                        required
                      />
                    </div>

                    {/* Description */}
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-navy">
                        توضیحات تفصیلی به زبان {editorLanguageTab === 'fa' ? 'فارسی' : editorLanguageTab === 'en' ? 'انگلیسی' : 'عربی'}
                      </label>
                      <textarea
                        value={langData[editorLanguageTab].description}
                        onChange={(e) => {
                          const updated = { ...langData };
                          updated[editorLanguageTab].description = e.target.value;
                          setLangData(updated);
                        }}
                        placeholder={`توضیحات تفصیلی خدمت را به ${editorLanguageTab === 'fa' ? 'فارسی' : editorLanguageTab === 'en' ? 'انگلیسی' : 'عربی'} بنویسید...`}
                        rows={3}
                        className={`w-full rounded-xl border border-border bg-white px-3 py-2 text-xs outline-none focus:border-gold ${editorLanguageTab === 'en' ? 'text-left font-sans' : 'text-right'}`}
                        dir={editorLanguageTab === 'en' ? 'ltr' : 'rtl'}
                      />
                    </div>

                    {/* Requirements Dynamic Array */}
                    <div className="space-y-2">
                      <label className="text-[11px] font-bold text-navy flex items-center justify-between">
                        <span>مدارک و پیش‌نیازهای لازم ({editorLanguageTab === 'fa' ? 'فارسی' : editorLanguageTab === 'en' ? 'انگلیسی' : 'عربی'})</span>
                        <button
                          type="button"
                          onClick={() => addRequirementRow(editorLanguageTab)}
                          className="flex items-center gap-1 rounded bg-gold/10 px-2 py-1 text-[10px] font-extrabold text-gold hover:bg-gold/20 transition-colors"
                        >
                          <Plus className="h-3 w-3" />
                          افزودن سطر مدارک
                        </button>
                      </label>

                      <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                        {langData[editorLanguageTab].requirements.map((req, idx) => (
                          <div key={idx} className="flex gap-2 items-center">
                            <span className="text-[10px] font-bold text-navy/40 w-5 text-center">{idx + 1}.</span>
                            <input
                              type="text"
                              value={req}
                              onChange={(e) => handleRequirementChange(editorLanguageTab, idx, e.target.value)}
                              placeholder={`مدرک یا مدرک شماره ${idx + 1} به زبان ${editorLanguageTab === 'fa' ? 'فارسی' : editorLanguageTab === 'en' ? 'انگلیسی' : 'عربی'}...`}
                              className={`flex-1 rounded-xl border border-border bg-white px-3 py-2 text-xs outline-none focus:border-gold ${editorLanguageTab === 'en' ? 'text-left font-sans' : 'text-right'}`}
                              dir={editorLanguageTab === 'en' ? 'ltr' : 'rtl'}
                            />
                            <button
                              type="button"
                              onClick={() => removeRequirementRow(editorLanguageTab, idx)}
                              className="flex h-8 w-8 items-center justify-center rounded-lg border border-red-100 bg-white text-red-600 hover:border-red-200 hover:bg-red-50 transition-all cursor-pointer"
                              title="حذف سطر"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>

                  </div>
                </div>

              </form>

              {/* Action Buttons */}
              <div className="flex items-center justify-between border-t border-border bg-slate-50 px-6 py-4">
                <button
                  type="button"
                  onClick={() => setIsEditorOpen(false)}
                  className="rounded-xl border border-border bg-white px-5 py-2 text-xs font-bold text-muted-foreground hover:bg-slate-100 hover:text-navy cursor-pointer"
                >
                  انصراف
                </button>
                <button
                  type="button"
                  onClick={handleSaveService}
                  disabled={loading}
                  className="flex items-center gap-1.5 rounded-xl bg-navy px-6 py-2.5 text-xs font-bold text-white hover:bg-navy-light shadow-md shadow-navy/10 active:scale-98 disabled:opacity-50 cursor-pointer"
                >
                  {loading ? (
                    <div className="h-4.5 w-4.5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                  ) : (
                    <>
                      <Save className="h-4.5 w-4.5 text-gold" />
                      ذخیره و ثبت نهایی خدمت
                    </>
                  )}
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Inline custom chevron component
function ChevronLeft(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={2.5}
      stroke="currentColor"
      className={props.className}
      style={{ width: '1em', height: '1em' }}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
    </svg>
  );
}

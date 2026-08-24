'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Lock, Mail, Eye, EyeOff, LayoutDashboard, Plus, Search, 
  Trash2, Edit3, Globe, Save, LogOut, Check, X, FileText, 
  Layers, Landmark, Briefcase, Calendar, AlertTriangle, ExternalLink, Menu,
  DollarSign, Languages, Users, Image as ImageIcon, Phone, MessageSquare
} from 'lucide-react';
import { toast, Toaster } from 'sonner';
import QMSScreen from '@/components/qms-screen';
import CustomersScreen from '@/components/customers-screen';
import CaseModal from '@/components/case-modal';
import NewRequestModal from '@/components/new-request-modal';

// Categories list matching app/page.tsx
const categories = [
  'Company Setup Services',
  'Family & Business Visas',
  'Tourist Visa Extension Services',
  'License Renewal Services',
  'Car Rental Services',
  'Banking Services',
  'Tax Services',
  'General Government Services',
];

const categoryTranslations: Record<string, string> = {
  'Company Setup Services': 'ثبت شرکت',
  'Family & Business Visas': 'ویزای فامیلی و تجاری',
  'Tourist Visa Extension Services': 'تمدید ویزای توریستی',
  'License Renewal Services': 'تمدید لایسنس‌ها',
  'Car Rental Services': 'رنت خودرو',
  'Banking Services': 'خدمات بانکی',
  'Tax Services': 'امور مالیاتی',
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
  imageUrl?: string; // Optional custom portrait image URL
}

interface ServicesDB {
  en: Service[];
  fa: Service[];
  ar: Service[];
  uaeServiceIds: string[];
  omanServiceIds: string[];
}

interface RequestFile {
  name: string;
  size: number;
  url?: string; // Web accessible download URL
}

interface ServiceRequest {
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

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState<boolean>(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Layout & Navigation State
  const [activeScreen, setActiveScreen] = useState<'services' | 'requests' | 'qms' | 'customers'>('services');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Dashboard state
  const [db, setDb] = useState<ServicesDB | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('all');
  const [selectedCountryFilter, setSelectedCountryFilter] = useState('all');

  // Requests state
  const [requests, setRequests] = useState<ServiceRequest[] | null>(null);
  const [requestsSearchQuery, setRequestsSearchQuery] = useState('');
  const [sourceFilter, setSourceFilter] = useState<'all' | 'web' | 'qms' | 'phone'>('all');
  const [selectedCaseRequest, setSelectedCaseRequest] = useState<ServiceRequest | null>(null);
  const [isNewRequestModalOpen, setIsNewRequestModalOpen] = useState(false);

  const handleCaseUpdateSuccess = (updated: ServiceRequest) => {
    setRequests(prev => prev ? prev.map(r => r.id === updated.id ? updated : r) : null);
    toast.success('پرونده و گردش کار با موفقیت بروزرسانی شد');
  };

  const handleAddManualPhoneRequest = () => {
    setIsNewRequestModalOpen(true);
  };

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
  const [formImageUrl, setFormImageUrl] = useState('');
  const [isUploadingImage, setIsUploadingImage] = useState(false);

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

  // Check auth status on mount and remove v0 badge watermarks
  useEffect(() => {
    // 1. Dynamic Runtime Style Sheet Injection
    try {
      const style = document.createElement('style');
      style.innerHTML = `
        a[href*="v0.dev"],
        a[href*="vercel.com"],
        [class*="v0-badge"],
        [id*="v0-badge"],
        #v0-badge,
        .v0-badge,
        [class*="v0-brand"],
        [id*="v0-brand"],
        [class*="built-with-v0"] {
          display: none !important;
          opacity: 0 !important;
          visibility: hidden !important;
          pointer-events: none !important;
          width: 0 !important;
          height: 0 !important;
          overflow: hidden !important;
        }
      `;
      document.head.appendChild(style);
    } catch (e) {}

    const removeBadge = () => {
      const traverse = (root: Node | ShadowRoot) => {
        if (!root) return;

        // Query Selector scans on Element roots
        if ('querySelectorAll' in root) {
          const selectors = [
            'a[href*="v0"]',
            'a[href*="vercel"]',
            '[class*="v0"]',
            '[id*="v0"]',
            '[class*="vercel"]',
            '[id*="vercel"]',
            '[class*="built-with"]',
            'iframe[src*="v0"]',
            'iframe[src*="vercel"]'
          ];
          selectors.forEach(sel => {
            try {
              const elements = (root as unknown as HTMLElement).querySelectorAll(sel);
              elements.forEach(el => el.remove());
            } catch (e) {}
          });
        }

        // Scan child nodes recursively
        const children = Array.from(root.childNodes);
        children.forEach(child => {
          const el = child as HTMLElement;
          
          if (el.textContent) {
            const text = el.textContent;
            if (
              text.includes('Built with v0') || 
              text.includes('built with v0') || 
              text.includes('with v0') ||
              (el.innerHTML && el.innerHTML.includes('Built with v0'))
            ) {
              const tagName = el.tagName?.toLowerCase();
              if (tagName && tagName !== 'body' && tagName !== 'html' && tagName !== 'main') {
                el.remove();
                return;
              }
            }
          }

          // Deep shadow DOM penetration
          if (el.shadowRoot) {
            const shadow = el.shadowRoot;
            traverse(shadow);
            
            try {
              const hasBadge = shadow.querySelector('a[href*="v0"]') || 
                               shadow.querySelector('a[href*="vercel"]') ||
                               (shadow.textContent && shadow.textContent.includes('v0'));
              if (hasBadge) {
                el.remove();
                return;
              }
            } catch (e) {}
          }

          traverse(child);
        });
      };

      try {
        traverse(document.documentElement);
      } catch (e) {}
    };

    removeBadge();
    
    const observer = new MutationObserver(() => {
      removeBadge();
    });
    
    observer.observe(document.documentElement, {
      childList: true,
      subtree: true
    });
    
    const interval = setInterval(removeBadge, 80);
    const timeout = setTimeout(() => {
      clearInterval(interval);
      observer.disconnect();
    }, 7000);

    fetch('/api/auth')
      .then(res => res.json())
      .then(data => {
        setIsAuthenticated(!!data.authenticated);
      })
      .catch(() => {
        setIsAuthenticated(false);
      })
      .finally(() => {
        setIsCheckingAuth(false);
      });

    return () => {
      clearInterval(interval);
      observer.disconnect();
    };
  }, []);

  // Fetch databases when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      fetchServices();
      fetchRequests();
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

  const fetchRequests = () => {
    fetch('/api/requests')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setRequests(data);
        }
      })
      .catch(() => toast.error('خطا در لود اطلاعات درخواست‌ها'));
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
      setRequests(null);
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
    setFormImageUrl('');

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
    setFormImageUrl(base.imageUrl || '');

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

  const handleDeleteRequest = async (requestId: string) => {
    const confirmDelete = window.confirm('آیا مطمئن هستید که می‌خواهید این درخواست پیگیری ثبت شده را حذف کنید؟');
    if (!confirmDelete) return;

    try {
      const res = await fetch(`/api/requests?id=${requestId}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        setRequests(prev => prev ? prev.filter(r => r.id !== requestId) : null);
        toast.success('درخواست پیگیری با موفقیت حذف شد');
      } else {
        const errData = await res.json();
        toast.error(errData.error || 'خطا در حذف درخواست');
      }
    } catch (err) {
      toast.error('خطا در ارتباط با سرور');
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

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    if (file.size > 5 * 1024 * 1024) {
      toast.error('حداکثر حجم تصویر ۵ مگابایت است.');
      return;
    }

    setIsUploadingImage(true);
    const toastId = toast.loading('در حال آپلود و ذخیره‌سازی تصویر...');

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/services/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setFormImageUrl(data.url);
        toast.success('تصویر با موفقیت آپلود و در استوریج ذخیره شد.', { id: toastId });
      } else {
        toast.error(data.error || 'خطا در آپلود تصویر', { id: toastId });
      }
    } catch (err) {
      console.error('Image upload error:', err);
      toast.error('ارتباط با سرور برقرار نشد.', { id: toastId });
    } finally {
      setIsUploadingImage(false);
      e.target.value = '';
    }
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
      if (formImageUrl.trim()) obj.imageUrl = formImageUrl.trim();

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
    if (formUaeActive) {
      if (!updatedUaeIds.includes(finalId)) updatedUaeIds.push(finalId);
    } else {
      updatedUaeIds = updatedUaeIds.filter(id => id !== finalId);
    }
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

    let services = [...db.fa];

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      services = services.filter(s => 
        s.title.toLowerCase().includes(query) || 
        s.id.toLowerCase().includes(query) ||
        (s.description && s.description.toLowerCase().includes(query))
      );
    }

    if (selectedCategoryFilter !== 'all') {
      services = services.filter(s => s.category === selectedCategoryFilter);
    }

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

  const formatRequestDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('fa-IR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateStr;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  // --- 0. AUTH CHECKING SPINNER SCREEN ---
  if (isCheckingAuth) {
    return (
      <div className="flex min-h-screen w-full flex-col items-center justify-center bg-[#07111f] font-sans text-white p-4" dir="rtl">
        <div className="flex flex-col items-center gap-3.5">
          <div className="h-9 w-9 animate-spin rounded-full border-2 border-gold border-t-transparent shadow-lg shadow-gold/20" />
          <span className="text-xs font-bold text-white/60">درحال بررسی سشن و بارگذاری پنل مدیریت...</span>
        </div>
      </div>
    );
  }

  // --- 1. LOGIN SCREEN ---
  if (!isAuthenticated) {
    return (
      <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-[#070e1b] via-[#0f1e37] to-[#162a4a] px-4 font-sans text-right" dir="rtl">
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
            <h2 className="text-2xl font-black text-white tracking-wide mb-1">ابوآرسام</h2>
            <p className="text-xs text-white/60">ورود به پنل مدیریت کل خدمات</p>
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
            <span>ARSAM SERVICES</span>
          </div>
        </motion.div>
      </div>
    );
  }

  // --- 2. ADMIN SIDEBAR NAVIGATION ---
  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-navy text-white text-right" dir="rtl">
      {/* Brand Header */}
      <div className="p-6 border-b border-white/10 flex flex-col items-center select-none">
        <h2 className="text-base font-extrabold text-gold leading-none">ابوآرسام</h2>
        <span className="text-[9px] font-bold text-white/40 uppercase tracking-widest mt-1.5">پنل مدیریت ادمین</span>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 px-4 py-6 space-y-2">
        <button
          onClick={() => {
            setActiveScreen('services');
            setIsMobileMenuOpen(false);
          }}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
            activeScreen === 'services'
              ? 'bg-gold text-[#0f1e37] shadow-lg shadow-gold/15'
              : 'text-white/70 hover:bg-white/5 hover:text-white'
          }`}
        >
          <Briefcase className="h-4.5 w-4.5 shrink-0" />
          مدیریت خدمات
        </button>

        <button
          onClick={() => {
            setActiveScreen('requests');
            setIsMobileMenuOpen(false);
          }}
          className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
            activeScreen === 'requests'
              ? 'bg-gold text-[#0f1e37] shadow-lg shadow-gold/15'
              : 'text-white/70 hover:bg-white/5 hover:text-white'
          }`}
        >
          <span className="flex items-center gap-3">
            <Mail className="h-4.5 w-4.5 shrink-0" />
            درخواست‌های ارسالی
          </span>
          {requests && requests.length > 0 && (
            <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black shrink-0 ${
              activeScreen === 'requests' ? 'bg-[#0f1e37] text-gold' : 'bg-gold text-[#0f1e37]'
            }`}>
              {requests.length}
            </span>
          )}
        </button>

        <button
          onClick={() => {
            setActiveScreen('qms');
            setIsMobileMenuOpen(false);
          }}
          className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
            activeScreen === 'qms'
              ? 'bg-gold text-[#0f1e37] shadow-lg shadow-gold/15'
              : 'text-white/70 hover:bg-white/5 hover:text-white'
          }`}
        >
          <span className="flex items-center gap-3">
            <Users className="h-4.5 w-4.5 shrink-0" />
            مدیریت صف QMS
          </span>
        </button>

        <button
          onClick={() => {
            setActiveScreen('customers');
            setIsMobileMenuOpen(false);
          }}
          className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
            activeScreen === 'customers'
              ? 'bg-gold text-[#0f1e37] shadow-lg shadow-gold/15'
              : 'text-white/70 hover:bg-white/5 hover:text-white'
          }`}
        >
          <span className="flex items-center gap-3">
            <Users className="h-4.5 w-4.5 shrink-0 text-amber-400" />
            مدیریت مشتریان (CRM)
          </span>
        </button>
      </nav>

      {/* Sidebar Footer / Action buttons */}
      <div className="p-4 border-t border-white/10 space-y-2 select-none">
        <a
          href="/"
          target="_blank"
          className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold text-white/60 hover:bg-white/5 hover:text-white transition-all"
        >
          <ExternalLink className="h-4.5 w-4.5 shrink-0" />
          مشاهده لندینگ پیج
        </a>
        <button
          onClick={() => {
            handleLogout();
            setIsMobileMenuOpen(false);
          }}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all cursor-pointer"
        >
          <LogOut className="h-4.5 w-4.5 shrink-0" />
          خروج از حساب
        </button>
      </div>
    </div>
  );

  // --- 3. REQUESTS SCREEN RENDER (Rich Dark Navy Cards + Workflow Modal) ---
  const renderRequestsScreen = () => {
    if (!requests) {
      return (
        <div className="flex h-64 items-center justify-center rounded-2xl border border-white/10 bg-[#0b172a] shadow-xl text-white">
          <div className="flex flex-col items-center gap-3">
            <div className="h-7 w-7 animate-spin rounded-full border-2 border-gold border-t-transparent"></div>
            <span className="text-xs font-bold text-white/50">درحال دریافت تمامی درخواست‌ها...</span>
          </div>
        </div>
      );
    }

    const filteredRequests = requests.filter(r => {
      const matchSearch =
        r.name.toLowerCase().includes(requestsSearchQuery.toLowerCase()) ||
        r.phone.toLowerCase().includes(requestsSearchQuery.toLowerCase()) ||
        r.serviceTitle.toLowerCase().includes(requestsSearchQuery.toLowerCase()) ||
        (r.description && r.description.toLowerCase().includes(requestsSearchQuery.toLowerCase()));

      const matchSource =
        sourceFilter === 'all' ? true : (r.source || 'web') === sourceFilter;

      return matchSearch && matchSource;
    });

    return (
      <div className="space-y-4 animate-fadeIn text-white" dir="rtl">
        {/* Header, Source Filters & Search */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-[#0b172a] p-4 rounded-2xl border border-white/10 shadow-lg">
          <div>
            <h2 className="text-base font-black text-white">درخواست‌ها و تسک‌های ادامه‌دار ({filteredRequests.length})</h2>
            <p className="text-[11px] text-white/40 mt-0.5">مدیریت پرونده‌ها، گردش کار، فازهای اجرایی و مدارک مشتریان</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Source Filter Pills */}
            <div className="flex items-center gap-1 bg-[#0f1e37] p-1 rounded-xl border border-white/10">
              {[
                { id: 'all', label: 'همه سورس‌ها' },
                { id: 'web', label: '🌐 آنلاین' },
                { id: 'qms', label: '🏛️ حضوری' },
                { id: 'phone', label: '📞 تلفنی' },
              ].map(sf => (
                <button
                  key={sf.id}
                  onClick={() => setSourceFilter(sf.id as any)}
                  className="px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer border"
                  style={{
                    background: sourceFilter === sf.id ? '#c9a227' : 'transparent',
                    color: sourceFilter === sf.id ? '#0f1e37' : 'rgba(255,255,255,0.6)',
                    borderColor: sourceFilter === sf.id ? '#c9a227' : 'transparent',
                  }}
                >
                  {sf.label}
                </button>
              ))}
            </div>

            {/* Manual Phone Request Button */}
            <button
              onClick={handleAddManualPhoneRequest}
              className="px-3.5 py-2 rounded-xl text-xs font-black cursor-pointer flex items-center gap-1.5 transition-all hover:brightness-110 bg-gold text-[#0f1e37] shadow-md shrink-0"
            >
              <Plus size={14} />
              <span>ثبت درخواست جدید / تلفنی</span>
            </button>

            {/* Search */}
            <div className="relative w-full sm:w-52">
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-white/30">
                <Search className="h-3.5 w-3.5" />
              </div>
              <input
                type="text"
                value={requestsSearchQuery}
                onChange={(e) => setRequestsSearchQuery(e.target.value)}
                placeholder="جستجو..."
                className="w-full rounded-xl border border-white/10 bg-[#0f1e37] py-1.5 pr-8 pl-3 text-xs text-white placeholder-white/30 outline-none focus:border-gold"
              />
            </div>
          </div>
        </div>

        {/* Requests Cards Grid (3 Columns matching QMS cards design) */}
        {filteredRequests.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {filteredRequests.map(req => {
              const cleanPhone = req.phone.replace(/[^0-9+]/g, '');
              const whatsappUrl = `https://wa.me/${cleanPhone}`;
              const reqSource = req.source || 'web';
              const reqStatus = req.queueStatus || 'waiting';

              const statusColors: Record<string, { label: string; color: string; bg: string; border: string }> = {
                waiting:      { label: 'در انتظار بررسی', color: '#94a3b8', bg: 'rgba(148,163,184,0.12)', border: 'rgba(148,163,184,0.3)' },
                in_progress:  { label: 'در حال اقدام',     color: '#c9a227', bg: 'rgba(201,162,39,0.18)', border: 'rgba(201,162,39,0.45)' },
                pending_docs: { label: 'منتظر مدارک',    color: '#f97316', bg: 'rgba(249,115,22,0.18)', border: 'rgba(249,115,22,0.45)' },
                gov_process:  { label: 'امور دولتی',      color: '#60a5fa', bg: 'rgba(59,130,246,0.18)', border: 'rgba(59,130,246,0.45)' },
                completed:    { label: 'تکمیل شد',        color: '#34d399', bg: 'rgba(52,211,153,0.15)', border: 'rgba(52,211,153,0.35)' },
                absent:       { label: 'معلق',             color: '#f87171', bg: 'rgba(248,113,113,0.15)', border: 'rgba(248,113,113,0.35)' },
              };

              const stCfg = statusColors[reqStatus] || statusColors.waiting;

              return (
                <div
                  key={req.id}
                  className="rounded-2xl border bg-[#0b172a] shadow-xl transition-all relative overflow-hidden text-right flex flex-col justify-between"
                  style={{
                    borderColor: stCfg.border,
                  }}
                >
                  {/* Side Status Bar */}
                  <div
                    className="absolute top-0 right-0 bottom-0 w-1.5"
                    style={{ background: stCfg.color }}
                  />

                  {/* Card Content */}
                  <div className="p-4 pb-2.5 pr-4.5 space-y-2.5">
                    {/* Header Row: Number/Avatar + Name + Status & Source badges */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        {req.queueNumber != null ? (
                          <div
                            className="flex flex-col items-center justify-center w-12 h-12 rounded-xl shrink-0 font-black border shadow-xs"
                            style={{ background: stCfg.bg, borderColor: stCfg.border, color: stCfg.color }}
                          >
                            <span className="text-[8px] leading-none mb-0.5 opacity-80">نوبت</span>
                            <span className="text-xl leading-none font-black">{req.queueNumber}</span>
                          </div>
                        ) : (
                          <div className="h-10 w-10 rounded-xl bg-gold/15 text-gold border border-gold/30 flex items-center justify-center font-black text-sm shrink-0 shadow-xs">
                            {req.name.charAt(0)}
                          </div>
                        )}

                        <div className="min-w-0">
                          <h4 className="font-extrabold text-white text-xs truncate max-w-[140px]">{req.name}</h4>
                          <span className="text-[10px] text-white/40 block mt-0.5">
                            {formatRequestDate(req.createdAt)}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-1">
                        <span
                          className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border"
                          style={{ color: stCfg.color, background: stCfg.bg, borderColor: stCfg.border }}
                        >
                          {stCfg.label}
                        </span>
                        <span className="px-2 py-0.5 rounded-md text-[9px] font-bold bg-white/5 border border-white/10 text-white/60">
                          {reqSource === 'qms' ? '🏛️ حضوری' : reqSource === 'phone' ? '📞 تلفنی' : '🌐 آنلاین'}
                        </span>
                      </div>
                    </div>

                    {/* Phone & Service */}
                    <div className="py-2 border-t border-white/10 space-y-1">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-white/40 text-[10px]">تلفن:</span>
                        <bdo dir="ltr" className="font-mono font-black text-white text-xs tracking-wide inline-block" style={{ unicodeBidi: 'bidi-override', direction: 'ltr' }}>
                          {req.phone}
                        </bdo>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-white/40 text-[10px]">خدمت:</span>
                        <span className="font-extrabold text-white/90 text-xs truncate max-w-[160px]">{req.serviceTitle}</span>
                      </div>
                    </div>

                    {/* Description note */}
                    <div className="bg-[#07111f] p-2.5 rounded-xl border border-white/8 text-[11px] text-white/70 leading-relaxed min-h-[40px] max-h-16 overflow-hidden font-medium">
                      {req.description || 'توضیحات اولیه ثبت نشده است.'}
                    </div>

                    {/* Files attached summary */}
                    {req.files && req.files.length > 0 && (
                      <div className="flex items-center justify-between text-[10px] text-gold font-bold bg-gold/10 px-2.5 py-1 rounded-lg border border-gold/20">
                        <span>📎 {req.files.length} مدرک و فایل پیوست</span>
                        <span className="text-white/40 font-normal">مشاهده</span>
                      </div>
                    )}
                  </div>

                  {/* Footer Actions */}
                  <div className="flex items-center justify-between gap-1.5 px-4 py-2 border-t border-white/10 bg-[#07111f]/60">
                    <div className="flex items-center gap-1.5">
                      <a
                        href={whatsappUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 rounded-lg bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/25 transition-all"
                        title="واتساپ"
                      >
                        <MessageSquare size={13} />
                      </a>
                      <a
                        href={`tel:${cleanPhone}`}
                        className="p-1.5 rounded-lg bg-white/5 text-white/70 border border-white/10 hover:bg-white/10 transition-all"
                        title="تماس"
                      >
                        <Phone size={13} />
                      </a>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {/* Case Workflow & Files Modal Trigger */}
                      <button
                        onClick={() => setSelectedCaseRequest(req)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-[10px] font-black transition-all cursor-pointer bg-gold/20 text-gold border border-gold/30 hover:bg-gold/30 shadow-xs"
                      >
                        <span>📂 گردش کار پرونده</span>
                      </button>

                      <button
                        onClick={() => handleDeleteRequest(req.id)}
                        className="p-1.5 rounded-lg text-red-400 hover:bg-red-500/15 transition-all cursor-pointer"
                        title="حذف"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex h-64 items-center justify-center rounded-2xl border border-white/10 bg-[#0b172a] shadow-xl text-white/40">
            <div className="flex flex-col items-center gap-1.5">
              <AlertTriangle className="h-6 w-6 text-amber-500" />
              <span className="font-bold text-xs">هیچ درخواستی یافت نشد.</span>
            </div>
          </div>
        )}
      </div>
    );
  };

  // --- 4. SERVICES LIST RENDER (Rich Dark Navy Theme) ---
  const renderServicesScreen = () => {
    if (!db) {
      return (
        <div className="flex h-80 items-center justify-center rounded-2xl border border-white/10 bg-[#0b172a] shadow-xl text-white">
          <div className="flex flex-col items-center gap-4">
            <div className="h-8 w-8 animate-spin rounded-full border-3 border-gold border-t-transparent"></div>
            <span className="text-sm font-semibold text-white/50">درحال دریافت اطلاعات از دیتابیس خدمات...</span>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-6 animate-fadeIn text-white" dir="rtl">
        {/* Quick Stat Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {/* Card 1 */}
          <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#0b172a] p-5 shadow-lg">
            <div className="absolute top-0 right-0 h-1 w-full bg-gold"></div>
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-white/50">کل خدمات ثبت شده</span>
                <h3 className="mt-2 text-2xl font-black text-white">{db.fa.length} خدمت</h3>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gold/15 text-gold border border-gold/30">
                <Briefcase className="h-5.5 w-5.5" />
              </div>
            </div>
          </div>

          {/* Card 2 */}
          <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#0b172a] p-5 shadow-lg">
            <div className="absolute top-0 right-0 h-1 w-full bg-amber-400"></div>
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-white/50">خدمات فعال در امارات</span>
                <h3 className="mt-2 text-2xl font-black text-white">{db.uaeServiceIds.length} خدمت</h3>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-400/15 text-amber-300 border border-amber-400/30">
                <Landmark className="h-5.5 w-5.5" />
              </div>
            </div>
          </div>

          {/* Card 3 */}
          <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#0b172a] p-5 shadow-lg">
            <div className="absolute top-0 right-0 h-1 w-full bg-emerald-400"></div>
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-white/50">خدمات فعال در عمان</span>
                <h3 className="mt-2 text-2xl font-black text-white">{db.omanServiceIds.length} خدمت</h3>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-400/15 text-emerald-400 border border-emerald-400/30">
                <Globe className="h-5.5 w-5.5" />
              </div>
            </div>
          </div>
        </div>

        {/* Filter and Management Bar */}
        <div className="rounded-2xl border border-white/10 bg-[#0b172a] p-4 shadow-lg">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            
            {/* Search & Filters */}
            <div className="grid flex-1 grid-cols-1 gap-3 sm:grid-cols-3">
              {/* Search Input */}
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-white/30">
                  <Search className="h-4 w-4" />
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="جستجو در عنوان یا شناسه..."
                  className="w-full rounded-xl border border-white/10 bg-[#0f1e37] py-2.5 pr-9 pl-4 text-xs text-white placeholder-white/30 outline-none focus:border-gold"
                />
              </div>

              {/* Category Filter */}
              <select
                value={selectedCategoryFilter}
                onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                className="rounded-xl border border-white/10 bg-[#0f1e37] px-3 py-2.5 text-xs text-white outline-none focus:border-gold cursor-pointer"
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
                className="rounded-xl border border-white/10 bg-[#0f1e37] px-3 py-2.5 text-xs text-white outline-none focus:border-gold cursor-pointer"
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
              className="flex items-center justify-center gap-1.5 rounded-xl bg-gold px-5 py-2.5 text-xs font-black text-[#0f1e37] hover:brightness-110 shadow-md transition-all cursor-pointer"
            >
              <Plus className="h-4.5 w-4.5" />
              افزودن خدمت جدید
            </button>

          </div>
        </div>

        {/* Services Table List */}
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#0b172a] shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full table-auto border-collapse text-right text-xs">
              <thead>
                <tr className="border-b border-white/10 bg-[#0f1e37]/90 text-gold font-extrabold">
                  <th className="py-4.5 px-4 font-extrabold">عنوان خدمت (فارسی)</th>
                  <th className="py-4.5 px-4 font-extrabold">دسته‌بندی</th>
                  <th className="py-4.5 px-4 font-extrabold">هزینه خدمات / کارمزد</th>
                  <th className="py-4.5 px-4 font-extrabold text-center">کشورها</th>
                  <th className="py-4.5 px-4 font-extrabold text-center">ترجمه‌ها</th>
                  <th className="py-4.5 px-4 font-extrabold text-center">عملیات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredList.length > 0 ? (
                  filteredList.map((service) => {
                    const inUae = db.uaeServiceIds.includes(service.id);
                    const inOman = db.omanServiceIds.includes(service.id);
                    
                    const hasEn = db.en.some(s => s.id === service.id && s.title.trim() !== '');
                    const hasAr = db.ar.some(s => s.id === service.id && s.title.trim() !== '');

                    return (
                      <tr key={service.id} className="hover:bg-white/5 transition-colors">
                        <td className="py-4 px-4">
                          <div className="font-bold text-white text-[13px]">{service.title}</div>
                          <div className="mt-1 font-mono text-[10px] text-white/50 select-all bg-black/30 px-2 py-0.5 rounded border border-white/10 inline-block">{service.id}</div>
                        </td>
                        
                        <td className="py-4 px-4 text-white/60 font-semibold">
                          {categoryTranslations[service.category || ''] || service.category}
                        </td>

                        <td className="py-4 px-4 font-mono font-bold text-gold">
                          {service.serviceFee || 'ثبت نشده'}
                        </td>

                        <td className="py-4 px-4 text-center">
                          <div className="flex justify-center gap-1.5">
                            {inUae && (
                              <span className="rounded-full bg-gold/15 px-2 py-0.5 text-[10px] font-bold text-gold border border-gold/30">امارات</span>
                            )}
                            {inOman && (
                              <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-500/30">عمان</span>
                            )}
                            {!inUae && !inOman && (
                              <span className="rounded-full bg-red-500/15 px-2 py-0.5 text-[10px] font-bold text-red-400 border border-red-500/30">غیرفعال</span>
                            )}
                          </div>
                        </td>

                        <td className="py-4 px-4 text-center">
                          <div className="flex justify-center gap-1">
                            <span className="rounded-full bg-white/10 px-1.5 py-0.5 text-[9px] font-extrabold text-white/80 border border-white/10">FA</span>
                            <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-extrabold border ${hasEn ? 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30' : 'bg-red-500/15 text-red-400 border-red-500/30'}`}>EN</span>
                            <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-extrabold border ${hasAr ? 'bg-amber-500/15 text-amber-300 border-amber-500/30' : 'bg-red-500/15 text-red-400 border-red-500/30'}`}>AR</span>
                          </div>
                        </td>

                        <td className="py-4 px-4 text-center">
                          <div className="flex justify-center gap-1.5">
                            <button
                              onClick={() => handleEditClick(service.id)}
                              className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-[#0f1e37] text-white hover:border-gold hover:bg-gold/20 transition-all active:scale-95 cursor-pointer"
                              title="ویرایش خدمت"
                            >
                              <Edit3 className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteClick(service.id)}
                              className="flex h-8 w-8 items-center justify-center rounded-lg border border-red-500/20 bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all active:scale-95 cursor-pointer"
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
                      <div className="flex flex-col items-center justify-center gap-2 text-white/40">
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
    );
  };

  // --- 4.5 DETAILED FULL-PAGE SERVICE EDITOR VIEW (Rich Dark Navy Theme) ---
  const renderServiceEditor = () => {
    return (
      <div className="space-y-6 animate-fadeIn text-white" dir="rtl">
        {/* Editor Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border border-white/10 bg-[#0b172a] rounded-3xl p-5 gap-4 shadow-xl">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gold/15 text-gold border border-gold/30 shrink-0">
              <FileText className="h-5.5 w-5.5 text-gold" />
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-white">
                {editingId ? `ویرایش خدمت: ${langData.fa.title || editingId}` : 'افزودن خدمت جدید'}
              </h2>
              <p className="text-[10px] text-white/40 mt-1 font-bold">
                مشخصات، دسته‌بندی، مبالغ هزینه‌ها و الزامات خدمت را در زبان‌های مختلف ویرایش و ثبت نهایی کنید.
              </p>
            </div>
          </div>
          
          <button
            type="button"
            onClick={() => setIsEditorOpen(false)}
            className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl border border-white/10 bg-[#0f1e37] text-[11px] font-bold text-white hover:bg-white/10 transition-colors shadow-sm cursor-pointer self-start sm:self-center"
          >
            <X className="h-4 w-4" />
            <span>انصراف و بازگشت</span>
          </button>
        </div>

        {/* Spacious Grid Layout */}
        <form onSubmit={handleSaveService} className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Right Column: Settings & Configs (lg:col-span-4) */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Card 1: Basic Configs */}
            <div className="rounded-3xl border border-white/10 bg-[#0b172a] p-5.5 shadow-xl space-y-4">
              <h3 className="text-[11px] font-black text-white flex items-center gap-2 border-b border-white/10 pb-3">
                <Layers className="h-4.5 w-4.5 text-gold" />
                <span>تنظیمات پایه سیستم</span>
              </h3>
              
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold text-white/80">شناسه انگلیسی یکتا (ID) *</label>
                  <input
                    type="text"
                    value={formId}
                    onChange={(e) => setFormId(e.target.value)}
                    disabled={editingId !== null}
                    placeholder="مثال: company-registration"
                    className="w-full rounded-xl border border-white/10 bg-[#0f1e37] disabled:opacity-50 px-3 py-2.5 text-xs text-white placeholder-white/30 outline-none focus:border-gold font-sans text-left"
                    required
                  />
                  <p className="text-[9px] text-white/40 leading-normal">شناسه یکتای خدمت که در آدرس‌های وب‌سایت استفاده می‌شود و غیرقابل تغییر است.</p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold text-white/80">دسته‌بندی خدمت</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-[#0f1e37] px-3 py-2.5 text-xs text-white outline-none focus:border-gold cursor-pointer"
                  >
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>
                        {categoryTranslations[cat as keyof typeof categoryTranslations] || cat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Card 2: Country Targets */}
            <div className="rounded-3xl border border-white/10 bg-[#0b172a] p-5.5 shadow-xl space-y-4">
              <h3 className="text-[11px] font-black text-white flex items-center gap-2 border-b border-white/10 pb-3">
                <Globe className="h-4.5 w-4.5 text-gold" />
                <span>کشورهای مقصد فعال</span>
              </h3>
              
              <div className="space-y-3 bg-[#0f1e37] p-4 rounded-2xl border border-white/8">
                <p className="text-[9px] text-white/40 font-bold leading-normal">این خدمت در پورتال کدام کشورها به کاربران نمایش داده شود؟</p>
                
                <div className="flex flex-col gap-3.5 mt-2">
                  <label className="flex items-center gap-2 text-xs font-bold text-white cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={formUaeActive}
                      onChange={(e) => setFormUaeActive(e.target.checked)}
                      className="rounded text-gold focus:ring-gold/30 h-4.5 w-4.5 cursor-pointer"
                    />
                    <span>امارات متحده عربی (دبی)</span>
                  </label>

                  <label className="flex items-center gap-2 text-xs font-bold text-white cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={formOmanActive}
                      onChange={(e) => setFormOmanActive(e.target.checked)}
                      className="rounded text-gold focus:ring-gold/30 h-4.5 w-4.5 cursor-pointer"
                    />
                    <span>سلطنت عمان (مسقط)</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Card 3: Image Upload & Storage */}
            <div className="rounded-3xl border border-white/10 bg-[#0b172a] p-5.5 shadow-xl space-y-4">
              <h3 className="text-[11px] font-black text-white flex items-center gap-2 border-b border-white/10 pb-3">
                <ImageIcon className="h-4.5 w-4.5 text-gold" />
                <span>تصویر لنداسکیپ خدمت</span>
              </h3>
              
              <div className="space-y-4">
                <div className="flex gap-2">
                  <label className={`flex-1 flex items-center justify-center gap-2 rounded-xl border border-dashed border-gold/40 bg-gold/10 hover:bg-gold/20 px-4 py-3 text-xs font-bold text-gold cursor-pointer transition-all ${isUploadingImage ? 'opacity-50 pointer-events-none' : ''}`}>
                    <svg className="w-4.5 h-4.5 text-gold shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                    <span>{isUploadingImage ? 'در حال آپلود...' : 'انتخاب و آپلود تصویر'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      disabled={isUploadingImage}
                    />
                  </label>
                  
                  {formImageUrl && (
                    <button
                      type="button"
                      onClick={() => setFormImageUrl('')}
                      className="px-3 rounded-xl border border-red-500/30 bg-red-500/15 hover:bg-red-500/25 text-red-400 text-[11px] font-extrabold transition-all cursor-pointer shrink-0"
                    >
                      حذف
                    </button>
                  )}
                </div>

                <div className="relative">
                  <input
                    type="text"
                    value={formImageUrl}
                    onChange={(e) => setFormImageUrl(e.target.value)}
                    placeholder="آدرس تصویر یا لینک مستقیم"
                    className="w-full rounded-xl border border-white/10 bg-[#0f1e37] px-3 py-2 text-[10px] text-white placeholder-white/30 outline-none focus:border-gold font-sans"
                    dir="ltr"
                  />
                  {formImageUrl && (
                    <span className="absolute right-2.5 top-1/2 -translate-y-1/2 flex h-2 w-2 rounded-full bg-emerald-400" />
                  )}
                </div>

                {/* Preview Aspect Video */}
                {formImageUrl ? (
                  <div className="relative group rounded-2xl border border-white/10 overflow-hidden bg-[#07111f] w-full aspect-video flex items-center justify-center shadow-inner">
                    <img
                      src={formImageUrl}
                      alt="پیش‌نمایش تصویر"
                      className="object-cover w-full h-full"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center">
                      <a
                        href={formImageUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] bg-gold text-[#0f1e37] font-black rounded-lg px-2.5 py-1 transition-all"
                      >
                        مشاهده اندازه اصلی
                      </a>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-2xl border border-dashed border-white/10 bg-[#07111f] w-full aspect-video flex flex-col items-center justify-center text-center p-4">
                    <svg className="w-8 h-8 text-white/20 mb-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="text-[10px] text-white/40 font-bold">تصویری بارگذاری نشده است</span>
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* Left Column: Details & Financials (lg:col-span-8) */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Card 4: Financials & Timeline (Horizontal Grid) */}
            <div className="rounded-3xl border border-white/10 bg-[#0b172a] p-6 shadow-xl space-y-4">
              <h3 className="text-[11px] font-black text-white flex items-center gap-2 border-b border-white/10 pb-3">
                <DollarSign className="h-4.5 w-4.5 text-gold" />
                <span>هزینه‌ها و زمان‌بندی انجام کار</span>
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold text-white/80">هزینه خدمات (Service Fee)</label>
                  <input
                    type="text"
                    value={formServiceFee}
                    onChange={(e) => setFormServiceFee(e.target.value)}
                    placeholder="مثال: ۳,۰۰۰ درهم یا رایگان"
                    className="w-full rounded-xl border border-white/10 bg-[#0f1e37] px-3 py-2.5 text-xs text-white placeholder-white/30 outline-none focus:border-gold"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold text-white/80">هزینه دولتی (Government Fees)</label>
                  <input
                    type="text"
                    value={formGovFees}
                    onChange={(e) => setFormGovFees(e.target.value)}
                    placeholder="مثال: از ۱۲,۰۰۰ درهم"
                    className="w-full rounded-xl border border-white/10 bg-[#0f1e37] px-3 py-2.5 text-xs text-white placeholder-white/30 outline-none focus:border-gold"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold text-white/80">زمان کاری (Working Days)</label>
                  <input
                    type="text"
                    value={formWorkingDays}
                    onChange={(e) => setFormWorkingDays(e.target.value)}
                    placeholder="مثال: ۵ روز کاری"
                    className="w-full rounded-xl border border-white/10 bg-[#0f1e37] px-3 py-2.5 text-xs text-white placeholder-white/30 outline-none focus:border-gold"
                  />
                </div>
              </div>
            </div>

            {/* Card 5: Text Translations & Content Tabs */}
            <div className="rounded-3xl border border-white/10 bg-[#0b172a] p-6 shadow-xl space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-white/10 pb-3 gap-3">
                <h3 className="text-[11px] font-black text-white flex items-center gap-2">
                  <Languages className="h-4.5 w-4.5 text-gold" />
                  <span>محتوای متنی و ترجمه اختصاصی</span>
                </h3>
                
                {/* Visual Languages selection tabs */}
                <div className="flex gap-1.5 bg-[#0f1e37] p-1 rounded-xl border border-white/10 self-start sm:self-center">
                  {([
                    { key: 'fa', label: 'فارسی (FA)' },
                    { key: 'en', label: 'English (EN)' },
                    { key: 'ar', label: 'العربية (AR)' }
                  ] as const).map(lang => {
                    const isActive = editorLanguageTab === lang.key;
                    return (
                      <button
                        key={lang.key}
                        type="button"
                        onClick={() => setEditorLanguageTab(lang.key)}
                        className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                          isActive 
                            ? 'bg-gold text-[#0f1e37] font-black shadow-xs' 
                            : 'text-white/60 hover:text-white hover:bg-white/5'
                        }`}
                      >
                        {lang.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Dynamic Content Panel per language */}
              <div className="space-y-5">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold text-white flex items-center gap-1">
                    <span>عنوان خدمت به زبان</span>
                    <span className="text-gold font-black">
                      {editorLanguageTab === 'fa' ? 'فارسی' : editorLanguageTab === 'en' ? 'انگلیسی' : 'عربی'}
                    </span>
                    <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={langData[editorLanguageTab].title}
                    onChange={(e) => {
                      const updated = { ...langData };
                      updated[editorLanguageTab].title = e.target.value;
                      setLangData(updated);
                    }}
                    placeholder={`ثبت شرکت در سرزمین اصلی (Mainland)...`}
                    className={`w-full rounded-xl border border-white/10 bg-[#0f1e37] px-4 py-2.5 text-xs text-white placeholder-white/30 font-semibold outline-none focus:border-gold ${editorLanguageTab === 'en' ? 'text-left font-sans' : 'text-right'}`}
                    dir={editorLanguageTab === 'en' ? 'ltr' : 'rtl'}
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold text-white flex items-center gap-1">
                    <span>توضیحات تفصیلی به زبان</span>
                    <span className="text-gold font-black">
                      {editorLanguageTab === 'fa' ? 'فارسی' : editorLanguageTab === 'en' ? 'انگلیسی' : 'عربی'}
                    </span>
                  </label>
                  <textarea
                    rows={5}
                    value={langData[editorLanguageTab].description}
                    onChange={(e) => {
                      const updated = { ...langData };
                      updated[editorLanguageTab].description = e.target.value;
                      setLangData(updated);
                    }}
                    placeholder={`توضیحات کامل شرایط، مزایا و مراحل انجام این خدمت را بنویسید...`}
                    className={`w-full rounded-xl border border-white/10 bg-[#0f1e37] px-4 py-2.5 text-xs text-white placeholder-white/30 outline-none focus:border-gold leading-relaxed ${editorLanguageTab === 'en' ? 'text-left font-sans' : 'text-right'}`}
                    dir={editorLanguageTab === 'en' ? 'ltr' : 'rtl'}
                  />
                </div>

                {/* Requirements list */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between border-b border-white/10 pb-2">
                    <label className="text-[10px] font-extrabold text-white flex items-center gap-1.5">
                      <span>مدارک و پیش‌نیازهای لازم (به زبان {editorLanguageTab === 'fa' ? 'فارسی' : editorLanguageTab === 'en' ? 'انگلیسی' : 'عربی'})</span>
                    </label>
                    
                    <button
                      type="button"
                      onClick={() => addRequirementRow(editorLanguageTab)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-gold/15 hover:bg-gold/25 text-gold text-[10px] font-black transition-all cursor-pointer border border-gold/30"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>افزودن سطر مدارک</span>
                    </button>
                  </div>

                  <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
                    {langData[editorLanguageTab].requirements.map((req, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-white/40 w-4 shrink-0 text-center">{idx + 1}.</span>
                        <input
                          type="text"
                          value={req}
                          onChange={(e) => handleRequirementChange(editorLanguageTab, idx, e.target.value)}
                          placeholder={`مدرک یا فیلد مورد نیاز شماره ${idx + 1}...`}
                          className={`flex-1 rounded-xl border border-white/10 bg-[#0f1e37] px-3 py-2 text-xs text-white placeholder-white/30 outline-none focus:border-gold ${editorLanguageTab === 'en' ? 'text-left font-sans' : 'text-right'}`}
                          dir={editorLanguageTab === 'en' ? 'ltr' : 'rtl'}
                        />
                        <button
                          type="button"
                          onClick={() => removeRequirementRow(editorLanguageTab, idx)}
                          className="flex h-8.5 w-8.5 items-center justify-center rounded-xl border border-red-500/30 bg-red-500/15 text-red-400 hover:bg-red-500/25 transition-all cursor-pointer shrink-0"
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

            {/* Action Footer */}
            <div className="flex items-center justify-between bg-[#0b172a] rounded-3xl border border-white/10 p-5 shadow-xl">
              <button
                type="button"
                onClick={() => setIsEditorOpen(false)}
                className="rounded-xl border border-white/10 bg-[#0f1e37] px-6 py-2.5 text-xs font-bold text-white/70 hover:bg-white/10 hover:text-white cursor-pointer transition-all"
              >
                انصراف و بازگشت
              </button>
              
              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-1.5 rounded-xl bg-gold px-8 py-3 text-xs font-black text-[#0f1e37] hover:brightness-110 shadow-md active:scale-98 disabled:opacity-50 cursor-pointer transition-all"
              >
                {loading ? (
                  <div className="h-4.5 w-4.5 animate-spin rounded-full border-2 border-[#0f1e37] border-t-transparent"></div>
                ) : (
                  <>
                    <Save className="h-4.5 w-4.5" />
                    ذخیره و ثبت نهایی خدمت
                  </>
                )}
              </button>
            </div>

          </div>

        </form>
      </div>
    );
  };

  // --- 5. COMPONENT MAIN RENDER ---
  return (
    <div className="min-h-screen bg-[#07111f] font-sans text-right text-white" dir="rtl">
      <Toaster position="top-center" toastOptions={{ style: { fontFamily: 'inherit' } }} />

      {/* Case Workflow & Task Management Modal */}
      <AnimatePresence>
        {selectedCaseRequest && (
          <CaseModal
            request={selectedCaseRequest}
            onClose={() => setSelectedCaseRequest(null)}
            onUpdateSuccess={handleCaseUpdateSuccess}
          />
        )}
      </AnimatePresence>

      {/* New Request Modal */}
      <AnimatePresence>
        {isNewRequestModalOpen && (
          <NewRequestModal
            onClose={() => setIsNewRequestModalOpen(false)}
            onSuccess={() => {
              fetchRequests();
              toast.success('درخواست جدید با موفقیت ثبت شد');
            }}
            servicesList={db?.fa ? db.fa.map(s => s.title) : []}
          />
        )}
      </AnimatePresence>

      {/* Main Responsive Grid Layout */}
      <div className="flex min-h-screen">
        
        {/* DESKTOP SIDEBAR PANEL */}
        <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:right-0 md:top-0 md:h-screen md:z-20 border-l border-white/10 bg-[#0b172a] shadow-2xl">
          <SidebarContent />
        </aside>

        {/* MOBILE SLIDING DRAWER NAVIGATION */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsMobileMenuOpen(false)}
                className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm md:hidden"
              />
              <motion.aside
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="fixed top-0 right-0 bottom-0 z-50 w-64 shadow-2xl md:hidden border-l border-white/10 bg-[#0b172a]"
              >
                <SidebarContent />
              </motion.aside>
            </>
          )}
        </AnimatePresence>

        {/* MAIN DISPLAY AREA */}
        <div className="flex-1 md:mr-64 min-h-screen flex flex-col bg-[#07111f]">
          
          {/* MOBILE ONLY TOP HEADER */}
          <header className="md:hidden sticky top-0 z-30 w-full border-b border-white/10 bg-[#0b172a]/90 backdrop-blur-md px-4 py-3 flex items-center justify-between">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-2 rounded-xl border border-white/10 bg-white/5 text-white hover:bg-white/10 transition-colors shadow-sm cursor-pointer"
            >
              <Menu className="h-5.5 w-5.5" />
            </button>

            <div className="flex flex-col items-end select-none">
              <h1 className="text-[13px] font-black text-white leading-none">پنل مدیریت</h1>
              <span className="text-[9px] font-bold text-gold tracking-wide mt-1.5">ابوآرسام</span>
            </div>
          </header>

          {/* DESKTOP BRAND BANNER */}
          <header className="hidden md:block w-full border-b border-white/10 bg-[#0b172a]/80 py-4.5 px-6 select-none backdrop-blur-md">
            <div className="max-w-6xl mx-auto w-full flex items-center justify-between">
              <div>
                <h1 className="text-base font-extrabold text-white leading-none">
                  {activeScreen === 'services' ? 'مدیریت خدمات' : activeScreen === 'requests' ? 'درخواست‌های ارسالی و تسک‌های ادامه‌دار' : activeScreen === 'qms' ? 'مدیریت صف نوبت‌دهی (QMS)' : 'مدیریت مشتریان (CRM)'}
                </h1>
                <p className="text-[10px] text-white/50 mt-1.5 font-bold">
                  {activeScreen === 'services' ? 'ایجاد، ویرایش، حذف و تنظیم خدمات فعال وب‌سایت' : activeScreen === 'requests' ? 'مدیریت پرونده‌ها، سوابق پیگیری و آپلود مدارک' : activeScreen === 'qms' ? 'مدیریت پویای نوبت‌های کیوسک و حضوری' : 'لیست پرونده‌ها، سوابق و مدارک مشتریان'}
                </p>
              </div>
              
              <div className="text-[10px] text-gold font-bold tracking-widest bg-gold/10 px-3.5 py-1.5 rounded-full border border-gold/30">
                ABU ARSAM SERVICES
              </div>
            </div>
          </header>

          {/* Dynamic Content Panel */}
          <main className="flex-1 px-4 py-6 md:px-6 w-full">
            <div className="max-w-6xl mx-auto w-full">
              {isEditorOpen ? (
                renderServiceEditor()
              ) : activeScreen === 'services' ? (
                renderServicesScreen()
              ) : activeScreen === 'requests' ? (
                renderRequestsScreen()
              ) : activeScreen === 'qms' ? (
                <QMSScreen />
              ) : (
                <CustomersScreen />
              )}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

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

'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Car as CarIcon, Calendar as CalendarIcon, DollarSign, Plus, Search,
  Edit3, Trash2, ChevronLeft, ChevronRight, CheckCircle2, Clock,
  AlertTriangle, Upload, FileText, UserCheck, Phone, ShieldCheck,
  CreditCard, Landmark, Wallet, Check, X, Info, ExternalLink, Image as ImageIcon,
  Camera, Loader2, ArrowUpRight, ArrowDownRight, RefreshCw, UserPlus, Filter, ClipboardList, Key, Fuel, Gauge, Download, Link2, Ban
} from 'lucide-react';
import { toast } from 'sonner';
import {
  Car, CarReservation, CarTransaction, CarContract, FuelLevel, PaymentMethod,
  FUEL_LEVEL_LABELS, HANDOVER_CHECKLIST_ITEMS, INCOMING_TRANSACTION_TYPES, cleanCarTitle, cleanCarPlate, carModelName, pendingIdOfPayment
} from '@/lib/db-cars';
import NumericInput from '@/components/numeric-input';
import { normalizeDigits, parseFormattedNumber, toEnglishDigits } from '@/lib/utils';
import OMRIcon from '@/components/omr-icon';
import HandoverWizard from './handover-wizard';
import FancySelect from '@/components/ui/fancy-select';
import { useContractPdf, contractShareUrl, revokeContractLink, REVOKE_LINK_MESSAGE } from './use-contract-pdf';
import { buildContractData } from '@/lib/contract-data';
import { confirmDialog } from '@/components/confirm-dialog';
import { MediaError, compressImage, prepareVideo, uploadContractFile } from '@/lib/contract-media';
import SignaturePadModal from '@/components/signature-pad-modal';
import CompactPicker, { type CompactPickerOption } from '@/components/compact-picker';

interface CRMClient {
  name: string;
  phone: string;
}

export type { CarContract };

const HANDOVER_STATUS_BADGES: Record<CarContract['handoverStatus'], { label: string; cls: string }> = {
  delivered: { label: 'تحویل داده شد', cls: 'bg-emerald-500/20 text-emerald-300' },
  pending_delivery: { label: 'در انتظار تحویل', cls: 'bg-amber-500/20 text-amber-300' },
  returned: { label: 'عودت داده شد', cls: 'bg-blue-500/20 text-blue-300' },
  inspection_required: { label: 'نیازمند بررسی بدنه', cls: 'bg-rose-500/20 text-rose-300' },
};

const DEPOSIT_STATUS_LABELS: Record<CarContract['depositStatus'], string> = {
  held: 'نزد شرکت',
  refunded: 'مسترد شد',
  partially_refunded: 'استرداد با کسر جریمه',
};

const TX_TYPE_LABELS: Record<CarTransaction['type'], string> = {
  rent_fee: 'کرایه خودرو',
  deposit_in: 'دریافت ودیعه',
  deposit_refund: 'عودت ودیعه',
  maintenance_expense: 'هزینه سرویس',
  other_income: 'درآمد متفرقه',
};

const PAYMENT_METHOD_OPTIONS: { value: PaymentMethod; label: string }[] = [
  { value: 'bank_reza', label: '🏦 واریز به حساب - حساب رضا اماره' },
  { value: 'bank_mohammadi', label: '🏦 واریز به حساب - حساب محمدی' },
  { value: 'cash_reza', label: '💵 نقد - نقد به رضا اماره' },
  { value: 'cash_mohammadi', label: '💵 نقد - نقد به محمدی' },
];

const formatDateTime = (iso?: string) => {
  if (!iso) return '';
  const d = new Date(iso);
  return isNaN(d.getTime()) ? '' : d.toLocaleString('fa-IR', { dateStyle: 'short', timeStyle: 'short' });
};

interface CarsScreenProps {
  initialTab?: 'calendar' | 'fleet' | 'contracts' | 'accounting';
  // General manager only: delete a contract (even after handover) with its reservation and accounting rows
  canDeleteContracts?: boolean;
}

export default function CarsScreen({ initialTab, canDeleteContracts = false }: CarsScreenProps = {}) {
  const [activeTab, setActiveTab] = useState<'calendar' | 'fleet' | 'contracts' | 'accounting'>(initialTab || 'calendar');

  const handleTabChange = (tab: 'calendar' | 'fleet' | 'contracts' | 'accounting') => {
    setActiveTab(tab);
    try {
      localStorage.setItem('admin_car_sub_tab', tab);
    } catch (e) {}
  };

  useEffect(() => {
    if (initialTab) {
      handleTabChange(initialTab);
    }
  }, [initialTab]);

  // Data States
  const [cars, setCars] = useState<Car[]>([]);
  const [reservations, setReservations] = useState<CarReservation[]>([]);
  const [transactions, setTransactions] = useState<CarTransaction[]>([]);
  const [crmClients, setCrmClients] = useState<CRMClient[]>([]);
  const [loading, setLoading] = useState(true);

  // Contracts Mock Data & State
  const [contracts, setContracts] = useState<CarContract[]>([]);
  const [savingCar, setSavingCar] = useState(false);
  const [savingRes, setSavingRes] = useState(false);
  // Synchronous locks: a state flag only updates on the next render, so a fast double-click could still slip through
  const saveLocks = useRef({ car: false, res: false, tx: false });

  // Hover Tooltip State for Calendar Gantt Bar
  const [hoveredRes, setHoveredRes] = useState<{ res: CarReservation; car: Car; x: number; y: number } | null>(null);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [paymentFilter, setPaymentFilter] = useState<string>('all');

  // Calendar Timeline Navigation State (-7 days to +21 days = 29 days total)
  const [calendarAnchorDate, setCalendarAnchorDate] = useState<Date>(new Date());

  // Modal States
  const [isCarModalOpen, setIsCarModalOpen] = useState(false);
  const [editingCar, setEditingCar] = useState<Car | null>(null);

  const [isReservationModalOpen, setIsReservationModalOpen] = useState(false);
  const [selectedResDetails, setSelectedResDetails] = useState<CarReservation | null>(null);

  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [isContractModalOpen, setIsContractModalOpen] = useState(false);
  // Handover wizard: new handover (contract null), edit (step 1) or the finished contract (download / share)
  const [wizard, setWizard] = useState<{ contract: CarContract | null; startAtDone?: boolean; reservationId?: string } | null>(null);
  const contractPdf = useContractPdf();

  const handleDownloadContract = async (cnt: CarContract) => {
    const res = reservations.find(r => r.id === cnt.reservationId);
    const car = cars.find(c => c.id === (cnt.carId || res?.carId));
    try {
      const sig = await fetch('/api/settings/signature').then(r => (r.ok ? r.json() : null)).catch(() => null);
      await contractPdf.download(buildContractData(cnt, res, car), sig?.url || null);
    } catch {
      toast.error('ساخت فایل PDF ناموفق بود؛ دوباره تلاش کنید');
    }
  };

  const handleCopyContractLink = async (cnt: CarContract) => {
    if (!cnt.shareToken) return toast.error('لینک قرارداد در دسترس نیست');
    const link = contractShareUrl(cnt.shareToken);
    try {
      await navigator.clipboard.writeText(link);
      toast.success('لینک دانلود قرارداد کپی شد');
    } catch {
      window.prompt('لینک قرارداد:', link);
    }
  };

  const handleRevokeContractLink = async (cnt: CarContract) => {
    if (!(await confirmDialog({ title: 'باطل کردن لینک قرارداد', message: REVOKE_LINK_MESSAGE, confirmText: 'باطل کن و لینک جدید بساز' }))) return;
    const result = await revokeContractLink(cnt.id);
    if ('error' in result) return toast.error(result.error);
    setContracts(prev => prev.map(c => (c.id === cnt.id ? { ...c, shareToken: result.shareToken, shareVersion: result.shareVersion } : c)));
    const link = contractShareUrl(result.shareToken);
    try {
      await navigator.clipboard.writeText(link);
      toast.success('لینک‌های قبلی باطل شد؛ لینک جدید کپی شد');
    } catch {
      toast.success('لینک‌های قبلی باطل شد');
      window.prompt('لینک جدید قرارداد:', link);
    }
  };

  const renderContractActions = (cnt: CarContract) => (
        <div className="flex flex-wrap items-center justify-center gap-1.5">
          <button
            onClick={() => handleDownloadContract(cnt)}
            disabled={contractPdf.busy}
            title="دانلود قرارداد PDF"
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-gold/15 text-gold border border-gold/30 hover:bg-gold hover:text-black font-extrabold text-[11px] transition-all cursor-pointer disabled:opacity-50"
          >
            {contractPdf.busy ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
            <span>PDF</span>
          </button>
          <button
            onClick={() => handleCopyContractLink(cnt)}
            title="کپی لینک دانلود قرارداد برای مشتری"
            className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-white/70 hover:text-gold hover:border-gold/40 transition-colors cursor-pointer"
          >
            <Link2 size={14} />
          </button>
          <button
            onClick={() => handleRevokeContractLink(cnt)}
            title="باطل کردن لینک‌های قبلی و ساخت لینک جدید"
            className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-white/70 hover:text-rose-400 hover:border-rose-400/40 transition-colors cursor-pointer"
          >
            <Ban size={14} />
          </button>
          {cnt.reservationId && reservations.some(r => r.id === cnt.reservationId) && (
            <button
              onClick={() => setReturnModalResId(cnt.reservationId)}
              title="ثبت عودت: تصاویر و ویدیوهای بازگشت خودرو و امضای مشتری"
              className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-white/70 hover:text-gold hover:border-gold/40 transition-colors cursor-pointer"
            >
              <Camera size={14} />
            </button>
          )}
          <button
            onClick={() => setWizard({ contract: cnt })}
            title="ویرایش صورتجلسه، اطلاعات قرارداد و تصاویر"
            className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-white/70 hover:text-gold hover:border-gold/40 transition-colors cursor-pointer"
          >
            <Edit3 size={14} />
          </button>
          {canDeleteContracts && !reservations.find(r => r.id === cnt.reservationId)?.returnSignature && (
            <button
              onClick={() => handleDeleteContract(cnt)}
              title="حذف قرارداد (مدیر کل)"
              className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-rose-400/70 hover:bg-rose-500/15 hover:text-rose-400 transition-colors cursor-pointer"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
  );

  const handleDeleteContract = async (cnt: CarContract) => {
    // Deleting the contract also removes its accounting rows; the reservation can then be cancelled or deleted
    const linkedTx = cnt.reservationId ? transactions.filter(t => t.reservationId === cnt.reservationId) : [];
    if (reservations.find(r => r.id === cnt.reservationId)?.returnSignature) {
      toast.error('مشتری تصاویر و ویدیوهای عودت این رزرو را امضا کرده است؛ این قرارداد دیگر قابل حذف نیست');
      return;
    }
    const handedOver = cnt.handoverStatus !== 'pending_delivery';
    const lines = [
      `قرارداد ${cnt.id} (${cnt.customerName} - ${cleanCarTitle(cnt.carTitle)}) برای همیشه حذف می‌شود.`,
      linkedTx.length
        ? `این ${linkedTx.length} سند مالی هم خودکار از حسابداری حذف می‌شوند:\n${linkedTx.map(t => `• ${t.description || t.type} (${t.amount})`).join('\n')}`
        : '',
      cnt.reservationId ? 'رزرو مربوط باقی می‌ماند و بعد از حذف قرارداد می‌توانید آن را لغو یا حذف کنید.' : '',
      handedOver ? '⚠️ برای این قرارداد صورتجلسه تحویل ثبت شده است؛ فقط در صورتی حذف کنید که قرارداد تستی یا اشتباه است.' : '',
      'این عمل قابل بازگشت نیست.',
    ].filter(Boolean);
    if (!(await confirmDialog({ title: 'حذف قرارداد', message: lines.join('\n'), requireText: cnt.id, confirmText: 'حذف قرارداد' }))) return;

    try {
      const response = await fetch(`/api/cars/contracts?id=${encodeURIComponent(cnt.id)}`, { method: 'DELETE' });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.success) {
        toast.error(data.error || 'خطا در حذف قرارداد');
        return;
      }
      setContracts(prev => prev.filter(c => !data.contractIds.includes(c.id)));
      setTransactions(prev => prev.filter(t => !data.transactionIds.includes(t.id)));
      toast.success(`قرارداد ${cnt.id} و ${data.transactionIds.length} سند مالی آن حذف شد`);
    } catch (err) {
      toast.error('خطای ارتباط با سرور');
    }
  };

  // Form States - Car
  const [carForm, setCarForm] = useState<Partial<Car>>({
    title: '', brand: '', modelYear: '', plateNumber: '', color: '',
    dailyRate: 350, depositAmount: 1000, transmission: 'automatic',
    fuelType: 'بنزین', capacity: 5, status: 'available', imageUrl: '', notes: ''
  });
  const [uploadingCarImg, setUploadingCarImg] = useState(false);

  // Form States - Reservation
  const [resForm, setResForm] = useState<{
    carId: string;
    carTitle?: string;
    customerName: string;
    customerPhone: string;
    customerNationalId?: string;
    startDate: string;
    endDate: string;
    customDailyRate: number;
    discountType: 'amount' | 'percent';
    discountValue: number;
    totalPrice: number;
    depositPaid: number;
    status: 'confirmed' | 'active' | 'completed' | 'cancelled';
    notes?: string;
  }>({
    carId: '',
    carTitle: '',
    customerName: '',
    customerPhone: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0],
    customDailyRate: 10,
    discountType: 'amount',
    discountValue: 0,
    totalPrice: 0,
    depositPaid: 0, // Default 0
    status: 'confirmed',
    notes: ''
  });

  const [customerSelectMode, setCustomerSelectMode] = useState<'existing' | 'new'>('existing');
  const [selectedClient, setSelectedClient] = useState<CRMClient | null>(null);
  const [clientSearchQuery, setClientSearchQuery] = useState('');
  const [showClientDropdown, setShowClientDropdown] = useState(false);

  // Form States - Transaction
  const [txForm, setTxForm] = useState<{
    amount: number;
    type: CarTransaction['type'];
    paymentMethod: PaymentMethod;
    description: string;
    customerName: string;
    carId: string;
    reservationId: string;
    transactionDate: string;
    file: File | null;
  }>({
    amount: 0,
    type: 'rent_fee',
    paymentMethod: 'bank_reza',
    description: '',
    customerName: '',
    carId: '',
    reservationId: '',
    transactionDate: new Date().toISOString().split('T')[0],
    file: null
  });
  const [uploadingTxFile, setUploadingTxFile] = useState(false);

  // Record Payment Modal (pays a pending row issued with a reservation / contract)
  const [payTarget, setPayTarget] = useState<CarTransaction | null>(null);
  const [payForm, setPayForm] = useState<{ amount: number; paymentMethod: PaymentMethod; transactionDate: string }>({
    amount: 0,
    paymentMethod: 'bank_reza',
    transactionDate: new Date().toISOString().split('T')[0]
  });
  const [savingPay, setSavingPay] = useState(false);
  const [receivingTxId, setReceivingTxId] = useState<string | null>(null);

  // Fetch initial data
  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [carsRes, resRes, txRes, crmRes, contractsRes] = await Promise.all([
        fetch('/api/cars').then(r => r.json()),
        fetch('/api/cars/reservations').then(r => r.json()),
        fetch('/api/cars/transactions').then(r => r.json()),
        fetch('/api/requests').then(r => r.json()).catch(() => []),
        fetch('/api/cars/contracts').then(r => r.json()).catch(() => [])
      ]);

      if (Array.isArray(contractsRes)) setContracts(contractsRes);
      if (Array.isArray(carsRes)) setCars(carsRes);
      if (Array.isArray(resRes)) setReservations(resRes);
      if (Array.isArray(txRes)) setTransactions(txRes);

      // Extract unique CRM clients from requests
      if (Array.isArray(crmRes)) {
        const clientMap = new Map<string, CRMClient>();
        for (const req of crmRes) {
          if (req.phone && req.name) {
            const cleanPhone = req.phone.trim();
            if (!clientMap.has(cleanPhone)) {
              clientMap.set(cleanPhone, { name: req.name.trim(), phone: cleanPhone });
            }
          }
        }
        setCrmClients(Array.from(clientMap.values()));
      }
    } catch (err) {
      console.error('Failed loading car management data:', err);
      toast.error('خطا در بارگذاری اطلاعات');
    } finally {
      setLoading(false);
    }
  };

  // --- CALENDAR DAYS COMPUTATION ---
  // Cancelled reservations stay in the database as records but are hidden from the calendar, lists and pickers
  const activeReservations = useMemo(() => reservations.filter(r => r.status !== 'cancelled'), [reservations]);

  // Contract of the reservation open in the details window once its car was handed over (blocks cancel/delete)
  // Photos/videos taken at car return live on the reservation file (never in the contract); the customer
  // signs to confirm them, after which the media is locked (enforced on the server too).
  const [uploadingReturnPhotos, setUploadingReturnPhotos] = useState(0);
  const [returnModalResId, setReturnModalResId] = useState<string | null>(null);
  const returnRes = returnModalResId ? reservations.find(r => r.id === returnModalResId) ?? null : null;
  const [returnSignOpen, setReturnSignOpen] = useState(false);
  const [signingReturn, setSigningReturn] = useState(false);

  const saveReturnMedia = async (reservation: CarReservation, photos: NonNullable<CarReservation['returnPhotos']>, signaturePath?: string) => {
    const res = await fetch('/api/cars/reservations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...reservation, returnPhotos: photos, returnSignature: signaturePath ? { path: signaturePath } : undefined }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.success) throw new Error(data.error || 'ذخیره تصاویر عودت ناموفق بود');
    const saved: CarReservation = data.reservation;
    const patch = { returnPhotos: saved.returnPhotos, returnSignature: saved.returnSignature };
    setReservations(prev => prev.map(r => (r.id === saved.id ? { ...r, ...patch } : r)));
    setSelectedResDetails(cur => (cur && cur.id === saved.id ? { ...cur, ...patch } : cur));
  };

  const handleAddReturnMedia = async (reservation: CarReservation, files: FileList | null) => {
    if (!files?.length) return;
    const current = reservations.find(r => r.id === reservation.id) ?? reservation;
    if (current.returnSignature) return;
    const added: NonNullable<CarReservation['returnPhotos']> = [];
    setUploadingReturnPhotos(n => n + files.length);
    for (const file of Array.from(files)) {
      try {
        const isVideo = file.type.startsWith('video/') || /\.(mp4|webm|mov)$/i.test(file.name);
        if (isVideo) {
          const { video, poster } = await prepareVideo(file, () => {});
          const posterPath = poster ? await uploadContractFile(poster, false).catch(() => undefined) : undefined;
          const path = await uploadContractFile(video, true);
          added.push({ kind: 'car_video', path, name: video.name, size: video.size, posterPath });
        } else {
          if (!file.type.startsWith('image/') && !/\.(jpe?g|png|webp|heic|heif)$/i.test(file.name)) throw new MediaError('فقط فایل تصویری یا ویدیو قابل انتخاب است');
          const image = await compressImage(file);
          const path = await uploadContractFile(image, false);
          added.push({ kind: 'car_photo', path, name: image.name, size: image.size });
        }
      } catch (err) {
        toast.error(err instanceof MediaError ? err.message : `آپلود «${file.name}» ناموفق بود`);
      } finally {
        setUploadingReturnPhotos(n => n - 1);
      }
    }
    if (!added.length) return;
    try {
      await saveReturnMedia(current, [...(current.returnPhotos || []), ...added]);
      toast.success('فایل‌های عودت در پرونده رزرو ثبت شد');
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleRemoveReturnMedia = async (reservation: CarReservation, index: number) => {
    const current = reservations.find(r => r.id === reservation.id) ?? reservation;
    if (current.returnSignature) return;
    if (!(await confirmDialog({ title: 'حذف فایل', message: 'این فایل از پرونده رزرو حذف شود؟', confirmText: 'حذف' }))) return;
    try {
      await saveReturnMedia(current, (current.returnPhotos || []).filter((_, i) => i !== index));
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleSignReturn = async (reservation: CarReservation, png: File) => {
    const current = reservations.find(r => r.id === reservation.id) ?? reservation;
    setSigningReturn(true);
    try {
      const path = await uploadContractFile(png, false);
      await saveReturnMedia(current, current.returnPhotos || [], path);
      setReturnSignOpen(false);
      toast.success('امضای مشتری ثبت شد');
    } catch (err: any) {
      toast.error(err.message || 'ثبت امضا ناموفق بود');
    } finally {
      setSigningReturn(false);
    }
  };

  const handedOverContractForDetails = selectedResDetails
    ? contracts.find(c => c.reservationId === selectedResDetails.id && c.handoverStatus !== 'pending_delivery')
    : undefined;

  const calendarDays = useMemo(() => {
    const days: { date: Date; dateStr: string; dayName: string; dayNum: number; isToday: boolean; isWeekend: boolean }[] = [];
    const base = new Date(calendarAnchorDate);
    // Start -7 days from anchor
    base.setDate(base.getDate() - 7);

    const todayStr = new Date().toISOString().split('T')[0];

    for (let i = 0; i < 29; i++) {
      const d = new Date(base);
      d.setDate(d.getDate() + i);
      const dateStr = d.toISOString().split('T')[0];

      const dayName = d.toLocaleDateString('fa-IR', { weekday: 'short' });
      const dayNum = d.getDate();
      const isToday = dateStr === todayStr;
      const isWeekend = d.getDay() === 5 || d.getDay() === 6; // Friday & Saturday (Oman Weekend)

      days.push({ date: d, dateStr, dayName, dayNum, isToday, isWeekend });
    }
    return days;
  }, [calendarAnchorDate]);

  const calendarDateRangeLabel = useMemo(() => {
    if (calendarDays.length === 0) return '';
    const first = calendarDays[0].date;
    const last = calendarDays[calendarDays.length - 1].date;
    const fStr = first.toLocaleDateString('fa-IR', { month: 'long', day: 'numeric' });
    const lStr = last.toLocaleDateString('fa-IR', { month: 'long', day: 'numeric', year: 'numeric' });
    return `${fStr} الی ${lStr}`;
  }, [calendarDays]);

  const handleShiftCalendar = (daysCount: number) => {
    const next = new Date(calendarAnchorDate);
    next.setDate(next.getDate() + daysCount);
    setCalendarAnchorDate(next);
  };

  // --- CAR HANDLERS ---
  const handleOpenAddCar = () => {
    setEditingCar(null);
    setCarForm({
      title: '', brand: '', modelYear: '', plateNumber: '', color: '',
      dailyRate: 350, depositAmount: 1000, transmission: 'automatic',
      fuelType: 'بنزین', capacity: 5, status: 'available', imageUrl: '', notes: ''
    });
    setIsCarModalOpen(true);
  };

  const handleOpenEditCar = (car: Car) => {
    setEditingCar(car);
    setCarForm({ ...car });
    setIsCarModalOpen(true);
  };

  const handleSaveCar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!carForm.title || !carForm.dailyRate) {
      toast.error('عنوان و نرخ روزانه خودرو الزامی است');
      return;
    }

    if (saveLocks.current.car) return;
    saveLocks.current.car = true;
    setSavingCar(true);
    try {
      const res = await fetch('/api/cars', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingCar ? { id: editingCar.id, ...carForm } : carForm)
      });

      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(editingCar ? 'مشخصات خودرو با موفقیت ویرایش شد' : 'خودرو جدید با موفقیت ثبت شد');
        setIsCarModalOpen(false);
        await fetchAllData();
      } else {
        toast.error(data.error || 'خطا در ذخیره‌سازی');
      }
    } catch (err) {
      toast.error('خطای ارتباط با سرور');
    } finally {
      saveLocks.current.car = false;
      setSavingCar(false);
    }
  };

  const handleDeleteCar = async (id: string) => {
    if (!(await confirmDialog('آیا از حذف این خودرو اطمینان دارید؟'))) return;
    try {
      const res = await fetch(`/api/cars?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('خودرو با موفقیت حذف شد');
        setCars(prev => prev.filter(c => c.id !== id));
      }
    } catch (err) {
      toast.error('خطا در حذف خودرو');
    }
  };

  const handleUploadCarImg = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingCarImg(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/services/upload', { method: 'POST', body: formData });
      const data = await res.json();
      if (res.ok && data.url) {
        setCarForm(prev => ({ ...prev, imageUrl: data.url }));
        toast.success('عکس خودرو با موفقیت آپلود شد');
      } else {
        toast.error(data.error || 'خطا در آپلود عکس');
      }
    } catch (err) {
      toast.error('خطای سرور در آپلود عکس');
    } finally {
      setUploadingCarImg(false);
    }
  };

  // --- CRM & RESERVATION CLIENTS POOL ---
  const allClients = useMemo(() => {
    const clientMap = new Map<string, CRMClient>();

    for (const c of crmClients) {
      if (c.phone && c.name) {
        const clean = normalizeDigits(c.phone).replace(/[^0-9+]/g, '');
        if (clean) clientMap.set(clean, { name: c.name.trim(), phone: c.phone.trim() });
      }
    }

    for (const r of reservations) {
      if (r.customerPhone && r.customerName) {
        const clean = normalizeDigits(r.customerPhone).replace(/[^0-9+]/g, '');
        if (clean && !clientMap.has(clean)) {
          clientMap.set(clean, { name: r.customerName.trim(), phone: r.customerPhone.trim() });
        }
      }
    }

    return Array.from(clientMap.values());
  }, [crmClients, reservations]);

  // Live Phone Match Check
  const matchedExistingClient = useMemo(() => {
    if (customerSelectMode !== 'new' || !resForm.customerPhone) return null;
    const clean = normalizeDigits(resForm.customerPhone).replace(/[^0-9+]/g, '');
    if (!clean || clean.length < 4) return null;
    return allClients.find(c => normalizeDigits(c.phone).replace(/[^0-9+]/g, '') === clean) || null;
  }, [customerSelectMode, resForm.customerPhone, allClients]);

  // --- RESERVATION HANDLERS & PRICING CALCULATOR ---
  const calculatePricing = (
    carId: string,
    sDate: string,
    eDate: string,
    customDailyRateInput?: number,
    discType: 'amount' | 'percent' = 'amount',
    discVal: number = 0
  ) => {
    const car = cars.find(c => c.id === carId);
    const rate = (customDailyRateInput !== undefined && customDailyRateInput >= 0)
      ? customDailyRateInput
      : (car ? car.dailyRate : 10);

    let days = 1;
    if (sDate && eDate) {
      try {
        const start = new Date(sDate);
        const end = new Date(eDate);
        days = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 3600 * 24)));
      } catch (err) {}
    }

    // Work in integer baisa (1 OMR = 1000 baisa) so percent discounts are exact to 3 decimals
    const grossBaisa = Math.round(rate * days * 1000);
    const discountBaisa = discType === 'percent'
      ? Math.round(Number((grossBaisa * Math.min(100, Math.max(0, discVal)) / 100).toPrecision(12)))
      : Math.min(grossBaisa, Math.round(Math.max(0, discVal) * 1000));

    const grossTotal = grossBaisa / 1000;
    const discountAmount = discountBaisa / 1000;
    const finalTotal = Math.max(0, grossBaisa - discountBaisa) / 1000;

    return {
      rate,
      days,
      grossTotal,
      discountAmount,
      finalTotal
    };
  };

  const updateResFormPricing = (updates: Partial<typeof resForm>) => {
    setResForm(prev => {
      const next = { ...prev, ...updates };

      if (updates.carId && updates.carId !== prev.carId) {
        const car = cars.find(c => c.id === updates.carId);
        if (car) {
          next.customDailyRate = car.dailyRate;
          next.carTitle = car.title;
          next.depositPaid = car.depositAmount || 40;
        }
      }

      const calc = calculatePricing(
        next.carId,
        next.startDate,
        next.endDate,
        next.customDailyRate,
        next.discountType,
        next.discountValue
      );

      return {
        ...next,
        customDailyRate: calc.rate,
        totalPrice: calc.finalTotal
      };
    });
  };

  const handleOpenAddReservation = (preselectedCarId?: string) => {
    const selectedCar = cars.find(c => c.id === (preselectedCarId || cars[0]?.id));
    const rate = selectedCar ? selectedCar.dailyRate : 10;
    const defaultDays = 3;
    const sDate = new Date().toISOString().split('T')[0];
    const eDate = new Date(Date.now() + defaultDays * 86400000).toISOString().split('T')[0];

    const calc = calculatePricing(selectedCar?.id || '', sDate, eDate, rate, 'amount', 0);

    setResForm({
      carId: selectedCar?.id || '',
      carTitle: selectedCar?.title || '',
      customerName: '',
      customerPhone: '',
      customerNationalId: '',
      startDate: sDate,
      endDate: eDate,
      customDailyRate: rate,
      discountType: 'amount',
      discountValue: 0,
      totalPrice: calc.finalTotal,
      depositPaid: selectedCar ? selectedCar.depositAmount || 40 : 40,
      status: 'confirmed',
      notes: ''
    });

    setCustomerSelectMode('existing');
    setSelectedClient(null);
    setClientSearchQuery('');
    setShowClientDropdown(false);
    setIsReservationModalOpen(true);
  };

  const handleSaveReservation = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!resForm.carId || !resForm.customerName || !resForm.startDate || !resForm.endDate) {
      toast.error('لطفا تمامی فیلدهای الزامی رزرو را تکمیل نمایید');
      return;
    }

    if (customerSelectMode === 'new') {
      if (!resForm.customerPhone || resForm.customerPhone.trim() === '') {
        toast.error('وارد کردن شماره تلفن تماس برای مشتری جدید الزامی است');
        return;
      }

      const cleanPhone = normalizeDigits(resForm.customerPhone).replace(/[^0-9+]/g, '');
      const existing = allClients.find(c => normalizeDigits(c.phone).replace(/[^0-9+]/g, '') === cleanPhone);
      if (existing && existing.name !== resForm.customerName.trim()) {
        toast.error(`خطا: شماره تماس ${resForm.customerPhone} متعلق به «${existing.name}» است. لطفاً از پرونده مشتری استفاده نمایید.`);
        return;
      }
    } else {
      if (!resForm.customerPhone || resForm.customerPhone.trim() === '') {
        toast.error('لطفاً یک مشتری از لیست انتخاب کنید');
        return;
      }
    }

    if (saveLocks.current.res) return;
    saveLocks.current.res = true;
    setSavingRes(true);
    try {
      const res = await fetch('/api/cars/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(resForm)
      });

      const data = await res.json();
      if (res.ok && data.success) {
        toast.success('رزرو خودرو با موفقیت ثبت گردید');
        setIsReservationModalOpen(false);

        const newRes = data.reservation || { id: 'res-' + Date.now(), ...resForm };
        setReservations(prev => [newRes, ...prev.filter(r => r.id !== newRes.id)]);
        const d = new Date(resForm.startDate);
        if (!isNaN(d.getTime())) {
          setCalendarAnchorDate(d);
        }

        const sideEffects: Promise<unknown>[] = [];

        // Update car status to rented if reservation is active today
        const todayStr = new Date().toISOString().split('T')[0];
        if (resForm.startDate! <= todayStr && resForm.endDate! >= todayStr) {
          sideEffects.push(fetch('/api/cars', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: resForm.carId, status: 'rented' })
          }));
          setCars(prev => prev.map(c => c.id === resForm.carId ? { ...c, status: 'rented' } : c));
        }

        // Contract, rent revenue and deposit are all issued and stored server-side
        const issued: CarTransaction[] = [data.transaction, data.depositTransaction].filter(Boolean);
        if (issued.length > 0) {
          setTransactions(prev => [...issued, ...prev.filter(t => !issued.some(i => i.id === t.id))]);
        }
        if (data.syncError) {
          toast.error('رزرو ذخیره شد اما به‌روزرسانی قرارداد و حسابداری ناموفق بود');
        } else if (data.chainError) {
          toast.error('رزرو ثبت شد اما صدور قرارداد و ثبت درآمد ناموفق بود');
        } else if (data.contract) {
          toast.success(`قرارداد ${data.contract.id} صادر شد؛ مبلغ اجاره تا ثبت پرداخت، «در انتظار پرداخت» است`);
        }

        // Wait for the follow-up writes so the refresh below can't overwrite them with stale data
        await Promise.allSettled(sideEffects);
        await fetchAllData();
      } else {
        toast.error(data.error || 'خطا در ثبت رزرو');
      }
    } catch (err) {
      toast.error('خطای برقراری ارتباط با سرور');
    } finally {
      saveLocks.current.res = false;
      setSavingRes(false);
    }
  };

  const handleDeleteReservation = async (id: string) => {
    const linkedContract = contracts.find(c => c.reservationId === id);
    const message = linkedContract
      ? `با حذف این رزرو، قرارداد ${linkedContract.id} و درآمد/ودیعه ثبت‌شده آن در حسابداری هم حذف می‌شود. ادامه می‌دهید؟`
      : 'آیا از حذف این رزرو مطمئن هستید؟';
    if (!(await confirmDialog({ title: 'حذف رزرو', message }))) return;
    try {
      const res = await fetch(`/api/cars/reservations?id=${id}`, { method: 'DELETE' });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success) {
        toast.success('رزرو و قرارداد و اسناد مالی مرتبط حذف شد');
        setSelectedResDetails(null);
        setReservations(prev => prev.filter(r => r.id !== id));
        setContracts(prev => prev.filter(c => c.reservationId !== id));
        setTransactions(prev => prev.filter(t => t.reservationId !== id));
      } else {
        toast.error(data.error || 'خطا در حذف رزرو');
      }
    } catch (err) {
      toast.error('خطا در حذف رزرو');
    }
  };

  // Cancelling keeps the reservation, its contract and accounting rows as records (used once the car was handed over)
  const handleCancelReservation = async (reservation: CarReservation) => {
    if (!(await confirmDialog({
      title: 'لغو رزرو',
      message: `رزرو «${reservation.customerName} - ${cleanCarTitle(reservation.carTitle || '')}» لغو می‌شود و از تقویم برداشته می‌شود. قرارداد و اسناد مالی آن به‌عنوان سابقه باقی می‌مانند.`,
      confirmText: 'بله، لغو شود',
    }))) return;
    try {
      const res = await fetch('/api/cars/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...reservation, returnPhotos: undefined, status: 'cancelled' })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        toast.error(data.error || 'خطا در لغو رزرو');
        return;
      }
      setReservations(prev => prev.map(r => r.id === reservation.id ? { ...r, status: 'cancelled' } : r));
      setSelectedResDetails(null);

      // Free the car if no other live reservation covers today
      const todayStr = new Date().toISOString().split('T')[0];
      const car = cars.find(c => c.id === reservation.carId);
      const stillBusy = reservations.some(r => r.id !== reservation.id && r.carId === reservation.carId && r.status !== 'cancelled' && r.status !== 'completed' && r.startDate <= todayStr && r.endDate >= todayStr);
      if (car?.status === 'rented' && !stillBusy) {
        await fetch('/api/cars', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: car.id, status: 'available' }) });
        setCars(prev => prev.map(c => c.id === car.id ? { ...c, status: 'available' } : c));
      }
      toast.success('رزرو لغو شد');
    } catch (err) {
      toast.error('خطای ارتباط با سرور');
    }
  };

  // --- TRANSACTION HANDLERS ---
  const handleOpenAddTransaction = () => {
    setTxForm({
      amount: 0,
      type: 'rent_fee',
      paymentMethod: 'bank_reza',
      description: '',
      customerName: '',
      carId: '',
      reservationId: '',
      transactionDate: new Date().toISOString().split('T')[0],
      file: null
    });
    setIsTransactionModalOpen(true);
  };

  const handleSaveTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!txForm.amount || txForm.amount <= 0) {
      toast.error('لطفا مبلغ معتبر تراکنش را وارد کنید');
      return;
    }

    if (saveLocks.current.tx) return;
    saveLocks.current.tx = true;
    setUploadingTxFile(true);
    try {
      const formData = new FormData();
      formData.append('amount', String(txForm.amount));
      formData.append('type', txForm.type);
      formData.append('paymentMethod', txForm.paymentMethod);
      formData.append('description', txForm.description);
      formData.append('customerName', txForm.customerName);
      formData.append('carId', txForm.carId);
      formData.append('reservationId', txForm.reservationId);
      formData.append('transactionDate', txForm.transactionDate);
      if (txForm.file) {
        formData.append('receiptFile', txForm.file);
      }

      const res = await fetch('/api/cars/transactions', {
        method: 'POST',
        body: formData
      });

      const data = await res.json();
      if (res.ok && data.success) {
        toast.success('تراکنش مالی جدید با موفقیت ثبت شد');
        setIsTransactionModalOpen(false);
        await fetchAllData();
      } else {
        toast.error(data.error || 'خطا در ثبت تراکنش');
      }
    } catch (err) {
      toast.error('خطا در ارتباط با سرور');
    } finally {
      saveLocks.current.tx = false;
      setUploadingTxFile(false);
    }
  };

  const handleDeleteTransaction = async (id: string) => {
    // Rows issued automatically with a reservation (rent revenue / deposit) are part of that reservation's chain
    const tx = transactions.find(t => t.id === id);
    // A payment recorded against a reservation charge: deleting it puts the amount back on what the customer owes
    const isRecordedPayment = !!tx && tx.paymentStatus === 'paid' && !!pendingIdOfPayment(tx);
    const isAutoIssued = !isRecordedPayment && ['tx-rent-', 'tx-dep-', 'tx-xkm-', 'tx-dmg-'].some(prefix => id.startsWith(prefix));
    const linkedRes = tx?.reservationId ? reservations.find(r => r.id === tx.reservationId) : undefined;
    const linkedContract = tx?.reservationId ? contracts.find(c => c.reservationId === tx.reservationId) : undefined;

    const confirmed = isRecordedPayment
      ? await confirmDialog({
          title: 'حذف پرداخت ثبت‌شده',
          message: `این پرداخت (${tx!.amount.toLocaleString()} OMR - ${getPaymentBadge(tx!.paymentMethod).label}) حذف می‌شود و همین مبلغ دوباره به «در انتظار پرداخت» مشتری${linkedRes ? ` (${linkedRes.customerName})` : ''} برمی‌گردد.\nآیا پرداخت حذف شود؟`,
          confirmText: 'حذف پرداخت',
        })
      : isAutoIssued && linkedRes
      ? await confirmDialog({
          title: 'این ردیف مربوط به یک رزرو است',
          message: `این ردیف به‌صورت خودکار برای رزرو «${linkedRes.customerName} - ${cleanCarTitle(linkedRes.carTitle || '')}»${linkedContract ? ` و قرارداد ${linkedContract.id}` : ''} ثبت شده است. با حذف آن فقط همین ردیف مالی پاک می‌شود و رزرو و قرارداد باقی می‌مانند.\nبرای حذف کامل: اگر خودرو هنوز تحویل نشده، کافی است خود رزرو را از تب «تقویم و رزروها» حذف کنید؛ اگر تحویل شده، قرارداد را در تب «قراردادها و تحویل» حذف کنید (اسناد مالی آن هم حذف می‌شوند) و سپس رزرو را.\nآیا این ردیف حذف شود؟`,
          confirmText: 'فقط این ردیف حذف شود',
        })
      : await confirmDialog('آیا از حذف این تراکنش مالی مطمئن هستید؟');
    if (!confirmed) return;

    try {
      const res = await fetch(`/api/cars/transactions?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        const data = await res.json().catch(() => ({}));
        const restored: CarTransaction | undefined = data.restored;
        setTransactions(prev => {
          const rest = prev.filter(t => t.id !== id && t.id !== restored?.id);
          return restored ? [restored, ...rest] : rest;
        });
        toast.success(restored
          ? `پرداخت حذف شد؛ ${tx?.amount.toLocaleString()} OMR دوباره در انتظار پرداخت است`
          : 'تراکنش حذف گردید');
      } else {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error || 'خطا در حذف تراکنش');
      }
    } catch (err) {
      toast.error('خطا در حذف تراکنش');
    }
  };

  // --- PAYMENT HANDLERS ---
  const handleOpenRecordPayment = (tx: CarTransaction) => {
    setPayForm({ amount: tx.amount, paymentMethod: 'bank_reza', transactionDate: new Date().toISOString().split('T')[0] });
    setPayTarget(tx);
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payTarget) return;
    if (!payForm.amount || payForm.amount <= 0) {
      toast.error('مبلغ پرداخت را وارد کنید');
      return;
    }
    if (payForm.amount > payTarget.amount) {
      toast.error(`مبلغ پرداخت بیشتر از مانده (${payTarget.amount.toLocaleString()}) است`);
      return;
    }
    if (savingPay) return;
    setSavingPay(true);
    try {
      const res = await fetch('/api/cars/transactions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'pay', id: payTarget.id, ...payForm })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        toast.error(data.error || 'خطا در ثبت پرداخت');
        return;
      }
      const paid: CarTransaction = data.payment;
      const remaining: CarTransaction | undefined = data.remaining;
      setTransactions(prev => [
        paid,
        ...prev.flatMap(t => t.id !== payTarget.id ? [t] : remaining ? [remaining] : [])
      ]);
      setPayTarget(null);
      toast.success(remaining
        ? `پرداخت ثبت شد؛ مانده: ${remaining.amount.toLocaleString()} OMR`
        : 'پرداخت کامل ثبت شد');
    } catch (err) {
      toast.error('خطای ارتباط با سرور');
    } finally {
      setSavingPay(false);
    }
  };

  const handleSetReceived = async (tx: CarTransaction, received: boolean) => {
    if (!received && !(await confirmDialog({
      title: 'لغو تأیید دریافت',
      message: `تأیید دریافت ${tx.amount.toLocaleString()} OMR (${getPaymentBadge(tx.paymentMethod).label}) برداشته شود؟`,
      confirmText: 'بله، برداشته شود',
    }))) return;
    if (receivingTxId) return;
    setReceivingTxId(tx.id);
    try {
      const res = await fetch('/api/cars/transactions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: received ? 'confirm_received' : 'undo_received', id: tx.id })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        toast.error(data.error || 'خطا در ثبت تأیید دریافت');
        return;
      }
      const updated: CarTransaction = data.transaction;
      setTransactions(prev => prev.map(t => t.id === updated.id ? updated : t));
      toast.success(received ? 'دریافت مبلغ تأیید شد' : 'تأیید دریافت برداشته شد');
    } catch (err) {
      toast.error('خطای ارتباط با سرور');
    } finally {
      setReceivingTxId(null);
    }
  };

  // Starts on the first reservation still waiting for its handover (the wizard continues its auto-issued contract)
  const handleOpenAddHandover = (resId?: string) => {
    const pending = (r: CarReservation) => {
      const c = contracts.find(x => x.reservationId === r.id);
      return !c || c.handoverStatus === 'pending_delivery';
    };
    const res = activeReservations.find(r => r.id === resId) || activeReservations.find(pending) || activeReservations[0];
    setWizard({ contract: null, reservationId: res?.id });
  };

  const handleWizardSaved = (saved: CarContract) => {
    setContracts(prev => [saved, ...prev.filter(c => c.id !== saved.id)]);
    // Extra-km / accident amounts become their own accounting rows
    fetch('/api/cars/transactions').then(r => r.json()).then(tx => { if (Array.isArray(tx)) setTransactions(tx); }).catch(() => {});
  };

  // --- CRM AUTOSUGGEST FILTER ---
  const filteredCrmSuggestions = useMemo(() => {
    if (!resForm.customerName || customerSelectMode === 'new') return [];
    const query = resForm.customerName.toLowerCase().trim();
    return crmClients.filter(
      c => c.name.toLowerCase().includes(query) || c.phone.includes(query)
    ).slice(0, 6);
  }, [crmClients, resForm.customerName, customerSelectMode]);

  // --- ACCOUNTING STATS CALCULATION ---
  const accountingStats = useMemo(() => {
    let netRentalIncome = 0;
    let totalDepositsHeld = 0;
    let netCashBalance = 0;
    let bankReza = 0;
    let bankMohammadi = 0;
    let cashReza = 0;
    let cashMohammadi = 0;
    // Still owed by customers (pending rows): not in any balance until paid
    let receivables = 0;
    let pendingDeposits = 0;
    // Paid in, but the account holder has not confirmed receiving it yet
    let unconfirmedTotal = 0;
    let unconfirmedCount = 0;

    for (const tx of transactions) {
      if (tx.paymentStatus === 'pending') {
        if (tx.type === 'deposit_in') pendingDeposits += tx.amount;
        else if (INCOMING_TRANSACTION_TYPES.includes(tx.type)) receivables += tx.amount;
        continue;
      }
      if (INCOMING_TRANSACTION_TYPES.includes(tx.type) && !tx.receivedAt) {
        unconfirmedTotal += tx.amount;
        unconfirmedCount++;
      }

      if (tx.type === 'rent_fee' || tx.type === 'other_income') {
        netRentalIncome += tx.amount;
        netCashBalance += tx.amount;
      } else if (tx.type === 'deposit_in') {
        totalDepositsHeld += tx.amount;
        netCashBalance += tx.amount;
      } else if (tx.type === 'deposit_refund') {
        totalDepositsHeld -= tx.amount;
        netCashBalance -= tx.amount;
      } else if (tx.type === 'maintenance_expense') {
        netCashBalance -= tx.amount;
      }

      const isExpense = tx.type === 'deposit_refund' || tx.type === 'maintenance_expense';
      const val = isExpense ? -tx.amount : tx.amount;

      if (tx.paymentMethod === 'bank_reza') bankReza += val;
      else if (tx.paymentMethod === 'bank_mohammadi') bankMohammadi += val;
      else if (tx.paymentMethod === 'cash_reza') cashReza += val;
      else if (tx.paymentMethod === 'cash_mohammadi') cashMohammadi += val;
    }

    return {
      netRentalIncome, totalDepositsHeld, netCashBalance, bankReza, bankMohammadi, cashReza, cashMohammadi,
      receivables, pendingDeposits, unconfirmedTotal, unconfirmedCount
    };
  }, [transactions]);

  // Payment state per reservation, from its incoming accounting rows (rent, deposit, extra charges)
  const reservationPayments = useMemo(() => {
    const map = new Map<string, { paid: number; owed: number; pendingRows: CarTransaction[]; paidRows: CarTransaction[] }>();
    for (const tx of transactions) {
      if (!tx.reservationId || !INCOMING_TRANSACTION_TYPES.includes(tx.type)) continue;
      const entry = map.get(tx.reservationId) || { paid: 0, owed: 0, pendingRows: [], paidRows: [] };
      if (tx.paymentStatus === 'pending') {
        entry.owed += tx.amount;
        entry.pendingRows.push(tx);
      } else {
        entry.paid += tx.amount;
        entry.paidRows.push(tx);
      }
      map.set(tx.reservationId, entry);
    }
    return map;
  }, [transactions]);

  const getReservationPaymentBadge = (reservationId: string) => {
    const p = reservationPayments.get(reservationId);
    if (!p) return null;
    if (p.owed <= 0) return { label: 'پرداخت کامل', cls: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' };
    if (p.paid > 0) return { label: 'پرداخت ناقص', cls: 'bg-amber-500/20 text-amber-300 border-amber-500/40' };
    return { label: 'پرداخت‌نشده', cls: 'bg-rose-500/20 text-rose-300 border-rose-500/40' };
  };

  // Payment method badges map
  const getPaymentBadge = (method: CarTransaction['paymentMethod']) => {
    switch (method) {
      case null:
        return { label: '⏳ در انتظار پرداخت', bg: 'rgba(244,63,94,0.12)', text: '#fda4af', border: 'rgba(244,63,94,0.35)' };
      case 'bank_reza':
        return { label: '🏦 واریز: حساب رضا اماره', bg: 'rgba(59,130,246,0.15)', text: '#60a5fa', border: 'rgba(59,130,246,0.3)' };
      case 'bank_mohammadi':
        return { label: '🏦 واریز: حساب محمدی', bg: 'rgba(168,85,247,0.15)', text: '#c084fc', border: 'rgba(168,85,247,0.3)' };
      case 'cash_reza':
        return { label: '💵 نقد: به رضا اماره', bg: 'rgba(52,211,153,0.15)', text: '#34d399', border: 'rgba(52,211,153,0.3)' };
      case 'cash_mohammadi':
        return { label: '💵 نقد: به محمدی', bg: 'rgba(251,146,60,0.15)', text: '#fb923c', border: 'rgba(251,146,60,0.3)' };
      default:
        return { label: 'پرداخت', bg: 'rgba(255,255,255,0.1)', text: '#ffffff', border: 'rgba(255,255,255,0.2)' };
    }
  };

  // Car Status badges
  const getCarStatusBadge = (status: Car['status']) => {
    switch (status) {
      case 'available':
        return { label: 'آماده رزرو', bg: 'rgba(52,211,153,0.15)', text: '#34d399', border: 'rgba(52,211,153,0.3)' };
      case 'rented':
        return { label: 'در حال اجاره', bg: 'rgba(248,113,113,0.15)', text: '#f87171', border: 'rgba(248,113,113,0.3)' };
      case 'maintenance':
        return { label: 'سرویس و تعمیر', bg: 'rgba(251,191,36,0.15)', text: '#fbbf24', border: 'rgba(251,191,36,0.3)' };
      case 'disabled':
        return { label: 'غیرفعال', bg: 'rgba(156,163,175,0.15)', text: '#9ca3af', border: 'rgba(156,163,175,0.3)' };
    }
  };

  // --- COMPACT PICKER ROWS: model + year + plate, so several units of the same model stay distinguishable ---
  const renderCarLine = (car: Car | undefined, fallbackTitle?: string) => {
    const badge = car ? getCarStatusBadge(car.status) : undefined;
    const plate = car ? cleanCarPlate(car.plateNumber) : '';
    return (
      <span className="flex items-center gap-1.5 min-w-0">
        {badge && <span className="h-1.5 w-1.5 rounded-full shrink-0" style={{ background: badge.text }} title={badge.label} />}
        <span className="truncate text-xs font-bold text-white">{car ? carModelName(car) : cleanCarTitle(fallbackTitle || 'خودرو')}</span>
        {car?.modelYear && <span className="shrink-0 text-[10px] text-white/45 font-mono">{car.modelYear}</span>}
        {plate && (
          <span className="ms-auto shrink-0 rounded-md border border-gold/30 bg-black/40 px-1.5 py-px font-mono text-[10.5px] font-bold text-gold dir-ltr">
            {plate}
          </span>
        )}
      </span>
    );
  };

  const carPickerOptions: CompactPickerOption[] = [...cars]
    .sort((a, b) =>
      carModelName(a).localeCompare(carModelName(b), 'fa') ||
      (a.modelYear || '').localeCompare(b.modelYear || '') ||
      cleanCarPlate(a.plateNumber).localeCompare(cleanCarPlate(b.plateNumber), 'en', { numeric: true })
    )
    .map(car => ({
      value: car.id,
      content: renderCarLine(car),
      searchText: `${car.title} ${car.titleEn || ''} ${car.modelYear || ''} ${car.plateNumber}`,
    }));

  return (
    <div className="space-y-5 animate-fadeIn text-white font-sans w-full max-w-full overflow-x-hidden min-w-0" dir="rtl">

      {/* ── TOP ACTION HEADER & SUB-PAGES NAVIGATION ── */}
      <div className="bg-[#0b172a] p-3.5 sm:p-5 rounded-2xl border border-white/10 shadow-xl flex flex-col md:flex-row md:items-center md:justify-between gap-4 w-full min-w-0">
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="h-11 w-11 rounded-2xl bg-gold/15 text-gold border border-gold/30 flex items-center justify-center shadow-lg shadow-gold/10 shrink-0">
            <CarIcon size={24} />
          </div>
          <div className="min-w-0">
            <h1 className="text-base sm:text-lg font-black text-white tracking-wide truncate">مدیریت خودروها</h1>
            <p className="text-[11px] text-white/50 truncate">مدیریت ناوگان و جدول رزروها</p>
          </div>
        </div>

        {/* 4 SUB-PAGES TABS (Responsive Scrollable Pills) */}
        <div className="flex items-center bg-[#07111f] p-1.5 rounded-xl border border-white/10 gap-1.5 overflow-x-auto w-full md:w-auto max-w-full shrink-0 no-scrollbar">
          <button
            onClick={() => handleTabChange('calendar')}
            className={`flex items-center gap-2 px-3.5 py-2.5 rounded-lg text-xs font-black transition-all cursor-pointer shrink-0 ${
              activeTab === 'calendar'
                ? 'bg-gradient-to-r from-gold to-amber-500 text-black shadow-lg shadow-gold/20'
                : 'text-white/70 hover:text-white hover:bg-white/5'
            }`}
          >
            <CalendarIcon size={15} />
            <span>تقویم و رزروها</span>
          </button>

          <button
            onClick={() => handleTabChange('contracts')}
            className={`flex items-center gap-2 px-3.5 py-2.5 rounded-lg text-xs font-black transition-all cursor-pointer shrink-0 ${
              activeTab === 'contracts'
                ? 'bg-gradient-to-r from-gold to-amber-500 text-black shadow-lg shadow-gold/20'
                : 'text-white/70 hover:text-white hover:bg-white/5'
            }`}
          >
            <ClipboardList size={15} />
            <span>قراردادها & تحویل</span>
            <span className="bg-white/20 text-white px-1.5 py-0.5 rounded-full text-[10px]">{contracts.length}</span>
          </button>

          <button
            onClick={() => handleTabChange('accounting')}
            className={`flex items-center gap-2 px-3.5 py-2.5 rounded-lg text-xs font-black transition-all cursor-pointer shrink-0 ${
              activeTab === 'accounting'
                ? 'bg-gradient-to-r from-gold to-amber-500 text-black shadow-lg shadow-gold/20'
                : 'text-white/70 hover:text-white hover:bg-white/5'
            }`}
          >
            <DollarSign size={15} />
            <span>حسابداری اجاره</span>
          </button>

          <button
            onClick={() => handleTabChange('fleet')}
            className={`flex items-center gap-2 px-3.5 py-2.5 rounded-lg text-xs font-black transition-all cursor-pointer shrink-0 ${
              activeTab === 'fleet'
                ? 'bg-gradient-to-r from-gold to-amber-500 text-black shadow-lg shadow-gold/20'
                : 'text-white/70 hover:text-white hover:bg-white/5'
            }`}
          >
            <CarIcon size={15} />
            <span>ناوگان خودروها</span>
            <span className="bg-white/20 text-white px-1.5 py-0.5 rounded-full text-[10px]">{cars.length}</span>
          </button>
        </div>
      </div>


      {/* ==================================================================== */}
      {/* SUB-PAGE 1: CALENDAR & BOOKINGS GANTT MATRIX VIEW                   */}
      {/* ==================================================================== */}
      {activeTab === 'calendar' && (
        <div className="space-y-4">

          {/* CALENDAR TOOLBAR & CONTROLS */}
          <div className="bg-[#0b172a] p-4 rounded-2xl border border-white/10 shadow-lg flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-gold bg-gold/10 px-3 py-1.5 rounded-xl border border-gold/30 flex items-center gap-1.5">
                <CalendarIcon size={14} />
                <span>{calendarDateRangeLabel}</span>
              </span>

              <div className="flex items-center bg-[#07111f] rounded-xl border border-white/10 p-1 gap-1">
                <button
                  onClick={() => handleShiftCalendar(-7)}
                  className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
                  title="۱ هفته قبل"
                >
                  <ChevronRight size={16} />
                </button>
                <button
                  onClick={() => setCalendarAnchorDate(new Date())}
                  className="px-2.5 py-1 text-[11px] font-extrabold text-gold hover:bg-gold/10 rounded-lg transition-colors"
                >
                  امروز
                </button>
                <button
                  onClick={() => handleShiftCalendar(7)}
                  className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
                  title="۱ هفته بعد"
                >
                  <ChevronLeft size={16} />
                </button>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Status Legend */}
              <div className="hidden lg:flex items-center gap-3 text-[11px] font-bold text-white/70 bg-[#07111f] px-3.5 py-1.5 rounded-xl border border-white/10">
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span> آزاد</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-sm shadow-rose-500/50"></span> رزرو / اجاره</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span> سرویس</span>
              </div>

              <button
                onClick={() => handleOpenAddReservation()}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-extrabold text-xs shadow-lg shadow-emerald-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
              >
                <Plus size={16} />
                <span>ثبت رزرو جدید</span>
              </button>
            </div>
          </div>

          {/* CALENDAR TIMELINE GANTT MATRIX TABLE */}
          <div className="rounded-2xl border border-white/10 bg-[#0b172a] shadow-2xl overflow-hidden relative">
            <div className="overflow-x-auto w-full">
              <table className="w-full text-right border-collapse text-xs">
                <thead>
                  <tr className="border-b border-white/10 text-white/80 font-extrabold text-[11px] bg-[#07111f]">
                    {/* Fixed Car Column (Mobile Compact Layout) */}
                    <th className="py-2.5 px-2 sm:px-4 w-32 min-w-[125px] sm:w-56 sm:min-w-[220px] sticky right-0 bg-[#07111f] z-20 border-l border-white/10 shadow-md">
                      خودروها ({cars.length})
                    </th>

                    {/* Timeline Days Headers */}
                    {calendarDays.map(day => (
                      <th
                        key={day.dateStr}
                        className={`py-2 px-1 text-center min-w-[48px] border-l border-white/5 font-sans ${
                          day.isToday
                            ? 'bg-gold/20 text-gold font-black border-b-2 border-b-gold'
                            : day.isWeekend
                            ? 'bg-rose-500/10 text-rose-300'
                            : 'text-white/70'
                        }`}
                      >
                        <div className="text-[10px] font-sans text-white/50">{day.dayName}</div>
                        <div className="text-xs font-black mt-0.5">{day.dayNum}</div>
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody className="divide-y divide-white/5">
                  {cars.map(car => {
                    const carReservations = reservations.filter(r => r.carId === car.id && r.status !== 'cancelled');

                    return (
                      <tr key={car.id} className="hover:bg-white/[0.02] transition-colors">
                        {/* Car Name & Plate Column (Responsive Compact Layout) */}
                        <td className="py-2 px-2 sm:px-3 sticky right-0 bg-[#0b172a] z-10 border-l border-white/10 shadow-md max-w-[125px] sm:max-w-none">
                          <div className="min-w-0 flex-1 overflow-hidden">
                            <p className="font-extrabold text-white text-[11px] sm:text-xs truncate">{car.title}</p>
                            <div className="flex flex-wrap items-center gap-1 mt-0.5">
                              <span className="text-[9px] sm:text-[10px] font-mono text-gold bg-gold/10 px-1 py-0.2 rounded border border-gold/20">
                                {car.plateNumber}
                              </span>
                              <span className="inline-flex items-center gap-0.5 text-[9px] sm:text-[10px] text-emerald-400 font-bold">{car.dailyRate.toLocaleString()} <OMRIcon size="sm" /></span>
                            </div>
                          </div>
                        </td>

                        {/* Timeline Gantt Cells */}
                        {calendarDays.map(day => {
                          const activeRes = carReservations.find(r => r.startDate <= day.dateStr && r.endDate >= day.dateStr);

                          const isStart = activeRes && activeRes.startDate === day.dateStr;
                          const isEnd = activeRes && activeRes.endDate === day.dateStr;

                          return (
                            <td
                              key={day.dateStr}
                              className={`p-0 text-center border-l border-white/5 relative h-14 ${
                                day.isToday ? 'bg-gold/[0.06]' : day.isWeekend ? 'bg-rose-500/[0.04]' : ''
                              }`}
                            >
                              {activeRes ? (
                                <div
                                  onClick={() => setSelectedResDetails(activeRes)}
                                  onMouseEnter={(e) => setHoveredRes({ res: activeRes, car, x: e.clientX, y: e.clientY })}
                                  onMouseLeave={() => setHoveredRes(null)}
                                  className={`w-full h-10 my-2 flex items-center justify-center transition-all cursor-pointer relative shadow-sm ${
                                    isStart && isEnd
                                      ? 'rounded-lg mx-1 w-[calc(100%-8px)]'
                                      : isStart
                                      ? 'rounded-r-lg mr-1 w-[calc(100%-4px)]'
                                      : isEnd
                                      ? 'rounded-l-lg ml-1 w-[calc(100%-4px)]'
                                      : 'w-full'
                                  } ${
                                    activeRes.status === 'completed'
                                      ? 'bg-gradient-to-l from-emerald-600 to-emerald-500 border-y border-emerald-400/40'
                                      : 'bg-gradient-to-l from-rose-600 to-rose-500 border-y border-rose-400/40 shadow-rose-900/30'
                                  }`}
                                >
                                  {isStart && (
                                    <span className="w-2 h-2 rounded-full bg-white animate-pulse absolute right-1.5"></span>
                                  )}
                                </div>
                              ) : (
                                <button
                                  onClick={() => handleOpenAddReservation(car.id)}
                                  className="w-full h-full opacity-0 hover:opacity-100 flex items-center justify-center bg-emerald-500/10 text-emerald-400 rounded-lg text-[10px] font-bold border border-dashed border-emerald-500/30 transition-all cursor-pointer"
                                  title="افزودن رزرو جدید"
                                >
                                  +
                                </button>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* FLOATING HOVER TOOLTIP FOR GANTT BAR */}
          {hoveredRes && (
            <div
              className="fixed z-50 p-3 rounded-2xl bg-[#0f1e37] border border-gold/40 shadow-2xl text-xs space-y-1 pointer-events-none transform -translate-x-1/2 -translate-y-full mb-2 backdrop-blur-md"
              style={{ left: hoveredRes.x, top: hoveredRes.y - 10 }}
            >
              <div className="flex justify-between items-center gap-4">
                <span className="font-extrabold text-white">{hoveredRes.res.customerName}</span>
                <span className="text-gold font-bold">{hoveredRes.car.title}</span>
              </div>
              <p className="text-white/60 text-[11px]">{hoveredRes.res.customerPhone}</p>
              <div className="text-[10px] text-emerald-400 font-bold pt-1 border-t border-white/10 flex items-center gap-1">
                {hoveredRes.res.startDate} الی {hoveredRes.res.endDate} ({hoveredRes.res.totalPrice.toLocaleString()} <OMRIcon size="sm" />)
              </div>
            </div>
          )}

          {/* RESERVATION LIST CARDS SUMMARY */}
          <div className="bg-[#0b172a] p-4 rounded-2xl border border-white/10 shadow-lg space-y-3">
            <h3 className="text-sm font-black text-white flex items-center gap-2">
              <span>آخرین رزروهای فعال سیستم</span>
              <span className="text-xs font-normal text-white/40">({activeReservations.length} رزرو فعال)</span>
            </h3>

            {activeReservations.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {activeReservations.slice(0, 6).map(res => (
                  <div
                    key={res.id}
                    className="p-3.5 rounded-xl border bg-[#07111f] border-white/10 hover:border-gold/30 transition-all space-y-2"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="font-extrabold text-xs text-white block">{res.customerName}</span>
                        <span className="text-[11px] text-white/50 dir-ltr inline-block">{res.customerPhone}</span>
                      </div>
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-black border ${
                        res.status === 'active' ? 'bg-rose-500/20 text-rose-300 border-rose-500/40' :
                        res.status === 'completed' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' :
                        res.status === 'cancelled' ? 'bg-white/10 text-white/50 border-white/20' :
                        'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      }`}>
                        {res.status === 'active' ? 'در حال اجرا' : res.status === 'completed' ? 'تکمیل شده' : res.status === 'cancelled' ? 'لغو شده' : 'تایید شده'}
                      </span>
                    </div>

                    <div className="text-[11px] text-white/70 bg-black/30 p-2 rounded-lg border border-white/5 space-y-1">
                      <div className="flex justify-between">
                        <span>خودرو:</span>
                        <span className="font-bold text-gold">{res.carTitle}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>بازه زمانی:</span>
                        <span className="text-white">{res.startDate} تا {res.endDate}</span>
                      </div>
                      <div className="flex justify-between font-bold pt-1 border-t border-white/5 text-white">
                        <span>مبلغ کل اجاره:</span>
                        <span className="inline-flex items-center gap-1 text-emerald-400">{res.totalPrice.toLocaleString()} <OMRIcon size="sm" /></span>
                      </div>
                    </div>

                    <div className="flex justify-between items-center gap-2 pt-1">
                      {(() => {
                        const payBadge = getReservationPaymentBadge(res.id);
                        return payBadge ? (
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-black border ${payBadge.cls}`}>{payBadge.label}</span>
                        ) : <span />;
                      })()}
                      <button
                        onClick={() => setSelectedResDetails(res)}
                        className="text-[10px] font-extrabold text-gold hover:underline"
                      >
                        مشاهده کامل جزییات
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-white/40 text-center py-4">هیچ رزروی هنوز ثبت نشده است.</p>
            )}
          </div>

        </div>
      )}


      {/* ==================================================================== */}
      {/* SUB-PAGE 2: FLEET MANAGEMENT & CAR SPECS                            */}
      {/* ==================================================================== */}
      {activeTab === 'fleet' && (
        <div className="space-y-4">
          <div className="bg-[#0b172a] p-4 rounded-2xl border border-white/10 shadow-lg flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="relative w-full sm:w-72">
              <Search className="absolute right-3 top-2.5 h-4 w-4 text-white/40" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="جستجوی نام خودرو، پلاک..."
                className="w-full rounded-xl border border-white/15 bg-[#07111f] py-2 pr-9 pl-3 text-xs text-white outline-none focus:border-gold"
              />
            </div>

            <button
              onClick={handleOpenAddCar}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-gold to-amber-500 text-black font-black text-xs shadow-lg shadow-gold/20 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
            >
              <Plus size={16} />
              <span>افزودن خودرو جدید</span>
            </button>
          </div>

          {/* CARS GRID CARDS (COMPACT & FAST VIEW) */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {cars
              .filter(c => c.title.toLowerCase().includes(searchQuery.toLowerCase()) || c.plateNumber.includes(searchQuery) || (c.titleEn && c.titleEn.toLowerCase().includes(searchQuery.toLowerCase())))
              .map(car => {
                const badge = getCarStatusBadge(car.status);
                return (
                  <div
                    key={car.id}
                    className="rounded-2xl border border-white/10 bg-[#0b172a] shadow-lg overflow-hidden flex flex-col hover:border-gold/40 transition-all group"
                  >
                    {/* Car Image Header (Compact height h-28 sm:h-32) */}
                    <div className="h-28 sm:h-32 bg-black/60 relative overflow-hidden">
                      {car.imageUrl ? (
                        <img
                          src={car.imageUrl}
                          alt={car.title}
                          loading="lazy"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center h-full text-white/30 gap-1">
                          <CarIcon size={28} />
                          <span className="text-[10px]">بدون تصویر</span>
                        </div>
                      )}

                      {/* Status Badge Tag */}
                      <div className="absolute top-2 right-2">
                        <span
                          className="px-2 py-0.5 rounded-full text-[9px] font-black border backdrop-blur-md shadow-sm"
                          style={{ background: badge.bg, color: badge.text, borderColor: badge.border }}
                        >
                          {badge.label}
                        </span>
                      </div>

                      {/* Plate Badge */}
                      <div className="absolute bottom-2 left-2 bg-black/85 backdrop-blur-md px-1.5 py-0.5 rounded-md border border-gold/40 font-mono text-gold text-[10px] font-bold">
                        {cleanCarPlate(car.plateNumber)}
                      </div>
                    </div>

                    {/* Content (Compact Padding) */}
                    <div className="p-2.5 space-y-2 flex-1 flex flex-col justify-between">
                      <div>
                        <div className="mb-1">
                          <h3 className="text-xs font-black text-white truncate" title={car.title}>
                            {cleanCarTitle(car.title)}
                          </h3>
                          {car.titleEn && (
                            <p className="text-[9.5px] text-white/40 font-sans truncate dir-ltr text-right">{car.titleEn}</p>
                          )}
                        </div>

                        <div className="flex items-center justify-between text-[10px] text-white/60 py-1 border-y border-white/5">
                          <span>{car.transmission === 'automatic' ? 'اتومات' : 'دستی'}</span>
                          <span>{car.fuelType || 'بنزین'}</span>
                          <span>{car.modelYear}</span>
                        </div>
                      </div>

                      {/* Footer Prices & Actions */}
                      <div className="pt-1 border-t border-white/10 flex items-center justify-between">
                        <div>
                          <p className="text-[9px] text-white/40">روزانه:</p>
                          <div className="flex items-center gap-1 text-xs sm:text-sm font-extrabold text-gold">
                            {car.dailyRate.toLocaleString()} <OMRIcon size="sm" />
                          </div>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleOpenEditCar(car)}
                            className="p-1.5 rounded-lg bg-white/5 hover:bg-gold/20 text-white/80 hover:text-gold border border-white/10 transition-all cursor-pointer"
                            title="ویرایش"
                          >
                            <Edit3 size={13} />
                          </button>
                          <button
                            onClick={() => handleDeleteCar(car.id)}
                            className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition-all cursor-pointer"
                            title="حذف"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}


      {/* ==================================================================== */}
      {/* SUB-PAGE 3: CONTRACTS & CAR HANDOVER LOGS                            */}
      {/* ==================================================================== */}
      {activeTab === 'contracts' && (
        <div className="space-y-4">
          <div className="bg-[#0b172a] p-4 rounded-2xl border border-white/10 shadow-lg flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h2 className="text-base font-black text-white flex items-center gap-2">
                <ClipboardList className="text-gold" size={18} />
                <span>مدیریت قراردادها و تحویل/عودت خودرو</span>
              </h2>
              <p className="text-xs text-white/50 mt-0.5">ثبت کیلومتر اولیه، وضعیت بنزین، چک‌لیست سلامت خودرو و وضعیت ودیعه</p>
            </div>

            <button
              onClick={() => handleOpenAddHandover()}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-gold to-amber-500 text-black font-black text-xs shadow-lg shadow-gold/20 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
            >
              <Plus size={16} />
              <span>ثبت صورتجلسه تحویل جدید</span>
            </button>
          </div>

          {/* CONTRACTS TABLE */}
          <div className="rounded-2xl border border-white/10 bg-[#0b172a] shadow-xl overflow-hidden w-full">
            {/* Phones: one card per contract */}
            <div className="md:hidden divide-y divide-white/10">
              {contracts.map(cnt => (
                <div key={cnt.id} className="space-y-2.5 p-4 text-xs">
                  <div className="flex items-start justify-between gap-2">
                    <button
                      onClick={() => setWizard({ contract: cnt, startAtDone: true })}
                      className="font-mono font-bold text-gold hover:underline cursor-pointer"
                    >
                      {cnt.id}
                    </button>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${HANDOVER_STATUS_BADGES[cnt.handoverStatus].cls}`}>
                      {HANDOVER_STATUS_BADGES[cnt.handoverStatus].label}
                    </span>
                  </div>
                  <div>
                    <span className="font-bold text-white block">{cnt.carTitle}</span>
                    <span className="text-[10px] text-white/50 font-mono">{cnt.plateNumber}</span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-white">{cnt.customerName}</span>
                    <span className="text-[10px] text-white/50 dir-ltr">{cnt.customerPhone}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 rounded-xl bg-[#07111f] p-2.5 text-[11px]">
                    <div><span className="block text-white/40">کیلومتر تحویل/عودت</span><span dir="ltr" className="font-mono text-white/80 inline-block">{cnt.initialOdometer.toLocaleString()} / {cnt.returnOdometer ? cnt.returnOdometer.toLocaleString() : '—'} KM</span></div>
                    <div><span className="block text-white/40">بنزین</span><span className="font-bold text-blue-400">{FUEL_LEVEL_LABELS[cnt.fuelLevel] || cnt.fuelLevel}</span></div>
                    <div className="col-span-2"><span className="block text-white/40">ودیعه</span><span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300">{cnt.depositAmount.toLocaleString()} OMR ({DEPOSIT_STATUS_LABELS[cnt.depositStatus]})</span></div>
                  </div>
                  {cnt.checklist && (
                    <span className="block text-[10px] text-white/50">
                      چک‌لیست: {HANDOVER_CHECKLIST_ITEMS.filter(i => cnt.checklist?.[i.key]).length}/{HANDOVER_CHECKLIST_ITEMS.length} مورد سالم
                    </span>
                  )}
                  {renderContractActions(cnt)}
                </div>
              ))}
            </div>

            <div className="hidden md:block overflow-x-auto w-full">
              <table className="w-full min-w-[700px] text-right border-collapse text-xs">
                <thead>
                  <tr className="border-b border-white/10 text-gold font-extrabold text-[11px] bg-[#07111f]">
                    <th className="py-3.5 px-4">شماره قرارداد</th>
                    <th className="py-3.5 px-4">خودرو & پلاک</th>
                    <th className="py-3.5 px-4">مشتری</th>
                    <th className="py-3.5 px-4">کیلومتر تحویل/عودت</th>
                    <th className="py-3.5 px-4">بنزین</th>
                    <th className="py-3.5 px-4">وضعیت ودیعه</th>
                    <th className="py-3.5 px-4">وضعیت تحویل</th>
                    <th className="py-3.5 px-4 text-center">قرارداد</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {contracts.map(cnt => (
                    <tr key={cnt.id} className="hover:bg-white/5 transition-colors">
                      <td className="py-3.5 px-4">
                        <button
                          onClick={() => setWizard({ contract: cnt, startAtDone: true })}
                          className="font-mono font-bold text-gold hover:underline cursor-pointer"
                          title="دانلود و اشتراک‌گذاری قرارداد"
                        >
                          {cnt.id}
                        </button>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-white block">{cnt.carTitle}</span>
                        <span className="text-[10px] text-white/50 font-mono">{cnt.plateNumber}</span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-white block">{cnt.customerName}</span>
                        <span className="text-[10px] text-white/50 dir-ltr inline-block">{cnt.customerPhone}</span>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-white/80">
                        {cnt.initialOdometer.toLocaleString()} / {cnt.returnOdometer ? cnt.returnOdometer.toLocaleString() : '—'} KM
                      </td>
                      <td className="py-3.5 px-4 font-bold text-blue-400">
                        {FUEL_LEVEL_LABELS[cnt.fuelLevel] || cnt.fuelLevel}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300">
                          {cnt.depositAmount.toLocaleString()} OMR ({DEPOSIT_STATUS_LABELS[cnt.depositStatus]})
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${HANDOVER_STATUS_BADGES[cnt.handoverStatus].cls}`}>
                          {HANDOVER_STATUS_BADGES[cnt.handoverStatus].label}
                        </span>
                        {cnt.checklist && (
                          <span className="block text-[10px] text-white/50 mt-1">
                            چک‌لیست: {HANDOVER_CHECKLIST_ITEMS.filter(i => cnt.checklist?.[i.key]).length}/{HANDOVER_CHECKLIST_ITEMS.length} مورد سالم
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        {renderContractActions(cnt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}


      {/* ==================================================================== */}
      {/* SUB-PAGE 4: RENTAL FINANCIALS & ACCOUNTING (REZA AMARE & MOHAMMADI ACCOUNTS) */}
      {/* ==================================================================== */}
      {activeTab === 'accounting' && (
        <div className="space-y-5">

          {/* FINANCIAL STATS SUMMARY CARDS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
            {/* Pure Rent Income */}
            <div className="bg-[#0b172a] p-4 rounded-2xl border border-emerald-500/40 shadow-lg relative overflow-hidden">
              <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-500/10 rounded-full blur-xl"></div>
              <p className="text-[11px] font-bold text-emerald-400 mb-1">درآمد خالص اجاره خودرو</p>
              <div className="flex items-center gap-2 text-2xl font-black text-white">{accountingStats.netRentalIncome.toLocaleString()} <OMRIcon size="md" /></div>
            </div>

            {/* Deposits Held (Liabilities) */}
            <div className="bg-[#0b172a] p-4 rounded-2xl border border-amber-500/40 shadow-lg relative overflow-hidden">
              <div className="absolute top-0 right-0 w-20 h-20 bg-amber-500/10 rounded-full blur-xl"></div>
              <p className="text-[11px] font-bold text-amber-400 mb-1">ودیعه نزد شرکت (بدهی)</p>
              <div className="flex items-center gap-2 text-2xl font-black text-white">{accountingStats.totalDepositsHeld.toLocaleString()} <OMRIcon size="md" /></div>
            </div>

            {/* Bank Reza Amare */}
            <div className="bg-[#0b172a] p-4 rounded-2xl border border-blue-500/30 shadow-lg">
              <div className="flex items-center gap-1.5 text-blue-400 text-[11px] font-bold mb-1">
                <Landmark size={14} />
                <span>حساب رضا (واریزی)</span>
              </div>
              <div className="flex items-center gap-1.5 text-xl font-black text-white">{accountingStats.bankReza.toLocaleString()} <OMRIcon size="sm" /></div>
            </div>

            {/* Bank Mohammadi */}
            <div className="bg-[#0b172a] p-4 rounded-2xl border border-purple-500/30 shadow-lg">
              <div className="flex items-center gap-1.5 text-purple-400 text-[11px] font-bold mb-1">
                <Landmark size={14} />
                <span>حساب محمدی (واریزی)</span>
              </div>
              <div className="flex items-center gap-1.5 text-xl font-black text-white">{accountingStats.bankMohammadi.toLocaleString()} <OMRIcon size="sm" /></div>
            </div>

            {/* Cash Reza Amare */}
            <div className="bg-[#0b172a] p-4 rounded-2xl border border-teal-500/30 shadow-lg">
              <div className="flex items-center gap-1.5 text-teal-400 text-[11px] font-bold mb-1">
                <Wallet size={14} />
                <span>نقد به رضا اماره</span>
              </div>
              <div className="flex items-center gap-1.5 text-xl font-black text-white">{accountingStats.cashReza.toLocaleString()} <OMRIcon size="sm" /></div>
            </div>

            {/* Cash Mohammadi */}
            <div className="bg-[#0b172a] p-4 rounded-2xl border border-orange-500/30 shadow-lg">
              <div className="flex items-center gap-1.5 text-orange-400 text-[11px] font-bold mb-1">
                <Wallet size={14} />
                <span>نقد به محمدی</span>
              </div>
              <div className="flex items-center gap-1.5 text-xl font-black text-white">{accountingStats.cashMohammadi.toLocaleString()} <OMRIcon size="sm" /></div>
            </div>
          </div>

          {/* OWED / NOT YET CONFIRMED */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setPaymentFilter('pending')}
              className="bg-[#0b172a] p-4 rounded-2xl border border-rose-500/30 shadow-lg text-right hover:border-rose-400/60 transition-colors cursor-pointer"
            >
              <p className="text-[11px] font-bold text-rose-300 mb-1">مانده طلب از مشتریان (پرداخت‌نشده)</p>
              <div className="flex items-center gap-2 text-xl font-black text-white">{accountingStats.receivables.toLocaleString()} <OMRIcon size="sm" /></div>
              {accountingStats.pendingDeposits > 0 && (
                <p className="text-[10px] text-white/50 mt-1 inline-flex items-center gap-1">+ ودیعه دریافت‌نشده: {accountingStats.pendingDeposits.toLocaleString()} <OMRIcon size="sm" /></p>
              )}
            </button>
            <button
              type="button"
              onClick={() => setPaymentFilter('unconfirmed')}
              className="bg-[#0b172a] p-4 rounded-2xl border border-sky-500/30 shadow-lg text-right hover:border-sky-400/60 transition-colors cursor-pointer"
            >
              <p className="text-[11px] font-bold text-sky-300 mb-1">پرداخت‌شده، دریافت هنوز تأیید نشده ({accountingStats.unconfirmedCount} ردیف)</p>
              <div className="flex items-center gap-2 text-xl font-black text-white">{accountingStats.unconfirmedTotal.toLocaleString()} <OMRIcon size="sm" /></div>
            </button>
          </div>

          {/* TRANSACTIONS FILTER & NEW BUTTON */}
          <div className="bg-[#0b172a] p-4 rounded-2xl border border-white/10 shadow-lg flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="w-full sm:w-64">
              <FancySelect
                value={paymentFilter}
                onChange={setPaymentFilter}
                ariaLabel="فیلتر روش پرداخت"
                options={[
                  { value: 'all', label: 'همه روش‌های پرداخت', icon: <Filter size={14} className="text-white/50" /> },
                  { value: 'bank_reza', label: 'واریز به حساب رضا اماره', icon: <Landmark size={14} className="text-blue-400" /> },
                  { value: 'bank_mohammadi', label: 'واریز به حساب محمدی', icon: <Landmark size={14} className="text-purple-400" /> },
                  { value: 'cash_reza', label: 'نقد به رضا اماره', icon: <Wallet size={14} className="text-teal-400" /> },
                  { value: 'cash_mohammadi', label: 'نقد به محمدی', icon: <Wallet size={14} className="text-orange-400" /> },
                  { value: 'pending', label: 'در انتظار پرداخت مشتری', icon: <Clock size={14} className="text-amber-400" /> },
                  { value: 'unconfirmed', label: 'دریافت تأییدنشده', icon: <CheckCircle2 size={14} className="text-sky-400" /> },
                ]}
              />
            </div>

            <button
              onClick={handleOpenAddTransaction}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-extrabold text-xs shadow-lg shadow-emerald-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
            >
              <Plus size={16} />
              <span>ثبت تراکنش مالی جدید</span>
            </button>
          </div>

          {/* TRANSACTIONS TABLE */}
          <div className="rounded-2xl border border-white/10 bg-[#0b172a] shadow-xl overflow-hidden w-full">
            <div className="overflow-x-auto w-full">
              <table className="w-full min-w-[820px] text-right border-collapse text-xs">
                <thead>
                  <tr className="border-b border-white/10 text-gold font-extrabold text-[11px] bg-[#07111f]">
                    <th className="py-3 px-4">تاریخ</th>
                    <th className="py-3 px-4">شرح تراکنش</th>
                    <th className="py-3 px-4">مشتری مربوطه</th>
                    <th className="py-3 px-4">نوع تراکنش</th>
                    <th className="py-3 px-4">
                      <span className="inline-flex items-center gap-1">مبلغ <OMRIcon size="sm" /></span>
                    </th>
                    <th className="py-3 px-4">حساب / روش پرداخت</th>
                    <th className="py-3 px-4 text-center">تأیید دریافت</th>
                    <th className="py-3 px-4 text-center">رسید / پیوست</th>
                    <th className="py-3 px-4 text-center">عملیات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {transactions
                    .filter(t =>
                      paymentFilter === 'all' ? true :
                      paymentFilter === 'pending' ? t.paymentStatus === 'pending' :
                      paymentFilter === 'unconfirmed' ? t.paymentStatus === 'paid' && INCOMING_TRANSACTION_TYPES.includes(t.type) && !t.receivedAt :
                      t.paymentMethod === paymentFilter
                    )
                    .map(tx => {
                      const badge = getPaymentBadge(tx.paymentMethod);
                      const isNegative = tx.type === 'deposit_refund' || tx.type === 'maintenance_expense';
                      const isPending = tx.paymentStatus === 'pending';

                      return (
                        <tr key={tx.id} className={`hover:bg-white/5 transition-colors ${isPending ? 'opacity-80' : ''}`}>
                          <td className="py-3 px-4 text-white/70">{tx.transactionDate}</td>
                          <td className="py-3 px-4 font-bold text-white">{tx.description}</td>
                          <td className="py-3 px-4 text-white/80">{tx.customerName || '-'}</td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              tx.type === 'rent_fee' ? 'bg-emerald-500/20 text-emerald-300' :
                              tx.type === 'deposit_in' ? 'bg-blue-500/20 text-blue-300' :
                              tx.type === 'deposit_refund' ? 'bg-rose-500/20 text-rose-300' :
                              tx.type === 'other_income' ? 'bg-teal-500/20 text-teal-300' :
                              'bg-amber-500/20 text-amber-300'
                            }`}>
                              {TX_TYPE_LABELS[tx.type] || tx.type}
                            </span>
                          </td>
                          <td className={`py-3 px-4 font-extrabold text-sm ${isPending ? 'text-white/50' : isNegative ? 'text-rose-400' : 'text-emerald-400'}`}>
                            <span className="inline-flex items-center gap-1">
                              {isPending ? '' : isNegative ? '-' : '+'}{tx.amount.toLocaleString()} <OMRIcon size="sm" />
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span
                                className="px-2.5 py-0.5 rounded-full text-[10px] font-black border inline-block"
                                style={{ background: badge.bg, color: badge.text, borderColor: badge.border }}
                              >
                                {badge.label}
                              </span>
                              {isPending && (
                                <button
                                  onClick={() => handleOpenRecordPayment(tx)}
                                  className="px-2 py-0.5 rounded-lg bg-emerald-500/15 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold hover:bg-emerald-500/25"
                                >
                                  ثبت پرداخت
                                </button>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-4 text-center">
                            {isPending || !INCOMING_TRANSACTION_TYPES.includes(tx.type) ? (
                              <span className="text-white/30 text-[10px]">-</span>
                            ) : tx.receivedAt ? (
                              <div className="inline-flex flex-col items-center gap-0.5">
                                <span className="inline-flex items-center gap-1 text-emerald-300 text-[10px] font-bold">
                                  <CheckCircle2 size={12} />
                                  <span>دریافت شد</span>
                                </span>
                                <span className="text-white/45 text-[9.5px]">
                                  {tx.receivedBy ? `${tx.receivedBy} · ` : ''}{formatDateTime(tx.receivedAt)}
                                </span>
                                <button
                                  onClick={() => handleSetReceived(tx, false)}
                                  disabled={receivingTxId === tx.id}
                                  className="text-white/35 hover:text-rose-300 text-[9.5px] underline disabled:opacity-50"
                                >
                                  لغو تأیید
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => handleSetReceived(tx, true)}
                                disabled={receivingTxId === tx.id}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-sky-500/15 text-sky-300 border border-sky-500/40 text-[10px] font-bold hover:bg-sky-500/25 disabled:opacity-50"
                              >
                                {receivingTxId === tx.id ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                                <span>تأیید دریافت</span>
                              </button>
                            )}
                          </td>
                          <td className="py-3 px-4 text-center">
                            {tx.receiptFileUrl ? (
                              <a
                                href={tx.receiptFileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-gold/15 text-gold border border-gold/30 hover:underline text-[10px] font-bold"
                              >
                                <FileText size={12} />
                                <span>دانلود رسید</span>
                              </a>
                            ) : (
                              <span className="text-white/30 text-[10px]">-</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <button
                              onClick={() => handleDeleteTransaction(tx.id)}
                              className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-500/10 transition-colors"
                              title="حذف"
                            >
                              <Trash2 size={14} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}


      {/* ==================================================================== */}
      {/* MODAL 1: ADD / EDIT CAR                                              */}
      {/* ==================================================================== */}
      <AnimatePresence>
        {isCarModalOpen && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md" dir="rtl">
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 30, scale: 0.98 }}
              className="w-full max-w-xl rounded-t-3xl sm:rounded-3xl border border-white/15 bg-[#0b172a] p-4 sm:p-6 shadow-2xl space-y-4 max-h-[92vh] sm:max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center border-b border-white/10 pb-3">
                <h3 className="text-sm sm:text-base font-black text-white flex items-center gap-2">
                  <CarIcon className="text-gold" size={18} />
                  <span>{editingCar ? 'ویرایش اطلاعات خودرو' : 'تعریف خودرو جدید'}</span>
                </h3>
                <button onClick={() => setIsCarModalOpen(false)} disabled={savingCar} className="p-1 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"><X size={18} /></button>
              </div>

              <form onSubmit={handleSaveCar} className="space-y-3.5 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-white/80 font-bold mb-1">نام خودرو (فارسی) *</label>
                    <input
                      type="text"
                      required
                      value={carForm.title || ''}
                      onChange={e => setCarForm({ ...carForm, title: e.target.value })}
                      placeholder="مثال: نیسان سانی 2024"
                      className="w-full rounded-xl border border-white/15 bg-[#07111f] p-3 sm:p-2.5 text-sm sm:text-xs text-white outline-none focus:border-gold"
                    />
                  </div>

                  <div>
                    <label className="block text-white/80 font-bold mb-1">نام خودرو (انگلیسی)</label>
                    <input
                      type="text"
                      value={carForm.titleEn || ''}
                      onChange={e => setCarForm({ ...carForm, titleEn: e.target.value })}
                      placeholder="مثال: Nissan Sunny 2024"
                      className="w-full rounded-xl border border-white/15 bg-[#07111f] p-3 sm:p-2.5 text-sm sm:text-xs text-white outline-none focus:border-gold font-sans dir-ltr text-left"
                    />
                  </div>

                  <div>
                    <label className="block text-white/80 font-bold mb-1">شماره پلاک خودرو *</label>
                    <input
                      type="text"
                      required
                      value={carForm.plateNumber || ''}
                      onChange={e => setCarForm({ ...carForm, plateNumber: normalizeDigits(e.target.value) })}
                      placeholder="مثال: 12301"
                      className="w-full rounded-xl border border-white/15 bg-[#07111f] p-3 sm:p-2.5 text-sm sm:text-xs text-white outline-none focus:border-gold font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-white/80 font-bold mb-1 flex items-center gap-1">
                      نرخ روزانه <OMRIcon size="sm" /> *
                    </label>
                    <NumericInput
                      required
                      value={carForm.dailyRate}
                      onValueChange={v => setCarForm({ ...carForm, dailyRate: v })}
                      className="w-full rounded-xl border border-white/15 bg-[#07111f] p-3 sm:p-2.5 text-sm sm:text-xs text-white outline-none focus:border-gold font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-white/80 font-bold mb-1 flex items-center gap-1">
                      مبلغ ودیعه <OMRIcon size="sm" />
                    </label>
                    <NumericInput
                      value={carForm.depositAmount}
                      onValueChange={v => setCarForm({ ...carForm, depositAmount: v })}
                      className="w-full rounded-xl border border-white/15 bg-[#07111f] p-3 sm:p-2.5 text-sm sm:text-xs text-white outline-none focus:border-gold"
                    />
                  </div>

                  <div>
                    <label className="block text-white/80 font-bold mb-1">گیربکس</label>
                    <FancySelect<Car['transmission']>
                      value={carForm.transmission || 'automatic'}
                      onChange={v => setCarForm({ ...carForm, transmission: v })}
                      options={[
                        { value: 'automatic', label: 'اتوماتیک' },
                        { value: 'manual', label: 'دستی' },
                      ]}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-white/80 font-bold mb-1">برند سازنده</label>
                    <input
                      type="text"
                      value={carForm.brand || ''}
                      onChange={e => setCarForm({ ...carForm, brand: e.target.value })}
                      placeholder="Nissan / Dodge"
                      className="w-full rounded-xl border border-white/15 bg-[#07111f] p-3 sm:p-2.5 text-sm sm:text-xs text-white outline-none focus:border-gold"
                    />
                  </div>

                  <div>
                    <label className="block text-white/80 font-bold mb-1">سال ساخت</label>
                    <input
                      type="tel"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={4}
                      value={carForm.modelYear || ''}
                      onChange={e => setCarForm({ ...carForm, modelYear: normalizeDigits(e.target.value).replace(/\D/g, '').slice(0, 4) })}
                      placeholder="2023"
                      className="w-full rounded-xl border border-white/15 bg-[#07111f] p-3 sm:p-2.5 text-sm sm:text-xs text-white outline-none focus:border-gold"
                    />
                  </div>

                  <div>
                    <label className="block text-white/80 font-bold mb-1">وضعیت خودرو</label>
                    <FancySelect<Car['status']>
                      value={carForm.status || 'available'}
                      onChange={v => setCarForm({ ...carForm, status: v })}
                      options={[
                        { value: 'available', label: 'آماده رزرو', icon: <span className="block h-2 w-2 rounded-full bg-emerald-400" /> },
                        { value: 'rented', label: 'در حال اجاره', icon: <span className="block h-2 w-2 rounded-full bg-rose-400" /> },
                        { value: 'maintenance', label: 'در حال سرویس', icon: <span className="block h-2 w-2 rounded-full bg-amber-400" /> },
                        { value: 'disabled', label: 'غیرفعال', icon: <span className="block h-2 w-2 rounded-full bg-gray-400" /> },
                      ]}
                    />
                  </div>
                </div>

                {/* Car Photo Upload */}
                <div>
                  <label className="block text-white/80 font-bold mb-1">عکس خودرو</label>
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    <input
                      type="text"
                      value={carForm.imageUrl || ''}
                      onChange={e => setCarForm({ ...carForm, imageUrl: e.target.value })}
                      placeholder="آدرس URL یا انتخاب تصویر..."
                      className="flex-1 rounded-xl border border-white/15 bg-[#07111f] p-3 sm:p-2.5 text-sm sm:text-xs text-white outline-none focus:border-gold"
                    />
                    <label className="cursor-pointer bg-white/10 hover:bg-white/20 text-white px-4 py-3 sm:py-2.5 rounded-xl border border-white/15 flex items-center justify-center gap-1.5 font-bold shrink-0">
                      <Upload size={14} />
                      <span>{uploadingCarImg ? 'در حال آپلود...' : 'انتخاب عکس'}</span>
                      <input type="file" accept="image/*" onChange={handleUploadCarImg} className="hidden" />
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-white/80 font-bold mb-1">توضیحات تکمیلی</label>
                  <textarea
                    rows={2}
                    value={carForm.notes || ''}
                    onChange={e => setCarForm({ ...carForm, notes: e.target.value })}
                    className="w-full rounded-xl border border-white/15 bg-[#07111f] p-3 sm:p-2.5 text-sm sm:text-xs text-white outline-none focus:border-gold"
                  />
                </div>

                <div className="pt-3 border-t border-white/10 flex flex-col-reverse sm:flex-row justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsCarModalOpen(false)}
                    disabled={savingCar}
                    className="w-full sm:w-auto px-4 py-3 sm:py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    انصراف
                  </button>
                  <button
                    type="submit"
                    disabled={savingCar}
                    className="w-full sm:w-auto px-5 py-3 sm:py-2.5 rounded-xl bg-gradient-to-r from-gold to-amber-500 text-black font-black shadow-lg shadow-gold/20 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
                  >
                    {savingCar ? (<><Loader2 size={16} className="animate-spin" /><span>در حال ذخیره...</span></>) : 'ذخیره اطلاعات خودرو'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>


      {/* ==================================================================== */}
      {/* MODAL 2: NEW RESERVATION WITH SLEEK COMPACT LAYOUT                   */}
      {/* ==================================================================== */}
      <AnimatePresence>
        {isReservationModalOpen && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md" dir="rtl">
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 30, scale: 0.98 }}
              className="w-full max-w-xl rounded-t-3xl sm:rounded-2xl border border-white/15 bg-[#0b172a] p-4 sm:p-5 shadow-2xl space-y-4 max-h-[92vh] sm:max-h-[90vh] overflow-y-auto text-xs"
            >
              {/* Header */}
              <div className="flex justify-between items-center pb-1">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shrink-0">
                    <CalendarIcon size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-white">ثبت رزرو جدید خودرو</h3>
                    <p className="text-[10.5px] text-white/50">مشخصات اجاره، مشتری و جزییات مالی</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsReservationModalOpen(false)}
                  disabled={savingRes}
                  className="disabled:opacity-40 disabled:cursor-not-allowed flex h-7 w-7 items-center justify-center rounded-lg bg-white/5 text-white/50 hover:bg-white/10 hover:text-white transition-all cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleSaveReservation} className="space-y-3.5">
                {/* 1. SELECT CAR */}
                <div className="space-y-1.5">
                  <label className="block text-white/90 font-bold text-[11px] flex items-center gap-1.5">
                    <CarIcon size={14} className="text-gold" />
                    <span>خودرو *</span>
                  </label>
                  <CompactPicker
                    value={resForm.carId || ''}
                    onChange={carId => updateResFormPricing({ carId })}
                    options={carPickerOptions}
                    placeholder="انتخاب خودرو"
                    searchPlaceholder="مدل یا پلاک..."
                    emptyText="خودرویی یافت نشد"
                  />
                </div>

                {/* 2. CUSTOMER SELECTION */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-white/90 font-bold text-[11px] flex items-center gap-1.5">
                      <UserCheck size={14} className="text-emerald-400" />
                      <span>اطلاعات مشتری *</span>
                    </label>

                    <div className="flex bg-[#07111f] p-0.5 rounded-lg border border-white/10 gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          setCustomerSelectMode('existing');
                          if (selectedClient) {
                            setResForm(prev => ({ ...prev, customerName: selectedClient.name, customerPhone: selectedClient.phone }));
                          }
                        }}
                        className={`px-2.5 py-1 sm:py-0.5 rounded text-[10.5px] sm:text-[10px] font-bold transition-all cursor-pointer ${
                          customerSelectMode === 'existing' ? 'bg-gold text-black' : 'text-white/50 hover:text-white'
                        }`}
                      >
                        مشتریان CRM
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setCustomerSelectMode('new');
                          setSelectedClient(null);
                          setResForm(prev => ({ ...prev, customerName: '', customerPhone: '' }));
                        }}
                        className={`px-2.5 py-1 sm:py-0.5 rounded text-[10.5px] sm:text-[10px] font-bold transition-all cursor-pointer ${
                          customerSelectMode === 'new' ? 'bg-emerald-500 text-white' : 'text-white/50 hover:text-white'
                        }`}
                      >
                        + جدید
                      </button>
                    </div>
                  </div>

                  {customerSelectMode === 'existing' ? (
                    <div>
                      {selectedClient ? (
                        <div className="flex items-center justify-between bg-emerald-500/10 border border-emerald-500/30 p-2.5 rounded-xl">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white text-xs">{selectedClient.name}</span>
                            <span className="text-gold font-mono text-[11px] dir-ltr">({selectedClient.phone})</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedClient(null);
                              setResForm(prev => ({ ...prev, customerName: '', customerPhone: '' }));
                            }}
                            className="text-[10px] text-white/60 hover:text-white underline cursor-pointer"
                          >
                            تغییر
                          </button>
                        </div>
                      ) : (
                        <div className="relative">
                          <input
                            type="text"
                            value={clientSearchQuery}
                            onChange={e => {
                              setClientSearchQuery(e.target.value);
                              setShowClientDropdown(true);
                            }}
                            onFocus={() => setShowClientDropdown(true)}
                            placeholder="جستجوی نام یا شماره تلفن مشتری..."
                            className="w-full rounded-xl border border-white/15 bg-[#07111f] p-3 sm:p-2 text-sm sm:text-xs text-white placeholder-white/30 outline-none focus:border-gold"
                          />

                          {showClientDropdown && (
                            <div className="absolute right-0 left-0 top-full mt-1 bg-[#0f1e37] border border-gold/40 rounded-xl shadow-2xl z-30 max-h-48 overflow-y-auto divide-y divide-white/5">
                              {allClients
                                .filter(c => 
                                  !clientSearchQuery || 
                                  c.name.toLowerCase().includes(clientSearchQuery.toLowerCase()) || 
                                  c.phone.includes(clientSearchQuery)
                                )
                                .map((client, idx) => (
                                  <div
                                    key={idx}
                                    onClick={() => {
                                      setSelectedClient(client);
                                      setResForm(prev => ({ ...prev, customerName: client.name, customerPhone: client.phone }));
                                      setShowClientDropdown(false);
                                    }}
                                    className="p-2.5 hover:bg-gold/15 cursor-pointer flex justify-between items-center text-[11px]"
                                  >
                                    <span className="font-bold text-white">{client.name}</span>
                                    <span className="font-mono text-gold dir-ltr">{client.phone}</span>
                                  </div>
                                ))}
                              {allClients.filter(c => 
                                !clientSearchQuery || 
                                c.name.toLowerCase().includes(clientSearchQuery.toLowerCase()) || 
                                c.phone.includes(clientSearchQuery)
                              ).length === 0 && (
                                <div className="p-3 text-center text-white/50 text-[11px]">
                                  مشتری یافت نشد.{' '}
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setCustomerSelectMode('new');
                                      setShowClientDropdown(false);
                                    }}
                                    className="text-gold underline font-bold"
                                  >
                                    ثبت مشتری جدید
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <input
                        type="text"
                        required
                        value={resForm.customerName || ''}
                        onChange={e => setResForm(prev => ({ ...prev, customerName: e.target.value }))}
                        placeholder="نام و نام خانوادگی *"
                        className="w-full rounded-xl border border-white/15 bg-[#07111f] p-3 sm:p-2 text-sm sm:text-xs text-white outline-none focus:border-gold"
                      />
                      <input
                        type="text"
                        inputMode="tel"
                        required
                        value={resForm.customerPhone || ''}
                        onChange={e => setResForm(prev => ({ ...prev, customerPhone: normalizeDigits(e.target.value) }))}
                        placeholder="شماره تماس (+968 91234567) *"
                        className="w-full rounded-xl border border-white/15 bg-[#07111f] p-3 sm:p-2 text-sm sm:text-xs text-white outline-none focus:border-gold dir-ltr"
                      />
                    </div>
                  )}
                </div>

                {/* 3. DATES & DAILY RATE (GRID 3 COLUMNS) */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div>
                    <label className="block text-white/80 font-bold text-[11px] mb-1">تاریخ تحویل *</label>
                    <input
                      type="date"
                      required
                      value={resForm.startDate || ''}
                      onChange={e => updateResFormPricing({ startDate: e.target.value })}
                      className="w-full rounded-xl border border-white/15 bg-[#07111f] p-3 sm:p-2 text-sm sm:text-xs text-white outline-none focus:border-gold"
                    />
                  </div>

                  <div>
                    <label className="block text-white/80 font-bold text-[11px] mb-1">تاریخ عودت *</label>
                    <input
                      type="date"
                      required
                      value={resForm.endDate || ''}
                      onChange={e => updateResFormPricing({ endDate: e.target.value })}
                      className="w-full rounded-xl border border-white/15 bg-[#07111f] p-3 sm:p-2 text-sm sm:text-xs text-white outline-none focus:border-gold"
                    />
                  </div>

                  <div>
                    <label className="block text-white/80 font-bold text-[11px] mb-1">نرخ روزانه (OMR) *</label>
                    <NumericInput
                      required
                      value={resForm.customDailyRate}
                      onValueChange={v => updateResFormPricing({ customDailyRate: v })}
                      className="w-full rounded-xl border border-gold/40 bg-[#07111f] p-3 sm:p-2 text-sm sm:text-xs text-gold font-bold outline-none focus:border-gold"
                    />
                  </div>
                </div>

                {/* 4. DISCOUNT & DEPOSIT */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-white/80 font-bold text-[11px]">تخفیف اجاره:</label>
                      <div className="flex bg-black/40 p-0.5 rounded border border-white/10">
                        <button
                          type="button"
                          onClick={() => updateResFormPricing({ discountType: 'amount' })}
                          className={`px-2 py-0.5 rounded text-[10px] sm:text-[9.5px] font-bold ${resForm.discountType === 'amount' ? 'bg-gold text-black' : 'text-white/50'}`}
                        >
                          مبلغی
                        </button>
                        <button
                          type="button"
                          onClick={() => updateResFormPricing({ discountType: 'percent' })}
                          className={`px-2 py-0.5 rounded text-[10px] sm:text-[9.5px] font-bold ${resForm.discountType === 'percent' ? 'bg-gold text-black' : 'text-white/50'}`}
                        >
                          درصدی
                        </button>
                      </div>
                    </div>
                    <NumericInput
                      value={resForm.discountValue}
                      onValueChange={v => updateResFormPricing({ discountValue: v })}
                      placeholder="0"
                      className="w-full rounded-xl border border-white/15 bg-[#07111f] p-3 sm:p-2 text-sm sm:text-xs text-white outline-none focus:border-gold"
                    />
                  </div>

                  <div>
                    <label className="block text-white/80 font-bold text-[11px] mb-1">مبلغ ودیعه (پیش‌فرض: ۰ OMR)</label>
                    <NumericInput
                      value={resForm.depositPaid}
                      onValueChange={v => updateResFormPricing({ depositPaid: v })}
                      placeholder="0"
                      className="w-full rounded-xl border border-white/15 bg-[#07111f] p-3 sm:p-2 text-sm sm:text-xs text-emerald-400 font-bold outline-none focus:border-emerald-400"
                    />
                  </div>
                </div>

                {/* 4.5 OPTIONAL NOTES */}
                <div>
                  <label className="block text-white/80 font-bold text-[11px] mb-1">یادداشت / توضیحات رزرو (اختیاری)</label>
                  <textarea
                    rows={2}
                    value={resForm.notes || ''}
                    onChange={e => setResForm({ ...resForm, notes: e.target.value })}
                    placeholder="توضیحات تکمیلی، مکان تحویل یا نکات ویژه مشتری..."
                    className="w-full rounded-xl border border-white/15 bg-[#07111f] p-2.5 text-xs text-white outline-none focus:border-gold resize-none"
                  />
                </div>

                {/* 5. SUMMARY ROW */}
                {(() => {
                  const pricing = calculatePricing(
                    resForm.carId,
                    resForm.startDate,
                    resForm.endDate,
                    resForm.customDailyRate,
                    resForm.discountType,
                    resForm.discountValue
                  );

                  return (
                    <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1.5">
                      <div className="text-white/80 text-[11px]">
                        <span>مدت اجاره: <strong className="text-white">{pricing.days} روز</strong></span>
                        {pricing.discountAmount > 0 && <span className="mr-3 text-amber-400">(تخفیف: {pricing.discountAmount} OMR)</span>}
                      </div>
                      <div className="flex items-center gap-1 text-sm font-black text-emerald-400">
                        <span>مبلغ کل:</span>
                        <span className="text-base">{pricing.finalTotal.toLocaleString()}</span>
                        <OMRIcon size="sm" />
                      </div>
                    </div>
                  );
                })()}

                {/* Actions */}
                <div className="pt-2 flex flex-col-reverse sm:flex-row justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsReservationModalOpen(false)}
                    disabled={savingRes}
                    className="w-full sm:w-auto px-4 py-3 sm:py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    انصراف
                  </button>
                  <button
                    type="submit"
                    disabled={savingRes}
                    className="w-full sm:w-auto px-5 py-3 sm:py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:brightness-110 text-white font-extrabold shadow-lg shadow-emerald-500/20 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
                  >
                    {savingRes ? (<><Loader2 size={16} className="animate-spin" /><span>در حال ثبت رزرو...</span></>) : 'ثبت رزرو'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>


      {/* ==================================================================== */}
      {/* MODAL 3: RESERVATION DETAILS & ACTIONS                               */}
      {/* ==================================================================== */}
      {returnRes && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md" dir="rtl">
          <div className="w-full max-w-md rounded-3xl border border-white/15 bg-[#0b172a] p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-white/10 pb-3">
              <h3 className="text-base font-black text-white">ثبت عودت — {returnRes.customerName}</h3>
              <button onClick={() => setReturnModalResId(null)} className="text-white/40 hover:text-white"><X size={18} /></button>
            </div>
            <div className="text-[11px] text-white/50">{cleanCarTitle(returnRes.carTitle || '')} · {returnRes.startDate} الی {returnRes.endDate}</div>
              {/* RETURN MEDIA: kept on the reservation file, not printed in the contract; the customer signs to confirm */}
            {(() => {
                const cur = returnRes;
                const media = cur.returnPhotos || [];
                const sig = cur.returnSignature;
                const nVideos = media.filter(m => m.kind === 'car_video').length;
                return (
                  <div className="space-y-2 text-xs bg-[#07111f] p-4 rounded-2xl border border-white/10">
                    <div className="flex justify-between items-center">
                      <span className="font-black text-white">تصاویر و ویدیوهای عودت خودرو</span>
                      <span className="text-[10px] text-white/40">{media.length - nVideos} تصویر · {nVideos} ویدیو</span>
                    </div>
                    <p className="text-[10.5px] leading-5 text-white/45">این فایل‌ها فقط در پرونده رزرو نگهداری می‌شوند و در قرارداد نمی‌آیند.</p>
                    {media.length > 0 && (
                      <div className="grid grid-cols-3 gap-2">
                        {media.map((m, i) => {
                          const video = m.kind === 'car_video';
                          const thumb = video ? m.posterUrl : m.url;
                          return (
                            <div key={`${i}-${m.path || m.url}`} className="relative aspect-square overflow-hidden rounded-xl border border-white/10 bg-black/40">
                              <a href={m.url} target="_blank" rel="noreferrer" className="flex h-full w-full items-center justify-center text-white/50">
                                {thumb ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img src={thumb} alt="" className="h-full w-full object-cover" />
                                ) : <span className="text-[10px]">ویدیو</span>}
                              </a>
                              {video && <span className="absolute bottom-1 left-1 rounded-md bg-black/70 px-1.5 py-0.5 text-[9px] font-bold text-white">ویدیو</span>}
                              {!sig && <button
                                type="button"
                                onClick={() => handleRemoveReturnMedia(returnRes, i)}
                                className="absolute top-1 right-1 flex h-7 w-7 items-center justify-center rounded-lg bg-black/70 text-rose-300 hover:bg-rose-600 hover:text-white"
                                title="حذف"
                              >
                                <Trash2 size={13} />
                              </button>}
                            </div>
                          );
                        })}
                      </div>
                    )}
                    {!sig && <label className={`flex items-center justify-center gap-2 rounded-xl border border-dashed border-gold/40 bg-gold/10 px-3 py-2.5 text-[11px] font-bold text-gold cursor-pointer hover:bg-gold/20 ${uploadingReturnPhotos > 0 ? 'opacity-60 pointer-events-none' : ''}`}>
                      {uploadingReturnPhotos > 0 ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                      <span>{uploadingReturnPhotos > 0 ? 'در حال آپلود (برای ویدیو صبر کنید)...' : 'افزودن تصویر یا ویدیوی عودت'}</span>
                      <input
                        type="file"
                        accept="image/*,video/*"
                        multiple
                        className="hidden"
                        onChange={e => {
                          const input = e.currentTarget;
                          handleAddReturnMedia(returnRes, input.files).finally(() => { input.value = ''; });
                        }}
                      />
                    </label>}

                    {media.length > 0 && (
                      sig ? (
                        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 space-y-2">
                          <div className="text-[11px] font-black text-emerald-300">
                            ✓ مشتری صحت این فایل‌ها را امضا کرد؛ دیگر قابل تغییر یا حذف نیستند
                            <bdi dir="ltr" className="block text-[10px] font-normal text-emerald-200/70">{new Date(sig.signedAt).toLocaleString('en-GB', { dateStyle: 'short', timeStyle: 'short' })}</bdi>
                          </div>
                          {sig.url && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={sig.url} alt="امضای مشتری" className="h-20 rounded-lg bg-white p-1" />
                          )}
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setReturnSignOpen(true)}
                          disabled={uploadingReturnPhotos > 0}
                          className="w-full rounded-xl bg-emerald-500/15 border border-emerald-500/40 px-3 py-2.5 text-[11px] font-bold text-emerald-300 hover:bg-emerald-500/25 disabled:opacity-40"
                        >
                          امضای مشتری برای تأیید صحت تصاویر و ویدیوها (پس از امضا قابل تغییر نیست)
                        </button>
                      )
                    )}
                  </div>
                );
              })()}

            <div className="flex justify-end pt-1">
              <button onClick={() => setReturnModalResId(null)} className="px-4 py-2 rounded-xl bg-white/10 text-white text-xs font-bold">بستن</button>
            </div>
          </div>
        </div>
      )}
      {returnSignOpen && returnRes && (
        <SignaturePadModal
          title={`تأیید صحت تصاویر و ویدیوهای عودت — ${returnRes.customerName}`}
          description="با امضای زیر، مشتری تأیید می‌کند که تصاویر و ویدیوهای ثبت‌شده هنگام عودت خودرو صحیح است."
          busy={signingReturn}
          onCancel={() => setReturnSignOpen(false)}
          onSave={png => handleSignReturn(returnRes, png)}
        />
      )}
      <AnimatePresence>
        {selectedResDetails && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md" dir="rtl">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md rounded-3xl border border-white/15 bg-[#0b172a] p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center border-b border-white/10 pb-3">
                <h3 className="text-base font-black text-white">اطلاعات رزرو {selectedResDetails.customerName}</h3>
                <button onClick={() => setSelectedResDetails(null)} className="text-white/40 hover:text-white"><X size={18} /></button>
              </div>

              <div className="space-y-2.5 text-xs text-white/80 bg-[#07111f] p-4 rounded-2xl border border-white/10">
                <div className="flex justify-between">
                  <span className="text-white/50">نام مشتری:</span>
                  <span className="font-extrabold text-white">{selectedResDetails.customerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/50">تلفن همراه:</span>
                  <span className="text-gold dir-ltr">{selectedResDetails.customerPhone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/50">خودرو:</span>
                  <span className="font-bold text-white">{selectedResDetails.carTitle}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/50">تاریخ تحویل تا عودت:</span>
                  <span className="text-white">{selectedResDetails.startDate} الی {selectedResDetails.endDate}</span>
                </div>
                <div className="flex justify-between font-bold text-sm text-emerald-400 pt-2 border-t border-white/10">
                  <span>مبلغ کل:</span>
                  <span className="inline-flex items-center gap-1">
                    {selectedResDetails.totalPrice.toLocaleString()} <OMRIcon size="sm" />
                  </span>
                </div>
              </div>

              {/* PAYMENTS: what the customer still owes, and what was paid to whom */}
              {(() => {
                const pay = reservationPayments.get(selectedResDetails.id);
                if (!pay) return null;
                const payBadge = getReservationPaymentBadge(selectedResDetails.id);
                return (
                  <div className="space-y-2 text-xs bg-[#07111f] p-4 rounded-2xl border border-white/10">
                    <div className="flex justify-between items-center">
                      <span className="font-black text-white">وضعیت پرداخت</span>
                      {payBadge && <span className={`px-2 py-0.5 rounded-md text-[10px] font-black border ${payBadge.cls}`}>{payBadge.label}</span>}
                    </div>
                    <div className="flex justify-between text-white/70">
                      <span>پرداخت‌شده:</span>
                      <span className="inline-flex items-center gap-1 font-bold text-emerald-400">{pay.paid.toLocaleString()} <OMRIcon size="sm" /></span>
                    </div>
                    <div className="flex justify-between text-white/70">
                      <span>مانده:</span>
                      <span className={`inline-flex items-center gap-1 font-bold ${pay.owed > 0 ? 'text-rose-300' : 'text-white/50'}`}>{pay.owed.toLocaleString()} <OMRIcon size="sm" /></span>
                    </div>

                    {pay.pendingRows.map(tx => (
                      <div key={tx.id} className="flex justify-between items-center gap-2 pt-2 border-t border-white/5">
                        <span className="text-white/80">
                          {TX_TYPE_LABELS[tx.type]}: <span className="font-bold text-white inline-flex items-center gap-1">{tx.amount.toLocaleString()} <OMRIcon size="sm" /></span>
                        </span>
                        <button
                          onClick={() => handleOpenRecordPayment(tx)}
                          className="px-3 py-1.5 rounded-lg bg-emerald-500/15 text-emerald-300 border border-emerald-500/40 text-[11px] font-bold hover:bg-emerald-500/25 inline-flex items-center gap-1"
                        >
                          <Wallet size={13} />
                          <span>ثبت پرداخت</span>
                        </button>
                      </div>
                    ))}

                    {pay.paidRows.map(tx => (
                      <div key={tx.id} className="flex justify-between items-center gap-2 pt-2 border-t border-white/5 text-[11px]">
                        <span className="text-white/70">
                          {TX_TYPE_LABELS[tx.type]} · {tx.transactionDate}
                          <span className="block text-white/45">{getPaymentBadge(tx.paymentMethod).label}</span>
                        </span>
                        <span className="text-left">
                          <span className="font-bold text-emerald-400 inline-flex items-center gap-1">{tx.amount.toLocaleString()} <OMRIcon size="sm" /></span>
                          <span className={`block text-[10px] ${tx.receivedAt ? 'text-emerald-300' : 'text-sky-300'}`}>
                            {tx.receivedAt ? `✓ دریافت تأیید شد${tx.receivedBy ? ` (${tx.receivedBy})` : ''}` : 'دریافت هنوز تأیید نشده'}
                          </span>
                        </span>
                      </div>
                    ))}
                  </div>
                );
              })()}

              {/* Return photos/videos are managed from the contracts tab; here they are only summarised */}
              {(() => {
                const cur = reservations.find(r => r.id === selectedResDetails.id) ?? selectedResDetails;
                const media = cur.returnPhotos || [];
                if (!media.length && !cur.returnSignature) return null;
                const nVideos = media.filter(m => m.kind === 'car_video').length;
                return (
                  <div className="flex items-center justify-between gap-2 text-xs bg-[#07111f] p-3 rounded-2xl border border-white/10">
                    <span className="text-white/70">تصاویر عودت: {media.length - nVideos} تصویر · {nVideos} ویدیو</span>
                    <span className={cur.returnSignature ? 'font-bold text-emerald-300' : 'text-white/40'}>{cur.returnSignature ? '✓ امضا شده' : 'بدون امضا'}</span>
                  </div>
                );
              })()}

              {handedOverContractForDetails && (
                <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-[11px] leading-6 text-amber-200 space-y-1">
                  <p>
                    خودرو برای این رزرو تحویل شده است (قرارداد <span className="font-mono font-bold">{handedOverContractForDetails.id}</span>)؛ تا وقتی قرارداد باقی است، رزرو قابل لغو یا حذف نیست. به ترتیب:
                  </p>
                  <p>۱. حذف قرارداد {handedOverContractForDetails.id} در تب «قراردادها و تحویل»{!canDeleteContracts && ' (توسط مدیر کل)'}؛ اسناد مالی آن هم خودکار حذف می‌شوند.</p>
                  <p>۲. سپس لغو یا حذف همین رزرو</p>
                </div>
              )}

              <div className="flex justify-between items-center gap-2 pt-2">
                <div className="flex gap-2">
                  {!handedOverContractForDetails && selectedResDetails.status !== 'cancelled' && (
                    <button
                      onClick={() => handleCancelReservation(selectedResDetails)}
                      className="px-4 py-2 rounded-xl bg-amber-500/15 text-amber-300 border border-amber-500/40 text-xs font-bold hover:bg-amber-500/25"
                    >
                      لغو رزرو
                    </button>
                  )}
                  {!handedOverContractForDetails && !selectedResDetails.returnSignature && (
                    <button
                      onClick={() => handleDeleteReservation(selectedResDetails.id)}
                      className="px-4 py-2 rounded-xl bg-rose-500/20 text-rose-300 border border-rose-500/40 text-xs font-bold hover:bg-rose-500/30"
                    >
                      حذف رزرو
                    </button>
                  )}
                </div>
                <button
                  onClick={() => setSelectedResDetails(null)}
                  className="px-4 py-2 rounded-xl bg-white/10 text-white text-xs font-bold"
                >
                  بستن
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>


      {/* ==================================================================== */}
      {/* MODAL 3.5: RECORD A CUSTOMER PAYMENT AGAINST A PENDING ROW           */}
      {/* ==================================================================== */}
      <AnimatePresence>
        {payTarget && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md" dir="rtl">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md rounded-3xl border border-white/15 bg-[#0b172a] p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center border-b border-white/10 pb-3">
                <h3 className="text-base font-black text-white flex items-center gap-2">
                  <Wallet className="text-gold" size={18} />
                  <span>ثبت پرداخت {TX_TYPE_LABELS[payTarget.type]}</span>
                </h3>
                <button onClick={() => setPayTarget(null)} disabled={savingPay} className="text-white/40 hover:text-white disabled:opacity-40"><X size={18} /></button>
              </div>

              <div className="text-[11px] text-white/70 bg-[#07111f] p-3 rounded-xl border border-white/10 space-y-1">
                <p className="font-bold text-white">{payTarget.customerName}</p>
                <p>{payTarget.description}</p>
                <p className="inline-flex items-center gap-1">مانده قابل پرداخت: <span className="font-black text-rose-300">{payTarget.amount.toLocaleString()}</span> <OMRIcon size="sm" /></p>
              </div>

              <form onSubmit={handleRecordPayment} className="space-y-3.5 text-xs">
                <div>
                  <label className="block text-white/80 font-bold mb-1 flex items-center gap-1">مبلغ پرداختی <OMRIcon size="sm" /> *</label>
                  <NumericInput
                    required
                    value={payForm.amount}
                    onValueChange={v => setPayForm({ ...payForm, amount: v })}
                    className="w-full rounded-xl border border-white/15 bg-[#07111f] p-2.5 text-white outline-none focus:border-gold text-sm"
                  />
                  <p className="text-white/40 text-[10px] mt-1">اگر کمتر از مانده باشد، باقی‌مانده «در انتظار پرداخت» می‌ماند.</p>
                </div>

                <div>
                  <label className="block text-white/80 font-bold mb-1">پول به کجا / به چه کسی رسید؟ *</label>
                  <select
                    required
                    value={payForm.paymentMethod}
                    onChange={e => setPayForm({ ...payForm, paymentMethod: e.target.value as PaymentMethod })}
                    className="w-full rounded-xl border border-white/15 bg-[#07111f] p-2.5 outline-none focus:border-gold font-bold text-gold"
                  >
                    {PAYMENT_METHOD_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-white/80 font-bold mb-1">تاریخ پرداخت</label>
                  <input
                    type="date"
                    value={payForm.transactionDate}
                    onChange={e => setPayForm({ ...payForm, transactionDate: e.target.value })}
                    className="w-full rounded-xl border border-white/15 bg-[#07111f] p-2.5 text-white outline-none focus:border-gold"
                  />
                </div>

                <div className="pt-2 flex flex-col-reverse sm:flex-row justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setPayTarget(null)}
                    disabled={savingPay}
                    className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold disabled:opacity-60"
                  >
                    انصراف
                  </button>
                  <button
                    type="submit"
                    disabled={savingPay}
                    className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:brightness-110 text-white font-extrabold disabled:opacity-60 inline-flex items-center justify-center gap-2"
                  >
                    {savingPay ? (<><Loader2 size={16} className="animate-spin" /><span>در حال ثبت...</span></>) : 'ثبت پرداخت'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>


      {/* ==================================================================== */}
      {/* MODAL 4: NEW FINANCIAL TRANSACTION WITH FILE ATTACHMENT              */}
      {/* ==================================================================== */}
      <AnimatePresence>
        {isTransactionModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md" dir="rtl">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg rounded-3xl border border-white/15 bg-[#0b172a] p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center border-b border-white/10 pb-3">
                <h3 className="text-base font-black text-white flex items-center gap-2">
                  <DollarSign className="text-gold" size={18} />
                  <span>ثبت تراکنش مالی جدید اجاره خودرو</span>
                </h3>
                <button onClick={() => setIsTransactionModalOpen(false)} disabled={uploadingTxFile} className="text-white/40 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed"><X size={18} /></button>
              </div>

              <form onSubmit={handleSaveTransaction} className="space-y-3.5 text-xs">
                <div>
                  <label className="block text-white/80 font-bold mb-1 flex items-center gap-1">
                    مبلغ <OMRIcon size="sm" /> *
                  </label>
                  <NumericInput
                    required
                    value={txForm.amount}
                    onValueChange={v => setTxForm({ ...txForm, amount: v })}
                    placeholder="مثال: 1500"
                    className="w-full rounded-xl border border-white/15 bg-[#07111f] p-2.5 text-white outline-none focus:border-gold text-sm"
                  />
                </div>

                {/* EXACT ACCOUNTS SELECTION REQUIRED BY USER */}
                <div>
                  <label className="block text-white/80 font-bold mb-1">روش پرداخت و حساب مقصد *</label>
                  <FancySelect<PaymentMethod>
                    value={txForm.paymentMethod}
                    onChange={v => setTxForm({ ...txForm, paymentMethod: v })}
                    options={[
                      { value: 'bank_reza', label: 'واریز به حساب رضا اماره', icon: <Landmark size={14} className="text-blue-400" /> },
                      { value: 'bank_mohammadi', label: 'واریز به حساب محمدی', icon: <Landmark size={14} className="text-purple-400" /> },
                      { value: 'cash_reza', label: 'نقد به رضا اماره', icon: <Wallet size={14} className="text-teal-400" /> },
                      { value: 'cash_mohammadi', label: 'نقد به محمدی', icon: <Wallet size={14} className="text-orange-400" /> },
                    ]}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-white/80 font-bold mb-1">نوع تراکنش</label>
                    <FancySelect<CarTransaction['type']>
                      value={txForm.type}
                      onChange={v => setTxForm({ ...txForm, type: v })}
                      options={[
                        { value: 'rent_fee', label: 'درآمد کرایه خودرو', icon: <ArrowUpRight size={14} className="text-emerald-400" /> },
                        { value: 'deposit_in', label: 'دریافت ودیعه', icon: <ArrowUpRight size={14} className="text-blue-400" /> },
                        { value: 'deposit_refund', label: 'عودت ودیعه', hint: 'از موجودی کم می‌شود', icon: <ArrowDownRight size={14} className="text-rose-400" /> },
                        { value: 'maintenance_expense', label: 'هزینه سرویس و تعمیرات', hint: 'از موجودی کم می‌شود', icon: <ArrowDownRight size={14} className="text-amber-400" /> },
                      ]}
                    />
                  </div>

                  <div>
                    <label className="block text-white/80 font-bold mb-1">تاریخ تراکنش</label>
                    <input
                      type="date"
                      value={txForm.transactionDate}
                      onChange={e => setTxForm({ ...txForm, transactionDate: e.target.value })}
                      className="w-full rounded-xl border border-white/15 bg-[#07111f] p-2.5 text-white outline-none focus:border-gold"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-white/80 font-bold mb-1">نام مشتری / بابت</label>
                  <input
                    type="text"
                    value={txForm.customerName}
                    onChange={e => setTxForm({ ...txForm, customerName: e.target.value })}
                    placeholder="نام مشتری یا عنوان بابت..."
                    className="w-full rounded-xl border border-white/15 bg-[#07111f] p-2.5 text-white outline-none focus:border-gold"
                  />
                </div>

                <div>
                  <label className="block text-white/80 font-bold mb-1">شرح تراکنش</label>
                  <input
                    type="text"
                    value={txForm.description}
                    onChange={e => setTxForm({ ...txForm, description: e.target.value })}
                    placeholder="توضیحات بابت فاکتور یا فیش..."
                    className="w-full rounded-xl border border-white/15 bg-[#07111f] p-2.5 text-white outline-none focus:border-gold"
                  />
                </div>

                {/* ATTACH FILE RECEIPT */}
                <div>
                  <label className="block text-white/80 font-bold mb-1">الصاق فایل رسید / فاکتور</label>
                  <input
                    type="file"
                    onChange={e => setTxForm({ ...txForm, file: e.target.files?.[0] || null })}
                    className="w-full rounded-xl border border-white/15 bg-[#07111f] p-2 text-white/80 outline-none focus:border-gold text-xs"
                  />
                </div>

                <div className="pt-3 border-t border-white/10 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsTransactionModalOpen(false)}
                    disabled={uploadingTxFile}
                    className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    انصراف
                  </button>
                  <button
                    type="submit"
                    disabled={uploadingTxFile}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-black shadow-lg shadow-emerald-500/20 disabled:opacity-60 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
                  >
                    {uploadingTxFile ? (<><Loader2 size={16} className="animate-spin" /><span>در حال ثبت و آپلود...</span></>) : 'ثبت تراکنش'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* HANDOVER WIZARD (handover record + contract, photos, PDF / share) */}
      <AnimatePresence>
        {wizard && (
          <HandoverWizard
            contract={wizard.contract}
            startAtDone={wizard.startAtDone}
            defaultReservationId={wizard.reservationId}
            reservations={reservations}
            cars={cars}
            contracts={contracts}
            onSaved={handleWizardSaved}
            onClose={() => setWizard(null)}
          />
        )}
      </AnimatePresence>
      {contractPdf.element}

    </div>
  );
}

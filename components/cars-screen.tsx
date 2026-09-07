'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Car as CarIcon, Calendar as CalendarIcon, DollarSign, Plus, Search,
  Edit3, Trash2, ChevronLeft, ChevronRight, CheckCircle2, Clock,
  AlertTriangle, Upload, FileText, UserCheck, Phone, ShieldCheck,
  CreditCard, Landmark, Wallet, Check, X, Info, ExternalLink, Image as ImageIcon,
  ArrowUpRight, ArrowDownRight, RefreshCw, UserPlus, Filter, ClipboardList, Key, Fuel, Gauge
} from 'lucide-react';
import { toast } from 'sonner';
import { Car, CarReservation, CarTransaction } from '@/lib/db-cars';
import OMRIcon from '@/components/omr-icon';

interface CRMClient {
  name: string;
  phone: string;
}

export interface CarContract {
  id: string;
  reservationId: string;
  carTitle: string;
  plateNumber: string;
  customerName: string;
  customerPhone: string;
  initialOdometer: number;
  returnOdometer?: number;
  fuelLevel: 'full' | 'three_quarters' | 'half' | 'quarter' | 'empty';
  depositAmount: number;
  depositStatus: 'held' | 'refunded' | 'partially_refunded';
  handoverStatus: 'delivered' | 'pending_delivery' | 'returned' | 'inspection_required';
  notes?: string;
  createdAt: string;
}

interface CarsScreenProps {
  initialTab?: 'calendar' | 'fleet' | 'contracts' | 'accounting';
}

export default function CarsScreen({ initialTab }: CarsScreenProps = {}) {
  const [activeTab, setActiveTab] = useState<'calendar' | 'fleet' | 'contracts' | 'accounting'>(initialTab || 'calendar');

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  // Data States
  const [cars, setCars] = useState<Car[]>([]);
  const [reservations, setReservations] = useState<CarReservation[]>([]);
  const [transactions, setTransactions] = useState<CarTransaction[]>([]);
  const [crmClients, setCrmClients] = useState<CRMClient[]>([]);
  const [loading, setLoading] = useState(true);

  // Contracts Mock Data & State
  const [contracts, setContracts] = useState<CarContract[]>([
    {
      id: 'cnt-101',
      reservationId: 'res-1',
      carTitle: 'دوج چارجر GT',
      plateNumber: 'Dubai - M 12345',
      customerName: 'رضا علوی',
      customerPhone: '+971501234567',
      initialOdometer: 42500,
      returnOdometer: 42850,
      fuelLevel: 'full',
      depositAmount: 1200,
      depositStatus: 'held',
      handoverStatus: 'delivered',
      notes: 'تحویل داده شد با بدنه سالم و فول بنزین',
      createdAt: new Date().toISOString()
    }
  ]);

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

  // Form States - Car
  const [carForm, setCarForm] = useState<Partial<Car>>({
    title: '', brand: '', modelYear: '', plateNumber: '', color: '',
    dailyRate: 350, depositAmount: 1000, transmission: 'automatic',
    fuelType: 'بنزین', capacity: 5, status: 'available', imageUrl: '', notes: ''
  });
  const [uploadingCarImg, setUploadingCarImg] = useState(false);

  // Form States - Reservation
  const [resForm, setResForm] = useState<Partial<CarReservation>>({
    carId: '', customerName: '', customerPhone: '', customerNationalId: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0],
    totalPrice: 0, depositPaid: 0, status: 'confirmed', notes: ''
  });
  const [showCrmSuggestions, setShowCrmSuggestions] = useState(false);
  const [isNewCustomerMode, setIsNewCustomerMode] = useState(false);

  // Form States - Transaction
  const [txForm, setTxForm] = useState<{
    amount: number;
    type: CarTransaction['type'];
    paymentMethod: CarTransaction['paymentMethod'];
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

  // Fetch initial data
  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [carsRes, resRes, txRes, crmRes] = await Promise.all([
        fetch('/api/cars').then(r => r.json()),
        fetch('/api/cars/reservations').then(r => r.json()),
        fetch('/api/cars/transactions').then(r => r.json()),
        fetch('/api/requests').then(r => r.json()).catch(() => [])
      ]);

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
        fetchAllData();
      } else {
        toast.error(data.error || 'خطا در ذخیره‌سازی');
      }
    } catch (err) {
      toast.error('خطای ارتباط با سرور');
    }
  };

  const handleDeleteCar = async (id: string) => {
    if (!window.confirm('آیا از حذف این خودرو اطمینان دارید؟')) return;
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

  // --- RESERVATION HANDLERS ---
  const handleOpenAddReservation = (preselectedCarId?: string) => {
    const selectedCar = cars.find(c => c.id === (preselectedCarId || cars[0]?.id));
    const dailyRate = selectedCar ? selectedCar.dailyRate : 350;
    const defaultDays = 3;

    setResForm({
      carId: selectedCar?.id || '',
      carTitle: selectedCar?.title || '',
      customerName: '',
      customerPhone: '',
      customerNationalId: '',
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + defaultDays * 86400000).toISOString().split('T')[0],
      totalPrice: dailyRate * defaultDays,
      depositPaid: selectedCar ? selectedCar.depositAmount : 1000,
      status: 'confirmed',
      notes: ''
    });
    setIsNewCustomerMode(false);
    setIsReservationModalOpen(true);
  };

  const updateResPrice = (carId: string, sDate: string, eDate: string) => {
    const car = cars.find(c => c.id === carId);
    if (!car) return;
    try {
      const start = new Date(sDate);
      const end = new Date(eDate);
      const diffDays = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 3600 * 24)));
      setResForm(prev => ({
        ...prev,
        carId,
        carTitle: car.title,
        totalPrice: car.dailyRate * diffDays
      }));
    } catch (err) {}
  };

  const handleSaveReservation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resForm.carId || !resForm.customerName || !resForm.customerPhone || !resForm.startDate || !resForm.endDate) {
      toast.error('لطفا تمامی فیلدهای الزامی رزرو را تکمیل نمایید');
      return;
    }

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

        // Update car status to rented if reservation is active today
        const todayStr = new Date().toISOString().split('T')[0];
        if (resForm.startDate! <= todayStr && resForm.endDate! >= todayStr) {
          fetch('/api/cars', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: resForm.carId, status: 'rented' })
          });
        }

        // Also add automatic transaction record
        if (resForm.totalPrice && resForm.totalPrice > 0) {
          fetch('/api/cars/transactions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              reservationId: data.reservation.id,
              carId: resForm.carId,
              customerName: resForm.customerName,
              amount: resForm.totalPrice,
              type: 'rent_fee',
              paymentMethod: 'bank_reza',
              description: `اجاره خودرو ${resForm.carTitle || ''} برای ${resForm.customerName}`,
              transactionDate: resForm.startDate
            })
          });
        }

        fetchAllData();
      } else {
        toast.error(data.error || 'خطا در ثبت رزرو');
      }
    } catch (err) {
      toast.error('خطای برقراری ارتباط با سرور');
    }
  };

  const handleDeleteReservation = async (id: string) => {
    if (!window.confirm('آیا از لغو/حذف این رزرو مطمئن هستید؟')) return;
    try {
      const res = await fetch(`/api/cars/reservations?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('رزرو با موفقیت حذف گردید');
        setSelectedResDetails(null);
        setReservations(prev => prev.filter(r => r.id !== id));
      }
    } catch (err) {
      toast.error('خطا در حذف رزرو');
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
        fetchAllData();
      } else {
        toast.error(data.error || 'خطا در ثبت تراکنش');
      }
    } catch (err) {
      toast.error('خطا در ارتباط با سرور');
    } finally {
      setUploadingTxFile(false);
    }
  };

  const handleDeleteTransaction = async (id: string) => {
    if (!window.confirm('آیا از حذف این تراکنش مالی مطمئن هستید؟')) return;
    try {
      const res = await fetch(`/api/cars/transactions?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('تراکنش حذف گردید');
        setTransactions(prev => prev.filter(t => t.id !== id));
      }
    } catch (err) {
      toast.error('خطا در حذف تراکنش');
    }
  };

  // --- CRM AUTOSUGGEST FILTER ---
  const filteredCrmSuggestions = useMemo(() => {
    if (!resForm.customerName || isNewCustomerMode) return [];
    const query = resForm.customerName.toLowerCase().trim();
    return crmClients.filter(
      c => c.name.toLowerCase().includes(query) || c.phone.includes(query)
    ).slice(0, 6);
  }, [crmClients, resForm.customerName, isNewCustomerMode]);

  // --- ACCOUNTING STATS CALCULATION ---
  const accountingStats = useMemo(() => {
    let totalIncome = 0;
    let bankReza = 0;
    let bankMohammadi = 0;
    let cashReza = 0;
    let cashMohammadi = 0;

    for (const tx of transactions) {
      const isExpense = tx.type === 'deposit_refund' || tx.type === 'maintenance_expense';
      const val = isExpense ? -tx.amount : tx.amount;

      totalIncome += val;

      if (tx.paymentMethod === 'bank_reza') bankReza += val;
      else if (tx.paymentMethod === 'bank_mohammadi') bankMohammadi += val;
      else if (tx.paymentMethod === 'cash_reza') cashReza += val;
      else if (tx.paymentMethod === 'cash_mohammadi') cashMohammadi += val;
    }

    return { totalIncome, bankReza, bankMohammadi, cashReza, cashMohammadi };
  }, [transactions]);

  // Payment method badges map
  const getPaymentBadge = (method: CarTransaction['paymentMethod']) => {
    switch (method) {
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
        return { label: '🟢 آماده رزرو', bg: 'rgba(52,211,153,0.15)', text: '#34d399', border: 'rgba(52,211,153,0.3)' };
      case 'rented':
        return { label: '🔴 در حال اجاره', bg: 'rgba(248,113,113,0.15)', text: '#f87171', border: 'rgba(248,113,113,0.3)' };
      case 'maintenance':
        return { label: '🟡 سرویس/تعمیر', bg: 'rgba(251,191,36,0.15)', text: '#fbbf24', border: 'rgba(251,191,36,0.3)' };
      case 'disabled':
        return { label: '⚪ غیرفعال', bg: 'rgba(156,163,175,0.15)', text: '#9ca3af', border: 'rgba(156,163,175,0.3)' };
    }
  };

  return (
    <div className="space-y-5 animate-fadeIn text-white font-sans w-full max-w-full overflow-x-hidden min-w-0" dir="rtl">

      {/* ── TOP ACTION HEADER & SUB-PAGES NAVIGATION ── */}
      <div className="bg-[#0b172a] p-3.5 sm:p-5 rounded-2xl border border-white/10 shadow-xl flex flex-col md:flex-row md:items-center md:justify-between gap-4 w-full min-w-0">
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="h-11 w-11 rounded-2xl bg-gold/15 text-gold border border-gold/30 flex items-center justify-center shadow-lg shadow-gold/10 shrink-0">
            <CarIcon size={24} />
          </div>
          <div className="min-w-0">
            <h1 className="text-base sm:text-xl font-black text-white tracking-wide truncate">مدیریت و رزرو خودروها (Car Rental System)</h1>
            <p className="text-[11px] sm:text-xs text-white/50 truncate">سیستم جامع ناوگان رنتال، کلندر اشغال گانت، تحویل قراردادها و حسابداری اجاره</p>
          </div>
        </div>

        {/* 4 SUB-PAGES TABS (Responsive Scrollable Pills) */}
        <div className="flex items-center bg-[#07111f] p-1.5 rounded-xl border border-white/10 gap-1.5 overflow-x-auto w-full md:w-auto max-w-full shrink-0 no-scrollbar">
          <button
            onClick={() => setActiveTab('calendar')}
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
            onClick={() => setActiveTab('fleet')}
            className={`flex items-center gap-2 px-3.5 py-2.5 rounded-lg text-xs font-black transition-all cursor-pointer shrink-0 ${
              activeTab === 'fleet'
                ? 'bg-gradient-to-r from-gold to-amber-500 text-black shadow-lg shadow-gold/20'
                : 'text-white/70 hover:text-white hover:bg-white/5'
            }`}
          >
            <CarIcon size={15} />
            <span>تعریف خودروها</span>
            <span className="bg-white/20 text-white px-1.5 py-0.5 rounded-full text-[10px]">{cars.length}</span>
          </button>

          <button
            onClick={() => setActiveTab('contracts')}
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
            onClick={() => setActiveTab('accounting')}
            className={`flex items-center gap-2 px-3.5 py-2.5 rounded-lg text-xs font-black transition-all cursor-pointer shrink-0 ${
              activeTab === 'accounting'
                ? 'bg-gradient-to-r from-gold to-amber-500 text-black shadow-lg shadow-gold/20'
                : 'text-white/70 hover:text-white hover:bg-white/5'
            }`}
          >
            <DollarSign size={15} />
            <span>حسابداری اجاره</span>
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
                    {/* Fixed Car Column */}
                    <th className="py-3.5 px-4 w-60 min-w-[240px] sticky right-0 bg-[#07111f] z-20 border-l border-white/10 shadow-md">
                      خودروهای رنتال ({cars.length})
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
                        {/* Car Name & Plate Column (Minimal Compact Layout) */}
                        <td className="py-2.5 px-3 sticky right-0 bg-[#0b172a] z-10 border-l border-white/10 shadow-md">
                          <div className="min-w-0 flex-1">
                            <p className="font-extrabold text-white text-xs truncate">{car.title}</p>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="text-[10px] font-mono text-gold bg-gold/10 px-1.5 py-0.2 rounded border border-gold/20">
                                {car.plateNumber}
                              </span>
                              <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 font-bold">{car.dailyRate.toLocaleString()} <OMRIcon size="sm" /></span>
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
              <span>📋 آخرین رزروهای فعال سیستم</span>
              <span className="text-xs font-normal text-white/40">({reservations.length} رزرو ثبت شده)</span>
            </h3>

            {reservations.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {reservations.slice(0, 6).map(res => (
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
                        'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      }`}>
                        {res.status === 'active' ? 'در حال اجرا' : res.status === 'completed' ? 'تکمیل شده' : 'تایید شده'}
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

                    <div className="flex justify-end gap-2 pt-1">
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

          {/* CARS GRID CARDS */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {cars
              .filter(c => c.title.toLowerCase().includes(searchQuery.toLowerCase()) || c.plateNumber.includes(searchQuery))
              .map(car => {
                const badge = getCarStatusBadge(car.status);
                return (
                  <div
                    key={car.id}
                    className="rounded-2xl border border-white/10 bg-[#0b172a] shadow-xl overflow-hidden flex flex-col hover:border-gold/40 transition-all group"
                  >
                    {/* Car Image Header */}
                    <div className="h-44 bg-black/60 relative overflow-hidden">
                      {car.imageUrl ? (
                        <img
                          src={car.imageUrl}
                          alt={car.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center h-full text-white/30 gap-2">
                          <CarIcon size={40} />
                          <span className="text-xs">بدون تصویر</span>
                        </div>
                      )}

                      {/* Status Badge Tag */}
                      <div className="absolute top-3 right-3">
                        <span
                          className="px-3 py-1 rounded-full text-[10px] font-black border backdrop-blur-md shadow-md"
                          style={{ background: badge.bg, color: badge.text, borderColor: badge.border }}
                        >
                          {badge.label}
                        </span>
                      </div>

                      {/* Plate Badge */}
                      <div className="absolute bottom-3 left-3 bg-black/80 backdrop-blur-md px-2.5 py-1 rounded-lg border border-gold/40 font-mono text-gold text-xs font-black">
                        {car.plateNumber}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-start mb-1">
                          <h3 className="text-base font-black text-white">{car.title}</h3>
                          <span className="text-xs text-white/50">{car.brand} {car.modelYear}</span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-[11px] text-white/70 py-2 border-y border-white/5 my-2">
                          <div>گیربکس: <span className="text-white font-bold">{car.transmission === 'automatic' ? 'اتوماتیک' : 'دستی'}</span></div>
                          <div>رنگ: <span className="text-white font-bold">{car.color}</span></div>
                          <div>سوخت: <span className="text-white font-bold">{car.fuelType || 'بنزین'}</span></div>
                          <div>ظرفیت: <span className="text-white font-bold">{car.capacity} نفر</span></div>
                        </div>

                        {car.notes && (
                          <p className="text-[11px] text-white/50 bg-black/20 p-2 rounded-lg line-clamp-2">
                            {car.notes}
                          </p>
                        )}
                      </div>

                      {/* Footer Prices & Actions */}
                      <div className="pt-2 border-t border-white/10 flex items-center justify-between">
                        <div>
                          <p className="text-[10px] text-white/50">اجاره روزانه:</p>
                          <div className="flex items-center gap-1.5 text-base font-extrabold text-gold">{car.dailyRate.toLocaleString()} <OMRIcon size="sm" /></div>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleOpenEditCar(car)}
                            className="p-2 rounded-xl bg-white/5 hover:bg-gold/20 text-white/80 hover:text-gold border border-white/10 transition-all cursor-pointer"
                            title="ویرایش"
                          >
                            <Edit3 size={15} />
                          </button>
                          <button
                            onClick={() => handleDeleteCar(car.id)}
                            className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition-all cursor-pointer"
                            title="حذف"
                          >
                            <Trash2 size={15} />
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
              onClick={() => toast.info('قرارداد جدید بر اساس رزرو ثبت شده صادر می‌گردد.')}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-gold to-amber-500 text-black font-black text-xs shadow-lg shadow-gold/20 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
            >
              <Plus size={16} />
              <span>ثبت صورتجلسه تحویل جدید</span>
            </button>
          </div>

          {/* CONTRACTS TABLE */}
          <div className="rounded-2xl border border-white/10 bg-[#0b172a] shadow-xl overflow-hidden w-full">
            <div className="overflow-x-auto w-full">
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
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {contracts.map(cnt => (
                    <tr key={cnt.id} className="hover:bg-white/5 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-gold">{cnt.id}</td>
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-white block">{cnt.carTitle}</span>
                        <span className="text-[10px] text-white/50 font-mono">{cnt.plateNumber}</span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-white block">{cnt.customerName}</span>
                        <span className="text-[10px] text-white/50 dir-ltr inline-block">{cnt.customerPhone}</span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="text-white font-bold">{cnt.initialOdometer.toLocaleString()} km</span>
                        {cnt.returnOdometer && <span className="text-white/50 text-[10px] block">عودت: {cnt.returnOdometer.toLocaleString()} km</span>}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                          ⛽ فول (Full)
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-emerald-400">
                        <span className="inline-flex items-center gap-1">{cnt.depositAmount.toLocaleString()} <OMRIcon size="sm" /> (دریافت شده)</span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                          🟢 تحویل داده شده
                        </span>
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {/* Total Income */}
            <div className="bg-[#0b172a] p-4 rounded-2xl border border-gold/30 shadow-lg relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-gold/5 rounded-full blur-xl"></div>
              <p className="text-[11px] font-bold text-gold mb-1">مجموع خالص کل درآمد اجاره</p>
              <div className="flex items-center gap-2 text-2xl font-black text-white">{accountingStats.totalIncome.toLocaleString()} <OMRIcon size="md" /></div>
            </div>

            {/* Bank Reza Amare */}
            <div className="bg-[#0b172a] p-4 rounded-2xl border border-blue-500/30 shadow-lg">
              <div className="flex items-center gap-1.5 text-blue-400 text-[11px] font-bold mb-1">
                <Landmark size={14} />
                <span>حساب رضا اماره (واریزی)</span>
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
            <div className="bg-[#0b172a] p-4 rounded-2xl border border-emerald-500/30 shadow-lg">
              <div className="flex items-center gap-1.5 text-emerald-400 text-[11px] font-bold mb-1">
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

          {/* TRANSACTIONS FILTER & NEW BUTTON */}
          <div className="bg-[#0b172a] p-4 rounded-2xl border border-white/10 shadow-lg flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-2">
              <select
                value={paymentFilter}
                onChange={e => setPaymentFilter(e.target.value)}
                className="bg-[#07111f] border border-white/15 rounded-xl px-3 py-2 text-xs font-bold text-white outline-none focus:border-gold cursor-pointer"
              >
                <option value="all">همه روش‌های پرداخت</option>
                <option value="bank_reza">واریز: حساب رضا اماره</option>
                <option value="bank_mohammadi">واریز: حساب محمدی</option>
                <option value="cash_reza">نقد: رضا اماره</option>
                <option value="cash_mohammadi">نقد: محمدی</option>
              </select>
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
              <table className="w-full min-w-[700px] text-right border-collapse text-xs">
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
                    <th className="py-3 px-4 text-center">رسید / پیوست</th>
                    <th className="py-3 px-4 text-center">عملیات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {transactions
                    .filter(t => paymentFilter === 'all' || t.paymentMethod === paymentFilter)
                    .map(tx => {
                      const badge = getPaymentBadge(tx.paymentMethod);
                      const isNegative = tx.type === 'deposit_refund' || tx.type === 'maintenance_expense';

                      return (
                        <tr key={tx.id} className="hover:bg-white/5 transition-colors">
                          <td className="py-3 px-4 text-white/70">{tx.transactionDate}</td>
                          <td className="py-3 px-4 font-bold text-white">{tx.description}</td>
                          <td className="py-3 px-4 text-white/80">{tx.customerName || '-'}</td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              tx.type === 'rent_fee' ? 'bg-emerald-500/20 text-emerald-300' :
                              tx.type === 'deposit_in' ? 'bg-blue-500/20 text-blue-300' :
                              tx.type === 'deposit_refund' ? 'bg-rose-500/20 text-rose-300' :
                              'bg-amber-500/20 text-amber-300'
                            }`}>
                              {tx.type === 'rent_fee' ? 'کرایه خودرو' :
                               tx.type === 'deposit_in' ? 'دریافت ودیعه' :
                               tx.type === 'deposit_refund' ? 'عودت ودیعه' : 'هزینه سرویس'}
                            </span>
                          </td>
                          <td className={`py-3 px-4 font-extrabold text-sm ${isNegative ? 'text-rose-400' : 'text-emerald-400'}`}>
                            <span className="inline-flex items-center gap-1">
                              {isNegative ? '-' : '+'}{tx.amount.toLocaleString()} <OMRIcon size="sm" />
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className="px-2.5 py-0.5 rounded-full text-[10px] font-black border inline-block"
                              style={{ background: badge.bg, color: badge.text, borderColor: badge.border }}
                            >
                              {badge.label}
                            </span>
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
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md" dir="rtl">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-xl rounded-3xl border border-white/15 bg-[#0b172a] p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center border-b border-white/10 pb-3">
                <h3 className="text-base font-black text-white flex items-center gap-2">
                  <CarIcon className="text-gold" size={18} />
                  <span>{editingCar ? 'ویرایش اطلاعات خودرو' : 'تعریف خودرو جدید'}</span>
                </h3>
                <button onClick={() => setIsCarModalOpen(false)} className="text-white/40 hover:text-white"><X size={18} /></button>
              </div>

              <form onSubmit={handleSaveCar} className="space-y-3.5 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-white/80 font-bold mb-1">نام و مدل خودرو *</label>
                    <input
                      type="text"
                      required
                      value={carForm.title || ''}
                      onChange={e => setCarForm({ ...carForm, title: e.target.value })}
                      placeholder="مثال: نیسان پاترول 2023"
                      className="w-full rounded-xl border border-white/15 bg-[#07111f] p-2.5 text-white outline-none focus:border-gold"
                    />
                  </div>

                  <div>
                    <label className="block text-white/80 font-bold mb-1">شماره پلاک خودرو *</label>
                    <input
                      type="text"
                      required
                      value={carForm.plateNumber || ''}
                      onChange={e => setCarForm({ ...carForm, plateNumber: e.target.value })}
                      placeholder="مثال: Dubai - A 84920"
                      className="w-full rounded-xl border border-white/15 bg-[#07111f] p-2.5 text-white outline-none focus:border-gold font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-white/80 font-bold mb-1 flex items-center gap-1">
                      نرخ روزانه <OMRIcon size="sm" /> *
                    </label>
                    <input
                      type="number"
                      required
                      value={carForm.dailyRate || 0}
                      onChange={e => setCarForm({ ...carForm, dailyRate: Number(e.target.value) })}
                      className="w-full rounded-xl border border-white/15 bg-[#07111f] p-2.5 text-white outline-none focus:border-gold"
                    />
                  </div>

                  <div>
                    <label className="block text-white/80 font-bold mb-1 flex items-center gap-1">
                      مبلغ ودیعه <OMRIcon size="sm" />
                    </label>
                    <input
                      type="number"
                      value={carForm.depositAmount || 0}
                      onChange={e => setCarForm({ ...carForm, depositAmount: Number(e.target.value) })}
                      className="w-full rounded-xl border border-white/15 bg-[#07111f] p-2.5 text-white outline-none focus:border-gold"
                    />
                  </div>

                  <div>
                    <label className="block text-white/80 font-bold mb-1">گیربکس</label>
                    <select
                      value={carForm.transmission || 'automatic'}
                      onChange={e => setCarForm({ ...carForm, transmission: e.target.value as any })}
                      className="w-full rounded-xl border border-white/15 bg-[#07111f] p-2.5 text-white outline-none focus:border-gold"
                    >
                      <option value="automatic">اتوماتیک</option>
                      <option value="manual">دستی</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-white/80 font-bold mb-1">برند سازنده</label>
                    <input
                      type="text"
                      value={carForm.brand || ''}
                      onChange={e => setCarForm({ ...carForm, brand: e.target.value })}
                      placeholder="Nissan / Dodge"
                      className="w-full rounded-xl border border-white/15 bg-[#07111f] p-2.5 text-white outline-none focus:border-gold"
                    />
                  </div>

                  <div>
                    <label className="block text-white/80 font-bold mb-1">سال ساخت</label>
                    <input
                      type="text"
                      value={carForm.modelYear || ''}
                      onChange={e => setCarForm({ ...carForm, modelYear: e.target.value })}
                      placeholder="2023"
                      className="w-full rounded-xl border border-white/15 bg-[#07111f] p-2.5 text-white outline-none focus:border-gold"
                    />
                  </div>

                  <div>
                    <label className="block text-white/80 font-bold mb-1">وضعیت خودرو</label>
                    <select
                      value={carForm.status || 'available'}
                      onChange={e => setCarForm({ ...carForm, status: e.target.value as any })}
                      className="w-full rounded-xl border border-white/15 bg-[#07111f] p-2.5 text-white outline-none focus:border-gold"
                    >
                      <option value="available">🟢 آماده رزرو</option>
                      <option value="rented">🔴 در حال اجاره</option>
                      <option value="maintenance">🟡 در حال سرویس</option>
                      <option value="disabled">⚪ غیرفعال</option>
                    </select>
                  </div>
                </div>

                {/* Car Photo Upload */}
                <div>
                  <label className="block text-white/80 font-bold mb-1">عکس خودرو</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="text"
                      value={carForm.imageUrl || ''}
                      onChange={e => setCarForm({ ...carForm, imageUrl: e.target.value })}
                      placeholder="آدرس URL یا انتخاب تصویر..."
                      className="flex-1 rounded-xl border border-white/15 bg-[#07111f] p-2.5 text-white outline-none focus:border-gold"
                    />
                    <label className="cursor-pointer bg-white/10 hover:bg-white/20 text-white px-3 py-2.5 rounded-xl border border-white/15 flex items-center gap-1.5 font-bold shrink-0">
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
                    className="w-full rounded-xl border border-white/15 bg-[#07111f] p-2.5 text-white outline-none focus:border-gold"
                  />
                </div>

                <div className="pt-3 border-t border-white/10 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsCarModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold"
                  >
                    انصراف
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-gold to-amber-500 text-black font-black shadow-lg shadow-gold/20"
                  >
                    ذخیره اطلاعات خودرو
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>


      {/* ==================================================================== */}
      {/* MODAL 2: NEW RESERVATION WITH CRM AUTOSUGGESTION                      */}
      {/* ==================================================================== */}
      <AnimatePresence>
        {isReservationModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md" dir="rtl">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-xl rounded-3xl border border-white/15 bg-[#0b172a] p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center border-b border-white/10 pb-3">
                <h3 className="text-base font-black text-white flex items-center gap-2">
                  <CalendarIcon className="text-emerald-400" size={18} />
                  <span>ثبت رزرو جدید خودرو</span>
                </h3>
                <button onClick={() => setIsReservationModalOpen(false)} className="text-white/40 hover:text-white"><X size={18} /></button>
              </div>

              <form onSubmit={handleSaveReservation} className="space-y-4 text-xs">
                {/* Select Car */}
                <div>
                  <label className="block text-white/80 font-bold mb-1">انتخاب خودرو *</label>
                  <select
                    required
                    value={resForm.carId || ''}
                    onChange={e => updateResPrice(e.target.value, resForm.startDate!, resForm.endDate!)}
                    className="w-full rounded-xl border border-white/15 bg-[#07111f] p-2.5 text-white outline-none focus:border-gold"
                  >
                    {cars.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.title} ({c.plateNumber}) - {c.dailyRate.toLocaleString()} ر.ع/روز
                      </option>
                    ))}
                  </select>
                </div>

                {/* CRM CUSTOMER AUTOSUGGESTION FIELD */}
                <div className="relative">
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-white/80 font-bold">نام مشتری *</label>
                    <button
                      type="button"
                      onClick={() => {
                        setIsNewCustomerMode(!isNewCustomerMode);
                        setShowCrmSuggestions(false);
                      }}
                      className="text-[10px] text-gold hover:underline font-bold flex items-center gap-1"
                    >
                      <UserPlus size={12} />
                      <span>{isNewCustomerMode ? 'جستجو در لیست CRM' : 'ثبت مشتری جدید'}</span>
                    </button>
                  </div>

                  <input
                    type="text"
                    required
                    value={resForm.customerName || ''}
                    onChange={e => {
                      setResForm({ ...resForm, customerName: e.target.value });
                      setShowCrmSuggestions(true);
                    }}
                    onFocus={() => setShowCrmSuggestions(true)}
                    placeholder={isNewCustomerMode ? 'نام کامل مشتری جدید را وارد کنید...' : 'شروع به تایپ کنید (جستجو از CRM)...'}
                    className="w-full rounded-xl border border-white/15 bg-[#07111f] p-2.5 text-white outline-none focus:border-gold"
                  />

                  {/* CRM Suggestion Dropdown */}
                  {!isNewCustomerMode && showCrmSuggestions && filteredCrmSuggestions.length > 0 && (
                    <div className="absolute right-0 left-0 top-full mt-1 bg-[#0f1e37] border border-gold/40 rounded-xl shadow-2xl z-30 overflow-hidden divide-y divide-white/5">
                      <p className="text-[10px] text-gold font-bold px-3 py-1.5 bg-black/40">پیشنهادات مشتریان CRM:</p>
                      {filteredCrmSuggestions.map((crm, i) => (
                        <div
                          key={i}
                          onClick={() => {
                            setResForm({
                              ...resForm,
                              customerName: crm.name,
                              customerPhone: crm.phone
                            });
                            setShowCrmSuggestions(false);
                          }}
                          className="p-2.5 hover:bg-gold/15 cursor-pointer flex justify-between items-center transition-colors"
                        >
                          <span className="font-extrabold text-white">{crm.name}</span>
                          <span className="font-mono text-gold text-[11px]">{crm.phone}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Customer Phone */}
                <div>
                  <label className="block text-white/80 font-bold mb-1">شماره تلفن تماس *</label>
                  <input
                    type="text"
                    required
                    value={resForm.customerPhone || ''}
                    onChange={e => setResForm({ ...resForm, customerPhone: e.target.value })}
                    placeholder="+971 50 123 4567"
                    className="w-full rounded-xl border border-white/15 bg-[#07111f] p-2.5 text-white outline-none focus:border-gold dir-ltr"
                  />
                </div>

                {/* Dates */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-white/80 font-bold mb-1">تاریخ تحویل (شروع) *</label>
                    <input
                      type="date"
                      required
                      value={resForm.startDate || ''}
                      onChange={e => updateResPrice(resForm.carId!, e.target.value, resForm.endDate!)}
                      className="w-full rounded-xl border border-white/15 bg-[#07111f] p-2.5 text-white outline-none focus:border-gold"
                    />
                  </div>

                  <div>
                    <label className="block text-white/80 font-bold mb-1">تاریخ عودت (پایان) *</label>
                    <input
                      type="date"
                      required
                      value={resForm.endDate || ''}
                      onChange={e => updateResPrice(resForm.carId!, resForm.startDate!, e.target.value)}
                      className="w-full rounded-xl border border-white/15 bg-[#07111f] p-2.5 text-white outline-none focus:border-gold"
                    />
                  </div>
                </div>

                {/* Price & Deposit */}
                <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-black/40 border border-white/10">
                  <div>
                    <label className="block text-white/60 text-[11px]">مبلغ کل اجاره (محاسبه خودکار):</label>
                    <div className="flex items-center gap-1.5 text-lg font-black text-emerald-400 mt-1">
                      {resForm.totalPrice?.toLocaleString()} <OMRIcon size="sm" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-white/60 text-[11px] flex items-center gap-1">
                      مبلغ ودیعه دریافتی <OMRIcon size="sm" />:
                    </label>
                    <input
                      type="number"
                      value={resForm.depositPaid || 0}
                      onChange={e => setResForm({ ...resForm, depositPaid: Number(e.target.value) })}
                      className="mt-1 w-full rounded-lg border border-white/15 bg-[#07111f] p-1.5 text-white outline-none focus:border-gold"
                    />
                  </div>
                </div>

                <div className="pt-3 border-t border-white/10 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsReservationModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold"
                  >
                    انصراف
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-black shadow-lg shadow-emerald-500/20"
                  >
                    تایید و ثبت نهایی رزرو
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
      <AnimatePresence>
        {selectedResDetails && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md" dir="rtl">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md rounded-3xl border border-white/15 bg-[#0b172a] p-6 shadow-2xl space-y-4"
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

              <div className="flex justify-between items-center pt-2">
                <button
                  onClick={() => handleDeleteReservation(selectedResDetails.id)}
                  className="px-4 py-2 rounded-xl bg-rose-500/20 text-rose-300 border border-rose-500/40 text-xs font-bold hover:bg-rose-500/30"
                >
                  لغو / حذف رزرو
                </button>
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
                <button onClick={() => setIsTransactionModalOpen(false)} className="text-white/40 hover:text-white"><X size={18} /></button>
              </div>

              <form onSubmit={handleSaveTransaction} className="space-y-3.5 text-xs">
                <div>
                  <label className="block text-white/80 font-bold mb-1 flex items-center gap-1">
                    مبلغ <OMRIcon size="sm" /> *
                  </label>
                  <input
                    type="number"
                    required
                    value={txForm.amount || ''}
                    onChange={e => setTxForm({ ...txForm, amount: Number(e.target.value) })}
                    placeholder="مثال: 1500"
                    className="w-full rounded-xl border border-white/15 bg-[#07111f] p-2.5 text-white outline-none focus:border-gold text-sm"
                  />
                </div>

                {/* EXACT ACCOUNTS SELECTION REQUIRED BY USER */}
                <div>
                  <label className="block text-white/80 font-bold mb-1">روش پرداخت و حساب مقصد *</label>
                  <select
                    required
                    value={txForm.paymentMethod}
                    onChange={e => setTxForm({ ...txForm, paymentMethod: e.target.value as any })}
                    className="w-full rounded-xl border border-white/15 bg-[#07111f] p-2.5 text-white outline-none focus:border-gold font-bold text-gold"
                  >
                    <option value="bank_reza">🏦 واریز به حساب - حساب رضا اماره</option>
                    <option value="bank_mohammadi">🏦 واریز به حساب - حساب محمدی</option>
                    <option value="cash_reza">💵 نقد - نقد به رضا اماره</option>
                    <option value="cash_mohammadi">💵 نقد - نقد به محمدی</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-white/80 font-bold mb-1">نوع تراکنش</label>
                    <select
                      value={txForm.type}
                      onChange={e => setTxForm({ ...txForm, type: e.target.value as any })}
                      className="w-full rounded-xl border border-white/15 bg-[#07111f] p-2.5 text-white outline-none focus:border-gold"
                    >
                      <option value="rent_fee">درآمد کرایه خودرو</option>
                      <option value="deposit_in">دریافت ودیعه</option>
                      <option value="deposit_refund">عودت ودیعه (منفی)</option>
                      <option value="maintenance_expense">هزینه سرویس و تعمیرات (منفی)</option>
                    </select>
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
                    className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold"
                  >
                    انصراف
                  </button>
                  <button
                    type="submit"
                    disabled={uploadingTxFile}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-black shadow-lg shadow-emerald-500/20"
                  >
                    {uploadingTxFile ? 'در حال ثبت و آپلود...' : 'ثبت تراکنش'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}

import { supabase } from './supabase';

export interface Car {
  id: string;
  title: string;
  titleEn?: string;
  brand: string;
  modelYear: string;
  plateNumber: string;
  color: string;
  dailyRate: number;
  depositAmount: number;
  transmission: 'automatic' | 'manual';
  fuelType?: string;
  capacity?: number;
  status: 'available' | 'rented' | 'maintenance' | 'disabled';
  imageUrl?: string;
  features?: string[];
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CarReservation {
  id: string;
  carId: string;
  carTitle?: string;
  customerName: string;
  customerPhone: string;
  customerNationalId?: string;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  totalPrice: number;
  depositPaid: number;
  status: 'confirmed' | 'active' | 'completed' | 'cancelled';
  notes?: string;
  createdAt?: string;
}

export interface CarTransaction {
  id: string;
  reservationId?: string;
  carId?: string;
  customerName?: string;
  amount: number;
  type: 'rent_fee' | 'deposit_in' | 'deposit_refund' | 'maintenance_expense' | 'other_income';
  paymentMethod: 'cash_reza' | 'cash_mohammadi' | 'bank_reza' | 'bank_mohammadi';
  description: string;
  receiptFileUrl?: string;
  receiptFileName?: string;
  transactionDate: string; // YYYY-MM-DD
  createdAt?: string;
}

export type FuelLevel = 'full' | 'three_quarters' | 'half' | 'quarter' | 'empty';

export const FUEL_LEVEL_LABELS: Record<FuelLevel, string> = {
  full: 'فول (Full)',
  three_quarters: '۳/۴',
  half: '۱/۲',
  quarter: '۱/۴',
  empty: 'خالی (Empty)',
};

export const HANDOVER_CHECKLIST_ITEMS: { key: string; label: string }[] = [
  { key: 'body', label: 'سلامت بدنه (بدون خط‌وخش و فرورفتگی)' },
  { key: 'windshield', label: 'شیشه‌ها و آینه‌ها' },
  { key: 'tires', label: 'لاستیک‌ها و رینگ‌ها' },
  { key: 'spareTire', label: 'لاستیک زاپاس' },
  { key: 'tools', label: 'جک و آچار چرخ' },
  { key: 'lights', label: 'چراغ‌ها و راهنماها' },
  { key: 'ac', label: 'کولر / سیستم تهویه' },
  { key: 'interior', label: 'سلامت و نظافت داخل خودرو' },
  { key: 'documents', label: 'کارت خودرو و بیمه‌نامه' },
  { key: 'safety', label: 'مثلث و کپسول ایمنی' },
];

export interface CarContract {
  id: string;
  reservationId: string;
  carId?: string;
  carTitle: string;
  plateNumber: string;
  customerName: string;
  customerPhone: string;
  initialOdometer: number;
  returnOdometer?: number;
  fuelLevel: FuelLevel;
  depositAmount: number;
  depositStatus: 'held' | 'refunded' | 'partially_refunded';
  handoverStatus: 'delivered' | 'pending_delivery' | 'returned' | 'inspection_required';
  checklist?: Record<string, boolean>;
  notes?: string;
  createdAt: string;
  // Details entered in the contract window (printed on the paper form)
  customerNameEn?: string;
  customerNationalId?: string;
  customerNationality?: string;
  customerAddress?: string;
  workAddress?: string;
  whatsapp?: string;
  licenceType?: string;
  licenceNo?: string;
  carTitleEn?: string;
  color?: string;
  cleanInside?: string;
  cleanOutside?: string;
  contractDate?: string;
  startDate?: string;
  departureTime?: string;
  endDate?: string;
  returnTime?: string;
  rentalDays?: number;
  dailyRate?: number;
  totalPrice?: number;
  extraKm?: string;
  extraKmAmount?: number;
  deductionsAmount?: number;
}

// Contract detail fields: [CarContract key, column, kind]. Empty values are stored as NULL.
const CONTRACT_DETAIL_COLUMNS: [keyof CarContract, string, 'text' | 'date' | 'number'][] = [
  ['customerNameEn', 'customer_name_en', 'text'],
  ['customerNationalId', 'customer_national_id', 'text'],
  ['customerNationality', 'customer_nationality', 'text'],
  ['customerAddress', 'customer_address', 'text'],
  ['workAddress', 'work_address', 'text'],
  ['whatsapp', 'whatsapp', 'text'],
  ['licenceType', 'licence_type', 'text'],
  ['licenceNo', 'licence_no', 'text'],
  ['carTitleEn', 'car_title_en', 'text'],
  ['color', 'color', 'text'],
  ['cleanInside', 'clean_inside', 'text'],
  ['cleanOutside', 'clean_outside', 'text'],
  ['contractDate', 'contract_date', 'date'],
  ['startDate', 'start_date', 'date'],
  ['departureTime', 'departure_time', 'text'],
  ['endDate', 'end_date', 'date'],
  ['returnTime', 'return_time', 'text'],
  ['rentalDays', 'rental_days', 'number'],
  ['dailyRate', 'daily_rate', 'number'],
  ['totalPrice', 'total_price', 'number'],
  ['extraKm', 'extra_km', 'text'],
  ['extraKmAmount', 'extra_km_amount', 'number'],
  ['deductionsAmount', 'deductions_amount', 'number'],
];

function detailToColumn(value: unknown, kind: 'text' | 'date' | 'number') {
  if (value === undefined || value === null || value === '') return null;
  if (kind === 'number') {
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  }
  if (kind === 'date') return /^\d{4}-\d{2}-\d{2}$/.test(String(value)) ? String(value) : null;
  return String(value);
}

export function cleanCarTitle(title: string): string {
  if (!title) return '';
  return title
    .replace(/\s*\((سفید صدفی|سفید|نقره‌ای|قرمز|نوک مدادی|مشکی)\s*(#\d+)?\)/gi, (match, color, num) => num ? ` (${num})` : '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function cleanCarPlate(plate: string): string {
  if (!plate) return '';
  return plate.replace(/^.*?\s*-\s*/, '').trim();
}

// Starter fleet shown (never persisted) while the cars table is empty
const seedCars: Car[] = [
  // 1. MG GT (3 units - All Model Year 2026, All White)
  {
    id: 'car-mg-gt-1',
    title: 'ام‌جی GT 2026 (#1)',
    titleEn: 'MG GT 2026 (#1)',
    brand: 'MG',
    modelYear: '2026',
    plateNumber: '48123',
    color: 'سفید صدفی',
    dailyRate: 15,
    depositAmount: 50,
    transmission: 'automatic',
    fuelType: 'بنزین',
    capacity: 5,
    status: 'rented',
    imageUrl: '/cars/mg-gt-v2.webp',
    features: ['مدل 2026 جدید', 'موتور 1.5 توربو', 'دنده اتوماتیک 7 سرعته', 'سقف پانوراما', 'دوربین 360'],
    notes: 'در حال اجاره فعلی - تحویل مسقط',
    createdAt: new Date().toISOString()
  },
  {
    id: 'car-mg-gt-2',
    title: 'ام‌جی GT 2026 (#2)',
    titleEn: 'MG GT 2026 (#2)',
    brand: 'MG',
    modelYear: '2026',
    plateNumber: '48124',
    color: 'سفید صدفی',
    dailyRate: 15,
    depositAmount: 50,
    transmission: 'automatic',
    fuelType: 'بنزین',
    capacity: 5,
    status: 'available',
    imageUrl: '/cars/mg-gt-v2.webp',
    features: ['مدل 2026 جدید', 'موتور 1.5 توربو', 'صندلی چرم', 'GPS'],
    notes: 'آماده رزرو تحویل فوری',
    createdAt: new Date().toISOString()
  },
  {
    id: 'car-mg-gt-3',
    title: 'ام‌جی GT 2026 (#3)',
    titleEn: 'MG GT 2026 (#3)',
    brand: 'MG',
    modelYear: '2026',
    plateNumber: '48125',
    color: 'سفید صدفی',
    dailyRate: 15,
    depositAmount: 50,
    transmission: 'automatic',
    fuelType: 'بنزین',
    capacity: 5,
    status: 'available',
    imageUrl: '/cars/mg-gt-v2.webp',
    features: ['مدل 2026 جدید', 'کروز کنترل هوشمند', 'ترمز پارک برقی'],
    notes: 'آماده رزرو تحویل فوری',
    createdAt: new Date().toISOString()
  },

  // 2. MG 5 (1 unit)
  {
    id: 'car-mg-5-1',
    title: 'ام‌جی 5 2023',
    titleEn: 'MG 5 2023',
    brand: 'MG',
    modelYear: '2023',
    plateNumber: '59201',
    color: 'سفید',
    dailyRate: 12,
    depositAmount: 40,
    transmission: 'automatic',
    fuelType: 'بنزین',
    capacity: 5,
    status: 'available',
    imageUrl: '/cars/mg-5-v2.webp',
    features: ['کم‌مصرف', 'سیستم مولتی‌مدیا', 'بلوتوث', 'دوربین دنده عقب'],
    notes: 'بسیار کم‌مصرف و اقتصادی برای تردد شهری',
    createdAt: new Date().toISOString()
  },

  // 3. Nissan Sunny (6 units)
  {
    id: 'car-nissan-sunny-1',
    title: 'نیسان سانی 2023 (#1)',
    titleEn: 'Nissan Sunny 2023 (#1)',
    brand: 'Nissan',
    modelYear: '2023',
    plateNumber: '12301',
    color: 'سفید',
    dailyRate: 10,
    depositAmount: 40,
    transmission: 'automatic',
    fuelType: 'بنزین',
    capacity: 5,
    status: 'available',
    imageUrl: '/cars/nissan-sunny-v2.webp',
    features: ['موتور 1.6L', 'کولر قوی عُمانی', 'سنسور پارک', 'بلوتوث'],
    notes: 'خودرو بسیار تمیز، سرویس شده در نمایندگی nissan',
    createdAt: new Date().toISOString()
  },
  {
    id: 'car-nissan-sunny-2',
    title: 'نیسان سانی 2023 (#2)',
    titleEn: 'Nissan Sunny 2023 (#2)',
    brand: 'Nissan',
    modelYear: '2023',
    plateNumber: '12302',
    color: 'سفید',
    dailyRate: 10,
    depositAmount: 40,
    transmission: 'automatic',
    fuelType: 'بنزین',
    capacity: 5,
    status: 'available',
    imageUrl: '/cars/nissan-sunny-v2.webp',
    features: ['موتور 1.6L', 'کولر قوی عُمانی', 'بسیار کم‌مصرف'],
    notes: 'آماده تحویل در فرودگاه مسقط',
    createdAt: new Date().toISOString()
  },
  {
    id: 'car-nissan-sunny-3',
    title: 'نیسان سانی 2023 (#3)',
    titleEn: 'Nissan Sunny 2023 (#3)',
    brand: 'Nissan',
    modelYear: '2023',
    plateNumber: '12303',
    color: 'سفید',
    dailyRate: 10,
    depositAmount: 40,
    transmission: 'automatic',
    fuelType: 'بنزین',
    capacity: 5,
    status: 'available',
    imageUrl: '/cars/nissan-sunny-v2.webp',
    features: ['ایربگ دوتایی', 'ترمز ABS', 'ورودی AUX/USB'],
    notes: 'آماده رزرو تحویل فوری',
    createdAt: new Date().toISOString()
  },
  {
    id: 'car-nissan-sunny-4',
    title: 'نیسان سانی 2024 (#4)',
    titleEn: 'Nissan Sunny 2024 (#4)',
    brand: 'Nissan',
    modelYear: '2024',
    plateNumber: '12304',
    color: 'سفید',
    dailyRate: 11,
    depositAmount: 40,
    transmission: 'automatic',
    fuelType: 'بنزین',
    capacity: 5,
    status: 'available',
    imageUrl: '/cars/nissan-sunny-v2.webp',
    features: ['مدل 2024 صفر', 'کولر دیجیتال', 'کروز کنترل'],
    notes: 'مدل جدید 2024',
    createdAt: new Date().toISOString()
  },
  {
    id: 'car-nissan-sunny-5',
    title: 'نیسان سانی 2024 (#5)',
    titleEn: 'Nissan Sunny 2024 (#5)',
    brand: 'Nissan',
    modelYear: '2024',
    plateNumber: '12305',
    color: 'سفید',
    dailyRate: 11,
    depositAmount: 40,
    transmission: 'automatic',
    fuelType: 'بنزین',
    capacity: 5,
    status: 'available',
    imageUrl: '/cars/nissan-sunny-v2.webp',
    features: ['فرمان هیدرولیک', 'آینه‌های برقی'],
    notes: 'آماده رزرو',
    createdAt: new Date().toISOString()
  },
  {
    id: 'car-nissan-sunny-6',
    title: 'نیسان سانی 2024 (#6)',
    titleEn: 'Nissan Sunny 2024 (#6)',
    brand: 'Nissan',
    modelYear: '2024',
    plateNumber: '12306',
    color: 'سفید',
    dailyRate: 11,
    depositAmount: 40,
    transmission: 'automatic',
    fuelType: 'بنزین',
    capacity: 5,
    status: 'available',
    imageUrl: '/cars/nissan-sunny-v2.webp',
    features: ['شیشه‌ها برقی', 'قفل مرکزی'],
    notes: 'آماده رزرو',
    createdAt: new Date().toISOString()
  },

  // 4. Nissan Micra (1 unit - Model 2019, White)
  {
    id: 'car-nissan-micra-1',
    title: 'نیسان میکرا 2019',
    titleEn: 'Nissan Micra 2019',
    brand: 'Nissan',
    modelYear: '2019',
    plateNumber: '31920',
    color: 'سفید',
    dailyRate: 9,
    depositAmount: 35,
    transmission: 'automatic',
    fuelType: 'بنزین',
    capacity: 4,
    status: 'available',
    imageUrl: '/cars/nissan-micra-v2.webp',
    features: ['مدل 2019 سفید', 'هاچ‌بک جمع‌وجور', 'پارک بسیار آسان', 'مصرف سوخت فوق‌العاده پایین'],
    notes: 'مناسب‌ترین گزینه اقتصادی برای سفر و تردد شهری',
    createdAt: new Date().toISOString()
  },

  // 5. Renault Duster (2 units - 2016 Silver & 2019 White)
  {
    id: 'car-renault-duster-1',
    title: 'رنو داستر 2016',
    titleEn: 'Renault Duster 2016',
    brand: 'Renault',
    modelYear: '2016',
    plateNumber: '88401',
    color: 'نقره‌ای',
    dailyRate: 14,
    depositAmount: 50,
    transmission: 'automatic',
    fuelType: 'بنزین',
    capacity: 5,
    status: 'available',
    imageUrl: '/cars/renault-duster-2016-v2.webp',
    features: ['مدل 2016', 'شاسی‌بلند SUV', 'دیفرانسیل قوی', 'صندوق عقب جادار'],
    notes: 'شاسی‌بلند اقتصادی برای سفرهای عُمانی',
    createdAt: new Date().toISOString()
  },
  {
    id: 'car-renault-duster-2',
    title: 'رنو داستر 2019',
    titleEn: 'Renault Duster 2019',
    brand: 'Renault',
    modelYear: '2019',
    plateNumber: '88402',
    color: 'سفید',
    dailyRate: 15,
    depositAmount: 50,
    transmission: 'automatic',
    fuelType: 'بنزین',
    capacity: 5,
    status: 'available',
    imageUrl: '/cars/renault-duster-2019-v2.webp',
    features: ['مدل 2019 سفید', 'شاسی‌بلند SUV', 'رینگ اسپرت', 'سیستم کنترل پایداری ESC'],
    notes: 'شاسی‌بلند سفید مدل 2019',
    createdAt: new Date().toISOString()
  }
];

export function resolveCarImageUrl(title: string, brand: string, imageUrl?: string): string {
  if (imageUrl && (imageUrl.startsWith('data:') || imageUrl.startsWith('http://') || imageUrl.startsWith('https://'))) {
    return imageUrl;
  }
  const t = (title + ' ' + brand).toLowerCase();
  if (t.includes('gt') || t.includes('ام‌جی gt') || t.includes('mg gt')) return '/cars/mg-gt-v2.png';
  if (t.includes('mg 5') || t.includes('ام‌جی 5') || (t.includes('5') && t.includes('mg'))) return '/cars/mg-5-v2.png';
  if (t.includes('micra') || t.includes('میکرا') || t.includes('bicra')) return '/cars/nissan-micra-v2.png';
  if ((t.includes('duster') || t.includes('داستر')) && (t.includes('2016') || t.includes('نقره') || t.includes('silver'))) return '/cars/renault-duster-2016-v2.png';
  if (t.includes('duster') || t.includes('داستر')) return '/cars/renault-duster-2019-v2.png';
  if (t.includes('sunny') || t.includes('سانی')) return '/cars/nissan-sunny-v2.png';
  return imageUrl || '/cars/nissan-sunny-v2.png';
}

// --- SUPABASE PERSISTENCE ---
// Supabase is the single source of truth. Every failure is thrown so callers never report a
// save that did not happen.
function ensureOk(operation: string, error: { message: string; details?: string; code?: string } | null) {
  if (error) throw new Error(`${operation}: ${error.message}${error.code ? ` [${error.code}]` : ''}${error.details ? ` ${error.details}` : ''}`);
}

function carFromRow(item: any): Car {
  return {
    id: item.id,
    title: item.title,
    titleEn: item.title_en || undefined,
    brand: item.brand,
    modelYear: item.model_year,
    plateNumber: item.plate_number,
    color: item.color,
    dailyRate: Number(item.daily_rate),
    depositAmount: Number(item.deposit_amount),
    transmission: item.transmission || 'automatic',
    fuelType: item.fuel_type,
    capacity: item.capacity,
    status: item.status,
    imageUrl: resolveCarImageUrl(item.title, item.brand, item.image_url),
    features: item.features || [],
    notes: item.notes,
    createdAt: item.created_at,
    updatedAt: item.updated_at,
  };
}

function reservationFromRow(item: any): CarReservation {
  return {
    id: item.id,
    carId: item.car_id,
    carTitle: item.car_title,
    customerName: item.customer_name,
    customerPhone: item.customer_phone,
    customerNationalId: item.customer_national_id,
    startDate: item.start_date,
    endDate: item.end_date,
    totalPrice: Number(item.total_price),
    depositPaid: Number(item.deposit_paid),
    status: item.status,
    notes: item.notes,
    createdAt: item.created_at,
  };
}

function transactionFromRow(item: any): CarTransaction {
  return {
    id: item.id,
    reservationId: item.reservation_id,
    carId: item.car_id,
    customerName: item.customer_name,
    amount: Number(item.amount),
    type: item.type,
    paymentMethod: item.payment_method,
    description: item.description,
    receiptFileUrl: item.receipt_file_url,
    receiptFileName: item.receipt_file_name,
    transactionDate: item.transaction_date,
    createdAt: item.created_at,
  };
}

function contractFromRow(item: any): CarContract {
  const details: Partial<CarContract> = {};
  for (const [key, column, kind] of CONTRACT_DETAIL_COLUMNS) {
    const v = item[column];
    if (v === null || v === undefined) continue;
    (details as any)[key] = kind === 'number' ? Number(v) : String(v);
  }
  return {
    ...details,
    id: item.id,
    reservationId: item.reservation_id || '',
    carId: item.car_id || undefined,
    carTitle: item.car_title,
    plateNumber: item.plate_number,
    customerName: item.customer_name,
    customerPhone: item.customer_phone,
    initialOdometer: Number(item.initial_odometer),
    returnOdometer: item.return_odometer != null ? Number(item.return_odometer) : undefined,
    fuelLevel: item.fuel_level,
    depositAmount: Number(item.deposit_amount),
    depositStatus: item.deposit_status,
    handoverStatus: item.handover_status,
    checklist: item.checklist || {},
    notes: item.notes,
    createdAt: item.created_at,
  };
}

// --- CARS CRUD ---
export async function getCars(): Promise<Car[]> {
  const { data, error } = await supabase.from('cars').select('*').order('created_at', { ascending: false });
  ensureOk('cars select', error);
  // Empty table: show the starter fleet without persisting it anywhere
  if (!data || data.length === 0) return seedCars;
  return data.map(carFromRow);
}

async function getCarById(id: string): Promise<Car | undefined> {
  const { data, error } = await supabase.from('cars').select('*').eq('id', id).maybeSingle();
  ensureOk('cars select', error);
  if (data) return carFromRow(data);
  return seedCars.find(c => c.id === id);
}

export async function saveCar(carData: Partial<Car>): Promise<Car> {
  const id = carData.id || 'car-' + Math.random().toString(36).substring(2, 9);
  const now = new Date().toISOString();
  const existing = carData.id ? await getCarById(id) : undefined;

  const car: Car = {
    id,
    title: carData.title ?? existing?.title ?? 'خودرو بدون نام',
    titleEn: carData.titleEn ?? existing?.titleEn ?? '',
    brand: carData.brand ?? existing?.brand ?? '',
    modelYear: carData.modelYear ?? existing?.modelYear ?? '',
    plateNumber: carData.plateNumber ?? existing?.plateNumber ?? '',
    color: carData.color ?? existing?.color ?? '',
    dailyRate: carData.dailyRate !== undefined ? Number(carData.dailyRate) : (existing?.dailyRate || 0),
    depositAmount: carData.depositAmount !== undefined ? Number(carData.depositAmount) : (existing?.depositAmount || 0),
    transmission: carData.transmission ?? existing?.transmission ?? 'automatic',
    fuelType: carData.fuelType ?? existing?.fuelType ?? 'بنزین',
    capacity: carData.capacity !== undefined ? Number(carData.capacity) : (existing?.capacity || 5),
    status: carData.status ?? existing?.status ?? 'available',
    imageUrl: carData.imageUrl ?? existing?.imageUrl ?? '',
    features: carData.features ?? existing?.features ?? [],
    notes: carData.notes ?? existing?.notes ?? '',
    createdAt: existing?.createdAt || carData.createdAt || now,
    updatedAt: now
  };

  const { error } = await supabase.from('cars').upsert({
    id: car.id,
    title: car.title,
    title_en: car.titleEn || null,
    brand: car.brand,
    model_year: car.modelYear,
    plate_number: car.plateNumber,
    color: car.color,
    daily_rate: car.dailyRate,
    deposit_amount: car.depositAmount,
    transmission: car.transmission,
    fuel_type: car.fuelType,
    capacity: car.capacity,
    status: car.status,
    image_url: car.imageUrl,
    features: car.features,
    notes: car.notes,
    updated_at: now
  }, { onConflict: 'id' });
  ensureOk('cars upsert', error);

  return car;
}

export async function deleteCar(id: string): Promise<boolean> {
  const { error } = await supabase.from('cars').delete().eq('id', id);
  ensureOk('cars delete', error);
  return true;
}

// --- RESERVATIONS CRUD ---
export async function getReservations(): Promise<CarReservation[]> {
  const { data, error } = await supabase.from('car_reservations').select('*').order('created_at', { ascending: false });
  ensureOk('car_reservations select', error);
  return (data || []).map(reservationFromRow);
}

export async function saveReservation(resData: Partial<CarReservation>): Promise<CarReservation> {
  const id = resData.id || 'res-' + Math.random().toString(36).substring(2, 9);
  const now = new Date().toISOString();

  let existing: CarReservation | undefined;
  if (resData.id) {
    const { data, error } = await supabase.from('car_reservations').select('*').eq('id', id).maybeSingle();
    ensureOk('car_reservations select', error);
    existing = data ? reservationFromRow(data) : undefined;
  }

  const reservation: CarReservation = {
    id,
    carId: resData.carId ?? existing?.carId ?? '',
    carTitle: resData.carTitle ?? existing?.carTitle ?? '',
    customerName: resData.customerName ?? existing?.customerName ?? '',
    customerPhone: resData.customerPhone ?? existing?.customerPhone ?? '',
    customerNationalId: resData.customerNationalId ?? existing?.customerNationalId ?? '',
    startDate: resData.startDate ?? existing?.startDate ?? new Date().toISOString().split('T')[0],
    endDate: resData.endDate ?? existing?.endDate ?? new Date().toISOString().split('T')[0],
    totalPrice: resData.totalPrice !== undefined ? Number(resData.totalPrice) : (existing?.totalPrice || 0),
    depositPaid: resData.depositPaid !== undefined ? Number(resData.depositPaid) : (existing?.depositPaid || 0),
    status: resData.status ?? existing?.status ?? 'confirmed',
    notes: resData.notes ?? existing?.notes ?? '',
    createdAt: existing?.createdAt || resData.createdAt || now,
  };

  const { error } = await supabase.from('car_reservations').upsert({
    id: reservation.id,
    car_id: reservation.carId,
    car_title: reservation.carTitle,
    customer_name: reservation.customerName,
    customer_phone: reservation.customerPhone,
    customer_national_id: reservation.customerNationalId,
    start_date: reservation.startDate,
    end_date: reservation.endDate,
    total_price: reservation.totalPrice,
    deposit_paid: reservation.depositPaid,
    status: reservation.status,
    notes: reservation.notes,
  }, { onConflict: 'id' });
  ensureOk('car_reservations upsert', error);

  return reservation;
}

export class ReservationDeleteBlockedError extends Error {
  contractId: string;
  constructor(contractId: string) {
    super(`reservation has a handed-over contract ${contractId}`);
    this.contractId = contractId;
  }
}

// A reservation owns its auto-issued contract and its accounting rows, so they are removed with it.
// Once the car has actually been handed over, the contract is a real record: deletion is refused and
// the reservation should be cancelled instead.
// `force` (superadmin only) also removes a reservation whose car was already handed over.
export async function deleteReservation(id: string, options: { force?: boolean } = {}): Promise<{ contractIds: string[]; transactionIds: string[] }> {
  if (!options.force) {
    const { data: contractRows, error: contractsError } = await supabase.from('car_contracts').select('id, handover_status').eq('reservation_id', id);
    ensureOk('car_contracts select', contractsError);
    const handedOver = (contractRows || []).find(c => c.handover_status !== 'pending_delivery');
    if (handedOver) throw new ReservationDeleteBlockedError(handedOver.id);
  }

  const { data: txRows, error: txError } = await supabase.from('car_transactions').delete().eq('reservation_id', id).select('id');
  ensureOk('car_transactions delete', txError);
  const { data: deletedContracts, error: cntError } = await supabase.from('car_contracts').delete().eq('reservation_id', id).select('id');
  ensureOk('car_contracts delete', cntError);
  const { error } = await supabase.from('car_reservations').delete().eq('id', id);
  ensureOk('car_reservations delete', error);

  return {
    contractIds: (deletedContracts || []).map(c => c.id),
    transactionIds: (txRows || []).map(t => t.id),
  };
}

// --- TRANSACTIONS CRUD ---
export async function getTransactions(): Promise<CarTransaction[]> {
  const { data, error } = await supabase.from('car_transactions').select('*').order('created_at', { ascending: false });
  ensureOk('car_transactions select', error);
  return (data || []).map(transactionFromRow);
}

export async function saveTransaction(txData: Partial<CarTransaction>): Promise<CarTransaction> {
  const id = txData.id || 'tx-' + Math.random().toString(36).substring(2, 9);
  const now = new Date().toISOString();

  let existing: CarTransaction | undefined;
  if (txData.id) {
    const { data, error } = await supabase.from('car_transactions').select('*').eq('id', id).maybeSingle();
    ensureOk('car_transactions select', error);
    existing = data ? transactionFromRow(data) : undefined;
  }

  const transaction: CarTransaction = {
    id,
    reservationId: txData.reservationId ?? existing?.reservationId ?? '',
    carId: txData.carId ?? existing?.carId ?? '',
    customerName: txData.customerName ?? existing?.customerName ?? '',
    amount: txData.amount !== undefined ? Number(txData.amount) : (existing?.amount || 0),
    type: txData.type ?? existing?.type ?? 'rent_fee',
    paymentMethod: txData.paymentMethod ?? existing?.paymentMethod ?? 'bank_reza',
    description: txData.description ?? existing?.description ?? '',
    receiptFileUrl: txData.receiptFileUrl ?? existing?.receiptFileUrl ?? '',
    receiptFileName: txData.receiptFileName ?? existing?.receiptFileName ?? '',
    transactionDate: txData.transactionDate ?? existing?.transactionDate ?? new Date().toISOString().split('T')[0],
    createdAt: existing?.createdAt || txData.createdAt || now,
  };

  const { error } = await supabase.from('car_transactions').upsert({
    id: transaction.id,
    reservation_id: transaction.reservationId || null,
    car_id: transaction.carId || null,
    customer_name: transaction.customerName,
    amount: transaction.amount,
    type: transaction.type,
    payment_method: transaction.paymentMethod,
    description: transaction.description,
    receipt_file_url: transaction.receiptFileUrl,
    receipt_file_name: transaction.receiptFileName,
    transaction_date: transaction.transactionDate,
  }, { onConflict: 'id' });
  ensureOk('car_transactions upsert', error);

  return transaction;
}

export async function deleteTransaction(id: string): Promise<boolean> {
  const { error } = await supabase.from('car_transactions').delete().eq('id', id);
  ensureOk('car_transactions delete', error);
  return true;
}

// --- CONTRACTS / HANDOVER CRUD ---
export async function getContracts(): Promise<CarContract[]> {
  const { data, error } = await supabase.from('car_contracts').select('*').order('created_at', { ascending: false });
  ensureOk('car_contracts select', error);
  return (data || []).map(contractFromRow);
}

export async function saveContract(data: Partial<CarContract>): Promise<CarContract> {
  let existing: CarContract | undefined;
  if (data.id) {
    const { data: row, error: selectError } = await supabase.from('car_contracts').select('*').eq('id', data.id).maybeSingle();
    ensureOk('car_contracts select', selectError);
    existing = row ? contractFromRow(row) : undefined;
  } else if (data.reservationId) {
    // One contract per reservation: a handover updates the auto-issued contract instead of adding a duplicate
    const { data: row, error: selectError } = await supabase.from('car_contracts').select('*').eq('reservation_id', data.reservationId).maybeSingle();
    ensureOk('car_contracts select', selectError);
    existing = row ? contractFromRow(row) : undefined;
  }
  const id = data.id || existing?.id || 'CNT-' + Date.now().toString().slice(-6);

  const reservationId = data.reservationId ?? existing?.reservationId ?? '';
  let carId = data.carId ?? existing?.carId;
  if (!carId && reservationId) {
    const { data: resRow, error: resError } = await supabase.from('car_reservations').select('car_id').eq('id', reservationId).maybeSingle();
    ensureOk('car_reservations select', resError);
    carId = resRow?.car_id || undefined;
  }

  const contract: CarContract = {
    id,
    reservationId,
    carId,
    carTitle: data.carTitle ?? existing?.carTitle ?? '',
    plateNumber: data.plateNumber ?? existing?.plateNumber ?? '',
    customerName: data.customerName ?? existing?.customerName ?? '',
    customerPhone: data.customerPhone ?? existing?.customerPhone ?? '',
    initialOdometer: data.initialOdometer !== undefined ? Number(data.initialOdometer) : (existing?.initialOdometer || 0),
    returnOdometer: data.returnOdometer !== undefined ? Number(data.returnOdometer) : existing?.returnOdometer,
    fuelLevel: data.fuelLevel ?? existing?.fuelLevel ?? 'full',
    depositAmount: data.depositAmount !== undefined ? Number(data.depositAmount) : (existing?.depositAmount || 0),
    depositStatus: data.depositStatus ?? existing?.depositStatus ?? 'held',
    handoverStatus: data.handoverStatus ?? existing?.handoverStatus ?? 'delivered',
    checklist: data.checklist ?? existing?.checklist ?? {},
    notes: data.notes ?? existing?.notes ?? '',
    createdAt: existing?.createdAt || data.createdAt || new Date().toISOString(),
  };

  // Details not sent in this save keep their stored value
  const detailRow: Record<string, unknown> = {};
  for (const [key, column, kind] of CONTRACT_DETAIL_COLUMNS) {
    const value = key in data ? data[key] : existing?.[key];
    (contract as any)[key] = value === '' || value === null ? undefined : value;
    detailRow[column] = detailToColumn(value, kind);
  }

  const { error } = await supabase.from('car_contracts').upsert({
    ...detailRow,
    id: contract.id,
    reservation_id: contract.reservationId || null,
    car_id: contract.carId || null,
    car_title: contract.carTitle,
    plate_number: contract.plateNumber,
    customer_name: contract.customerName,
    customer_phone: contract.customerPhone,
    initial_odometer: contract.initialOdometer,
    return_odometer: contract.returnOdometer ?? null,
    fuel_level: contract.fuelLevel,
    deposit_amount: contract.depositAmount,
    deposit_status: contract.depositStatus,
    handover_status: contract.handoverStatus,
    checklist: contract.checklist,
    notes: contract.notes,
  }, { onConflict: 'id' });
  ensureOk('car_contracts upsert', error);

  return contract;
}

// Extra-km and accident amounts from the contract are their own income rows for the reservation, so the
// original rent revenue stays untouched. A cleared amount removes its row.
export async function syncContractExtraCharges(contract: CarContract): Promise<void> {
  if (!contract.reservationId) return;
  const charges = [
    { id: `tx-xkm-${contract.reservationId}`, amount: contract.extraKmAmount || 0, label: 'کیلومتر اضافه' },
    { id: `tx-dmg-${contract.reservationId}`, amount: contract.deductionsAmount || 0, label: 'خسارت/حادثه' },
  ];
  const { data: rows, error } = await supabase.from('car_transactions').select('*').in('id', charges.map(c => c.id));
  ensureOk('car_transactions select', error);
  const existing = new Map((rows || []).map(r => [r.id, transactionFromRow(r)]));

  for (const charge of charges) {
    const current = existing.get(charge.id);
    if (charge.amount > 0) {
      if (current?.amount === charge.amount) continue;
      await saveTransaction({
        id: charge.id,
        reservationId: contract.reservationId,
        carId: contract.carId,
        customerName: contract.customerName,
        amount: charge.amount,
        type: 'other_income',
        description: `${charge.label} - قرارداد ${contract.id} (${contract.customerName})`,
        transactionDate: contract.endDate || new Date().toISOString().split('T')[0],
      });
    } else if (current) {
      await deleteTransaction(charge.id);
    }
  }
}

// Superadmin cleanup: removes a contract even after handover, together with its reservation and
// every accounting row of that reservation. A contract without a reservation is removed on its own.
export async function deleteContract(id: string): Promise<{ reservationId?: string; contractIds: string[]; transactionIds: string[] }> {
  const { data: row, error: selectError } = await supabase.from('car_contracts').select('id, reservation_id').eq('id', id).maybeSingle();
  ensureOk('car_contracts select', selectError);
  if (!row) return { contractIds: [], transactionIds: [] };

  if (row.reservation_id) {
    const removed = await deleteReservation(row.reservation_id, { force: true });
    return { reservationId: row.reservation_id, ...removed };
  }

  const { error } = await supabase.from('car_contracts').delete().eq('id', id);
  ensureOk('car_contracts delete', error);
  return { contractIds: [id], transactionIds: [] };
}

// --- RESERVATION CHAIN: reservation -> contract -> accounting revenue ---
async function nextContractSerial(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `CNT-${year}-`;
  const contracts = await getContracts();
  const maxSeq = contracts.reduce((max, c) => {
    if (!c.id.startsWith(prefix)) return max;
    const n = parseInt(c.id.slice(prefix.length), 10);
    return Number.isNaN(n) ? max : Math.max(max, n);
  }, 0);
  return `${prefix}${String(maxSeq + 1).padStart(4, '0')}`;
}

// Idempotent: re-running for the same reservation never creates a duplicate contract or revenue row.
export async function issueContractAndRevenue(
  reservation: CarReservation,
  paymentMethod: CarTransaction['paymentMethod'] = 'bank_reza'
): Promise<{ contract: CarContract; transaction?: CarTransaction; depositTransaction?: CarTransaction }> {
  const contracts = await getContracts();
  let contract = contracts.find(c => c.reservationId === reservation.id);

  if (!contract) {
    const cars = await getCars();
    const car = cars.find(c => c.id === reservation.carId);
    contract = await saveContract({
      id: await nextContractSerial(),
      reservationId: reservation.id,
      carId: reservation.carId,
      carTitle: reservation.carTitle || car?.title || '',
      plateNumber: car?.plateNumber || '',
      customerName: reservation.customerName,
      customerPhone: reservation.customerPhone,
      depositAmount: reservation.depositPaid,
      startDate: reservation.startDate,
      endDate: reservation.endDate,
      totalPrice: reservation.totalPrice,
      customerNationalId: reservation.customerNationalId,
      handoverStatus: 'pending_delivery',
    });
  }

  let transaction: CarTransaction | undefined;
  if (reservation.totalPrice > 0) {
    const txId = `tx-rent-${reservation.id}`;
    const transactions = await getTransactions();
    transaction = transactions.find(t => t.id === txId);
    if (!transaction) {
      transaction = await saveTransaction({
        id: txId,
        reservationId: reservation.id,
        carId: reservation.carId,
        customerName: reservation.customerName,
        amount: reservation.totalPrice,
        type: 'rent_fee',
        paymentMethod,
        description: `درآمد اجاره ${reservation.carTitle || 'خودرو'} - قرارداد ${contract.id}`,
        transactionDate: reservation.startDate,
      });
    }
  }

  // Customer deposit is a liability, kept as its own deposit_in row so it never counts as rent revenue
  let depositTransaction: CarTransaction | undefined;
  if (reservation.depositPaid > 0) {
    const depId = `tx-dep-${reservation.id}`;
    const transactions = await getTransactions();
    depositTransaction = transactions.find(t => t.id === depId);
    if (!depositTransaction) {
      depositTransaction = await saveTransaction({
        id: depId,
        reservationId: reservation.id,
        carId: reservation.carId,
        customerName: reservation.customerName,
        amount: reservation.depositPaid,
        type: 'deposit_in',
        paymentMethod: 'cash_mohammadi',
        description: `ودیعه نقد اجاره ${reservation.carTitle || 'خودرو'} (${reservation.customerName})`,
        transactionDate: reservation.startDate,
      });
    }
  }

  return { contract, transaction, depositTransaction };
}

import fs from 'fs';
import path from 'path';
import { supabase } from './supabase';

export interface Car {
  id: string;
  title: string;
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

// In-Memory Fallback Stores
let memoryCars: Car[] = [
  // 1. MG GT (3 units - All Model Year 2026, All White)
  {
    id: 'car-mg-gt-1',
    title: 'ام‌جی GT 2026 (سفید صدفی #1)',
    brand: 'MG',
    modelYear: '2026',
    plateNumber: 'مسقط - 48123',
    color: 'سفید صدفی',
    dailyRate: 15,
    depositAmount: 50,
    transmission: 'automatic',
    fuelType: 'بنزین',
    capacity: 5,
    status: 'available',
    imageUrl: '/cars/mg-gt.png',
    features: ['مدل 2026 جدید', 'موتور 1.5 توربو', 'دنده اتوماتیک 7 سرعته', 'سقف پانوراما', 'دوربین 360'],
    notes: 'خودرو نو، صفر کیلومتر 2026 جهت اجاره در مسقط',
    createdAt: new Date().toISOString()
  },
  {
    id: 'car-mg-gt-2',
    title: 'ام‌جی GT 2026 (سفید صدفی #2)',
    brand: 'MG',
    modelYear: '2026',
    plateNumber: 'مسقط - 48124',
    color: 'سفید صدفی',
    dailyRate: 15,
    depositAmount: 50,
    transmission: 'automatic',
    fuelType: 'بنزین',
    capacity: 5,
    status: 'rented',
    imageUrl: '/cars/mg-gt.png',
    features: ['مدل 2026 جدید', 'موتور 1.5 توربو', 'صندلی چرم', 'GPS'],
    notes: 'در حال اجاره فعلی',
    createdAt: new Date().toISOString()
  },
  {
    id: 'car-mg-gt-3',
    title: 'ام‌جی GT 2026 (سفید صدفی #3)',
    brand: 'MG',
    modelYear: '2026',
    plateNumber: 'مسقط - 48125',
    color: 'سفید صدفی',
    dailyRate: 15,
    depositAmount: 50,
    transmission: 'automatic',
    fuelType: 'بنزین',
    capacity: 5,
    status: 'available',
    imageUrl: '/cars/mg-gt.png',
    features: ['مدل 2026 جدید', 'کروز کنترل هوشمند', 'ترمز پارک برقی'],
    notes: 'آماده رزرو تحویل فوری',
    createdAt: new Date().toISOString()
  },

  // 2. MG 5 (1 unit)
  {
    id: 'car-mg-5-1',
    title: 'ام‌جی 5 2023 (قرمز)',
    brand: 'MG',
    modelYear: '2023',
    plateNumber: 'مسقط - 59201',
    color: 'قرمز',
    dailyRate: 12,
    depositAmount: 40,
    transmission: 'automatic',
    fuelType: 'بنزین',
    capacity: 5,
    status: 'available',
    imageUrl: '/cars/mg-5.png',
    features: ['کم‌مصرف', 'سیستم مولتی‌مدیا', 'بلوتوث', 'دوربین دنده عقب'],
    notes: 'بسیار کم‌مصرف و اقتصادی برای تردد شهری',
    createdAt: new Date().toISOString()
  },

  // 3. Nissan Sunny (6 units)
  {
    id: 'car-nissan-sunny-1',
    title: 'نیسان سانی 2023 (نقره‌ای #1)',
    brand: 'Nissan',
    modelYear: '2023',
    plateNumber: 'مسقط - 12301',
    color: 'نقره‌ای',
    dailyRate: 10,
    depositAmount: 40,
    transmission: 'automatic',
    fuelType: 'بنزین',
    capacity: 5,
    status: 'available',
    imageUrl: '/cars/nissan-sunny.png',
    features: ['موتور 1.6L', 'کولر قوی عُمانی', 'سنسور پارک', 'بلوتوث'],
    notes: 'خودرو بسیار تمیز، سرویس شده در نمایندگی nissan',
    createdAt: new Date().toISOString()
  },
  {
    id: 'car-nissan-sunny-2',
    title: 'نیسان سانی 2023 (نقره‌ای #2)',
    brand: 'Nissan',
    modelYear: '2023',
    plateNumber: 'مسقط - 12302',
    color: 'نقره‌ای',
    dailyRate: 10,
    depositAmount: 40,
    transmission: 'automatic',
    fuelType: 'بنزین',
    capacity: 5,
    status: 'available',
    imageUrl: '/cars/nissan-sunny.png',
    features: ['موتور 1.6L', 'کولر قوی عُمانی', 'بسیار کم‌مصرف'],
    notes: 'آماده تحویل در فرودگاه مسقط',
    createdAt: new Date().toISOString()
  },
  {
    id: 'car-nissan-sunny-3',
    title: 'نیسان سانی 2023 (سفید #3)',
    brand: 'Nissan',
    modelYear: '2023',
    plateNumber: 'مسقط - 12303',
    color: 'سفید',
    dailyRate: 10,
    depositAmount: 40,
    transmission: 'automatic',
    fuelType: 'بنزین',
    capacity: 5,
    status: 'rented',
    imageUrl: '/cars/nissan-sunny.png',
    features: ['ایربگ دوتایی', 'ترمز ABS', 'ورودی AUX/USB'],
    notes: 'در حال اجاره',
    createdAt: new Date().toISOString()
  },
  {
    id: 'car-nissan-sunny-4',
    title: 'نیسان سانی 2024 (سفید #4)',
    brand: 'Nissan',
    modelYear: '2024',
    plateNumber: 'مسقط - 12304',
    color: 'سفید',
    dailyRate: 11,
    depositAmount: 40,
    transmission: 'automatic',
    fuelType: 'بنزین',
    capacity: 5,
    status: 'available',
    imageUrl: '/cars/nissan-sunny.png',
    features: ['مدل 2024 صفر', 'کولر دیجیتال', 'کروز کنترل'],
    notes: 'مدل جدید 2024',
    createdAt: new Date().toISOString()
  },
  {
    id: 'car-nissan-sunny-5',
    title: 'نیسان سانی 2024 (نوک مدادی #5)',
    brand: 'Nissan',
    modelYear: '2024',
    plateNumber: 'مسقط - 12305',
    color: 'نوک مدادی',
    dailyRate: 11,
    depositAmount: 40,
    transmission: 'automatic',
    fuelType: 'بنزین',
    capacity: 5,
    status: 'available',
    imageUrl: '/cars/nissan-sunny.png',
    features: ['رنگ نوک مدادی خاص', 'فرمان هیدرولیک', 'آینه‌های برقی'],
    notes: 'آماده رزرو',
    createdAt: new Date().toISOString()
  },
  {
    id: 'car-nissan-sunny-6',
    title: 'نیسان سانی 2024 (مشکی #6)',
    brand: 'Nissan',
    modelYear: '2024',
    plateNumber: 'مسقط - 12306',
    color: 'مشکی',
    dailyRate: 11,
    depositAmount: 40,
    transmission: 'automatic',
    fuelType: 'بنزین',
    capacity: 5,
    status: 'available',
    imageUrl: '/cars/nissan-sunny.png',
    features: ['مدل 2024 مشکی', 'شیشه‌ها برقی', 'قفل مرکزی'],
    notes: 'آماده رزرو',
    createdAt: new Date().toISOString()
  },

  // 4. Nissan Micra (1 unit - Model 2019, White)
  {
    id: 'car-nissan-micra-1',
    title: 'نیسان میکرا 2019 (سفید)',
    brand: 'Nissan',
    modelYear: '2019',
    plateNumber: 'مسقط - 31920',
    color: 'سفید',
    dailyRate: 9,
    depositAmount: 35,
    transmission: 'automatic',
    fuelType: 'بنزین',
    capacity: 4,
    status: 'available',
    imageUrl: '/cars/nissan-micra.png',
    features: ['مدل 2019 سفید', 'هاچ‌بک جمع‌وجور', 'پارک بسیار آسان', 'مصرف سوخت فوق‌العاده پایین'],
    notes: 'مناسب‌ترین گزینه اقتصادی برای سفر و تردد شهری',
    createdAt: new Date().toISOString()
  },

  // 5. Renault Duster (2 units - 2016 Silver & 2019 White)
  {
    id: 'car-renault-duster-1',
    title: 'رنو داستر 2016 (نقره‌ای)',
    brand: 'Renault',
    modelYear: '2016',
    plateNumber: 'مسقط - 88401',
    color: 'نقره‌ای',
    dailyRate: 14,
    depositAmount: 50,
    transmission: 'automatic',
    fuelType: 'بنزین',
    capacity: 5,
    status: 'available',
    imageUrl: '/cars/renault-duster-2016.png',
    features: ['مدل 2016', 'شاسی‌بلند SUV', 'دیفرانسیل قوی', 'صندوق عقب جادار'],
    notes: 'شاسی‌بلند اقتصادی برای سفرهای عُمانی',
    createdAt: new Date().toISOString()
  },
  {
    id: 'car-renault-duster-2',
    title: 'رنو داستر 2019 (سفید)',
    brand: 'Renault',
    modelYear: '2019',
    plateNumber: 'مسقط - 88402',
    color: 'سفید',
    dailyRate: 15,
    depositAmount: 50,
    transmission: 'automatic',
    fuelType: 'بنزین',
    capacity: 5,
    status: 'available',
    imageUrl: '/cars/renault-duster-2019.png',
    features: ['مدل 2019 سفید', 'شاسی‌بلند SUV', 'رینگ اسپرت', 'سیستم کنترل پایداری ESC'],
    notes: 'شاسی‌بلند سفید مدل 2019',
    createdAt: new Date().toISOString()
  }
];

let memoryReservations: CarReservation[] = [
  {
    id: 'res-1',
    carId: 'car-2',
    carTitle: 'دوج چارجر GT',
    customerName: 'رضا علوی',
    customerPhone: '+96891234567',
    startDate: new Date(Date.now() - 2 * 86400000).toISOString().split('T')[0],
    endDate: new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0],
    totalPrice: 175,
    depositPaid: 120,
    status: 'active',
    notes: 'تحویل در فرودگاه مسقط',
    createdAt: new Date().toISOString()
  }
];

let memoryTransactions: CarTransaction[] = [
  {
    id: 'tx-1',
    reservationId: 'res-1',
    carId: 'car-2',
    customerName: 'رضا علوی',
    amount: 175,
    type: 'rent_fee',
    paymentMethod: 'bank_reza',
    description: 'دریافت کرایه کامل دوج چارجر',
    transactionDate: new Date().toISOString().split('T')[0],
    createdAt: new Date().toISOString()
  },
  {
    id: 'tx-2',
    reservationId: 'res-1',
    carId: 'car-2',
    customerName: 'رضا علوی',
    amount: 120,
    type: 'deposit_in',
    paymentMethod: 'cash_mohammadi',
    description: 'ودیعه نقد دریافتی',
    transactionDate: new Date().toISOString().split('T')[0],
    createdAt: new Date().toISOString()
  }
];

export function resolveCarImageUrl(title: string, brand: string, imageUrl?: string): string {
  if (imageUrl && (imageUrl.startsWith('data:') || imageUrl.startsWith('http://') || imageUrl.startsWith('https://'))) {
    return imageUrl;
  }
  const t = (title + ' ' + brand).toLowerCase();
  if (t.includes('gt') || t.includes('ام‌جی gt') || t.includes('mg gt')) return '/cars/mg-gt.png';
  if (t.includes('mg 5') || t.includes('ام‌جی 5') || (t.includes('5') && t.includes('mg'))) return '/cars/mg-5.png';
  if (t.includes('micra') || t.includes('میکرا') || t.includes('bicra')) return '/cars/nissan-micra.png';
  if ((t.includes('duster') || t.includes('داستر')) && (t.includes('2016') || t.includes('نقره') || t.includes('silver'))) return '/cars/renault-duster-2016.png';
  if (t.includes('duster') || t.includes('داستر')) return '/cars/renault-duster-2019.png';
  if (t.includes('sunny') || t.includes('سانی')) return '/cars/nissan-sunny.png';
  return imageUrl || '/cars/nissan-sunny.png';
}

// --- DISK PERSISTENCE HELPERS ---
const DATA_FILE = path.join(process.cwd(), 'data', 'cars-db.json');

function ensureDataDirExists() {
  try {
    const dir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  } catch (err) {}
}

function loadDiskStore(): { cars: Car[]; reservations: CarReservation[]; transactions: CarTransaction[] } {
  try {
    ensureDataDirExists();
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf8');
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.cars) && parsed.cars.length > 0) {
        return {
          cars: parsed.cars,
          reservations: Array.isArray(parsed.reservations) ? parsed.reservations : memoryReservations,
          transactions: Array.isArray(parsed.transactions) ? parsed.transactions : memoryTransactions,
        };
      }
    }
  } catch (err) {
    console.warn('Error reading cars-db.json:', err);
  }

  const initial = {
    cars: memoryCars,
    reservations: memoryReservations,
    transactions: memoryTransactions,
  };
  saveDiskStore(initial);
  return initial;
}

function saveDiskStore(store: { cars: Car[]; reservations: CarReservation[]; transactions: CarTransaction[] }) {
  try {
    ensureDataDirExists();
    fs.writeFileSync(DATA_FILE, JSON.stringify(store, null, 2), 'utf8');
  } catch (err) {
    console.warn('Error writing cars-db.json:', err);
  }
}

// --- CARS CRUD ---
export async function getCars(): Promise<Car[]> {
  const store = loadDiskStore();
  try {
    const { data, error } = await supabase.from('cars').select('*').order('created_at', { ascending: false });
    if (!error && data && data.length > 0) {
      const dbCars = data.map((item: any) => ({
        id: item.id,
        title: item.title,
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
      }));
      store.cars = dbCars;
      saveDiskStore(store);
      return dbCars;
    }
  } catch (err) {}
  return store.cars;
}

export async function saveCar(carData: Partial<Car>): Promise<Car> {
  const store = loadDiskStore();
  const isEdit = Boolean(carData.id);
  const id = carData.id || 'car-' + Math.random().toString(36).substring(2, 9);
  const now = new Date().toISOString();

  const existing = store.cars.find(c => c.id === id);

  const car: Car = {
    id,
    title: carData.title ?? existing?.title ?? 'خودرو بدون نام',
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

  if (isEdit && store.cars.some(c => c.id === id)) {
    store.cars = store.cars.map(c => c.id === id ? car : c);
  } else {
    store.cars.unshift(car);
  }
  saveDiskStore(store);

  try {
    const dbRow = {
      id: car.id,
      title: car.title,
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
    };
    await supabase.from('cars').upsert(dbRow, { onConflict: 'id' });
  } catch (err) {}

  return car;
}

export async function deleteCar(id: string): Promise<boolean> {
  const store = loadDiskStore();
  store.cars = store.cars.filter(c => c.id !== id);
  saveDiskStore(store);
  try {
    await supabase.from('cars').delete().eq('id', id);
  } catch (err) {}
  return true;
}

// --- RESERVATIONS CRUD ---
export async function getReservations(): Promise<CarReservation[]> {
  const store = loadDiskStore();
  try {
    const { data, error } = await supabase.from('car_reservations').select('*').order('created_at', { ascending: false });
    if (!error && data && data.length > 0) {
      const dbRes = data.map((item: any) => ({
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
      }));
      store.reservations = dbRes;
      saveDiskStore(store);
      return dbRes;
    }
  } catch (err) {}
  return store.reservations;
}

export async function saveReservation(resData: Partial<CarReservation>): Promise<CarReservation> {
  const store = loadDiskStore();
  const isEdit = Boolean(resData.id);
  const id = resData.id || 'res-' + Math.random().toString(36).substring(2, 9);
  const now = new Date().toISOString();

  const existing = store.reservations.find(r => r.id === id);

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

  if (isEdit && store.reservations.some(r => r.id === id)) {
    store.reservations = store.reservations.map(r => r.id === id ? reservation : r);
  } else {
    store.reservations.unshift(reservation);
  }
  saveDiskStore(store);

  try {
    const dbRow = {
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
    };
    await supabase.from('car_reservations').upsert(dbRow, { onConflict: 'id' });
  } catch (err) {}

  return reservation;
}

export async function deleteReservation(id: string): Promise<boolean> {
  const store = loadDiskStore();
  store.reservations = store.reservations.filter(r => r.id !== id);
  saveDiskStore(store);
  try {
    await supabase.from('car_reservations').delete().eq('id', id);
  } catch (err) {}
  return true;
}

// --- TRANSACTIONS CRUD ---
export async function getTransactions(): Promise<CarTransaction[]> {
  const store = loadDiskStore();
  try {
    const { data, error } = await supabase.from('car_transactions').select('*').order('created_at', { ascending: false });
    if (!error && data && data.length > 0) {
      const dbTx = data.map((item: any) => ({
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
      }));
      store.transactions = dbTx;
      saveDiskStore(store);
      return dbTx;
    }
  } catch (err) {}
  return store.transactions;
}

export async function saveTransaction(txData: Partial<CarTransaction>): Promise<CarTransaction> {
  const store = loadDiskStore();
  const isEdit = Boolean(txData.id);
  const id = txData.id || 'tx-' + Math.random().toString(36).substring(2, 9);
  const now = new Date().toISOString();

  const existing = store.transactions.find(t => t.id === id);

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

  if (isEdit && store.transactions.some(t => t.id === id)) {
    store.transactions = store.transactions.map(t => t.id === id ? transaction : t);
  } else {
    store.transactions.unshift(transaction);
  }
  saveDiskStore(store);

  try {
    const dbRow = {
      id: transaction.id,
      reservation_id: transaction.reservationId,
      car_id: transaction.carId,
      customer_name: transaction.customerName,
      amount: transaction.amount,
      type: transaction.type,
      payment_method: transaction.paymentMethod,
      description: transaction.description,
      receipt_file_url: transaction.receiptFileUrl,
      receipt_file_name: transaction.receiptFileName,
      transaction_date: transaction.transactionDate,
    };
    await supabase.from('car_transactions').upsert(dbRow, { onConflict: 'id' });
  } catch (err) {}

  return transaction;
}

export async function deleteTransaction(id: string): Promise<boolean> {
  const store = loadDiskStore();
  store.transactions = store.transactions.filter(t => t.id !== id);
  saveDiskStore(store);
  try {
    await supabase.from('car_transactions').delete().eq('id', id);
  } catch (err) {}
  return true;
}

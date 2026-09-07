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
  {
    id: 'car-1',
    title: 'نیسان پاترول 2023',
    brand: 'Nissan',
    modelYear: '2023',
    plateNumber: 'مسقط - 48209',
    color: 'مشکی متالیک',
    dailyRate: 45,
    depositAmount: 150,
    transmission: 'automatic',
    fuelType: 'بنزین',
    capacity: 7,
    status: 'available',
    imageUrl: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?q=80&w=800&auto=format&fit=crop',
    features: ['دنده اتوماتیک', 'صندلی چرم', 'سقف پانوراما', 'سیستم صوتی حرفه‌ای', 'GPS'],
    notes: 'خودرو بسیار تمیز و تازه سرویس شده در مسقط',
    createdAt: new Date().toISOString()
  },
  {
    id: 'car-2',
    title: 'دوج چارجر GT',
    brand: 'Dodge',
    modelYear: '2022',
    plateNumber: 'مسقط - 12345',
    color: 'سفید صدفی',
    dailyRate: 35,
    depositAmount: 120,
    transmission: 'automatic',
    fuelType: 'بنزین',
    capacity: 5,
    status: 'rented',
    imageUrl: 'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?q=80&w=800&auto=format&fit=crop',
    features: ['موتور V6', 'کروز کنترل', 'دوربین ۳۶۰'],
    notes: 'تحویل داده شده تا فردا',
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

// --- CARS CRUD ---
export async function getCars(): Promise<Car[]> {
  try {
    const { data, error } = await supabase.from('cars').select('*').order('created_at', { ascending: false });
    if (!error && data) {
      return data.map((item: any) => ({
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
        imageUrl: item.image_url,
        features: item.features || [],
        notes: item.notes,
        createdAt: item.created_at,
        updatedAt: item.updated_at,
      }));
    }
  } catch (err) {
    console.warn('Supabase cars table fetch failed, using memory fallback:', err);
  }
  return memoryCars;
}

export async function saveCar(carData: Partial<Car>): Promise<Car> {
  const isEdit = Boolean(carData.id);
  const id = carData.id || 'car-' + Math.random().toString(36).substring(2, 9);
  
  const now = new Date().toISOString();
  const car: Car = {
    id,
    title: carData.title || 'خودرو بدون نام',
    brand: carData.brand || '',
    modelYear: carData.modelYear || '',
    plateNumber: carData.plateNumber || '',
    color: carData.color || '',
    dailyRate: Number(carData.dailyRate) || 0,
    depositAmount: Number(carData.depositAmount) || 0,
    transmission: carData.transmission || 'automatic',
    fuelType: carData.fuelType || 'بنزین',
    capacity: carData.capacity || 5,
    status: carData.status || 'available',
    imageUrl: carData.imageUrl || '',
    features: carData.features || [],
    notes: carData.notes || '',
    createdAt: carData.createdAt || now,
    updatedAt: now
  };

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

    const { error } = await supabase.from('cars').upsert(dbRow, { onConflict: 'id' });
    if (error) console.warn('Supabase car save error, saving to memory fallback:', error);
  } catch (err) {
    console.warn('Supabase car save exception:', err);
  }

  if (isEdit) {
    memoryCars = memoryCars.map(c => c.id === id ? car : c);
  } else {
    memoryCars.unshift(car);
  }
  return car;
}

export async function deleteCar(id: string): Promise<boolean> {
  try {
    await supabase.from('cars').delete().eq('id', id);
  } catch (err) {}
  memoryCars = memoryCars.filter(c => c.id !== id);
  return true;
}

// --- RESERVATIONS CRUD ---
export async function getReservations(): Promise<CarReservation[]> {
  try {
    const { data, error } = await supabase.from('car_reservations').select('*').order('created_at', { ascending: false });
    if (!error && data) {
      return data.map((item: any) => ({
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
    }
  } catch (err) {
    console.warn('Supabase reservations fetch error:', err);
  }
  return memoryReservations;
}

export async function saveReservation(resData: Partial<CarReservation>): Promise<CarReservation> {
  const isEdit = Boolean(resData.id);
  const id = resData.id || 'res-' + Math.random().toString(36).substring(2, 9);
  const now = new Date().toISOString();

  const reservation: CarReservation = {
    id,
    carId: resData.carId || '',
    carTitle: resData.carTitle || '',
    customerName: resData.customerName || '',
    customerPhone: resData.customerPhone || '',
    customerNationalId: resData.customerNationalId || '',
    startDate: resData.startDate || new Date().toISOString().split('T')[0],
    endDate: resData.endDate || new Date().toISOString().split('T')[0],
    totalPrice: Number(resData.totalPrice) || 0,
    depositPaid: Number(resData.depositPaid) || 0,
    status: resData.status || 'confirmed',
    notes: resData.notes || '',
    createdAt: resData.createdAt || now,
  };

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

    const { error } = await supabase.from('car_reservations').upsert(dbRow, { onConflict: 'id' });
    if (error) console.warn('Supabase reservation save error:', error);
  } catch (err) {}

  if (isEdit) {
    memoryReservations = memoryReservations.map(r => r.id === id ? reservation : r);
  } else {
    memoryReservations.unshift(reservation);
  }
  return reservation;
}

export async function deleteReservation(id: string): Promise<boolean> {
  try {
    await supabase.from('car_reservations').delete().eq('id', id);
  } catch (err) {}
  memoryReservations = memoryReservations.filter(r => r.id !== id);
  return true;
}

// --- TRANSACTIONS CRUD ---
export async function getTransactions(): Promise<CarTransaction[]> {
  try {
    const { data, error } = await supabase.from('car_transactions').select('*').order('created_at', { ascending: false });
    if (!error && data) {
      return data.map((item: any) => ({
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
    }
  } catch (err) {
    console.warn('Supabase transactions fetch error:', err);
  }
  return memoryTransactions;
}

export async function saveTransaction(txData: Partial<CarTransaction>): Promise<CarTransaction> {
  const isEdit = Boolean(txData.id);
  const id = txData.id || 'tx-' + Math.random().toString(36).substring(2, 9);
  const now = new Date().toISOString();

  const transaction: CarTransaction = {
    id,
    reservationId: txData.reservationId || '',
    carId: txData.carId || '',
    customerName: txData.customerName || '',
    amount: Number(txData.amount) || 0,
    type: txData.type || 'rent_fee',
    paymentMethod: txData.paymentMethod || 'bank_reza',
    description: txData.description || '',
    receiptFileUrl: txData.receiptFileUrl || '',
    receiptFileName: txData.receiptFileName || '',
    transactionDate: txData.transactionDate || new Date().toISOString().split('T')[0],
    createdAt: txData.createdAt || now,
  };

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

    const { error } = await supabase.from('car_transactions').upsert(dbRow, { onConflict: 'id' });
    if (error) console.warn('Supabase transaction save error:', error);
  } catch (err) {}

  if (isEdit) {
    memoryTransactions = memoryTransactions.map(t => t.id === id ? transaction : t);
  } else {
    memoryTransactions.unshift(transaction);
  }
  return transaction;
}

export async function deleteTransaction(id: string): Promise<boolean> {
  try {
    await supabase.from('car_transactions').delete().eq('id', id);
  } catch (err) {}
  memoryTransactions = memoryTransactions.filter(t => t.id !== id);
  return true;
}

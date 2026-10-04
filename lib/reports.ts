import type { CarTransaction, PaymentMethod } from './db-cars';

// Financial reports from the accounting rows (car_transactions), filterable by date, car and category.
// Only paid rows move money; pending rows are what customers still owe. A deposit is money held for the
// customer, so it is reported on its own and never counted as income.

export type ReportCategory = 'rent' | 'extraKm' | 'damage' | 'otherIncome' | 'depositIn' | 'depositRefund' | 'maintenance';

export const REPORT_CATEGORIES: ReportCategory[] = ['rent', 'extraKm', 'damage', 'otherIncome', 'depositIn', 'depositRefund', 'maintenance'];

export const CATEGORY_LABELS: Record<ReportCategory, string> = {
  rent: 'درآمد اجاره',
  extraKm: 'کیلومتر اضافه',
  damage: 'حادثه / خسارت',
  otherIncome: 'سایر درآمدها',
  depositIn: 'ودیعه‌ی دریافتی',
  depositRefund: 'عودت ودیعه',
  maintenance: 'هزینه سرویس و تعمیرات',
};

export const METHOD_LABELS: Record<PaymentMethod, string> = {
  bank_reza: 'حساب رضا اماره',
  bank_mohammadi: 'حساب محمدی',
  cash_reza: 'نقد رضا اماره',
  cash_mohammadi: 'نقد محمدی',
};

const INCOME: ReportCategory[] = ['rent', 'extraKm', 'damage', 'otherIncome'];
const INCOMING_TYPES: CarTransaction['type'][] = ['rent_fee', 'deposit_in', 'other_income'];
const METHODS: PaymentMethod[] = ['bank_reza', 'bank_mohammadi', 'cash_reza', 'cash_mohammadi'];

/** Which report category a row belongs to (extra-km and damage charges are told apart by their row id) */
export function categoryOf(tx: Pick<CarTransaction, 'id' | 'type'>): ReportCategory {
  switch (tx.type) {
    case 'rent_fee': return 'rent';
    case 'deposit_in': return 'depositIn';
    case 'deposit_refund': return 'depositRefund';
    case 'maintenance_expense': return 'maintenance';
    default:
      if (tx.id.startsWith('tx-xkm-')) return 'extraKm';
      if (tx.id.startsWith('tx-dmg-')) return 'damage';
      return 'otherIncome';
  }
}

export const NO_CAR = '__none__';

export interface ReportFilter {
  from?: string; // YYYY-MM-DD, inclusive
  to?: string; // YYYY-MM-DD, inclusive
  carId?: string; // '' / undefined = every car, NO_CAR = rows not tied to a car
  categories?: ReportCategory[]; // undefined / empty = every category
}

export interface CategoryRow {
  category: ReportCategory;
  count: number;
  paid: number;
  pending: number;
}

export interface CarRow {
  carId: string; // NO_CAR for rows without a car
  byCategory: Record<ReportCategory, number>; // paid amounts
  totalIncome: number;
  maintenance: number;
  net: number;
  depositsHeld: number;
  receivables: number;
  count: number;
}

export interface MonthlyRow { month: string; income: number; expense: number; net: number }
export interface AccountRow { method: PaymentMethod; incoming: number; outgoing: number; balance: number }
export interface ReceivableRow { customerName: string; owed: number; rows: number }

export interface FinancialReport {
  byCategory: CategoryRow[];
  totalIncome: number;
  maintenanceExpense: number;
  netResult: number;
  depositsReceived: number;
  depositsRefunded: number;
  depositsHeld: number;
  receivables: number;
  unconfirmed: number;
  unconfirmedCount: number;
  byCar: CarRow[];
  accounts: AccountRow[];
  monthly: MonthlyRow[];
  receivablesByCustomer: ReceivableRow[];
  rows: CarTransaction[]; // the filtered rows, newest first
}

const round = (n: number) => Math.round(n * 1000) / 1000;
const zeroByCategory = () => Object.fromEntries(REPORT_CATEGORIES.map(c => [c, 0])) as Record<ReportCategory, number>;

export function filterTransactions(all: CarTransaction[], filter: ReportFilter): CarTransaction[] {
  const wanted = filter.categories?.length ? new Set(filter.categories) : null;
  return all.filter(t => {
    if (filter.from && t.transactionDate < filter.from) return false;
    if (filter.to && t.transactionDate > filter.to) return false;
    if (filter.carId === NO_CAR ? !!t.carId : filter.carId ? t.carId !== filter.carId : false) return false;
    if (wanted && !wanted.has(categoryOf(t))) return false;
    return true;
  });
}

export function buildFinancialReport(all: CarTransaction[], filter: ReportFilter): FinancialReport {
  const rows = filterTransactions(all, filter).sort((a, b) => b.transactionDate.localeCompare(a.transactionDate) || (b.createdAt || '').localeCompare(a.createdAt || ''));

  const cat = new Map<ReportCategory, { count: number; paid: number; pending: number }>(REPORT_CATEGORIES.map(c => [c, { count: 0, paid: 0, pending: 0 }]));
  const cars = new Map<string, CarRow>();
  const accounts = new Map<PaymentMethod, { incoming: number; outgoing: number }>(METHODS.map(m => [m, { incoming: 0, outgoing: 0 }]));
  const monthly = new Map<string, { income: number; expense: number }>();
  const owedBy = new Map<string, { owed: number; rows: number }>();
  let unconfirmed = 0, unconfirmedCount = 0;

  for (const tx of rows) {
    const category = categoryOf(tx);
    const c = cat.get(category)!;
    c.count++;

    const carKey = tx.carId || NO_CAR;
    const car = cars.get(carKey) || { carId: carKey, byCategory: zeroByCategory(), totalIncome: 0, maintenance: 0, net: 0, depositsHeld: 0, receivables: 0, count: 0 };
    car.count++;
    cars.set(carKey, car);

    if (tx.paymentStatus === 'pending') {
      c.pending += tx.amount;
      if (INCOMING_TYPES.includes(tx.type)) {
        car.receivables += tx.amount;
        const key = tx.customerName || '—';
        const o = owedBy.get(key) || { owed: 0, rows: 0 };
        o.owed += tx.amount;
        o.rows++;
        owedBy.set(key, o);
      }
      continue;
    }

    c.paid += tx.amount;
    car.byCategory[category] += tx.amount;
    if (INCOMING_TYPES.includes(tx.type) && !tx.receivedAt) {
      unconfirmed += tx.amount;
      unconfirmedCount++;
    }

    const isIncome = INCOME.includes(category);
    const isExpense = category === 'maintenance';
    if (isIncome || isExpense) {
      const month = tx.transactionDate.slice(0, 7);
      const m = monthly.get(month) || { income: 0, expense: 0 };
      if (isIncome) m.income += tx.amount; else m.expense += tx.amount;
      monthly.set(month, m);
    }

    const acc = tx.paymentMethod ? accounts.get(tx.paymentMethod) : undefined;
    if (acc) {
      if (category === 'depositRefund' || isExpense) acc.outgoing += tx.amount; else acc.incoming += tx.amount;
    }
  }

  const byCategory: CategoryRow[] = REPORT_CATEGORIES.map(category => {
    const v = cat.get(category)!;
    return { category, count: v.count, paid: round(v.paid), pending: round(v.pending) };
  });
  const paidOf = (k: ReportCategory) => byCategory.find(r => r.category === k)!.paid;
  const totalIncome = round(INCOME.reduce((s, k) => s + paidOf(k), 0));

  const byCar = [...cars.values()].map(car => {
    const income = INCOME.reduce((s, k) => s + car.byCategory[k], 0);
    return {
      ...car,
      byCategory: Object.fromEntries(REPORT_CATEGORIES.map(k => [k, round(car.byCategory[k])])) as Record<ReportCategory, number>,
      totalIncome: round(income),
      maintenance: round(car.byCategory.maintenance),
      net: round(income - car.byCategory.maintenance),
      depositsHeld: round(car.byCategory.depositIn - car.byCategory.depositRefund),
      receivables: round(car.receivables),
    };
  }).sort((a, b) => b.totalIncome - a.totalIncome);

  return {
    byCategory,
    totalIncome,
    maintenanceExpense: paidOf('maintenance'),
    netResult: round(totalIncome - paidOf('maintenance')),
    depositsReceived: paidOf('depositIn'),
    depositsRefunded: paidOf('depositRefund'),
    depositsHeld: round(paidOf('depositIn') - paidOf('depositRefund')),
    receivables: round([...owedBy.values()].reduce((s, o) => s + o.owed, 0)),
    unconfirmed: round(unconfirmed),
    unconfirmedCount,
    byCar,
    accounts: METHODS.map(method => {
      const a = accounts.get(method)!;
      return { method, incoming: round(a.incoming), outgoing: round(a.outgoing), balance: round(a.incoming - a.outgoing) };
    }),
    monthly: [...monthly.entries()].sort(([a], [b]) => a.localeCompare(b))
      .map(([month, m]) => ({ month, income: round(m.income), expense: round(m.expense), net: round(m.income - m.expense) })),
    receivablesByCustomer: [...owedBy.entries()].map(([customerName, o]) => ({ customerName, owed: round(o.owed), rows: o.rows })).sort((a, b) => b.owed - a.owed),
    rows,
  };
}

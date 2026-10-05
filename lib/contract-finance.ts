import type { CarTransaction } from './db-cars';

// Financial position of one contract (= one reservation), worked out from its accounting rows.
// Pending rows hold what the customer still owes; paid rows are money already received. Because a partial
// payment shrinks the pending row, "total" for a line is paid + owed.

export type FinanceLineKey = 'rent' | 'deposit' | 'extraKm' | 'damage' | 'other';

export interface FinanceLine {
  key: FinanceLineKey;
  label: string;
  total: number;
  paid: number;
  owed: number;
}

export interface ContractFinance {
  lines: FinanceLine[];
  totalCharged: number;
  totalPaid: number;
  totalOwed: number;
  // Paid in, but the account holder has not confirmed receiving it yet
  unconfirmed: number;
  // Deposit still held for the customer (received minus refunded)
  depositHeld: number;
  status: 'none' | 'paid' | 'partial' | 'unpaid';
}

const round = (n: number) => Math.round(n * 1000) / 1000;

const LABELS: Record<FinanceLineKey, string> = {
  rent: 'اجاره',
  deposit: 'ودیعه',
  extraKm: 'کیلومتر اضافه',
  damage: 'حادثه / خسارت',
  other: 'سایر درآمدها',
};

function lineKey(tx: Pick<CarTransaction, 'id' | 'type'>): FinanceLineKey | null {
  if (tx.type === 'deposit_in') return 'deposit';
  if (tx.type === 'rent_fee') return 'rent';
  if (tx.type === 'other_income') {
    if (tx.id.startsWith('tx-xkm-')) return 'extraKm';
    if (tx.id.startsWith('tx-dmg-')) return 'damage';
    return 'other';
  }
  return null;
}

export function summarizeContractFinance(rows: CarTransaction[]): ContractFinance {
  const acc = new Map<FinanceLineKey, { paid: number; owed: number }>();
  let unconfirmed = 0;
  let refunded = 0;

  for (const tx of rows) {
    if (tx.type === 'deposit_refund' && tx.paymentStatus === 'paid') refunded += tx.amount;
    const key = lineKey(tx);
    if (!key) continue;
    const entry = acc.get(key) || { paid: 0, owed: 0 };
    if (tx.paymentStatus === 'pending') {
      entry.owed += tx.amount;
    } else {
      entry.paid += tx.amount;
      if (!tx.receivedAt) unconfirmed += tx.amount;
    }
    acc.set(key, entry);
  }

  const order: FinanceLineKey[] = ['rent', 'deposit', 'extraKm', 'damage', 'other'];
  const lines: FinanceLine[] = order
    .filter(key => acc.has(key))
    .map(key => {
      const { paid, owed } = acc.get(key)!;
      return { key, label: LABELS[key], total: round(paid + owed), paid: round(paid), owed: round(owed) };
    });

  const totalCharged = round(lines.reduce((s, l) => s + l.total, 0));
  const totalPaid = round(lines.reduce((s, l) => s + l.paid, 0));
  const totalOwed = round(lines.reduce((s, l) => s + l.owed, 0));
  const depositPaid = lines.find(l => l.key === 'deposit')?.paid || 0;

  let status: ContractFinance['status'] = 'none';
  if (lines.length) status = totalOwed <= 0 ? 'paid' : totalPaid > 0 ? 'partial' : 'unpaid';

  return {
    lines,
    totalCharged,
    totalPaid,
    totalOwed,
    unconfirmed: round(unconfirmed),
    depositHeld: round(depositPaid - refunded),
    status,
  };
}

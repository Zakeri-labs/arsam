import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Rental Agreement | ARSAM RENT A CAR',
  description: 'Download your car rental agreement',
  robots: { index: false, follow: false },
};

export default function ContractShareLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

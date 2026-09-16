import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'پنل مدیریت ابوآرسام | Abu Arsam Admin',
  description: 'پنل مدیریت ناوگان خودروها، رزروها، قراردادها و حسابداری ابوآرسام',
  manifest: '/manifest-admin.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'مدیریت ابوآرسام',
  },
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminQMSPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to /admin seamlessly
    router.replace('/admin');
  }, [router]);

  return (
    <div className="min-h-screen bg-[#0f1e37] flex items-center justify-center text-white">
      <div className="flex items-center gap-3">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-gold border-t-transparent" />
        <span className="text-sm font-bold">درحال انتقال به پنل مدیریت یکپارچه...</span>
      </div>
    </div>
  );
}
